'use strict';
/* NXT Gen Plans 0.1 R7 — Manual Road-Attached TCP Tools */
(() => {
  if(!window.NXT_R5 || !window.NXT_R6 || !window.NXT_R6_1 || !window.__NXT_R6_1_INTEGRATION){
    console.error('R7 requires the accepted R6.1 FIX2 baseline.'); return;
  }
  if(window.__NXT_R7_MANUAL_TCP)return;
  window.__NXT_R7_MANUAL_TCP=true;

  const q=s=>document.querySelector(s), ce=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.innerHTML=h;return n};
  const stamp=()=>new Date().toISOString(), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const R7={roadId:null,pending:null,pickStart:null};
  const page=()=>currentPage();
  const roads=()=> (page()?.markups||[]).filter(m=>m.r6Road||m.r5RoadPath||m.r4Road);
  const roadById=id=>roads().find(m=>m.id===id)||null;
  const pageScale=()=>Number(page()?.scaleFeetPerInch)||0;
  const feetToPts=ft=>pageScale()?Number(ft)/pageScale()*72:Number(ft)*2;
  const layerLocked=id=>!!state.layers.find(l=>l.id===id)?.locked;

  function sampleRoad(m,steps=18){
    if(!m)return[];
    if(m.r6Road&&Array.isArray(m.points)){
      const out=[],pts=m.points;if(pts.length<2)return pts.map(p=>({x:p[0],y:p[1]}));
      for(let i=0;i<pts.length-1;i++){
        const a={x:pts[i][0],y:pts[i][1]},b={x:pts[i+1][0],y:pts[i+1][1]},c=m.r6Curves?.[i],n=c?steps:1;
        for(let k=0;k<n;k++){const t=k/n;if(c){const u=1-t;out.push({x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y})}else out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})}
      }
      const z=pts.at(-1);out.push({x:z[0],y:z[1]});return out;
    }
    if(Array.isArray(m.points))return m.points.map(p=>({x:+p[0]||0,y:+p[1]||0}));
    if(Number.isFinite(m.x)&&Number.isFinite(m.x2))return[{x:m.x,y:m.y},{x:m.x2,y:m.y2}];
    return[];
  }
  function cumulative(s){let t=0;const d=[0];for(let i=1;i<s.length;i++){t+=Math.hypot(s[i].x-s[i-1].x,s[i].y-s[i-1].y);d.push(t)}return{d,total:t}}
  function pointAtT(s,t){
    if(s.length<2)return{x:s[0]?.x||0,y:s[0]?.y||0,tx:1,ty:0};
    const c=cumulative(s),target=clamp(+t||0,0,1)*c.total;
    for(let i=1;i<s.length;i++)if(c.d[i]>=target){const a=s[i-1],b=s[i],seg=Math.max(.001,c.d[i]-c.d[i-1]),u=clamp((target-c.d[i-1])/seg,0,1),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;return{x:a.x+dx*u,y:a.y+dy*u,tx:dx/len,ty:dy/len}}
    const a=s.at(-2),b=s.at(-1),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;return{x:b.x,y:b.y,tx:dx/len,ty:dy/len};
  }
  function nearestT(s,p){
    const c=cumulative(s);let best={dist:Infinity,t:0};
    for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,u=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l2,0,1),x=a.x+dx*u,y=a.y+dy*u,dist=Math.hypot(p.x-x,p.y-y);if(dist<best.dist)best={dist,t:c.total?(c.d[i-1]+Math.sqrt(l2)*u)/c.total:0}}
    return best;
  }
  function rangeSamples(road,t0,t1){
    const base=sampleRoad(road),a=clamp(Math.min(t0,t1),0,1),b=clamp(Math.max(t0,t1),0,1),n=Math.max(2,Math.ceil((b-a)*90)),out=[];
    for(let i=0;i<=n;i++)out.push(pointAtT(base,a+(b-a)*i/n)); if(t0>t1)out.reverse(); return out;
  }
  function offsetSamples(s,aFt,bFt=aFt){
    const a=feetToPts(+aFt||0),b=feetToPts(+bFt||0),last=Math.max(1,s.length-1);
    return s.map((p,i)=>{const off=a+(b-a)*i/last;return{x:p.x-p.ty*off,y:p.y+p.tx*off,tx:p.tx,ty:p.ty}});
  }
  const pathD=s=>s.length?'M'+s.map((p,i)=>(i?'L':'')+p.x+' '+p.y).join(' '):'';
  function polyBounds(s,pad=6){if(!s.length)return{x:0,y:0,w:1,h:1};const xs=s.map(p=>p.x),ys=s.map(p=>p.y);return{x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+pad*2,h:Math.max(...ys)-Math.min(...ys)+pad*2}}
  function geometry(m){
    const road=roadById(m.r7RoadId);if(!road)return{road:null,path:[],center:[],bounds:{x:0,y:0,w:1,h:1}};
    const center=rangeSamples(road,m.r7StartT,m.r7EndT),path=offsetSamples(center,m.r7StartOffsetFt,m.r7EndOffsetFt);
    if(m.r7Kind==='workArea'){const left=offsetSamples(center,m.r7LeftOffsetFt),right=offsetSamples(center,m.r7RightOffsetFt);return{road,center,path,left,right,bounds:polyBounds([...left,...right],5)}}
    return{road,center,path,bounds:polyBounds(path,8)};
  }

  function addAttached(kind,road,t0,t1,s){
    const layer=kind==='deviceRun'?'trafficDevices':kind==='workArea'?'workZones':'tempTraffic';
    if(layerLocked(layer))return toast(`${state.layers.find(l=>l.id===layer)?.name||layer} layer is locked.`);
    checkpoint();
    const m={id:uid(),type:'r7Attached',layer,subject:s.subject||'Manual Road TCP',comment:'Manual R7 road attachment',status:'Open',created:stamp(),modified:stamp(),r7Attached:true,r7Kind:kind,r7RoadId:road.id,r7StartT:clamp(t0,0,1),r7EndT:clamp(t1,0,1),r7StartOffsetFt:+s.startOffsetFt||0,r7EndOffsetFt:+(s.endOffsetFt??s.startOffsetFt)||0,opacity:1,...s};
    page().markups.push(m);state.selected=m.id;state.propertyMode='object';render();setTool('select');updateProperties();toast('Manual road-attached object created.');
  }
  function startPick(kind,settings){
    const road=roadById(R7.roadId);if(!road)return toast('Choose a roadway first.');
    const layer=kind==='deviceRun'?'trafficDevices':kind==='workArea'?'workZones':'tempTraffic';if(layerLocked(layer))return toast('Target layer is locked.');
    R7.pending={kind,settings,roadId:road.id};R7.pickStart=null;state.tool='r7PickRange';q('#statusTool').textContent='R7 Manual Range — click START then END';q('#canvasScroller').style.cursor='crosshair';toast('Click the exact start on the selected road, then the exact end.');
  }

  const svg=q('#pageSvg');
  svg.addEventListener('pointerdown',e=>{if(state.tool==='r7PickRange'&&e.button===0){e.preventDefault();e.stopImmediatePropagation()}},true);
  svg.addEventListener('click',e=>{
    if(state.tool!=='r7PickRange'||!R7.pending)return;e.preventDefault();e.stopImmediatePropagation();
    const road=roadById(R7.pending.roadId);if(!road){R7.pending=null;setTool('select');return toast('Road is no longer available.')}
    const hit=nearestT(sampleRoad(road),svgPoint(e));
    if(!R7.pickStart){R7.pickStart=hit;q('#statusTool').textContent='R7 Manual Range — click END';return toast(`Start: ${(hit.t*100).toFixed(1)}% along road. Click end.`)}
    const first=R7.pickStart,p=R7.pending;R7.pickStart=null;R7.pending=null;addAttached(p.kind,road,first.t,hit.t,p.settings);
  },true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.tool==='r7PickRange'){R7.pending=null;R7.pickStart=null}},true);

  function groupBase(m){
    const g=svgEl('g');g.dataset.id=m.id;g.classList.add('markup','r7AttachedMarkup');if(state.selected===m.id)g.classList.add('selected');g.setAttribute('opacity',m.opacity??1);
    g.addEventListener('pointerdown',e=>{if(state.tool!=='select')return;e.preventDefault();e.stopPropagation();state.selected=m.id;state.propertyMode='object';renderSelection();updateProperties()});
    g.addEventListener('contextmenu',e=>openContext(e,m.id));return g;
  }
  function symbol(g,p,kind){
    if(kind==='drum'){g.appendChild(svgEl('rect',{x:p.x-3,y:p.y-5,width:6,height:10,rx:1,fill:'#f58220',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));g.appendChild(svgEl('rect',{x:p.x-3,y:p.y-1,width:6,height:2,fill:'#fff','pointer-events':'none'}));return}
    if(kind==='verticalPanel'){g.appendChild(svgEl('rect',{x:p.x-2,y:p.y-6,width:4,height:12,fill:'#fff',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));g.appendChild(svgEl('line',{x1:p.x-2,y1:p.y-4,x2:p.x+2,y2:p.y,stroke:'#f58220','stroke-width':2,'pointer-events':'none'}));return}
    if(kind==='barricade'){g.appendChild(svgEl('rect',{x:p.x-6,y:p.y-2,width:12,height:4,fill:'#fff',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));g.appendChild(svgEl('line',{x1:p.x-5,y1:p.y-1.5,x2:p.x+5,y2:p.y+1.5,stroke:'#f58220','stroke-width':2,'pointer-events':'none'}));return}
    if(kind==='barrier'){g.appendChild(svgEl('rect',{x:p.x-6,y:p.y-2.5,width:12,height:5,fill:'#d6d6d6',stroke:'#555','stroke-width':.7,'pointer-events':'none'}));return}
    g.appendChild(svgEl('path',{d:`M${p.x} ${p.y-5} L${p.x+3.5} ${p.y+4} L${p.x-3.5} ${p.y+4} Z`,fill:'#f58220',stroke:'#333','stroke-width':.6,'pointer-events':'none'}));
  }
  function deviceRun(g,m,geom){
    const s=geom.path,c=cumulative(s),spacing=Math.max(3,feetToPts(+m.r7SpacingFt||20));
    for(let dist=0;dist<=c.total+.01;dist+=spacing){let i=1;while(i<c.d.length&&c.d[i]<dist)i++;i=Math.min(i,c.d.length-1);const a=s[i-1],b=s[i],seg=Math.max(.001,c.d[i]-c.d[i-1]),u=clamp((dist-c.d[i-1])/seg,0,1);symbol(g,{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},m.r7DeviceKind||'cone')}
    g.appendChild(svgEl('path',{d:pathD(s),fill:'none',stroke:'transparent','stroke-width':18,'pointer-events':'stroke'}));
  }
  function lineStyle(k){return({dashWhite:['#fff',2,'12 8'],solidWhite:['#fff',2,''],dashYellow:['#f2c230',2,'12 8'],solidYellow:['#f2c230',2,''],taper:['#ef6c00',2.5,'8 5'],closure:['#ef6c00',2.5,'8 5']})[k]||['#ef6c00',2.5,'8 5']}
  function lineRun(g,m,geom){const st=lineStyle(m.r7LineStyle||m.r7Kind),p=svgEl('path',{d:pathD(geom.path),fill:'none',stroke:st[0],'stroke-width':st[1],'pointer-events':'stroke'});if(st[2])p.setAttribute('stroke-dasharray',st[2]);g.appendChild(p)}
  function tabs(g,m,geom){
    const s=geom.path,c=cumulative(s),spacing=Math.max(3,feetToPts(+m.r7SpacingFt||20)),fill=m.r7TabColor==='yellow'?'#f2c230':'#fff';
    for(let dist=0;dist<=c.total+.01;dist+=spacing){let i=1;while(i<c.d.length&&c.d[i]<dist)i++;i=Math.min(i,c.d.length-1);const a=s[i-1],b=s[i],seg=Math.max(.001,c.d[i]-c.d[i-1]),u=clamp((dist-c.d[i-1])/seg,0,1),x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u,ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;g.appendChild(svgEl('rect',{x:x-3,y:y-1,width:6,height:2,rx:.5,fill,stroke:'#333','stroke-width':.35,transform:`rotate(${ang} ${x} ${y})`,'pointer-events':'none'}))}
    g.appendChild(svgEl('path',{d:pathD(s),fill:'none',stroke:'transparent','stroke-width':14,'pointer-events':'stroke'}));
  }
  function workArea(g,m,geom){const pts=[...(geom.left||[]),...(geom.right||[]).slice().reverse()];if(!pts.length)return;g.appendChild(svgEl('polygon',{points:pts.map(p=>`${p.x},${p.y}`).join(' '),fill:'#ef5350','fill-opacity':.14,stroke:'#c62828','stroke-width':1.5,'stroke-dasharray':'8 5','pointer-events':'all'}));const mid=geom.center[Math.floor(geom.center.length/2)];if(mid){const t=svgEl('text',{x:mid.x,y:mid.y,'text-anchor':'middle','font-size':9,'font-weight':'700',fill:'#a32121','pointer-events':'none'});t.textContent=m.r7Label||'WORK AREA';g.appendChild(t)}}
  function renderAttached(){const g=q('#markupLayer');for(const m of (page()?.markups||[]).filter(x=>x.r7Attached&&isMarkupVisible(x))){const geom=geometry(m),grp=groupBase(m);if(!geom.road){const t=svgEl('text',{x:20,y:30,'font-size':10,fill:'#b5252b'});t.textContent='R7 attachment missing road';grp.appendChild(t)}else if(m.r7Kind==='deviceRun')deviceRun(grp,m,geom);else if(m.r7Kind==='tabs')tabs(grp,m,geom);else if(m.r7Kind==='workArea')workArea(grp,m,geom);else lineRun(grp,m,geom);g.appendChild(grp)}}
  const priorRenderMarkups=renderMarkups;renderMarkups=function(){priorRenderMarkups();renderAttached()};
  const priorBounds=bounds;bounds=function(m){return m?.r7Attached?geometry(m).bounds:priorBounds(m)};
  const priorTranslateMarkup=translateMarkup;translateMarkup=function(m,dx,dy,orig){if(m?.r7Attached)return;return priorTranslateMarkup(m,dx,dy,orig)};
  const priorRotateMarkup90=rotateMarkup90;rotateMarkup90=function(m,h){if(m?.r7Attached)return;return priorRotateMarkup90(m,h)};

  function dragStation(e,m,key){
    if(isMarkupLocked(m)){e.preventDefault();e.stopPropagation();return toast('Layer locked.')}
    const road=roadById(m.r7RoadId);if(!road)return;checkpoint();e.preventDefault();e.stopPropagation();
    const move=ev=>{m[key]=nearestT(sampleRoad(road),svgPoint(ev)).t;m.modified=stamp();renderMarkups();renderSelection()};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);updateProperties();renderTable()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  }
  function r7Selection(m){
    const ig=q('#interactionLayer'),geom=geometry(m),b=geom.bounds;ig.innerHTML='';ig.appendChild(svgEl('rect',{x:b.x-3,y:b.y-3,width:b.w+6,height:b.h+6,class:'selectionBox'}));
    if(isMarkupLocked(m)){const t=svgEl('text',{x:b.x+4,y:Math.max(9,b.y-7),'font-size':9,'font-weight':'700',fill:'#5d6770'});t.textContent='LOCKED LAYER';ig.appendChild(t);return}
    if(!geom.road)return;const rs=sampleRoad(geom.road),a=pointAtT(rs,m.r7StartT),z=pointAtT(rs,m.r7EndT),h1=svgEl('circle',{cx:a.x,cy:a.y,r:5,class:'r7StationHandle'}),h2=svgEl('circle',{cx:z.x,cy:z.y,r:5,class:'r7StationHandle'});h1.addEventListener('pointerdown',e=>dragStation(e,m,'r7StartT'));h2.addEventListener('pointerdown',e=>dragStation(e,m,'r7EndT'));ig.appendChild(h1);ig.appendChild(h2);
  }
  const priorRenderSelection=renderSelection;renderSelection=function(){priorRenderSelection();const m=selectedMarkup();if(m?.r7Attached)r7Selection(m)};

  function roadOptions(id){return roads().map((r,i)=>`<option value="${r.id}"${r.id===id?' selected':''}>${r.subject||'Roadway'} ${i+1}</option>`).join('')}
  function injectProps(){
    let box=q('#r7AttachedProps');if(!box){box=ce('details','r7AttachedProps');box.id='r7AttachedProps';box.open=true;q('#propEditor')?.appendChild(box)}
    const m=selectedMarkup();if(!m?.r7Attached||state.propertyMode!=='object'){box.classList.add('hidden');return}box.classList.remove('hidden');
    const extra=m.r7Kind==='deviceRun'?`<label>Device<select id="r7PropDevice"><option value="cone">Cone</option><option value="drum">Drum</option><option value="verticalPanel">Vertical Panel</option><option value="barricade">Barricade</option><option value="barrier">Barrier</option></select></label><label>Spacing ft<input id="r7PropSpacing" type="number" min="1" value="${+m.r7SpacingFt||20}"></label>`:m.r7Kind==='tabs'?`<label>Tab color<select id="r7PropTabColor"><option value="white">White</option><option value="yellow">Yellow</option></select></label><label>Spacing ft<input id="r7PropSpacing" type="number" min="1" value="${+m.r7SpacingFt||20}"></label>`:m.r7Kind==='workArea'?`<label>Left offset ft<input id="r7PropLeft" type="number" step=".5" value="${+m.r7LeftOffsetFt||0}"></label><label>Right offset ft<input id="r7PropRight" type="number" step=".5" value="${+m.r7RightOffsetFt||0}"></label>`:`<label>Line style<select id="r7PropLineStyle"><option value="closure">Closure / Orange</option><option value="dashWhite">Dashed White</option><option value="solidWhite">Solid White</option><option value="dashYellow">Dashed Yellow</option><option value="solidYellow">Solid Yellow</option><option value="taper">Taper / Orange</option></select></label>`;
    box.innerHTML=`<summary>R7 Manual Road Attachment</summary><div class="r7PropGrid"><label>Road<select id="r7PropRoad">${roadOptions(m.r7RoadId)}</select></label><label>Kind<input value="${m.r7Kind}" disabled></label><label>Start along road %<input id="r7PropStart" type="number" min="0" max="100" step=".1" value="${(m.r7StartT*100).toFixed(1)}"></label><label>End along road %<input id="r7PropEnd" type="number" min="0" max="100" step=".1" value="${(m.r7EndT*100).toFixed(1)}"></label><label>Start offset ft<input id="r7PropStartOffset" type="number" step=".5" value="${+m.r7StartOffsetFt||0}"></label><label>End offset ft<input id="r7PropEndOffset" type="number" step=".5" value="${+m.r7EndOffsetFt||0}"></label>${extra}</div><small>Blue handles move only the manual start/end stations.</small>`;
    if(q('#r7PropDevice'))q('#r7PropDevice').value=m.r7DeviceKind||'cone';if(q('#r7PropTabColor'))q('#r7PropTabColor').value=m.r7TabColor||'white';if(q('#r7PropLineStyle'))q('#r7PropLineStyle').value=m.r7LineStyle||'closure';
    const bind=(id,fn)=>{const el=q(id);if(!el)return;el.onchange=e=>{if(isMarkupLocked(m))return toast('Layer locked.');checkpoint();fn(e.target.value);m.modified=stamp();render();updateProperties()}};
    bind('#r7PropRoad',v=>m.r7RoadId=v);bind('#r7PropStart',v=>m.r7StartT=clamp(+v/100,0,1));bind('#r7PropEnd',v=>m.r7EndT=clamp(+v/100,0,1));bind('#r7PropStartOffset',v=>m.r7StartOffsetFt=+v||0);bind('#r7PropEndOffset',v=>m.r7EndOffsetFt=+v||0);bind('#r7PropDevice',v=>m.r7DeviceKind=v);bind('#r7PropSpacing',v=>m.r7SpacingFt=Math.max(1,+v||20));bind('#r7PropTabColor',v=>m.r7TabColor=v);bind('#r7PropLeft',v=>m.r7LeftOffsetFt=+v||0);bind('#r7PropRight',v=>m.r7RightOffsetFt=+v||0);bind('#r7PropLineStyle',v=>m.r7LineStyle=v);
    if(isMarkupLocked(m))box.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
  }
  const priorUpdateProperties=updateProperties;updateProperties=function(){priorUpdateProperties();injectProps()};

  function refreshRoads(){const sel=q('#r7RoadSelect');if(!sel)return;const rs=roads();if(!rs.length){sel.innerHTML='<option>No roads on current sheet</option>';R7.roadId=null;return}if(!rs.some(r=>r.id===R7.roadId))R7.roadId=rs[0].id;sel.innerHTML=rs.map((r,i)=>`<option value="${r.id}"${r.id===R7.roadId?' selected':''}>${r.subject||'Roadway'} ${i+1}</option>`).join('')}
  function openPalette(){
    let p=q('#r7ManualPalette');if(!p){p=ce('section','palette r7ManualPalette hidden');p.id='r7ManualPalette';p.dataset.floating='true';p.innerHTML=`<div class="paletteHead"><strong>Manual Road TCP</strong><span>R7 — no automatic layout</span><button data-r7-close>×</button></div><div class="paletteBody">
      <div class="r7ManualNotice">Every R7 item is placed manually. Choose the road, enter your values, then click the exact start and end.</div>
      <div class="toolSection"><b>Road Attachment</b><label class="r7Field">Road<select id="r7RoadSelect"></select></label><div class="r7Grid2"><button id="r7UseSelected">Use Selected Road</button><button id="r7RefreshRoads">Refresh Roads</button></div><small>After choosing it, the roadway may be locked.</small></div>
      <div class="toolSection"><b>Manual Device Run</b><div class="r7Grid2"><label>Device<select id="r7Device"><option value="cone">Cone</option><option value="drum">Drum</option><option value="verticalPanel">Vertical Panel</option><option value="barricade">Barricade</option><option value="barrier">Barrier</option></select></label><label>Spacing ft<input id="r7DeviceSpacing" type="number" min="1" value="20"></label><label>Road offset ft<input id="r7DeviceOffset" type="number" step=".5" value="0"></label></div><button class="r7Wide" id="r7DeviceRun">Pick Start / End — Device Run</button></div>
      <div class="toolSection"><b>Manual Temporary Line</b><div class="r7Grid2"><label>Style<select id="r7LineStyle"><option value="closure">Closure / Orange</option><option value="dashWhite">Dashed White</option><option value="solidWhite">Solid White</option><option value="dashYellow">Dashed Yellow</option><option value="solidYellow">Solid Yellow</option></select></label><label>Start offset ft<input id="r7LineStartOffset" type="number" step=".5" value="0"></label><label>End offset ft<input id="r7LineEndOffset" type="number" step=".5" value="0"></label></div><button class="r7Wide" id="r7LineRun">Pick Start / End — Line</button></div>
      <div class="toolSection"><b>Manual Temporary Tabs</b><div class="r7Grid2"><label>Color<select id="r7TabColor"><option value="white">White</option><option value="yellow">Yellow</option></select></label><label>Spacing ft<input id="r7TabSpacing" type="number" min="1" value="20"></label><label>Road offset ft<input id="r7TabOffset" type="number" step=".5" value="0"></label></div><button class="r7Wide" id="r7Tabs">Pick Start / End — Tabs</button></div>
      <div class="toolSection"><b>Manual Taper / Shift Line</b><div class="r7Grid2"><label>Start offset ft<input id="r7TaperStart" type="number" step=".5" value="0"></label><label>End offset ft<input id="r7TaperEnd" type="number" step=".5" value="12"></label></div><button class="r7Wide" id="r7Taper">Pick Start / End — Taper</button></div>
      <div class="toolSection"><b>Manual Work Area</b><div class="r7Grid2"><label>Left offset ft<input id="r7WorkLeft" type="number" step=".5" value="-6"></label><label>Right offset ft<input id="r7WorkRight" type="number" step=".5" value="6"></label></div><button class="r7Wide" id="r7WorkArea">Pick Start / End — Work Area</button></div>
    </div>`;document.body.appendChild(p);p.querySelector('[data-r7-close]').onclick=()=>p.classList.add('hidden');q('#r7RoadSelect').onchange=e=>R7.roadId=e.target.value||null;q('#r7RefreshRoads').onclick=refreshRoads;q('#r7UseSelected').onclick=()=>{const r=selectedMarkup();if(!(r&&(r.r6Road||r.r5RoadPath||r.r4Road)))return toast('Select a roadway first.');R7.roadId=r.id;refreshRoads();toast('Selected road assigned to R7.')};
      q('#r7DeviceRun').onclick=()=>startPick('deviceRun',{subject:'Manual Road Device Run',r7DeviceKind:q('#r7Device').value,r7SpacingFt:Math.max(1,+q('#r7DeviceSpacing').value||20),startOffsetFt:+q('#r7DeviceOffset').value||0,endOffsetFt:+q('#r7DeviceOffset').value||0});
      q('#r7LineRun').onclick=()=>startPick('line',{subject:'Manual Temporary Line',r7LineStyle:q('#r7LineStyle').value,startOffsetFt:+q('#r7LineStartOffset').value||0,endOffsetFt:+q('#r7LineEndOffset').value||0});
      q('#r7Tabs').onclick=()=>startPick('tabs',{subject:'Manual Temporary Tabs',r7TabColor:q('#r7TabColor').value,r7SpacingFt:Math.max(1,+q('#r7TabSpacing').value||20),startOffsetFt:+q('#r7TabOffset').value||0,endOffsetFt:+q('#r7TabOffset').value||0});
      q('#r7Taper').onclick=()=>startPick('taper',{subject:'Manual Taper / Shift Line',r7LineStyle:'taper',startOffsetFt:+q('#r7TaperStart').value||0,endOffsetFt:+q('#r7TaperEnd').value||0});
      q('#r7WorkArea').onclick=()=>startPick('workArea',{subject:'Manual Work Area',r7Label:'WORK AREA',startOffsetFt:0,endOffsetFt:0,r7LeftOffsetFt:+q('#r7WorkLeft').value||0,r7RightOffsetFt:+q('#r7WorkRight').value||0});
    }refreshRoads();p.classList.toggle('hidden');
  }
  function installUi(){const small=q('.brand small');if(small)small.textContent='0.1 R7';document.title='NXT Gen Plans 0.1 R7';const pals=q('.paletteButtons');if(pals&&!q('#r7ManualBtn')){const b=ce('button','r7ManualButton');b.id='r7ManualBtn';b.textContent='Manual TCP';b.title='R7 manual road-attached TCP tools';b.onclick=openPalette;pals.appendChild(b)}}
  installUi();window.NXT_R7={openPalette,refreshRoads,roads,geometry};console.info('NXT Gen Plans R7 manual road-attached TCP module loaded.');
})();
