'use strict';
/*
 NXT Gen Plans 0.1 R6 — Editable Roadways / Intersections / Road-Aware Striping
 Strictly additive to accepted R5 FIX1.
 Does not replace app.js, r4-addon.js, r5-addon.js, standards.js, or MUTCD assets.
*/
(() => {
  if(!window.NXT_R4 || !window.NXT_R5 || !window.__NXT_R5_ROAD_POINTER_FIX1){
    console.error('R6 requires the accepted R5 FIX1 baseline.');
    return;
  }

  const q=s=>document.querySelector(s);
  const ce=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.innerHTML=h;return n};
  const stamp=()=>new Date().toISOString();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const R6={
    activeNode:null,
    activeSegment:null,
    defaultRoad:{lanes:2,laneWidthFt:12,shoulderLeftFt:0,shoulderRightFt:0,centerAfter:1},
    temp:{type:'tabsWhite',spacingFt:20}
  };

  function isRoad(m){return !!(m&&(m.r6Road||m.r5RoadPath||m.r4Road))}
  function selectedRoad(){const m=selectedMarkup();return isRoad(m)?m:null}
  function pageScale(){return Number(currentPage()?.scaleFeetPerInch)||0}
  function feetToPts(ft){const s=pageScale();return s?Number(ft)/s*72:Number(ft)*2}
  function ptsToFeet(pt){const s=pageScale();return s?Number(pt)/72*s:Number(pt)/2}

  function normalizeRoad(m){
    if(!m||m.r6Road)return m;
    checkpoint();
    if(m.r4Road){
      m.type='polyline';
      m.points=[[Number(m.x)||0,Number(m.y)||0],[Number(m.x2)||0,Number(m.y2)||0]];
      delete m.x2;delete m.y2;
      m.lanes=Number(m.lanes)||2;
      m.laneWidthFt=Number(m.laneWidthFt)||12;
      m.shoulderLeftFt=Number(m.shoulderFt)||0;
      m.shoulderRightFt=Number(m.shoulderFt)||0;
      m.centerAfter=Math.max(0,Math.min(m.lanes-1,Math.floor(m.lanes/2)));
      m.r4Road=false;
    }else if(m.r5RoadPath){
      m.type='polyline';
      m.points=(m.points||[]).map(p=>[Number(p[0])||0,Number(p[1])||0]);
      m.lanes=Number(m.lanes)||2;
      m.laneWidthFt=Number(m.laneWidthFt)||12;
      m.shoulderLeftFt=Number(m.shoulderFt)||0;
      m.shoulderRightFt=Number(m.shoulderFt)||0;
      m.centerAfter=Math.max(0,Math.min(m.lanes-1,Math.floor(m.lanes/2)));
      m.r5RoadPath=false; // prevents R5's straight-only road overlay from double-rendering promoted roads
    }
    m.r6Road=true;
    m.r6Curves=m.r6Curves||{};
    m.r6LaneMarkings=Array.isArray(m.r6LaneMarkings)?m.r6LaneMarkings:[];
    m.r6TempStriping=Array.isArray(m.r6TempStriping)?m.r6TempStriping:[];
    m.roadColor=m.roadColor||'#72777b';
    m.edgeLineLeft=m.edgeLineLeft!==false;
    m.edgeLineRight=m.edgeLineRight!==false;
    m.subject=m.subject||'Roadway';
    m.modified=stamp();
    return m;
  }

  function roadTotalWidthFt(m){
    return Math.max(1,(Number(m.lanes)||1)*(Number(m.laneWidthFt)||12)+(Number(m.shoulderLeftFt)||0)+(Number(m.shoulderRightFt)||0));
  }
  function travelWidthFt(m){return Math.max(1,(Number(m.lanes)||1)*(Number(m.laneWidthFt)||12))}
  function roadWidthPts(m){return Math.max(12,feetToPts(roadTotalWidthFt(m)))}
  function travelWidthPts(m){return Math.max(8,feetToPts(travelWidthFt(m)))}
  function laneWidthPts(m){return Math.max(4,feetToPts(Number(m.laneWidthFt)||12))}

  function curveFor(m,i){
    const c=m.r6Curves?.[i];
    return c&&Number.isFinite(c.x)&&Number.isFinite(c.y)?c:null;
  }
  function pathD(m){
    const pts=m.points||[];
    if(!pts.length)return '';
    let d=`M${pts[0][0]} ${pts[0][1]}`;
    for(let i=0;i<pts.length-1;i++){
      const b=pts[i+1],c=curveFor(m,i);
      d+=c?` Q${c.x} ${c.y} ${b[0]} ${b[1]}`:` L${b[0]} ${b[1]}`;
    }
    return d;
  }

  function sampleRoad(m,steps=14){
    const out=[],pts=m.points||[];
    if(pts.length<2)return pts.map(p=>({x:p[0],y:p[1]}));
    for(let i=0;i<pts.length-1;i++){
      const a={x:pts[i][0],y:pts[i][1]},b={x:pts[i+1][0],y:pts[i+1][1]},c=curveFor(m,i);
      const n=c?steps:1;
      for(let k=0;k<n;k++){
        const t=k/n;
        if(c){
          const u=1-t;
          out.push({x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y});
        }else out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
      }
    }
    const last=pts.at(-1);out.push({x:last[0],y:last[1]});
    return out;
  }

  function offsetSamples(samples,offset){
    if(samples.length<2)return samples;
    return samples.map((p,i)=>{
      const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)];
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      return {x:p.x-dy/len*offset,y:p.y+dx/len*offset};
    });
  }
  function samplesPath(s){
    if(!s.length)return '';
    return 'M'+s.map((p,i)=>(i?'L':'')+p.x+' '+p.y).join(' ');
  }

  function lineStyle(style){
    const map={
      none:null,
      dashWhite:{color:'#fff',width:1.7,dash:'10 7'},
      solidWhite:{color:'#fff',width:1.7,dash:''},
      doubleWhite:{color:'#fff',width:1.5,dash:'',double:true},
      dashYellow:{color:'#f2c230',width:1.7,dash:'10 7'},
      solidYellow:{color:'#f2c230',width:1.7,dash:''},
      doubleYellow:{color:'#f2c230',width:1.5,dash:'',double:true}
    };
    return map[style]||map.dashWhite;
  }

  function appendOffsetLine(g,samples,offset,style,extraClass=''){
    const st=lineStyle(style);if(!st)return;
    const draw=off=>{
      const p=svgEl('path',{d:samplesPath(offsetSamples(samples,offset+off)),fill:'none',stroke:st.color,'stroke-width':st.width,'pointer-events':'none'});
      if(st.dash)p.setAttribute('stroke-dasharray',st.dash);
      if(extraClass)p.setAttribute('class',extraClass);
      g.appendChild(p);
    };
    if(st.double){draw(-2.1);draw(2.1)}else draw(0);
  }

  function boundaryOffset(m,boundary){
    const lanes=Math.max(1,Number(m.lanes)||1),lw=laneWidthPts(m),travel=travelWidthPts(m);
    return -travel/2+clamp(Number(boundary)||0,0,lanes)*lw;
  }

  function markingForBoundary(m,j){
    const lanes=Math.max(1,Number(m.lanes)||1);
    const center=clamp(Number(m.centerAfter)||Math.floor(lanes/2),0,Math.max(0,lanes-1));
    if(j===center && j>0 && j<lanes)return m.centerLine||'doubleYellow';
    return m.r6LaneMarkings?.[j-1]||'dashWhite';
  }

  function renderTempTabs(g,m,samples,rule){
    const offset=boundaryOffset(m,rule.boundary),os=offsetSamples(samples,offset);
    const spacing=Math.max(4,feetToPts(Number(rule.spacingFt)||20));
    let carry=0,next=0;
    for(let i=1;i<os.length;i++){
      const a=os[i-1],b=os[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)continue;
      while(next<=carry+len){
        const t=(next-carry)/len;
        const x=a.x+dx*t,y=a.y+dy*t,ang=Math.atan2(dy,dx)*180/Math.PI;
        const fill=/yellow/i.test(rule.type)?'#f2c230':'#fff';
        const r=svgEl('rect',{x:x-3,y:y-1,width:6,height:2,rx:.5,fill,stroke:'#333','stroke-width':.35,'pointer-events':'none',transform:`rotate(${ang} ${x} ${y})`});
        g.appendChild(r);next+=spacing;
      }
      carry+=len;
    }
  }

  function renderRoad(m,g){
    const body=svgEl('path',{d:pathD(m),fill:'none',stroke:m.roadColor||'#72777b','stroke-width':roadWidthPts(m),
      'stroke-linejoin':'round','stroke-linecap':'butt'});
    commonAttrs(body,m);
    body.setAttribute('fill','none');body.setAttribute('stroke',m.roadColor||'#72777b');body.setAttribute('stroke-width',roadWidthPts(m));
    body.setAttribute('stroke-linejoin','round');body.setAttribute('stroke-linecap','butt');
    g.appendChild(body);

    const samples=sampleRoad(m,18),travel=travelWidthPts(m);
    if(m.edgeLineLeft!==false)appendOffsetLine(g,samples,-travel/2,'solidWhite','r6RoadMarking');
    if(m.edgeLineRight!==false)appendOffsetLine(g,samples, travel/2,'solidWhite','r6RoadMarking');

    const lanes=Math.max(1,Number(m.lanes)||1);
    for(let j=1;j<lanes;j++)appendOffsetLine(g,samples,boundaryOffset(m,j),markingForBoundary(m,j),'r6RoadMarking');

    for(const rule of m.r6TempStriping||[]){
      if(/^tabs/i.test(rule.type))renderTempTabs(g,m,samples,rule);
      else appendOffsetLine(g,samples,boundaryOffset(m,rule.boundary),rule.type,'r6TempStriping');
    }
  }

  function roadElementsFor(id){
    return [...q('#markupLayer').querySelectorAll('[data-id]')].filter(n=>n.dataset.id===id);
  }

  const priorRenderMarkups=renderMarkups;
  renderMarkups=function(){
    priorRenderMarkups();
    const g=q('#markupLayer'),p=currentPage();if(!g||!p)return;
    for(const m of p.markups.filter(x=>x.r6Road&&isMarkupVisible(x))){
      roadElementsFor(m.id).forEach(n=>n.remove());
      renderRoad(m,g);
    }
    for(const x of p.markups.filter(x=>x.r6Intersection&&isMarkupVisible(x))){
      roadElementsFor(x.id).forEach(n=>n.remove());
      const c=svgEl('circle',{cx:x.cx,cy:x.cy,r:x.radius,fill:x.roadColor||'#72777b',stroke:'#555','stroke-width':.5});
      commonAttrs(c,x);c.setAttribute('fill',x.roadColor||'#72777b');c.setAttribute('fill-opacity','1');
      g.appendChild(c);
    }
  };

  const priorTranslate=translateMarkup;
  translateMarkup=function(m,dx,dy,orig){
    priorTranslate(m,dx,dy,orig);
    if(m?.r6Road && orig?.r6Curves){
      m.r6Curves={};
      Object.keys(orig.r6Curves).forEach(k=>{
        const c=orig.r6Curves[k];m.r6Curves[k]={x:c.x+dx,y:c.y+dy};
      });
    }
  };

  const priorApplyBounds=applyBounds;
  applyBounds=function(m,orig,ob,nb){
    priorApplyBounds(m,orig,ob,nb);
    if(m?.r6Road&&orig?.r6Curves){
      const sx=ob.w?nb.w/ob.w:1,sy=ob.h?nb.h/ob.h:1;
      m.r6Curves={};
      Object.keys(orig.r6Curves).forEach(k=>{
        const c=orig.r6Curves[k];
        m.r6Curves[k]={x:nb.x+(c.x-ob.x)*sx,y:nb.y+(c.y-ob.y)*sy};
      });
    }
  };

  const priorBounds=bounds;
  bounds=function(m){
    if(m?.r6Road){
      const a=[...(m.points||[]).map(p=>({x:p[0],y:p[1]})),...Object.values(m.r6Curves||{})];
      if(a.length){
        const xs=a.map(p=>p.x),ys=a.map(p=>p.y),pad=roadWidthPts(m)/2;
        return{x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+pad*2,h:Math.max(...ys)-Math.min(...ys)+pad*2};
      }
    }
    if(m?.r6Intersection)return{x:m.cx-m.radius,y:m.cy-m.radius,w:m.radius*2,h:m.radius*2};
    return priorBounds(m);
  };

  function reindexCurvesAfterInsert(m,seg){
    const old=m.r6Curves||{},nu={};
    Object.keys(old).forEach(k=>{
      const i=Number(k);
      if(i<seg)nu[i]=old[k];
      else if(i>seg)nu[i+1]=old[k];
      // splitting a curved segment intentionally straightens its two new subsegments
    });
    m.r6Curves=nu;
  }
  function reindexCurvesAfterDelete(m,node){
    const old=m.r6Curves||{},nu={};
    Object.keys(old).forEach(k=>{
      const i=Number(k);
      if(i===node||i===node-1)return;
      nu[i>node?i-1:i]=old[k];
    });
    m.r6Curves=nu;
  }

  function dragNode(e,m,i){
    checkpoint();e.stopPropagation();e.preventDefault();R6.activeNode=i;
    const move=ev=>{const p=svgPoint(ev);m.points[i]=[p.x,p.y];m.modified=stamp();renderMarkups();renderSelection()};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);updateProperties()};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  }

  function dragCurve(e,m,i){
    checkpoint();e.stopPropagation();e.preventDefault();R6.activeSegment=i;
    const p=svgPoint(e);m.r6Curves=m.r6Curves||{};m.r6Curves[i]={x:p.x,y:p.y};
    const move=ev=>{const z=svgPoint(ev);m.r6Curves[i]={x:z.x,y:z.y};m.modified=stamp();renderMarkups();renderSelection()};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);updateProperties()};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  }

  function addRoadEditHandles(m){
    const ig=q('#interactionLayer');if(!ig||!m?.r6Road)return;
    // Click-drag any segment to convert/adjust that section as a quadratic curve.
    for(let i=0;i<m.points.length-1;i++){
      const a=m.points[i],b=m.points[i+1],c=curveFor(m,i);
      const d=c?`M${a[0]} ${a[1]} Q${c.x} ${c.y} ${b[0]} ${b[1]}`:`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
      const hit=svgEl('path',{d,fill:'none',stroke:'transparent','stroke-width':Math.max(12,roadWidthPts(m)*.30),'pointer-events':'stroke',class:'r6CurveHit'});
      hit.dataset.segment=i;hit.addEventListener('pointerdown',e=>dragCurve(e,m,i));ig.appendChild(hit);
    }
    (m.points||[]).forEach((p,i)=>{
      const h=svgEl('circle',{cx:p[0],cy:p[1],r:5,class:'r6RoadNode'});
      if(R6.activeNode===i)h.classList.add('active');
      h.title='Drag road control point';
      h.addEventListener('pointerdown',e=>dragNode(e,m,i));ig.appendChild(h);
    });
    Object.keys(m.r6Curves||{}).forEach(k=>{
      const i=Number(k),c=m.r6Curves[k],a=m.points[i],b=m.points[i+1];if(!a||!b)return;
      const l1=svgEl('line',{x1:a[0],y1:a[1],x2:c.x,y2:c.y,class:'r6CurveGuide'});
      const l2=svgEl('line',{x1:b[0],y1:b[1],x2:c.x,y2:c.y,class:'r6CurveGuide'});
      const h=svgEl('diamond',{});
      ig.appendChild(l1);ig.appendChild(l2);
      const ch=svgEl('rect',{x:c.x-4,y:c.y-4,width:8,height:8,class:'r6CurveControl',transform:`rotate(45 ${c.x} ${c.y})`});
      ch.addEventListener('pointerdown',e=>dragCurve(e,m,i));ig.appendChild(ch);
    });
  }

  const priorRenderSelection=renderSelection;
  renderSelection=function(){
    priorRenderSelection();
    const m=selectedMarkup();
    if(m?.r6Road)addRoadEditHandles(m);
  };

  function createRoad(points,settings={}){
    const m=baseMarkup('polyline',{x:points[0][0],y:points[0][1]});
    m.type='polyline';m.points=points;m.layer='design';m.subject='Editable Roadway';
    m.stroke=settings.roadColor||'#72777b';m.width=1;m.fill='none';m.fillOpacity=0;
    m.r6Road=true;m.r6Curves={};m.r6TempStriping=[];m.r6LaneMarkings=[];
    m.roadColor=settings.roadColor||'#72777b';
    m.lanes=Math.max(1,Number(settings.lanes)||2);
    m.laneWidthFt=Math.max(1,Number(settings.laneWidthFt)||12);
    m.shoulderLeftFt=Math.max(0,Number(settings.shoulderLeftFt)||0);
    m.shoulderRightFt=Math.max(0,Number(settings.shoulderRightFt)||0);
    m.centerAfter=clamp(Number(settings.centerAfter)||Math.floor(m.lanes/2),0,Math.max(0,m.lanes-1));
    m.centerLine=settings.centerLine||'doubleYellow';m.edgeLineLeft=true;m.edgeLineRight=true;
    m.created=m.modified=stamp();return m;
  }

  function startStraightRoad(){
    setTool('r6StraightRoad');q('#statusTool').textContent='Straight Road — click and drag';
    toast('Click and drag from the road start to the road end.');
  }

  // R6 custom pointer tool runs in capture phase and blocks only its own tool from R3.
  q('#pageSvg').addEventListener('pointerdown',e=>{
    if(state.tool!=='r6StraightRoad'||e.button!==0)return;
    e.preventDefault();e.stopImmediatePropagation();checkpoint();
    const a=svgPoint(e),m=createRoad([[a.x,a.y],[a.x,a.y]],R6.defaultRoad);
    currentPage().markups.push(m);state.selected=m.id;
    const move=ev=>{const b=svgPoint(ev);m.points[1]=[b.x,b.y];renderMarkups()};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);m.modified=stamp();render();setTool('select');updateProperties()};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  },true);

  function addNode(){
    const m=normalizeRoad(selectedRoad());if(!m)return toast('Select a roadway first.');
    checkpoint();
    let seg=R6.activeSegment;
    if(!(seg>=0&&seg<m.points.length-1)){
      let best=-1,bestLen=-1;
      for(let i=0;i<m.points.length-1;i++){const a=m.points[i],b=m.points[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>bestLen){bestLen=l;best=i}}
      seg=best;
    }
    if(seg<0)return;
    const a=m.points[seg],b=m.points[seg+1],c=curveFor(m,seg);
    let pt;
    if(c)pt=[.25*a[0]+.5*c.x+.25*b[0],.25*a[1]+.5*c.y+.25*b[1]];
    else pt=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    reindexCurvesAfterInsert(m,seg);m.points.splice(seg+1,0,pt);R6.activeNode=seg+1;m.modified=stamp();render();updateProperties();
  }

  function removeNode(){
    const m=normalizeRoad(selectedRoad());if(!m)return toast('Select a roadway first.');
    if(m.points.length<=2)return toast('A roadway must retain at least two control points.');
    let i=R6.activeNode;
    if(!(i>=0&&i<m.points.length))i=m.points.length-2;
    checkpoint();reindexCurvesAfterDelete(m,i);m.points.splice(i,1);R6.activeNode=null;m.modified=stamp();render();updateProperties();
  }

  function straightenSegment(){
    const m=normalizeRoad(selectedRoad());if(!m)return toast('Select a roadway first.');
    let i=R6.activeSegment;
    if(!(i>=0&&i<m.points.length-1)){
      const keys=Object.keys(m.r6Curves||{});if(!keys.length)return toast('This road has no curved segments.');
      i=Number(keys[0]);
    }
    checkpoint();delete m.r6Curves[i];m.modified=stamp();render();updateProperties();
  }

  function straightenRoad(){
    const m=normalizeRoad(selectedRoad());if(!m)return toast('Select a roadway first.');
    checkpoint();m.r6Curves={};m.modified=stamp();render();updateProperties();
  }

  function styleOptions(current){
    return ['none','dashWhite','solidWhite','doubleWhite','dashYellow','solidYellow','doubleYellow'].map(v=>{
      const n={none:'None',dashWhite:'Dashed White',solidWhite:'Solid White',doubleWhite:'Double White',dashYellow:'Dashed Yellow',solidYellow:'Solid Yellow',doubleYellow:'Double Yellow'}[v];
      return `<option value="${v}"${v===current?' selected':''}>${n}</option>`;
    }).join('');
  }

  function updateLaneArray(m){
    const need=Math.max(0,(Number(m.lanes)||1)-1);
    m.r6LaneMarkings=Array.isArray(m.r6LaneMarkings)?m.r6LaneMarkings:[];
    while(m.r6LaneMarkings.length<need)m.r6LaneMarkings.push('dashWhite');
    m.r6LaneMarkings.length=need;
    m.centerAfter=clamp(Number(m.centerAfter)||Math.floor(m.lanes/2),0,Math.max(0,m.lanes-1));
  }

  function tempRows(m){
    return (m.r6TempStriping||[]).map((r,i)=>`<div class="r6TempRow"><span>${r.type.replace(/([A-Z])/g,' $1')} · boundary ${r.boundary}${/^tabs/i.test(r.type)?` · ${r.spacingFt} ft`:''}</span><button data-r6-temp-remove="${i}">×</button></div>`).join('')||'<small>No temporary striping/tabs attached to this road.</small>';
  }

  function injectRoadProperties(){
    let host=q('#r6RoadProps');
    if(!host){
      host=ce('details','r6RoadProps');host.id='r6RoadProps';host.open=true;
      const editor=q('#propEditor');if(editor)editor.appendChild(host);
    }
    const raw=selectedRoad();
    if(!raw||state.propertyMode!=='object'){host.classList.add('hidden');return}
    const m=normalizeRoad(raw);updateLaneArray(m);host.classList.remove('hidden');
    const lanes=Math.max(1,Number(m.lanes)||1);
    let laneControls='';
    for(let j=1;j<lanes;j++){
      laneControls+=`<label>Boundary ${j}${j===Number(m.centerAfter)?' (center divide)':''}<select data-r6-lane="${j}">${styleOptions(markingForBoundary(m,j))}</select></label>`;
    }
    let boundaryOpts='';
    for(let j=0;j<=lanes;j++)boundaryOpts+=`<option value="${j}">${j===0?'Left edge':j===lanes?'Right edge':'Lane boundary '+j}</option>`;
    host.innerHTML=`<summary>Roadway / Pavement Markings</summary>
      <div class="r6PropGrid">
        <label>Lanes<input id="r6PropLanes" type="number" min="1" max="12" value="${lanes}"></label>
        <label>Lane width (ft)<input id="r6PropLaneWidth" type="number" min="6" max="30" step=".5" value="${Number(m.laneWidthFt)||12}"></label>
        <label>Left shoulder (ft)<input id="r6PropShoulderL" type="number" min="0" max="40" step=".5" value="${Number(m.shoulderLeftFt)||0}"></label>
        <label>Right shoulder (ft)<input id="r6PropShoulderR" type="number" min="0" max="40" step=".5" value="${Number(m.shoulderRightFt)||0}"></label>
        <label>Center divide after lane<input id="r6PropCenterAfter" type="number" min="0" max="${Math.max(0,lanes-1)}" value="${Number(m.centerAfter)||0}"></label>
        <label>Center marking<select id="r6PropCenter">${styleOptions(m.centerLine||'doubleYellow')}</select></label>
      </div>
      <div class="r6Checks"><label><input id="r6EdgeL" type="checkbox"${m.edgeLineLeft!==false?' checked':''}> Left edge line</label><label><input id="r6EdgeR" type="checkbox"${m.edgeLineRight!==false?' checked':''}> Right edge line</label></div>
      <div class="r6LaneProps">${laneControls||'<small>One-lane road: no internal lane boundaries.</small>'}</div>
      <div class="r6RoadActions"><button id="r6AddNode">+ Node</button><button id="r6RemoveNode">− Node</button><button id="r6StraightSegment">Straighten Segment</button><button id="r6StraightRoad">Straighten Road</button></div>
      <div class="r6TempBox"><b>Temporary Striping / Tabs</b>
        <div class="r6PropGrid">
          <label>Road boundary<select id="r6TempBoundary">${boundaryOpts}</select></label>
          <label>Type<select id="r6TempType"><option value="tabsWhite">Temporary White Tabs</option><option value="tabsYellow">Temporary Yellow Tabs</option><option value="dashWhite">Temporary Dashed White</option><option value="solidWhite">Temporary Solid White</option><option value="solidYellow">Temporary Solid Yellow</option><option value="dashYellow">Temporary Dashed Yellow</option></select></label>
          <label>Tab spacing (ft)<input id="r6TempSpacing" type="number" min="1" max="500" value="20"></label>
        </div>
        <button id="r6AddTemp" class="r6Wide">Add to Road</button>
        <div id="r6TempRows">${tempRows(m)}</div>
      </div>`;

    const apply=(fn)=>{checkpoint();fn();m.modified=stamp();updateLaneArray(m);render();updateProperties()};
    q('#r6PropLanes').onchange=e=>apply(()=>{m.lanes=clamp(Number(e.target.value)||1,1,12);m.centerAfter=Math.floor(m.lanes/2)});
    q('#r6PropLaneWidth').onchange=e=>apply(()=>m.laneWidthFt=Math.max(1,Number(e.target.value)||12));
    q('#r6PropShoulderL').onchange=e=>apply(()=>m.shoulderLeftFt=Math.max(0,Number(e.target.value)||0));
    q('#r6PropShoulderR').onchange=e=>apply(()=>m.shoulderRightFt=Math.max(0,Number(e.target.value)||0));
    q('#r6PropCenterAfter').onchange=e=>apply(()=>m.centerAfter=clamp(Number(e.target.value)||0,0,Math.max(0,m.lanes-1)));
    q('#r6PropCenter').onchange=e=>apply(()=>m.centerLine=e.target.value);
    q('#r6EdgeL').onchange=e=>apply(()=>m.edgeLineLeft=e.target.checked);
    q('#r6EdgeR').onchange=e=>apply(()=>m.edgeLineRight=e.target.checked);
    host.querySelectorAll('[data-r6-lane]').forEach(sel=>sel.onchange=e=>{
      const j=Number(sel.dataset.r6Lane);apply(()=>m.r6LaneMarkings[j-1]=e.target.value);
    });
    q('#r6AddNode').onclick=addNode;q('#r6RemoveNode').onclick=removeNode;
    q('#r6StraightSegment').onclick=straightenSegment;q('#r6StraightRoad').onclick=straightenRoad;
    q('#r6AddTemp').onclick=()=>{
      checkpoint();m.r6TempStriping.push({boundary:Number(q('#r6TempBoundary').value),type:q('#r6TempType').value,spacingFt:Math.max(1,Number(q('#r6TempSpacing').value)||20)});
      m.modified=stamp();render();updateProperties();
    };
    host.querySelectorAll('[data-r6-temp-remove]').forEach(b=>b.onclick=()=>{
      checkpoint();m.r6TempStriping.splice(Number(b.dataset.r6TempRemove),1);m.modified=stamp();render();updateProperties();
    });
  }

  const priorUpdateProperties=updateProperties;
  updateProperties=function(){
    priorUpdateProperties();
    injectRoadProperties();
  };

  // When R3 opens Properties on an R5/R4 road, R6 promotes only that road.
  const priorOpenPropertiesAt=openPropertiesAt;
  openPropertiesAt=function(ev,mode='object',tool=null){
    const m=selectedRoad();if(m&&mode==='object')normalizeRoad(m);
    return priorOpenPropertiesAt(ev,mode,tool);
  };

  function segmentIntersection(a,b,c,d){
    const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y};
    const den=r.x*s.y-r.y*s.x;if(Math.abs(den)<1e-7)return null;
    const q={x:c.x-a.x,y:c.y-a.y};
    const t=(q.x*s.y-q.y*s.x)/den,u=(q.x*r.y-q.y*r.x)/den;
    if(t>=0&&t<=1&&u>=0&&u<=1)return{x:a.x+t*r.x,y:a.y+t*r.y};
    return null;
  }
  function nearestPointOnSegment(p,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l2,0,1);
    const z={x:a.x+t*dx,y:a.y+t*dy};z.dist=Math.hypot(p.x-z.x,p.y-z.y);return z;
  }
  function roadCrossing(a,b){
    const A=sampleRoad(a,18),B=sampleRoad(b,18);
    for(let i=1;i<A.length;i++)for(let j=1;j<B.length;j++){
      const x=segmentIntersection(A[i-1],A[i],B[j-1],B[j]);if(x)return x;
    }
    // T-junction: endpoint close to the other road.
    const tol=Math.max(8,Math.min(roadWidthPts(a),roadWidthPts(b))*.55);
    for(const p of [A[0],A.at(-1)]){
      for(let j=1;j<B.length;j++){const n=nearestPointOnSegment(p,B[j-1],B[j]);if(n.dist<=tol)return{x:n.x,y:n.y}}
    }
    for(const p of [B[0],B.at(-1)]){
      for(let i=1;i<A.length;i++){const n=nearestPointOnSegment(p,A[i-1],A[i]);if(n.dist<=tol)return{x:n.x,y:n.y}}
    }
    return null;
  }

  function refreshIntersections(){
    checkpoint();
    const p=currentPage();
    p.markups=p.markups.filter(m=>!m.r6Intersection);
    const roads=p.markups.filter(isRoad).map(normalizeRoad);
    let count=0;
    for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){
      const z=roadCrossing(roads[i],roads[j]);if(!z)continue;
      const radius=Math.max(roadWidthPts(roads[i]),roadWidthPts(roads[j]))*.54;
      p.markups.push({id:uid(),type:'circle',layer:'design',subject:'Road Intersection',comment:'R6 auto intersection',status:'Open',
        r6Intersection:true,roads:[roads[i].id,roads[j].id],cx:z.x,cy:z.y,radius,roadColor:roads[i].roadColor||'#72777b',
        x:z.x-radius,y:z.y-radius,w:radius*2,h:radius*2,stroke:'#555',width:.5,fill:roads[i].roadColor||'#72777b',fillOpacity:1,
        dash:'',hatch:'none',opacity:1,created:stamp(),modified:stamp()});count++;
    }
    state.selected=null;render();toast(count?`Created ${count} intersection${count===1?'':'s'}.`:'No roadway crossings found on this sheet.');
  }

  function editSelectedRoad(){
    const m=selectedRoad();if(!m)return toast('Select an R5/R6 roadway first.');
    normalizeRoad(m);state.selected=m.id;setTool('select');render();openPropertiesAt(null,'object',null);
  }

  function openPalette(){
    let p=q('#r6RoadPalette');
    if(!p){
      p=ce('section','palette r6RoadPalette hidden');p.id='r6RoadPalette';p.dataset.floating='true';
      p.innerHTML=`<div class="paletteHead"><strong>Roadway Editor</strong><span>R6 editable geometry / striping</span><button data-r6-close>×</button></div>
      <div class="paletteBody">
        <div class="toolSection"><b>Road Creation</b>
          <div class="r6RoadDefaults">
            <label>Lanes<input id="r6DefLanes" type="number" min="1" max="12" value="${R6.defaultRoad.lanes}"></label>
            <label>Lane width (ft)<input id="r6DefWidth" type="number" min="6" max="30" step=".5" value="${R6.defaultRoad.laneWidthFt}"></label>
          </div>
          <button class="r6Wide" id="r6StraightBtn">Draw Straight Editable Road</button>
          <button class="r6Wide" id="r6EditBtn">Edit Selected R5/R6 Road</button>
        </div>
        <div class="toolSection"><b>Geometry</b>
          <div class="r6Grid2"><button id="r6AddNodePal">+ Control Point</button><button id="r6RemoveNodePal">− Control Point</button><button id="r6StraightSegPal">Straighten Segment</button><button id="r6StraightAllPal">Straighten Road</button></div>
          <small>Select a roadway. Drag blue circles to reshape it. Click-drag directly on a road segment to curve that section.</small>
        </div>
        <div class="toolSection"><b>Intersections V1</b>
          <button class="r6Wide" id="r6Intersections">Create / Refresh Intersections</button>
          <small>Detects crossing roads and road endpoints terminating into another roadway.</small>
        </div>
        <div class="toolSection"><b>Road-Aware Striping</b>
          <small>Select a roadway and open Props to configure permanent lane lines and temporary striping/tabs by lane boundary.</small>
          <button class="r6Wide" id="r6PropsBtn">Open Selected Road Properties</button>
        </div>
      </div>`;
      document.body.appendChild(p);
      p.querySelector('[data-r6-close]').onclick=()=>p.classList.add('hidden');
      q('#r6StraightBtn').onclick=()=>{R6.defaultRoad.lanes=Math.max(1,Number(q('#r6DefLanes').value)||2);R6.defaultRoad.laneWidthFt=Math.max(1,Number(q('#r6DefWidth').value)||12);R6.defaultRoad.centerAfter=Math.floor(R6.defaultRoad.lanes/2);startStraightRoad()};
      q('#r6EditBtn').onclick=editSelectedRoad;q('#r6AddNodePal').onclick=addNode;q('#r6RemoveNodePal').onclick=removeNode;
      q('#r6StraightSegPal').onclick=straightenSegment;q('#r6StraightAllPal').onclick=straightenRoad;
      q('#r6Intersections').onclick=refreshIntersections;
      q('#r6PropsBtn').onclick=editSelectedRoad;
    }
    p.classList.toggle('hidden');
  }

  function installUi(){
    const small=q('.brand small');if(small)small.textContent='0.1 R6';
    document.title='NXT Gen Plans 0.1 R6';
    const pals=q('.paletteButtons');
    if(pals&&!q('#r6RoadBtn')){
      const b=ce('button','r6RoadButton');b.id='r6RoadBtn';b.textContent='Road+';
      b.title='R6 editable roadways, curves, intersections and road-aware striping';b.onclick=openPalette;pals.appendChild(b);
    }
  }

  installUi();
  window.NXT_R6={openPalette,normalizeRoad,startStraightRoad,refreshIntersections,editSelectedRoad,addNode,removeNode,straightenSegment,straightenRoad};
  console.info('NXT Gen Plans R6 editable-roadway module loaded without modifying R5.');
})();
