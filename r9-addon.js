'use strict';
/*
 NXT Gen Plans 0.1 R9 — Universal Manual Geometry & Editing
 Baseline: Git f652a20c (cleanup)
 Loads AFTER r8-1-compat.js.

 Manual-only editing foundation:
 - multi-select / CAD-style window selection
 - grouping / ungrouping
 - batch movement / layer assignment / duplication / deletion
 - copy & paste appearance
 - free editable paths with nodes and optional quadratic curve controls
 - editable device runs, temporary striping and tabs without a roadway
 - endpoint / midpoint / segment / grid snapping
 - manual offset geometry

 No automatic TCP layout. No map/cloud integration.
*/
(() => {
  if(!window.NXT_R8_1 || !window.__NXT_R8_1_UNIVERSAL_CANVAS ||
     !window.NXT_R8 || !window.NXT_R7 || !window.NXT_R6_1){
    console.error('R9 requires the accepted R8.1 Universal Canvas baseline.');
    return;
  }
  if(window.__NXT_R9_MANUAL_GEOMETRY)return;
  window.__NXT_R9_MANUAL_GEOMETRY=true;

  const q=s=>document.querySelector(s);
  const ce=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.innerHTML=h;return n};
  const stamp=()=>new Date().toISOString();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  const R9={
    selected:new Set(),
    pathDraft:null,
    activeNode:null,
    activeSegment:null,
    appearance:null,
    snap:{
      enabled:true,
      grid:false,
      gridFt:5,
      endpoint:true,
      midpoint:true,
      segment:true,
      threshold:10
    }
  };

  function page(){return currentPage()}
  function pageScale(){return Number(page()?.scaleFeetPerInch)||0}
  function feetToPts(ft){const s=pageScale();return s?Number(ft)/s*72:Number(ft)*2}
  function layerLocked(id){return !!state.layers.find(l=>l.id===id)?.locked}
  function byId(id){return (page()?.markups||[]).find(m=>m.id===id)||null}
  function selectedObjects(){return [...R9.selected].map(byId).filter(Boolean)}
  function selectedOne(){return selectedMarkup()}

  // -----------------------------------------------------------------------
  // R9 PATH MODEL
  // -----------------------------------------------------------------------

  function isR9Path(m){return !!m?.r9Path}

  function curveFor(m,i){
    const c=m?.r9Curves?.[i];
    return c&&Number.isFinite(c.x)&&Number.isFinite(c.y)?c:null;
  }

  function pathD(m){
    const pts=m.points||[];
    if(!pts.length)return'';
    let d=`M${pts[0][0]} ${pts[0][1]}`;
    for(let i=0;i<pts.length-1;i++){
      const b=pts[i+1],c=curveFor(m,i);
      d+=c?` Q${c.x} ${c.y} ${b[0]} ${b[1]}`:` L${b[0]} ${b[1]}`;
    }
    return d;
  }

  function samplePath(m,steps=12){
    const pts=m.points||[],out=[];
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
    const z=pts.at(-1);out.push({x:z[0],y:z[1]});
    return out;
  }

  function cumulative(samples){
    const d=[0];let total=0;
    for(let i=1;i<samples.length;i++){
      total+=Math.hypot(samples[i].x-samples[i-1].x,samples[i].y-samples[i-1].y);
      d.push(total);
    }
    return{d,total};
  }

  function pathBounds(m){
    const pts=[
      ...(m.points||[]).map(p=>({x:p[0],y:p[1]})),
      ...Object.values(m.r9Curves||{})
    ];
    if(!pts.length)return{x:0,y:0,w:1,h:1};
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
    const pad=m.r9Kind==='deviceRun'?10:Math.max(5,Number(m.width)||2);
    return{x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+pad*2,h:Math.max(...ys)-Math.min(...ys)+pad*2};
  }

  function lineStyle(k){
    return ({
      closure:['#ef6c00',2.5,'8 5'],
      taper:['#ef6c00',2.5,'8 5'],
      dashWhite:['#ffffff',2.2,'12 9'],
      solidWhite:['#ffffff',2.2,''],
      dashYellow:['#f2c230',2.2,'12 9'],
      solidYellow:['#f2c230',2.2,''],
      generic:['#d71920',2,'']
    })[k]||['#d71920',2,''];
  }

  function appendDevice(g,p,kind){
    if(kind==='drum'){
      g.appendChild(svgEl('rect',{x:p.x-3.5,y:p.y-5.5,width:7,height:11,rx:1,fill:'#f58220',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));
      g.appendChild(svgEl('rect',{x:p.x-3.5,y:p.y-1,width:7,height:2,fill:'#fff','pointer-events':'none'}));
      return;
    }
    if(kind==='verticalPanel'){
      g.appendChild(svgEl('rect',{x:p.x-2.2,y:p.y-6,width:4.4,height:12,fill:'#fff',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));
      g.appendChild(svgEl('line',{x1:p.x-2,y1:p.y-4,x2:p.x+2,y2:p.y,stroke:'#f58220','stroke-width':2,'pointer-events':'none'}));
      return;
    }
    if(kind==='barricade'){
      g.appendChild(svgEl('rect',{x:p.x-6,y:p.y-2,width:12,height:4,fill:'#fff',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));
      g.appendChild(svgEl('line',{x1:p.x-5,y1:p.y-1.5,x2:p.x+5,y2:p.y+1.5,stroke:'#f58220','stroke-width':2,'pointer-events':'none'}));
      return;
    }
    if(kind==='barrier'){
      g.appendChild(svgEl('path',{d:`M${p.x-6} ${p.y-2}L${p.x+6} ${p.y-2}L${p.x+5} ${p.y+3}L${p.x-5} ${p.y+3}Z`,fill:'#d6d6d6',stroke:'#555','stroke-width':.7,'pointer-events':'none'}));
      return;
    }
    g.appendChild(svgEl('path',{d:`M${p.x} ${p.y-5}L${p.x+3.5} ${p.y+4}L${p.x-3.5} ${p.y+4}Z`,fill:'#f58220',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));
  }

  function renderR9Path(g,m){
    const group=svgEl('g');
    group.dataset.id=m.id;group.classList.add('markup','r9PathObject');
    if(state.selected===m.id)group.classList.add('selected');
    group.setAttribute('opacity',m.opacity??1);
    group.addEventListener('pointerdown',e=>objectPointerDown(e,m));
    group.addEventListener('contextmenu',e=>openContext(e,m.id));

    const samples=samplePath(m,16),d=pathD(m);

    if(m.r9Kind==='deviceRun'){
      const hit=svgEl('path',{d,fill:'none',stroke:'transparent','stroke-width':18,'pointer-events':'stroke'});
      group.appendChild(hit);
      const c=cumulative(samples),spacing=Math.max(3,feetToPts(Number(m.r9SpacingFt)||20));
      for(let dist=0;dist<=c.total+.01;dist+=spacing){
        let i=1;while(i<c.d.length&&c.d[i]<dist)i++;
        i=Math.min(i,c.d.length-1);
        const a=samples[i-1],b=samples[i],seg=Math.max(.001,c.d[i]-c.d[i-1]);
        const u=clamp((dist-c.d[i-1])/seg,0,1);
        appendDevice(group,{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},m.r9DeviceKind||'cone');
      }
    }else if(m.r9Kind==='tabs'){
      const hit=svgEl('path',{d,fill:'none',stroke:'transparent','stroke-width':14,'pointer-events':'stroke'});
      group.appendChild(hit);
      const c=cumulative(samples),spacing=Math.max(3,feetToPts(Number(m.r9SpacingFt)||20));
      const fill=m.r9TabColor==='yellow'?'#f2c230':'#fff';
      for(let dist=0;dist<=c.total+.01;dist+=spacing){
        let i=1;while(i<c.d.length&&c.d[i]<dist)i++;
        i=Math.min(i,c.d.length-1);
        const a=samples[i-1],b=samples[i],seg=Math.max(.001,c.d[i]-c.d[i-1]);
        const u=clamp((dist-c.d[i-1])/seg,0,1);
        const x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u,ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
        group.appendChild(svgEl('rect',{x:x-3,y:y-1,width:6,height:2,rx:.5,fill,stroke:'#333','stroke-width':.35,transform:`rotate(${ang} ${x} ${y})`,'pointer-events':'none'}));
      }
    }else{
      const st=lineStyle(m.r9LineStyle||'generic');
      const p=svgEl('path',{d,fill:'none',stroke:m.stroke||st[0],'stroke-width':m.width||st[1],'pointer-events':'stroke'});
      const dash=m.dash!==undefined?m.dash:st[2];if(dash)p.setAttribute('stroke-dasharray',dash);
      group.appendChild(p);
    }

    g.appendChild(group);
  }

  const priorRenderMarkups=renderMarkups;
  renderMarkups=function(){
    priorRenderMarkups();
    const g=q('#markupLayer');if(!g)return;
    for(const m of (page()?.markups||[])){
      if(m.r9Path&&isMarkupVisible(m))renderR9Path(g,m);
    }
  };

  const priorBounds=bounds;
  bounds=function(m){
    if(m?.r9Path)return pathBounds(m);
    return priorBounds(m);
  };

  const priorTranslateMarkup=translateMarkup;
  translateMarkup=function(m,dx,dy,orig){
    if(m?.r9Path){
      m.points=(orig.points||[]).map(([x,y])=>[x+dx,y+dy]);
      m.r9Curves={};
      for(const [k,c] of Object.entries(orig.r9Curves||{}))m.r9Curves[k]={x:c.x+dx,y:c.y+dy};
      return;
    }
    return priorTranslateMarkup(m,dx,dy,orig);
  };

  const priorApplyBounds=applyBounds;
  applyBounds=function(m,orig,ob,nb){
    if(m?.r9Path){
      const sx=ob.w?nb.w/ob.w:1,sy=ob.h?nb.h/ob.h:1;
      m.points=(orig.points||[]).map(([x,y])=>[nb.x+(x-ob.x)*sx,nb.y+(y-ob.y)*sy]);
      m.r9Curves={};
      for(const [k,c] of Object.entries(orig.r9Curves||{}))m.r9Curves[k]={x:nb.x+(c.x-ob.x)*sx,y:nb.y+(c.y-ob.y)*sy};
      return;
    }
    return priorApplyBounds(m,orig,ob,nb);
  };

  const priorRotateMarkup90=rotateMarkup90;
  rotateMarkup90=function(m,h){
    if(m?.r9Path){
      m.points=(m.points||[]).map(([x,y])=>rotatePoint90(x,y,h));
      const nu={};for(const [k,c] of Object.entries(m.r9Curves||{})){const p=rotatePoint90(c.x,c.y,h);nu[k]={x:p[0],y:p[1]}}m.r9Curves=nu;
      m.rotation=((m.rotation||0)+90)%360;
      return;
    }
    return priorRotateMarkup90(m,h);
  };

  // -----------------------------------------------------------------------
  // SNAPPING
  // -----------------------------------------------------------------------

  function genericPoints(m){
    if(!m)return[];
    if(m.r9Path)return (m.points||[]).map(p=>({x:p[0],y:p[1]}));
    if(m.r6Road)return (m.points||[]).map(p=>({x:p[0],y:p[1]}));
    if(Array.isArray(m.points))return m.points.map(p=>({x:p[0],y:p[1]}));
    if(Number.isFinite(m.x)&&Number.isFinite(m.x2))return[{x:m.x,y:m.y},{x:m.x2,y:m.y2}];
    const b=priorBounds(m);
    if(!b)return[];
    return[
      {x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h},
      {x:b.x+b.w/2,y:b.y+b.h/2}
    ];
  }

  function genericSegments(m){
    const pts=genericPoints(m),out=[];
    if(m?.r9Path||m?.r6Road||m?.type==='polyline'||m?.type==='polygon'){
      for(let i=1;i<pts.length;i++)out.push([pts[i-1],pts[i]]);
      if(m?.type==='polygon'&&pts.length>2)out.push([pts.at(-1),pts[0]]);
    }else if(Number.isFinite(m?.x)&&Number.isFinite(m?.x2))out.push([pts[0],pts[1]]);
    return out;
  }

  function projectSegment(p,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;
    const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l2,0,1);
    return{x:a.x+dx*t,y:a.y+dy*t,dist:Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t))};
  }

  function snapPoint(p,excludeId=null){
    if(!R9.snap.enabled)return p;
    let best={x:p.x,y:p.y,dist:R9.snap.threshold+1,kind:null};

    if(R9.snap.grid){
      const step=Math.max(2,feetToPts(Math.max(.25,Number(R9.snap.gridFt)||5)));
      const z={x:Math.round(p.x/step)*step,y:Math.round(p.y/step)*step};
      const d=Math.hypot(p.x-z.x,p.y-z.y);if(d<best.dist)best={...z,dist:d,kind:'grid'};
    }

    for(const m of (page()?.markups||[])){
      if(m.id===excludeId||!isMarkupVisible(m))continue;
      const pts=genericPoints(m);

      if(R9.snap.endpoint){
        for(const z of pts){
          const d=Math.hypot(p.x-z.x,p.y-z.y);
          if(d<best.dist)best={x:z.x,y:z.y,dist:d,kind:'endpoint'};
        }
      }

      if(R9.snap.midpoint){
        for(const [a,b] of genericSegments(m)){
          const z={x:(a.x+b.x)/2,y:(a.y+b.y)/2},d=Math.hypot(p.x-z.x,p.y-z.y);
          if(d<best.dist)best={...z,dist:d,kind:'midpoint'};
        }
      }

      if(R9.snap.segment){
        for(const [a,b] of genericSegments(m)){
          const z=projectSegment(p,a,b);
          if(z.dist<best.dist)best={x:z.x,y:z.y,dist:z.dist,kind:'segment'};
        }
      }
    }

    return best.dist<=R9.snap.threshold?{x:best.x,y:best.y,r9SnapKind:best.kind}:p;
  }

  // -----------------------------------------------------------------------
  // EDITABLE PATH DRAWING
  // -----------------------------------------------------------------------

  function currentPathConfig(){
    return{
      kind:q('#r9PathKind')?.value||'generic',
      lineStyle:q('#r9LineStyle')?.value||'generic',
      deviceKind:q('#r9DeviceKind')?.value||'cone',
      spacingFt:Math.max(1,Number(q('#r9SpacingFt')?.value)||20),
      tabColor:q('#r9TabColor')?.value||'white'
    };
  }

  function beginPath(){
    if(layerLocked('trafficDevices')&&q('#r9PathKind')?.value==='deviceRun')return toast('Traffic Devices layer is locked.');
    if(layerLocked('tempTraffic')&&['line','tabs','taper'].includes(q('#r9PathKind')?.value))return toast('Temporary Striping / Tapers layer is locked.');
    R9.pathDraft=null;
    state.tool='r9PathDraw';
    q('#statusTool').textContent='R9 Editable Path — click points, double-click to finish';
    q('#canvasScroller').style.cursor='crosshair';
    toast('Click path nodes manually. Double-click the final point to finish.');
  }

  function createPathAt(p){
    const cfg=currentPathConfig();
    const layer=cfg.kind==='deviceRun'?'trafficDevices':cfg.kind==='generic'?(state.activeLayer||'default'):'tempTraffic';
    const st=lineStyle(cfg.lineStyle);
    return{
      id:uid(),type:'r9Path',layer,
      subject:cfg.kind==='deviceRun'?'Editable Device Run':cfg.kind==='tabs'?'Editable Temporary Tabs':cfg.kind==='taper'?'Editable Taper / Shift Path':cfg.kind==='line'?'Editable Temporary Line':'Editable Manual Path',
      comment:'R9 manual editable geometry',status:'Open',created:stamp(),modified:stamp(),
      r9Path:true,r9Kind:cfg.kind,r9LineStyle:cfg.kind==='taper'?'taper':cfg.lineStyle,
      r9DeviceKind:cfg.deviceKind,r9SpacingFt:cfg.spacingFt,r9TabColor:cfg.tabColor,
      points:[[p.x,p.y]],r9Curves:{},stroke:st[0],width:st[1],dash:st[2],
      fill:'none',fillOpacity:0,opacity:1
    };
  }

  function finishPath(select=true){
    const m=R9.pathDraft;if(!m)return;
    if(m.points.length>1){
      const a=m.points.at(-1),b=m.points.at(-2);
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<3)m.points.pop();
    }
    if(m.points.length<2)page().markups=page().markups.filter(x=>x!==m);
    else{m.modified=stamp();if(select){state.selected=m.id;state.propertyMode='object'}}
    R9.pathDraft=null;render();setTool('select');updateProperties();
  }

  const svg=q('#pageSvg');
  svg.addEventListener('pointerdown',e=>{
    if(state.tool==='r9PathDraw'&&e.button===0){e.preventDefault();e.stopImmediatePropagation()}
  },true);

  svg.addEventListener('click',e=>{
    if(state.tool!=='r9PathDraw'||e.detail>1)return;
    e.preventDefault();e.stopImmediatePropagation();
    const p=snapPoint(svgPoint(e),R9.pathDraft?.id);
    if(!R9.pathDraft){
      checkpoint();
      const m=createPathAt(p);page().markups.push(m);R9.pathDraft=m;
    }else R9.pathDraft.points.push([p.x,p.y]);
    renderMarkups();
  },true);

  svg.addEventListener('dblclick',e=>{
    if(state.tool!=='r9PathDraw')return;
    e.preventDefault();e.stopImmediatePropagation();
    finishPath(true);
  },true);

  // -----------------------------------------------------------------------
  // PATH NODE EDITING
  // -----------------------------------------------------------------------

  function reindexCurvesInsert(m,seg){
    const old=m.r9Curves||{},nu={};
    for(const [k,c] of Object.entries(old)){
      const i=Number(k);
      if(i<seg)nu[i]=c;
      else if(i>seg)nu[i+1]=c;
    }
    m.r9Curves=nu;
  }

  function reindexCurvesDelete(m,node){
    const old=m.r9Curves||{},nu={};
    for(const [k,c] of Object.entries(old)){
      const i=Number(k);
      if(i<node-1)nu[i]=c;
      else if(i>node)nu[i-1]=c;
    }
    m.r9Curves=nu;
  }

  function midpoint(a,b){return{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2}}

  function dragNode(e,m,index){
    if(isMarkupLocked(m))return toast('Layer locked.');
    checkpoint();e.preventDefault();e.stopPropagation();
    R9.activeNode=index;R9.activeSegment=Math.max(0,Math.min(index,m.points.length-2));
    const move=ev=>{
      const p=snapPoint(svgPoint(ev),m.id);
      m.points[index]=[p.x,p.y];m.modified=stamp();renderMarkups();renderSelection();
    };
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);render();updateProperties()};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  }

  function dragCurve(e,m,seg){
    if(isMarkupLocked(m))return toast('Layer locked.');
    checkpoint();e.preventDefault();e.stopPropagation();R9.activeSegment=seg;
    const move=ev=>{const p=snapPoint(svgPoint(ev),m.id);m.r9Curves[seg]={x:p.x,y:p.y};m.modified=stamp();renderMarkups();renderSelection()};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);render();updateProperties()};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  }

  function insertAtSegment(m,seg){
    if(isMarkupLocked(m))return toast('Layer locked.');
    if(seg<0||seg>=m.points.length-1)return;
    checkpoint();
    const a=m.points[seg],b=m.points[seg+1],c=curveFor(m,seg);
    let p;
    if(c){
      p=[.25*a[0]+.5*c.x+.25*b[0],.25*a[1]+.5*c.y+.25*b[1]];
    }else{const z=midpoint(a,b);p=[z.x,z.y]}
    reindexCurvesInsert(m,seg);delete m.r9Curves[seg];
    m.points.splice(seg+1,0,p);R9.activeNode=seg+1;R9.activeSegment=seg;m.modified=stamp();render();updateProperties();
  }

  function removeActiveNode(){
    const m=selectedOne();if(!m?.r9Path)return toast('Select an R9 editable path.');
    if(isMarkupLocked(m))return toast('Layer locked.');
    if(m.points.length<=2)return toast('A path needs at least two nodes.');
    const i=Number(R9.activeNode);
    if(!Number.isInteger(i)||i<0||i>=m.points.length)return toast('Click a node first.');
    checkpoint();reindexCurvesDelete(m,i);m.points.splice(i,1);R9.activeNode=null;R9.activeSegment=Math.max(0,Math.min(i-1,m.points.length-2));m.modified=stamp();render();updateProperties();
  }

  function curveActiveSegment(){
    const m=selectedOne();if(!m?.r9Path)return toast('Select an R9 editable path.');
    if(isMarkupLocked(m))return toast('Layer locked.');
    const seg=Number(R9.activeSegment);
    if(!Number.isInteger(seg)||seg<0||seg>=m.points.length-1)return toast('Click a segment midpoint first.');
    checkpoint();
    const a=m.points[seg],b=m.points[seg+1],mid=midpoint(a,b),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
    m.r9Curves[seg]={x:mid.x-dy/len*20,y:mid.y+dx/len*20};m.modified=stamp();render();updateProperties();
  }

  function straightenActiveSegment(){
    const m=selectedOne();if(!m?.r9Path)return toast('Select an R9 editable path.');
    if(isMarkupLocked(m))return toast('Layer locked.');
    const seg=Number(R9.activeSegment);if(!Number.isInteger(seg))return toast('Choose a segment first.');
    checkpoint();delete m.r9Curves[seg];m.modified=stamp();render();updateProperties();
  }

  function renderPathHandles(m){
    const ig=q('#interactionLayer');if(!ig)return;
    if(isMarkupLocked(m))return;
    for(let i=0;i<m.points.length;i++){
      const [x,y]=m.points[i],h=svgEl('circle',{cx:x,cy:y,r:4.8,class:'r9NodeHandle'});
      if(R9.activeNode===i)h.classList.add('active');
      h.addEventListener('pointerdown',e=>dragNode(e,m,i));ig.appendChild(h);
    }
    for(let i=0;i<m.points.length-1;i++){
      const a=m.points[i],b=m.points[i+1],z=midpoint(a,b),mid=svgEl('rect',{x:z.x-3,y:z.y-3,width:6,height:6,class:'r9SegmentHandle'});
      if(R9.activeSegment===i)mid.classList.add('active');
      mid.title='Click to select segment; double-click to insert node';
      mid.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();R9.activeSegment=i;R9.activeNode=null;renderSelection();updateProperties()});
      mid.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();insertAtSegment(m,i)});
      ig.appendChild(mid);

      const c=curveFor(m,i);
      if(c){
        ig.appendChild(svgEl('line',{x1:z.x,y1:z.y,x2:c.x,y2:c.y,class:'r9CurveGuide'}));
        const ch=svgEl('circle',{cx:c.x,cy:c.y,r:4,class:'r9CurveHandle'});
        ch.addEventListener('pointerdown',e=>dragCurve(e,m,i));ig.appendChild(ch);
      }
    }
  }

  const priorRenderSelection=renderSelection;
  renderSelection=function(){
    priorRenderSelection();
    const m=selectedOne();
    if(m?.r9Path)renderPathHandles(m);
    renderMultiSelection();
  };

  // -----------------------------------------------------------------------
  // CONVERT EXISTING GEOMETRY TO R9 PATH
  // -----------------------------------------------------------------------

  function convertible(m){
    if(!m||m.r7Attached||m.r8Station||m.r6Road||m.r6Intersection)return false;
    return m.r9Path||m.type==='line'||m.type==='arrow'||m.type==='deviceRun'||m.type==='polyline';
  }

  function convertSelected(){
    const old=selectedOne();if(!old)return toast('Select a line, polyline, or device run.');
    if(old.r9Path)return toast('That object is already an R9 editable path.');
    if(!convertible(old))return toast('This object type cannot be converted to an editable path.');
    if(isMarkupLocked(old))return toast('Layer locked.');

    checkpoint();
    let pts;
    if(Array.isArray(old.points))pts=old.points.map(p=>[Number(p[0])||0,Number(p[1])||0]);
    else pts=[[Number(old.x)||0,Number(old.y)||0],[Number(old.x2)||0,Number(old.y2)||0]];

    const kind=old.type==='deviceRun'?'deviceRun':old.r81FreeTabs?'tabs':'generic';
    const m={
      ...JSON.parse(JSON.stringify(old)),
      id:uid(),type:'r9Path',r9Path:true,r9Kind:kind,points:pts,r9Curves:{},
      r9DeviceKind:old.deviceKind||'cone',
      r9SpacingFt:old.r81SpacingFt||20,
      r9TabColor:old.r81TabColor||'white',
      created:stamp(),modified:stamp()
    };
    delete m.x;delete m.y;delete m.x2;delete m.y2;delete m.w;delete m.h;
    page().markups=page().markups.filter(x=>x.id!==old.id);
    page().markups.push(m);state.selected=m.id;R9.activeNode=null;R9.activeSegment=0;render();updateProperties();
    toast('Converted to R9 editable path.');
  }

  // -----------------------------------------------------------------------
  // MULTI-SELECTION / GROUPS
  // -----------------------------------------------------------------------

  function clearMulti(){R9.selected.clear();renderSelection();updateMultiUi()}
  function addMulti(id){if(id)R9.selected.add(id);renderSelection();updateMultiUi()}

  function rectIntersects(a,b){
    return a.x<=b.x+b.w&&a.x+a.w>=b.x&&a.y<=b.y+b.h&&a.y+a.h>=b.y;
  }
  function rectContains(a,b){
    return b.x>=a.x&&b.y>=a.y&&b.x+b.w<=a.x+a.w&&b.y+b.h<=a.y+a.h;
  }

  function beginWindowSelect(){
    state.tool='r9MultiWindow';q('#statusTool').textContent='R9 Window Select — drag selection rectangle';q('#canvasScroller').style.cursor='crosshair';
  }

  svg.addEventListener('pointerdown',e=>{
    if(state.tool!=='r9MultiWindow'||e.button!==0)return;
    e.preventDefault();e.stopImmediatePropagation();
    const a=svgPoint(e);let z=a;
    const ig=q('#interactionLayer'),r=svgEl('rect',{x:a.x,y:a.y,width:1,height:1,class:'r9WindowRect'});ig.appendChild(r);
    const move=ev=>{
      z=svgPoint(ev);r.setAttribute('x',Math.min(a.x,z.x));r.setAttribute('y',Math.min(a.y,z.y));r.setAttribute('width',Math.abs(z.x-a.x));r.setAttribute('height',Math.abs(z.y-a.y));
    };
    const up=ev=>{
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);z=svgPoint(ev);
      const box={x:Math.min(a.x,z.x),y:Math.min(a.y,z.y),w:Math.abs(z.x-a.x),h:Math.abs(z.y-a.y)};
      const crossing=z.x<a.x;R9.selected.clear();
      for(const m of (page()?.markups||[])){
        if(!isMarkupVisible(m))continue;const b=bounds(m);if(!b)continue;
        if(crossing?rectIntersects(box,b):rectContains(box,b))R9.selected.add(m.id);
      }
      state.selected=null;setTool('select');render();renderSelection();updateMultiUi();
      toast(`${R9.selected.size} object${R9.selected.size===1?'':'s'} selected.`);
    };
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  },true);

  // Shift-click toggles objects into R9 multi-selection.
  svg.addEventListener('pointerdown',e=>{
    if(state.tool!=='select'||!e.shiftKey||e.button!==0)return;
    const node=e.target.closest?.('[data-id]'),id=node?.dataset?.id;if(!id||!byId(id))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(R9.selected.has(id))R9.selected.delete(id);else R9.selected.add(id);
    state.selected=null;renderSelection();updateMultiUi();
  },true);

  function renderMultiSelection(){
    if(!R9.selected.size)return;
    const ig=q('#interactionLayer');if(!ig)return;
    for(const id of R9.selected){
      const m=byId(id);if(!m||!isMarkupVisible(m))continue;const b=bounds(m);if(!b)continue;
      ig.appendChild(svgEl('rect',{x:b.x-2,y:b.y-2,width:b.w+4,height:b.h+4,class:'r9MultiBox','pointer-events':'none'}));
    }
    const items=selectedObjects(),bs=items.map(bounds).filter(Boolean);
    if(bs.length){
      const x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y));
      const t=svgEl('text',{x,y:Math.max(9,y-6),'font-size':9,'font-weight':'700',fill:'#5b3f91','pointer-events':'none'});
      t.textContent=`${R9.selected.size} SELECTED`;ig.appendChild(t);
    }
  }

  function selectGroup(){
    const m=selectedOne()||selectedObjects()[0];if(!m?.r9GroupId)return toast('Selected object is not grouped.');
    R9.selected.clear();for(const x of page().markups)if(x.r9GroupId===m.r9GroupId)R9.selected.add(x.id);
    state.selected=null;renderSelection();updateMultiUi();
  }

  function groupSelected(){
    const items=selectedObjects();if(items.length<2)return toast('Select at least two objects.');
    const id='grp_'+Date.now().toString(36);checkpoint();items.forEach(m=>{m.r9GroupId=id;m.modified=stamp()});render();updateMultiUi();toast('Objects grouped.');
  }

  function ungroupSelected(){
    const items=selectedObjects();if(!items.length)return toast('Select grouped objects first.');
    checkpoint();items.forEach(m=>{delete m.r9GroupId;m.modified=stamp()});render();updateMultiUi();toast('Objects ungrouped.');
  }

  function batchMove(dx,dy){
    const items=selectedObjects();if(!items.length)return toast('Select objects first.');
    if(items.some(isMarkupLocked))return toast('One or more selected objects are on locked layers.');
    checkpoint();
    for(const m of items){const orig=JSON.parse(JSON.stringify(m));translateMarkup(m,dx,dy,orig);m.modified=stamp()}
    render();renderSelection();
  }

  function batchLayer(){
    const id=q('#r9BatchLayer')?.value,items=selectedObjects();if(!id||!items.length)return toast('Select objects first.');
    if(items.some(isMarkupLocked))return toast('One or more selected objects are on locked layers.');
    checkpoint();items.forEach(m=>{m.layer=id;m.modified=stamp()});render();renderLayers();renderSelection();
  }

  function remapCloneRelations(clones,idMap){
    for(const m of clones){
      if(m.r7RoadId&&idMap.has(m.r7RoadId))m.r7RoadId=idMap.get(m.r7RoadId);
      if(m.r8RoadId&&idMap.has(m.r8RoadId))m.r8RoadId=idMap.get(m.r8RoadId);
      if(Array.isArray(m.roads))m.roads=m.roads.map(id=>idMap.get(id)||id);
    }
  }

  function duplicateMulti(){
    const items=selectedObjects();if(!items.length)return toast('Select objects first.');
    if(items.some(isMarkupLocked))return toast('One or more selected objects are on locked layers.');
    checkpoint();
    const idMap=new Map(),clones=[];
    for(const m of items){
      const c=JSON.parse(JSON.stringify(m)),old=c.id;c.id=uid();idMap.set(old,c.id);c.created=c.modified=stamp();
      const orig=JSON.parse(JSON.stringify(c));translateMarkup(c,12,12,orig);clones.push(c);
    }
    remapCloneRelations(clones,idMap);
    page().markups.push(...clones);R9.selected=new Set(clones.map(c=>c.id));state.selected=null;render();renderSelection();updateMultiUi();toast('Selection duplicated.');
  }

  function deleteMulti(){
    const items=selectedObjects();if(!items.length)return toast('Select objects first.');
    if(items.some(isMarkupLocked))return toast('One or more selected objects are on locked layers.');
    checkpoint();const ids=new Set(items.map(m=>m.id));page().markups=page().markups.filter(m=>!ids.has(m.id));clearMulti();render();toast('Selection deleted.');
  }

  // -----------------------------------------------------------------------
  // APPEARANCE COPY / PASTE
  // -----------------------------------------------------------------------

  const APPEARANCE_FIELDS=['stroke','width','fill','fillOpacity','dash','hatch','hatchColor','hatchSpacing','opacity','rotation','font','fontSize','textColor','textAlign','bold','italic'];

  function copyAppearance(){
    const m=selectedOne()||selectedObjects()[0];if(!m)return toast('Select an object first.');
    R9.appearance={};for(const k of APPEARANCE_FIELDS)if(m[k]!==undefined)R9.appearance[k]=JSON.parse(JSON.stringify(m[k]));
    toast('Appearance copied.');
  }

  function pasteAppearance(){
    const targets=R9.selected.size?selectedObjects():(selectedOne()?[selectedOne()]:[]);
    if(!targets.length)return toast('Select an object first.');
    if(!R9.appearance)return toast('Copy an appearance first.');
    if(targets.some(isMarkupLocked))return toast('One or more selected objects are on locked layers.');
    checkpoint();for(const m of targets){Object.assign(m,JSON.parse(JSON.stringify(R9.appearance)));m.modified=stamp()}render();updateProperties();toast('Appearance applied.');
  }

  // -----------------------------------------------------------------------
  // MANUAL OFFSET GEOMETRY
  // -----------------------------------------------------------------------

  function offsetPolyline(points,offset){
    if(points.length<2)return points.map(p=>[p[0],p[1]]);
    const normals=[];
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
      normals.push({x:-dy/len,y:dx/len});
    }
    return points.map((p,i)=>{
      let nx,ny;
      if(i===0){nx=normals[0].x;ny=normals[0].y}
      else if(i===points.length-1){nx=normals.at(-1).x;ny=normals.at(-1).y}
      else{
        nx=normals[i-1].x+normals[i].x;ny=normals[i-1].y+normals[i].y;
        const len=Math.hypot(nx,ny)||1;nx/=len;ny/=len;
      }
      return[p[0]+nx*offset,p[1]+ny*offset];
    });
  }

  function offsetSelected(){
    const m=selectedOne();if(!m)return toast('Select an open line/path first.');
    if(isMarkupLocked(m))return toast('Layer locked.');
    const ft=Number(q('#r9OffsetFt')?.value)||0;if(!ft)return toast('Enter a non-zero offset.');
    const side=q('#r9OffsetSide')?.value==='right'?-1:1,off=feetToPts(ft)*side;
    const copy=q('#r9OffsetMode')?.value!=='move';
    let pts,kind='generic';

    if(m.r9Path){pts=samplePath(m,8).map(p=>[p.x,p.y]);kind=m.r9Kind}
    else if(m.type==='line'||m.type==='arrow'||m.type==='deviceRun'){pts=[[m.x,m.y],[m.x2,m.y2]];kind=m.type==='deviceRun'?'deviceRun':'generic'}
    else if(m.type==='polyline'){pts=(m.points||[]).map(p=>[p[0],p[1]])}
    else return toast('Offset currently supports open lines, polylines, and R9 paths.');

    const nu=offsetPolyline(pts,off);checkpoint();
    if(copy){
      const c={
        ...JSON.parse(JSON.stringify(m)),id:uid(),type:'r9Path',r9Path:true,r9Kind:kind,
        points:nu,r9Curves:{},created:stamp(),modified:stamp(),subject:(m.subject||'Path')+' Offset'
      };
      delete c.x;delete c.y;delete c.x2;delete c.y2;delete c.w;delete c.h;
      page().markups.push(c);state.selected=c.id;
    }else{
      if(m.r9Path){m.points=nu;m.r9Curves={}}
      else if(m.type==='polyline')m.points=nu;
      else{m.x=nu[0][0];m.y=nu[0][1];m.x2=nu[1][0];m.y2=nu[1][1]}
      m.modified=stamp();
    }
    render();updateProperties();toast('Manual offset applied.');
  }

  // -----------------------------------------------------------------------
  // R9 PROPERTIES
  // -----------------------------------------------------------------------

  function injectR9Props(){
    let box=q('#r9PathProps');
    if(!box){box=ce('details','r9PathProps');box.id='r9PathProps';box.open=true;q('#propEditor')?.appendChild(box)}
    const m=selectedOne();
    if(!m?.r9Path||state.propertyMode!=='object'){box.classList.add('hidden');return}
    box.classList.remove('hidden');

    const extra=m.r9Kind==='deviceRun'
      ? `<label>Device<select id="r9PropDevice"><option value="cone">Cone</option><option value="drum">Drum</option><option value="verticalPanel">Vertical Panel</option><option value="barricade">Barricade</option><option value="barrier">Barrier</option></select></label>
         <label>Spacing ft<input id="r9PropSpacing" type="number" min="1" value="${Number(m.r9SpacingFt)||20}"></label>`
      :m.r9Kind==='tabs'
      ? `<label>Tab color<select id="r9PropTab"><option value="white">White</option><option value="yellow">Yellow</option></select></label>
         <label>Spacing ft<input id="r9PropSpacing" type="number" min="1" value="${Number(m.r9SpacingFt)||20}"></label>`
      :`<label>Line style<select id="r9PropStyle"><option value="generic">Generic</option><option value="closure">Closure / Orange</option><option value="dashWhite">Dashed White</option><option value="solidWhite">Solid White</option><option value="dashYellow">Dashed Yellow</option><option value="solidYellow">Solid Yellow</option><option value="taper">Taper / Orange</option></select></label>`;

    box.innerHTML=`<summary>R9 Editable Path</summary>
      <div class="r9PropGrid">
        <label>Kind<input value="${m.r9Kind}" disabled></label>
        <label>Nodes<input value="${m.points.length}" disabled></label>
        ${extra}
      </div>
      <div class="r9PropActions">
        <button id="r9PropCurve">Curve Segment</button>
        <button id="r9PropStraight">Straighten Segment</button>
        <button id="r9PropRemoveNode">Remove Node</button>
      </div>
      <small>Circle handles move nodes. Square handles choose a segment; double-click a square to insert a node. Curve handles reshape curved segments.</small>`;

    if(q('#r9PropDevice'))q('#r9PropDevice').value=m.r9DeviceKind||'cone';
    if(q('#r9PropTab'))q('#r9PropTab').value=m.r9TabColor||'white';
    if(q('#r9PropStyle'))q('#r9PropStyle').value=m.r9LineStyle||'generic';

    const bind=(id,fn)=>{const el=q(id);if(!el)return;el.onchange=e=>{if(isMarkupLocked(m))return toast('Layer locked.');checkpoint();fn(e.target.value);m.modified=stamp();render();updateProperties()}};
    bind('#r9PropDevice',v=>m.r9DeviceKind=v);
    bind('#r9PropSpacing',v=>m.r9SpacingFt=Math.max(1,Number(v)||20));
    bind('#r9PropTab',v=>m.r9TabColor=v);
    bind('#r9PropStyle',v=>{m.r9LineStyle=v;const st=lineStyle(v);m.stroke=st[0];m.width=st[1];m.dash=st[2]});

    q('#r9PropCurve').onclick=curveActiveSegment;
    q('#r9PropStraight').onclick=straightenActiveSegment;
    q('#r9PropRemoveNode').onclick=removeActiveNode;
    if(isMarkupLocked(m))box.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
  }

  const priorUpdateProperties=updateProperties;
  updateProperties=function(){priorUpdateProperties();injectR9Props()};

  // -----------------------------------------------------------------------
  // PALETTE
  // -----------------------------------------------------------------------

  function updateMultiUi(){
    const c=q('#r9SelectionCount');if(c)c.textContent=`${R9.selected.size} selected`;
    const layer=q('#r9BatchLayer');if(layer){
      const cur=layer.value;layer.innerHTML=state.layers.map(l=>`<option value="${l.id}">${l.name}</option>`).join('');
      if(state.layers.some(l=>l.id===cur))layer.value=cur;
    }
  }

  function syncSnapUi(){
    const ids={
      r9SnapEnable:'enabled',r9SnapGrid:'grid',r9SnapEndpoint:'endpoint',r9SnapMidpoint:'midpoint',r9SnapSegment:'segment'
    };
    for(const [id,k] of Object.entries(ids)){const el=q('#'+id);if(el)el.checked=!!R9.snap[k]}
    if(q('#r9GridFt'))q('#r9GridFt').value=R9.snap.gridFt;
  }

  function openPalette(){
    let p=q('#r9EditPalette');
    if(!p){
      p=ce('section','palette r9EditPalette hidden');p.id='r9EditPalette';p.dataset.floating='true';
      p.innerHTML=`<div class="paletteHead"><strong>Manual Geometry</strong><span>R9 universal editing</span><button data-r9-close>×</button></div>
      <div class="paletteBody">
        <div class="r9Notice">Manual drafting only. R9 adds editing precision; it does not decide placement or generate a traffic-control plan.</div>

        <div class="toolSection"><b>Multi-Select / Group</b>
          <div class="r9Status" id="r9SelectionCount">0 selected</div>
          <div class="r9Grid2"><button id="r9WindowSelect">Window Select</button><button id="r9ClearSelect">Clear</button><button id="r9SelectGroup">Select Group</button><button id="r9Group">Group</button><button id="r9Ungroup">Ungroup</button><button id="r9DuplicateMulti">Duplicate</button></div>
          <label class="r9Field">Move step (pt)<input id="r9Nudge" type="number" min=".1" step=".5" value="5"></label>
          <div class="r9Nudge"><button data-r9-nudge="0,-1">↑</button><button data-r9-nudge="-1,0">←</button><button data-r9-nudge="1,0">→</button><button data-r9-nudge="0,1">↓</button></div>
          <label class="r9Field">Move selection to layer<select id="r9BatchLayer"></select></label>
          <div class="r9Grid2"><button id="r9ApplyLayer">Apply Layer</button><button id="r9DeleteMulti">Delete Selection</button></div>
          <small>Shift-click toggles individual objects. Window left-to-right contains; right-to-left crossing-selects.</small>
        </div>

        <div class="toolSection"><b>Editable Free Path</b>
          <div class="r9Grid2">
            <label>Kind<select id="r9PathKind"><option value="generic">Generic Path</option><option value="deviceRun">Device Run</option><option value="line">Temporary Line</option><option value="tabs">Temporary Tabs</option><option value="taper">Taper / Shift Path</option></select></label>
            <label>Line style<select id="r9LineStyle"><option value="generic">Generic</option><option value="closure">Closure / Orange</option><option value="dashWhite">Dashed White</option><option value="solidWhite">Solid White</option><option value="dashYellow">Dashed Yellow</option><option value="solidYellow">Solid Yellow</option></select></label>
            <label>Device<select id="r9DeviceKind"><option value="cone">Cone</option><option value="drum">Drum</option><option value="verticalPanel">Vertical Panel</option><option value="barricade">Barricade</option><option value="barrier">Barrier</option></select></label>
            <label>Spacing ft<input id="r9SpacingFt" type="number" min="1" value="20"></label>
            <label>Tab color<select id="r9TabColor"><option value="white">White</option><option value="yellow">Yellow</option></select></label>
          </div>
          <button class="r9Wide" id="r9DrawPath">Draw Editable Path</button>
          <button class="r9Wide" id="r9ConvertPath">Convert Selected Line / Device Run</button>
        </div>

        <div class="toolSection"><b>Snapping</b>
          <div class="r9Checks"><label><input id="r9SnapEnable" type="checkbox"> Master Snap</label><label><input id="r9SnapEndpoint" type="checkbox"> Endpoint</label><label><input id="r9SnapMidpoint" type="checkbox"> Midpoint</label><label><input id="r9SnapSegment" type="checkbox"> Segment</label><label><input id="r9SnapGrid" type="checkbox"> Grid</label></div>
          <label class="r9Field">Grid spacing ft<input id="r9GridFt" type="number" min=".25" step=".25" value="5"></label>
        </div>

        <div class="toolSection"><b>Manual Offset Geometry</b>
          <div class="r9Grid3"><label>Distance ft<input id="r9OffsetFt" type="number" step=".5" value="3"></label><label>Side<select id="r9OffsetSide"><option value="left">Left</option><option value="right">Right</option></select></label><label>Mode<select id="r9OffsetMode"><option value="copy">Copy</option><option value="move">Move</option></select></label></div>
          <button class="r9Wide" id="r9Offset">Apply Offset</button>
        </div>

        <div class="toolSection"><b>Appearance</b>
          <div class="r9Grid2"><button id="r9CopyAppearance">Copy Appearance</button><button id="r9PasteAppearance">Paste Appearance</button></div>
        </div>
      </div>`;

      document.body.appendChild(p);
      p.querySelector('[data-r9-close]').onclick=()=>p.classList.add('hidden');
      q('#r9WindowSelect').onclick=beginWindowSelect;
      q('#r9ClearSelect').onclick=clearMulti;
      q('#r9SelectGroup').onclick=selectGroup;
      q('#r9Group').onclick=groupSelected;
      q('#r9Ungroup').onclick=ungroupSelected;
      q('#r9DuplicateMulti').onclick=duplicateMulti;
      q('#r9DeleteMulti').onclick=deleteMulti;
      q('#r9ApplyLayer').onclick=batchLayer;
      q('#r9DrawPath').onclick=beginPath;
      q('#r9ConvertPath').onclick=convertSelected;
      q('#r9Offset').onclick=offsetSelected;
      q('#r9CopyAppearance').onclick=copyAppearance;
      q('#r9PasteAppearance').onclick=pasteAppearance;
      p.querySelectorAll('[data-r9-nudge]').forEach(b=>b.onclick=()=>{
        const [x,y]=b.dataset.r9Nudge.split(',').map(Number),step=Math.max(.1,Number(q('#r9Nudge').value)||5);batchMove(x*step,y*step);
      });
      const checks={r9SnapEnable:'enabled',r9SnapGrid:'grid',r9SnapEndpoint:'endpoint',r9SnapMidpoint:'midpoint',r9SnapSegment:'segment'};
      for(const [id,k] of Object.entries(checks))q('#'+id).onchange=e=>R9.snap[k]=e.target.checked;
      q('#r9GridFt').onchange=e=>R9.snap.gridFt=Math.max(.25,Number(e.target.value)||5);
    }
    updateMultiUi();syncSnapUi();
    p.classList.toggle('hidden');
  }

  function installUi(){
    const small=q('.brand small');if(small)small.textContent='0.1 R9';
    document.title='NXT Gen Plans 0.1 R9';
    const pals=q('.paletteButtons');
    if(pals&&!q('#r9EditBtn')){
      const b=ce('button','r9EditButton');b.id='r9EditBtn';b.textContent='Edit+';
      b.title='R9 manual geometry, control points, snapping, grouping and offset tools';
      b.onclick=openPalette;pals.appendChild(b);
    }
  }

  // Escape cleanly cancels an unfinished R9 path.
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&state.tool==='r9PathDraw'&&R9.pathDraft){
      const m=R9.pathDraft;R9.pathDraft=null;page().markups=page().markups.filter(x=>x!==m);render();
    }
  },true);

  installUi();
  window.NXT_R9={
    openPalette,
    snapPoint,
    clearMulti,
    selectedObjects,
    convertSelected
  };
  console.info('NXT Gen Plans R9 universal manual geometry loaded.');
})();
