'use strict';
/*
 NXT Gen Plans 0.1 R6.1 — TCP+ / Layer Integration
 Baseline: Git e9b7739d ("r6")
 Loads AFTER r6-addon.js.
 Does not replace R3/R4/R5/R6 source files.
*/
(() => {
  if(!window.NXT_R5 || !window.NXT_R6 || !window.__NXT_R5_ROAD_POINTER_FIX1){
    console.error('R6.1 requires the accepted R6 + R5 FIX1 baseline.');
    return;
  }
  if(window.__NXT_R6_1_INTEGRATION)return;
  window.__NXT_R6_1_INTEGRATION=true;

  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const stamp=()=>new Date().toISOString();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  const TCP_LAYERS=[
    {id:'roadway',name:'Roadways'},
    {id:'pavement',name:'Permanent Pavement Markings'},
    {id:'trafficSigns',name:'Traffic Signs'},
    {id:'trafficDevices',name:'Traffic Devices'},
    {id:'workZones',name:'Work Zones / Areas'},
    {id:'tempTraffic',name:'Temporary Striping / Tapers'}
  ];

  function ensureTcpLayers(){
    for(const def of TCP_LAYERS){
      if(!state.layers.some(l=>l.id===def.id)){
        state.layers.push({id:def.id,name:def.name,visible:true,locked:false});
      }
    }
  }

  function classifyMarkup(m){
    if(!m)return null;
    if(m.r6Road||m.r5RoadPath||m.r4Road||m.r6Intersection)return'roadway';
    if(m.type==='trafficSign')return'trafficSigns';
    if(m.type==='device'||m.type==='deviceRun')return'trafficDevices';
    if(m.r5Zone||/^(Work Area|Buffer Space|Activity Area|Advance Warning Area|Termination Area)$/i.test(m.subject||''))return'workZones';
    if(m.r5Taper)return'tempTraffic';
    if(m.r5Marking)return'pavement';
    return null;
  }

  function migrateKnownObjects(){
    ensureTcpLayers();
    for(const page of state.pages||[]){
      for(const m of page.markups||[]){
        const target=classifyMarkup(m);
        if(!target)continue;
        if(!m.layer || ['default','design','traffic'].includes(m.layer))m.layer=target;
      }
    }
  }

  ensureTcpLayers();
  migrateKnownObjects();

  // Keep future addMarkup-based traffic objects on dedicated layers.
  const priorAddMarkup=addMarkup;
  addMarkup=function(obj,select=true){
    const target=classifyMarkup(obj);
    if(target)obj.layer=target;
    return priorAddMarkup(obj,select);
  };

  // R5 markings/zones are finalized outside addMarkup.
  const priorFinishPolyDraft=finishPolyDraft;
  finishPolyDraft=function(select=true){
    const m=state.polyDraft;
    const result=priorFinishPolyDraft(select);
    if(m){
      const target=classifyMarkup(m);
      if(target)m.layer=target;
    }
    return result;
  };

  // R5 and R6 road creation push objects directly; migrate at the safe render boundary.
  const priorRender=render;
  render=function(){
    migrateKnownObjects();
    priorRender();
    installLayerPanelTools();
    installTcpHealth();
    installR6PaletteGuards();
  };

  // -------- HARD LAYER LOCKING --------

  function selectedLocked(){
    const m=selectedMarkup();
    return !!(m && state.propertyMode==='object' && isMarkupLocked(m));
  }

  const priorResizePointerDown=resizePointerDown;
  resizePointerDown=function(e,m,dir){
    if(isMarkupLocked(m)){
      e?.preventDefault?.();e?.stopPropagation?.();
      return toast('Layer locked — unlock it before resizing this object.');
    }
    return priorResizePointerDown(e,m,dir);
  };

  const priorDeleteSelected=deleteSelected;
  deleteSelected=function(){
    const m=selectedMarkup();
    if(m&&isMarkupLocked(m))return toast('Layer locked — object cannot be deleted.');
    return priorDeleteSelected();
  };

  const priorDuplicateSelected=duplicateSelected;
  duplicateSelected=function(){
    const m=selectedMarkup();
    if(m&&isMarkupLocked(m))return toast('Layer locked — object cannot be duplicated.');
    return priorDuplicateSelected();
  };

  const priorRenderSelection=renderSelection;
  renderSelection=function(){
    priorRenderSelection();
    const m=selectedMarkup();
    if(!m||!isMarkupLocked(m))return;
    const ig=q('#interactionLayer'),b=bounds(m);
    if(!ig||!b)return;
    ig.innerHTML='';
    const box=svgEl('rect',{x:b.x-3,y:b.y-3,width:b.w+6,height:b.h+6,class:'selectionBox r61LockedSelection'});
    ig.appendChild(box);
    const label=svgEl('text',{x:b.x+4,y:Math.max(9,b.y-7),'font-size':9,'font-weight':'700',fill:'#5d6770','pointer-events':'none'});
    label.textContent='LOCKED LAYER';ig.appendChild(label);
  };

  function syncPropertyLock(){
    const panel=q('#propEditor');if(!panel)return;
    const locked=selectedLocked();
    let note=q('#r61LockedPropertyNote');
    if(!note){
      note=document.createElement('div');
      note.id='r61LockedPropertyNote';
      note.className='r61LockedPropertyNote hidden';
      panel.insertBefore(note,panel.firstChild);
    }
    note.textContent='This object is on a locked layer. Unlock that layer before editing it.';
    note.classList.toggle('hidden',!locked);

    if(locked){
      panel.querySelectorAll('input,select,textarea,button').forEach(el=>{
        if(el.id==='r61UnlockSelectedLayer')return;
        if(el.dataset.r61DisabledSaved===undefined)el.dataset.r61DisabledSaved=el.disabled?'1':'0';
        el.disabled=true;
      });
      if(!q('#r61UnlockSelectedLayer')){
        const b=document.createElement('button');
        b.id='r61UnlockSelectedLayer';b.className='r61UnlockSelectedLayer';b.textContent='Unlock Selected Layer';
        b.onclick=()=>{
          const m=selectedMarkup(),l=m&&state.layers.find(x=>x.id===m.layer);
          if(l){checkpoint();l.locked=false;renderLayers();renderSelection();updateProperties();toast(l.name+' unlocked.')}
        };
        note.appendChild(document.createElement('br'));
        note.appendChild(b);
      }
    }else{
      panel.querySelectorAll('[data-r61-disabled-saved]').forEach(el=>{
        el.disabled=el.dataset.r61DisabledSaved==='1';
        delete el.dataset.r61DisabledSaved;
      });
      const b=q('#r61UnlockSelectedLayer');if(b)b.remove();
    }
  }

  const priorUpdateProperties=updateProperties;
  updateProperties=function(){
    priorUpdateProperties();
    syncPropertyLock();
  };

  // Block mutating context-menu commands for layer-locked objects.
  const cm=q('#contextMenu');
  if(cm){
    cm.addEventListener('click',e=>{
      const cmd=e.target?.dataset?.cmd,m=selectedMarkup();
      if(!m||!isMarkupLocked(m))return;
      if(['duplicate','delete','front','back','editText','preset'].includes(cmd)){
        e.preventDefault();e.stopImmediatePropagation();
        cm.classList.add('hidden');
        toast('Layer locked — unlock it before changing this object.');
      }
    },true);
  }

  // Block R6 roadway mutation buttons when the road's layer is locked.
  function installR6PaletteGuards(){
    const p=q('#r6RoadPalette');if(!p||p.dataset.r61Guarded==='1')return;
    p.dataset.r61Guarded='1';
    const mutationIds=['r6EditBtn','r6AddNodePal','r6RemoveNodePal','r6StraightSegPal','r6StraightAllPal','r6PropsBtn'];
    for(const id of mutationIds){
      const b=q('#'+id);if(!b)continue;
      b.addEventListener('click',e=>{
        const m=selectedMarkup();
        if(m&&isMarkupLocked(m)){
          e.preventDefault();e.stopImmediatePropagation();
          toast('Roadway layer is locked.');
        }
      },true);
    }
  }

  // -------- DEDICATED TCP LAYER CONTROLS --------

  function lockLayer(id,locked=true){
    const l=state.layers.find(x=>x.id===id);if(!l)return;
    l.locked=locked;
    if(state.selected){
      const m=selectedMarkup();
      if(m&&m.layer===id)renderSelection();
    }
  }

  function installLayerPanelTools(){
    ensureTcpLayers();
    const body=q('#layersPalette .paletteBody');
    if(!body||q('#r61LayerTools'))return;
    const box=document.createElement('div');box.id='r61LayerTools';box.className='r61LayerTools';
    box.innerHTML=`<b>TCP Layer Controls</b>
      <div class="r61LayerGrid">
        <button data-r61-lock="roadway">Lock Roads</button>
        <button data-r61-lock="trafficSigns">Lock Signs</button>
        <button data-r61-lock="trafficDevices">Lock Devices</button>
        <button data-r61-lock="pavement">Lock Markings</button>
        <button data-r61-lock="workZones">Lock Work Zones</button>
        <button data-r61-lock="tempTraffic">Lock Temporary</button>
      </div>
      <div class="r61LayerGrid two">
        <button id="r61Organize">Organize Existing TCP Objects</button>
        <button id="r61UnlockAll">Unlock TCP Layers</button>
      </div>
      <small>Each TCP group can also be locked/unlocked individually in the normal layer list below.</small>`;
    body.insertBefore(box,body.firstChild);

    box.querySelectorAll('[data-r61-lock]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.r61Lock,l=state.layers.find(x=>x.id===id);if(!l)return;
      checkpoint();lockLayer(id,!l.locked);renderLayers();renderSelection();updateProperties();
      toast(`${l.name} ${l.locked?'locked':'unlocked'}.`);
      b.textContent=(l.locked?'Unlock ':'Lock ')+({roadway:'Roads',trafficSigns:'Signs',trafficDevices:'Devices',pavement:'Markings',workZones:'Work Zones',tempTraffic:'Temporary'}[id]||l.name);
    });
    q('#r61Organize').onclick=()=>{checkpoint();migrateKnownObjects();renderLayers();render();toast('Existing TCP objects organized into dedicated layers.');};
    q('#r61UnlockAll').onclick=()=>{
      checkpoint();TCP_LAYERS.forEach(x=>lockLayer(x.id,false));renderLayers();renderSelection();updateProperties();toast('All TCP layers unlocked.');
    };
  }

  // -------- SAFE, READ-ONLY INTERSECTION DISCOVERY --------

  function roadPoints(m){
    if(m.r6Road&&Array.isArray(m.points))return sampleR6Road(m,14);
    if(Array.isArray(m.points))return m.points.map(p=>({x:p[0],y:p[1]}));
    if(Number.isFinite(m.x)&&Number.isFinite(m.x2))return[{x:m.x,y:m.y},{x:m.x2,y:m.y2}];
    return[];
  }

  function sampleR6Road(m,steps){
    const pts=m.points||[],out=[];if(pts.length<2)return pts.map(p=>({x:p[0],y:p[1]}));
    for(let i=0;i<pts.length-1;i++){
      const a={x:pts[i][0],y:pts[i][1]},b={x:pts[i+1][0],y:pts[i+1][1]},c=m.r6Curves?.[i];
      const n=c?steps:1;
      for(let k=0;k<n;k++){
        const t=k/n;
        if(c){const u=1-t;out.push({x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y})}
        else out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
      }
    }
    const z=pts.at(-1);out.push({x:z[0],y:z[1]});return out;
  }

  function segX(a,b,c,d){
    const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx;
    if(Math.abs(den)<1e-8)return null;
    const qx=c.x-a.x,qy=c.y-a.y,t=(qx*sy-qy*sx)/den,u=(qx*ry-qy*rx)/den;
    if(t>=0&&t<=1&&u>=0&&u<=1)return{x:a.x+t*rx,y:a.y+t*ry};return null;
  }

  function nearest(p,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy||1,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1);
    const x=a.x+t*dx,y=a.y+t*dy;return{x,y,dist:Math.hypot(p.x-x,p.y-y)};
  }

  function roadWidth(m){
    const scale=Number(currentPage()?.scaleFeetPerInch)||0;
    const lanes=Math.max(1,Number(m.lanes)||2),lw=Number(m.laneWidthFt)||12;
    const shoulders=m.r6Road?(Number(m.shoulderLeftFt)||0)+(Number(m.shoulderRightFt)||0):(Number(m.shoulderFt)||0)*2;
    const ft=lanes*lw+shoulders;
    return scale?Math.max(12,ft/scale*72):Math.max(18,lanes*18+shoulders*1.5);
  }

  function crossing(a,b){
    const A=roadPoints(a),B=roadPoints(b);if(A.length<2||B.length<2)return null;
    for(let i=1;i<A.length;i++)for(let j=1;j<B.length;j++){const z=segX(A[i-1],A[i],B[j-1],B[j]);if(z)return z}
    const tol=Math.max(8,Math.min(roadWidth(a),roadWidth(b))*.5);
    for(const p of [A[0],A.at(-1)])for(let j=1;j<B.length;j++){const n=nearest(p,B[j-1],B[j]);if(n.dist<=tol)return{x:n.x,y:n.y}}
    for(const p of [B[0],B.at(-1)])for(let i=1;i<A.length;i++){const n=nearest(p,A[i-1],A[i]);if(n.dist<=tol)return{x:n.x,y:n.y}}
    return null;
  }

  function safeRefreshIntersections(){
    checkpoint();
    const page=currentPage();
    page.markups=page.markups.filter(m=>!m.r6Intersection);
    const roads=page.markups.filter(m=>m.r6Road||m.r5RoadPath||m.r4Road);
    let count=0;
    for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){
      const z=crossing(roads[i],roads[j]);if(!z)continue;
      const radius=Math.max(roadWidth(roads[i]),roadWidth(roads[j]))*.54;
      page.markups.push({id:uid(),type:'circle',layer:'roadway',subject:'Road Intersection',comment:'R6.1 read-only intersection discovery',status:'Open',
        r6Intersection:true,roads:[roads[i].id,roads[j].id],cx:z.x,cy:z.y,radius,roadColor:roads[i].roadColor||'#72777b',
        x:z.x-radius,y:z.y-radius,w:radius*2,h:radius*2,stroke:'#555',width:.5,fill:roads[i].roadColor||'#72777b',fillOpacity:1,
        dash:'',hatch:'none',opacity:1,created:stamp(),modified:stamp()});
      count++;
    }
    state.selected=null;render();
    toast(count?`Created ${count} intersection${count===1?'':'s'} without modifying roadway objects.`:'No roadway crossings found.');
  }

  function guardIntersectionButton(){
    const b=q('#r6Intersections');if(!b||b.dataset.r61Safe==='1')return;
    b.dataset.r61Safe='1';
    b.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();safeRefreshIntersections();
    },true);
    b.title='Create/refresh intersections without promoting or modifying source road objects';
  }

  // -------- TCP+ RUNTIME GUARD / HEALTH --------

  const svg=q('#pageSvg');
  if(svg){
    // Reassert the R5 road pointer isolation after R6 has loaded.
    svg.addEventListener('pointerdown',e=>{
      if(state.tool!=='r5RoadPath'||e.button!==0)return;
      e.stopImmediatePropagation();
    },true);
  }

  function tcpControlStatus(){
    const expected=['r5Road','r5StopBar','r5Arrow','r5Taper','r5Legend','r5North'];
    const missing=expected.filter(id=>!q('#'+id));
    const markCount=qa('[data-r5-mark]').length;
    const zoneCount=qa('[data-r5-zone]').length;
    const maskCount=qa('[data-r5-mask]').length;
    return{missing,markCount,zoneCount,maskCount,ok:missing.length===0&&markCount===6&&zoneCount===5&&maskCount===2};
  }

  function installTcpHealth(){
    const p=q('#r5DesignPalette');if(!p)return;
    guardIntersectionButton();
    installR6PaletteGuards();
    let badge=q('#r61TcpHealth');
    if(!badge){
      badge=document.createElement('div');badge.id='r61TcpHealth';badge.className='r61TcpHealth';
      p.querySelector('.paletteBody')?.prepend(badge);
    }
    const s=tcpControlStatus();
    badge.classList.toggle('bad',!s.ok);
    badge.textContent=s.ok?'TCP+ integration verified: road, markings, zones, masks and output controls loaded.':
      `TCP+ integration problem: ${s.missing.length?'missing '+s.missing.join(', '):''} markings ${s.markCount}/6, zones ${s.zoneCount}/5, masks ${s.maskCount}/2`;
  }

  const tcpBtn=q('#r5AdvancedBtn');
  if(tcpBtn){
    tcpBtn.addEventListener('click',()=>setTimeout(()=>{
      installTcpHealth();
      // Opening TCP+ while an R6 drawing mode is armed should not carry that mode into TCP+.
      if(/^r6/.test(String(state.tool||'')))setTool('select');
    },0));
  }

  /* NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER
   Removed body-wide MutationObserver because health-badge DOM updates could recursively retrigger it and freeze TCP+. */


  installLayerPanelTools();
  installR6PaletteGuards();
  guardIntersectionButton();
  installTcpHealth();

  
  /* NXT_R6_1_FIX2_DIRECT_HOOKS */
  const r61RoadBtn=q('#r6RoadBtn');
  if(r61RoadBtn){r61RoadBtn.addEventListener('click',()=>setTimeout(()=>{installR6PaletteGuards();guardIntersectionButton();},0));}
  if(tcpBtn){tcpBtn.addEventListener('click',()=>setTimeout(()=>{installTcpHealth();},0));}

window.NXT_R6_1={
    migrateKnownObjects,
    ensureTcpLayers,
    safeRefreshIntersections,
    tcpControlStatus
  };

  console.info('NXT Gen Plans R6.1 TCP+/layer integration loaded.');
})();
