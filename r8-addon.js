'use strict';
/*
 NXT Gen Plans 0.1 R8 — Combined Manual Intersection / Template / Sheet Production
 Baseline: Git 87121884 (Installed R7)
 No automatic TCP design. All geometry, station text, templates, tables and regions
 are created from explicit user choices.
*/
(() => {
  if(!window.NXT_R5 || !window.NXT_R6 || !window.NXT_R6_1 || !window.NXT_R7 ||
     !window.__NXT_R6_1_INTEGRATION || !window.__NXT_R7_MANUAL_TCP){
    console.error('R8 requires the accepted R7 + R6.1 FIX2 baseline.');
    return;
  }
  if(window.__NXT_R8_COMBINED_MANUAL)return;
  window.__NXT_R8_COMBINED_MANUAL=true;

  const q=s=>document.querySelector(s);
  const ce=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.innerHTML=h;return n};
  const stamp=()=>new Date().toISOString();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const NS='http://www.w3.org/2000/svg';

  const R8={
    pending:null,
    threePoint:[],
    stationRoadId:null,
    templates:[],
    templatePlace:null
  };

  const R8_LAYERS=[
    {id:'intersectionDetails',name:'Intersection Details'},
    {id:'sheetProduction',name:'Sheet Production'},
    {id:'printRegions',name:'Print Regions'}
  ];

  function ensureLayers(){
    for(const def of R8_LAYERS){
      if(!state.layers.some(l=>l.id===def.id))state.layers.push({id:def.id,name:def.name,visible:true,locked:false});
    }
  }
  ensureLayers();

  function layerLocked(id){return !!state.layers.find(l=>l.id===id)?.locked}
  function page(){return currentPage()}
  function roads(){return (page()?.markups||[]).filter(m=>m.r6Road||m.r5RoadPath||m.r4Road)}
  function roadById(id){return roads().find(m=>m.id===id)||null}
  function pageScale(){return Number(page()?.scaleFeetPerInch)||0}
  function feetToPts(ft){const s=pageScale();return s?Number(ft)/s*72:Number(ft)*2}

  // ---------------- ROAD SAMPLING FOR MANUAL STATION LABELS ----------------

  function sampleRoad(m,steps=18){
    if(!m)return[];
    if(m.r6Road&&Array.isArray(m.points)){
      const pts=m.points,out=[];
      if(pts.length<2)return pts.map(p=>({x:p[0],y:p[1]}));
      for(let i=0;i<pts.length-1;i++){
        const a={x:pts[i][0],y:pts[i][1]},b={x:pts[i+1][0],y:pts[i+1][1]},c=m.r6Curves?.[i];
        const n=c?steps:1;
        for(let k=0;k<n;k++){
          const t=k/n;
          if(c){const u=1-t;out.push({x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y})}
          else out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
        }
      }
      const z=pts.at(-1);out.push({x:z[0],y:z[1]});
      return out;
    }
    if(Array.isArray(m.points))return m.points.map(p=>({x:Number(p[0])||0,y:Number(p[1])||0}));
    if(Number.isFinite(m.x)&&Number.isFinite(m.x2))return[{x:m.x,y:m.y},{x:m.x2,y:m.y2}];
    return[];
  }

  function cumulative(samples){
    const d=[0];let total=0;
    for(let i=1;i<samples.length;i++){total+=Math.hypot(samples[i].x-samples[i-1].x,samples[i].y-samples[i-1].y);d.push(total)}
    return{d,total};
  }

  function nearestRoadT(samples,p){
    if(samples.length<2)return{t:0,x:samples[0]?.x||0,y:samples[0]?.y||0,tx:1,ty:0};
    const c=cumulative(samples);let best={dist:Infinity,t:0,x:0,y:0,tx:1,ty:0};
    for(let i=1;i<samples.length;i++){
      const a=samples[i-1],b=samples[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;
      const u=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l2,0,1),x=a.x+dx*u,y=a.y+dy*u,dist=Math.hypot(p.x-x,p.y-y),len=Math.sqrt(l2)||1;
      if(dist<best.dist)best={dist,t:c.total?(c.d[i-1]+len*u)/c.total:0,x,y,tx:dx/len,ty:dy/len};
    }
    return best;
  }

  function pointAtT(samples,t){
    if(samples.length<2)return{x:samples[0]?.x||0,y:samples[0]?.y||0,tx:1,ty:0};
    const c=cumulative(samples),target=clamp(Number(t)||0,0,1)*c.total;
    for(let i=1;i<samples.length;i++){
      if(c.d[i]>=target){
        const a=samples[i-1],b=samples[i],seg=Math.max(.0001,c.d[i]-c.d[i-1]),u=clamp((target-c.d[i-1])/seg,0,1),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
        return{x:a.x+dx*u,y:a.y+dy*u,tx:dx/len,ty:dy/len};
      }
    }
    const a=samples.at(-2),b=samples.at(-1),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    return{x:b.x,y:b.y,tx:dx/len,ty:dy/len};
  }

  function stationGeom(m){
    const road=roadById(m.r8RoadId);if(!road)return null;
    const p=pointAtT(sampleRoad(road),m.r8T),off=feetToPts(Number(m.r8OffsetFt)||0),nx=-p.ty,ny=p.tx;
    return{road,x:p.x+nx*off,y:p.y+ny*off,baseX:p.x,baseY:p.y,tx:p.tx,ty:p.ty};
  }

  // ---------------- CUSTOM RENDERERS ----------------

  function renderCrosswalk(g,m){
    const grp=svgEl('g');commonAttrs(grp,m);
    const x=m.x,y=m.y,w=Math.max(4,m.w),h=Math.max(4,m.h);
    grp.appendChild(svgEl('rect',{x,y,width:w,height:h,fill:'none',stroke:m.stroke||'#fff','stroke-width':1}));
    const vertical=w>=h,span=vertical?w:h,step=Math.max(5,Number(m.r8StripeSpacing)||10);
    for(let s=0;s<span;s+=step){
      if(vertical)grp.appendChild(svgEl('rect',{x:x+s,y,width:Math.min(step*.55,w-s),height:h,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.95,'pointer-events':'none'}));
      else grp.appendChild(svgEl('rect',{x,y:y+s,width:w,height:Math.min(step*.55,h-s),fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.95,'pointer-events':'none'}));
    }
    g.appendChild(grp);
  }

  function renderArc(g,m){
    const p=svgEl('path',{d:`M${m.x} ${m.y} Q${m.cx} ${m.cy} ${m.x2} ${m.y2}`,fill:'none'});
    commonAttrs(p,m);p.setAttribute('fill','none');g.appendChild(p);
  }

  function renderStation(g,m){
    const z=stationGeom(m);if(!z)return;
    const grp=svgEl('g');grp.dataset.id=m.id;grp.classList.add('markup','r8Station');
    if(state.selected===m.id)grp.classList.add('selected');
    grp.addEventListener('pointerdown',e=>objectPointerDown(e,m));
    grp.addEventListener('contextmenu',e=>openContext(e,m.id));
    grp.appendChild(svgEl('line',{x1:z.baseX,y1:z.baseY,x2:z.x,y2:z.y,stroke:m.stroke||'#444','stroke-width':1,'stroke-dasharray':'3 2','pointer-events':'none'}));
    const t=svgEl('text',{x:z.x,y:z.y-3,'text-anchor':'middle','font-size':m.fontSize||9,'font-family':m.font||'Arial','font-weight':'700',fill:m.textColor||'#222','pointer-events':'none'});
    t.textContent=m.r8StationText||'STA';grp.appendChild(t);g.appendChild(grp);
  }

  function renderPrintRegionLabel(g,m){
    if(!m.r8PrintRegion)return;
    const t=svgEl('text',{x:m.x+5,y:m.y+12,'font-size':9,'font-weight':'700',fill:m.stroke||'#7b4f00','pointer-events':'none'});
    t.textContent=m.r8RegionName||'PRINT REGION';g.appendChild(t);
  }

  const priorRenderMarkups=renderMarkups;
  renderMarkups=function(){
    priorRenderMarkups();
    const g=q('#markupLayer');if(!g)return;
    for(const m of page().markups){
      if(!isMarkupVisible(m))continue;
      if(m.r8Crosswalk){
        [...g.querySelectorAll(`[data-id="${m.id}"]`)].forEach(n=>n.remove());
        renderCrosswalk(g,m);
      }else if(m.r8Arc){
        renderArc(g,m);
      }else if(m.r8Station){
        renderStation(g,m);
      }else if(m.r8PrintRegion){
        renderPrintRegionLabel(g,m);
      }
    }
  };

  // ---------------- BOUNDS / MOVE / ROTATE ----------------

  const priorBounds=bounds;
  bounds=function(m){
    if(m?.r8Arc){
      const xs=[m.x,m.cx,m.x2],ys=[m.y,m.cy,m.y2];
      return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
    }
    if(m?.r8Station){
      const z=stationGeom(m);if(!z)return{x:0,y:0,w:1,h:1};
      return{x:z.x-35,y:z.y-15,w:70,h:25};
    }
    return priorBounds(m);
  };

  const priorTranslate=translateMarkup;
  translateMarkup=function(m,dx,dy,orig){
    if(m?.r8Station)return; // station location is road-relative, edited in R8 Props
    if(m?.r8Arc){
      m.x=orig.x+dx;m.y=orig.y+dy;m.cx=orig.cx+dx;m.cy=orig.cy+dy;m.x2=orig.x2+dx;m.y2=orig.y2+dy;return;
    }
    return priorTranslate(m,dx,dy,orig);
  };

  const priorRotate=rotateMarkup90;
  rotateMarkup90=function(m,h){
    if(m?.r8Station)return; // derived from road, which rotates separately
    if(m?.r8Arc){
      [m.x,m.y]=rotatePoint90(m.x,m.y,h);
      [m.cx,m.cy]=rotatePoint90(m.cx,m.cy,h);
      [m.x2,m.y2]=rotatePoint90(m.x2,m.y2,h);
      m.rotation=((m.rotation||0)+90)%360;return;
    }
    return priorRotate(m,h);
  };

  // ---------------- MANUAL INTERSECTION DRAWING ----------------

  function startDragTool(kind,opts={}){
    const layer='intersectionDetails';
    if(layerLocked(layer))return toast('Intersection Details layer is locked.');
    R8.pending={kind,opts,layer};
    state.tool='r8Drag';
    q('#statusTool').textContent=opts.label||'R8 Manual Drawing — drag';
    q('#canvasScroller').style.cursor='crosshair';
  }

  function finishDrag(kind,a,b,opts){
    checkpoint();
    if(kind==='stopBar'||kind==='turnArrow'){
      const m=baseMarkup(kind==='turnArrow'?'arrow':'line',a);
      m.type=kind==='turnArrow'?'arrow':'line';m.x=a.x;m.y=a.y;m.x2=b.x;m.y2=b.y;
      m.layer='intersectionDetails';m.subject=opts.subject||'Intersection Detail';
      m.stroke=opts.stroke||'#fff';m.width=opts.width||3;m.fill='none';m.fillOpacity=0;m.modified=stamp();
      currentPage().markups.push(m);state.selected=m.id;
    }else{
      const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.max(2,Math.abs(b.x-a.x)),h=Math.max(2,Math.abs(b.y-a.y));
      const m=baseMarkup(kind==='median'?'rect':'rect',{x,y});
      m.x=x;m.y=y;m.w=w;m.h=h;m.layer='intersectionDetails';m.modified=stamp();
      if(kind==='crosswalk'){
        m.type='rect';m.r8Crosswalk=true;m.subject='Manual Crosswalk';m.stroke='#fff';m.width=1;m.fill='#fff';m.fillOpacity=.95;m.r8StripeSpacing=10;
      }else{
        m.type='rect';m.subject='Manual Median / Island';m.stroke='#555';m.width=1.2;m.fill='#d6d6d6';m.fillOpacity=.85;
      }
      currentPage().markups.push(m);state.selected=m.id;
    }
    render();setTool('select');
  }

  function startArc(){
    if(layerLocked('intersectionDetails'))return toast('Intersection Details layer is locked.');
    R8.threePoint=[];state.tool='r8Arc';
    q('#statusTool').textContent='Manual Curb Return — click START, CONTROL, END';
    q('#canvasScroller').style.cursor='crosshair';
    toast('Click start, then curve control point, then end.');
  }

  const svg=q('#pageSvg');
  svg.addEventListener('pointerdown',e=>{
    if(!['r8Drag','r8Arc','r8StationPlace','r8TemplatePlace','r8PrintRegion'].includes(state.tool)||e.button!==0)return;
    e.preventDefault();e.stopImmediatePropagation();

    if(state.tool==='r8Drag'||state.tool==='r8PrintRegion'){
      const start=svgPoint(e),kind=state.tool==='r8PrintRegion'?'printRegion':R8.pending?.kind,opts=R8.pending?.opts||{};
      const move=()=>{};
      const up=ev=>{
        window.removeEventListener('pointerup',up);
        const end=svgPoint(ev);
        if(kind==='printRegion'){
          if(layerLocked('printRegions')){setTool('select');return toast('Print Regions layer is locked.')}
          checkpoint();
          const x=Math.min(start.x,end.x),y=Math.min(start.y,end.y),w=Math.max(4,Math.abs(end.x-start.x)),h=Math.max(4,Math.abs(end.y-start.y));
          const m=baseMarkup('rect',{x,y});m.type='rect';m.x=x;m.y=y;m.w=w;m.h=h;m.layer='printRegions';m.subject='Print Region';
          m.stroke='#b07516';m.width=1.5;m.dash='8 5';m.fill='#fff';m.fillOpacity=0;m.r8PrintRegion=true;m.r8RegionName=R8.pending?.opts?.name||'PRINT REGION';m.modified=stamp();
          currentPage().markups.push(m);state.selected=m.id;R8.pending=null;render();setTool('select');
        }else{
          finishDrag(kind,start,end,opts);R8.pending=null;
        }
      };
      window.addEventListener('pointerup',up);
    }
  },true);

  svg.addEventListener('click',e=>{
    if(state.tool==='r8Arc'){
      e.preventDefault();e.stopImmediatePropagation();
      R8.threePoint.push(svgPoint(e));
      if(R8.threePoint.length===1)q('#statusTool').textContent='Manual Curb Return — click CONTROL';
      else if(R8.threePoint.length===2)q('#statusTool').textContent='Manual Curb Return — click END';
      else{
        checkpoint();
        const [a,c,b]=R8.threePoint,m=baseMarkup('polyline',a);
        m.type='r8Arc';m.x=a.x;m.y=a.y;m.cx=c.x;m.cy=c.y;m.x2=b.x;m.y2=b.y;
        m.layer='intersectionDetails';m.subject='Manual Curb Return';m.stroke='#666';m.width=2;m.fill='none';m.fillOpacity=0;m.r8Arc=true;m.modified=stamp();
        currentPage().markups.push(m);state.selected=m.id;R8.threePoint=[];render();setTool('select');
      }
    }else if(state.tool==='r8StationPlace'){
      e.preventDefault();e.stopImmediatePropagation();
      const road=roadById(R8.stationRoadId);if(!road){setTool('select');return toast('Selected road is unavailable.')}
      const hit=nearestRoadT(sampleRoad(road),svgPoint(e)),cfg=R8.pending?.opts||{};
      checkpoint();
      const m={
        id:uid(),type:'r8Station',layer:'measurements',subject:'Manual Station Label',comment:'',status:'Open',
        r8Station:true,r8RoadId:road.id,r8T:hit.t,r8OffsetFt:Number(cfg.offsetFt)||0,r8StationText:cfg.text||'STA',
        stroke:'#444',width:1,fill:'none',fillOpacity:0,opacity:1,font:'Arial',fontSize:9,textColor:'#222',created:stamp(),modified:stamp()
      };
      currentPage().markups.push(m);state.selected=m.id;state.propertyMode='object';R8.pending=null;render();setTool('select');updateProperties();
    }else if(state.tool==='r8TemplatePlace'){
      e.preventDefault();e.stopImmediatePropagation();
      placeTemplateAt(svgPoint(e));setTool('select');
    }
  },true);

  // ---------------- MANUAL STATION LABELS ----------------

  function roadOptions(selected){
    return roads().map((r,i)=>`<option value="${r.id}"${r.id===selected?' selected':''}>${r.subject||'Roadway'} ${i+1}</option>`).join('');
  }

  function startStationPlacement(){
    const road=roadById(q('#r8StationRoad')?.value);
    if(!road)return toast('Choose a road first.');
    if(layerLocked('measurements'))return toast('Measurements layer is locked.');
    const text=(q('#r8StationText')?.value||'STA').trim();
    R8.stationRoadId=road.id;R8.pending={kind:'station',opts:{text,offsetFt:Number(q('#r8StationOffset')?.value)||0}};
    state.tool='r8StationPlace';q('#statusTool').textContent='Manual Station — click exact position on roadway';
    q('#canvasScroller').style.cursor='crosshair';
  }

  // ---------------- USER-MADE MANUAL TEMPLATES ----------------

  const TEMPLATE_KEY='nxt_r8_manual_templates';

  function loadTemplates(){
    try{R8.templates=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'[]');if(!Array.isArray(R8.templates))R8.templates=[]}catch{R8.templates=[]}
  }
  function saveTemplates(){
    try{localStorage.setItem(TEMPLATE_KEY,JSON.stringify(R8.templates))}catch(err){console.warn(err);toast('Template library could not be saved to browser storage.')}
  }
  loadTemplates();

  function eligibleTemplateMarkup(m){
    return !m.r6Road&&!m.r5RoadPath&&!m.r4Road&&!m.r6Intersection&&!m.r7Attached&&!m.r8Station;
  }

  function templateObjectList(){
    const box=q('#r8TemplateObjects');if(!box)return;
    const list=(page()?.markups||[]).filter(eligibleTemplateMarkup);
    box.innerHTML=list.length?list.map(m=>`<label><input type="checkbox" data-r8-template-id="${m.id}"> ${escapeHtml(m.subject||m.type||'Object')}</label>`).join(''):'<small>No template-eligible objects on this sheet.</small>';
  }

  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function unionBounds(items){
    const bs=items.map(bounds).filter(Boolean);if(!bs.length)return{x:0,y:0,w:1,h:1};
    const x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y)),r=Math.max(...bs.map(b=>b.x+b.w)),bot=Math.max(...bs.map(b=>b.y+b.h));
    return{x,y,w:r-x,h:bot-y};
  }

  function saveManualTemplate(){
    const ids=[...q('#r8TemplateObjects').querySelectorAll('[data-r8-template-id]:checked')].map(x=>x.dataset.r8TemplateId);
    if(!ids.length)return toast('Select at least one object for the template.');
    const name=(q('#r8TemplateName').value||'Manual Template').trim();
    const source=page().markups.filter(m=>ids.includes(m.id)&&eligibleTemplateMarkup(m));
    const b=unionBounds(source),center={x:b.x+b.w/2,y:b.y+b.h/2};
    const objects=source.map(m=>JSON.parse(JSON.stringify(m)));
    R8.templates.push({id:'tpl_'+Date.now().toString(36),name,created:stamp(),center,objects});
    saveTemplates();renderTemplateLibrary();toast('Manual template saved.');
  }

  function renderTemplateLibrary(){
    const box=q('#r8TemplateLibrary');if(!box)return;
    box.innerHTML=R8.templates.length?R8.templates.map(t=>`<div class="r8TemplateRow"><span>${escapeHtml(t.name)} <small>${t.objects.length} object${t.objects.length===1?'':'s'}</small></span><button data-r8-place="${t.id}">Place</button><button data-r8-delete="${t.id}">×</button></div>`).join(''):'<small>No saved manual templates.</small>';
    box.querySelectorAll('[data-r8-place]').forEach(b=>b.onclick=()=>{
      const t=R8.templates.find(x=>x.id===b.dataset.r8Place);if(!t)return;
      const blocked=t.objects.find(o=>layerLocked(o.layer));
      if(blocked)return toast(`${state.layers.find(l=>l.id===blocked.layer)?.name||blocked.layer} layer is locked.`);
      R8.templatePlace=t;state.tool='r8TemplatePlace';q('#statusTool').textContent='Place Manual Template — click insertion point';q('#canvasScroller').style.cursor='crosshair';
    });
    box.querySelectorAll('[data-r8-delete]').forEach(b=>b.onclick=()=>{
      R8.templates=R8.templates.filter(x=>x.id!==b.dataset.r8Delete);saveTemplates();renderTemplateLibrary();
    });
  }

  function placeTemplateAt(p){
    const t=R8.templatePlace;if(!t)return;
    const dx=p.x-t.center.x,dy=p.y-t.center.y;
    checkpoint();
    for(const original of t.objects){
      const c=JSON.parse(JSON.stringify(original)),orig=JSON.parse(JSON.stringify(original));
      c.id=uid();c.created=c.modified=stamp();c.subject=(c.subject||'Template Object');
      translateMarkup(c,dx,dy,orig);
      currentPage().markups.push(c);
    }
    R8.templatePlace=null;state.selected=null;render();toast('Manual template placed.');
  }

  // ---------------- MANUAL SCHEDULE / LEGEND NOTE ----------------

  function insertManualSchedule(){
    if(layerLocked('sheetProduction'))return toast('Sheet Production layer is locked.');
    const title=(q('#r8ScheduleTitle').value||'SCHEDULE').trim();
    const rows=(q('#r8ScheduleRows').value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!rows.length)return toast('Enter at least one schedule row.');
    const c=viewportCenterOnPage(),text=[title,'------------------------------',...rows].join('\n');
    addMarkup({
      type:'note',layer:'sheetProduction',x:c.x-170,y:c.y-Math.min(250,45+rows.length*15)/2,w:340,h:Math.min(250,45+rows.length*15),
      text,subject:'Manual Schedule / Legend',comment:'User-entered manual schedule',status:'Open',
      stroke:'#333',width:1,fill:'#fff',fillOpacity:.96,hatch:'none',opacity:1,
      font:'Courier New',fontSize:8.5,textColor:'#111',textAlign:'left'
    });
  }

  // ---------------- MANUAL PRINT REGIONS ----------------

  function startPrintRegion(){
    if(layerLocked('printRegions'))return toast('Print Regions layer is locked.');
    const name=(q('#r8RegionName').value||'PRINT REGION').trim();
    R8.pending={kind:'printRegion',opts:{name}};state.tool='r8PrintRegion';
    q('#statusTool').textContent='Print Region — drag rectangle';q('#canvasScroller').style.cursor='crosshair';
  }

  function fitSelectedRegion(){
    const m=selectedMarkup();if(!m?.r8PrintRegion)return toast('Select a print region first.');
    const b=bounds(m),sc=q('#canvasScroller'),factor=Math.min((sc.clientWidth-50)/(b.w*96/72),(sc.clientHeight-50)/(b.h*96/72));
    setZoom(factor);
    requestAnimationFrame(()=>{
      const s=96/72*state.zoom;sc.scrollLeft=Math.max(0,(b.x+b.w/2)*s-sc.clientWidth/2);sc.scrollTop=Math.max(0,(b.y+b.h/2)*s-sc.clientHeight/2);
    });
  }

  // ---------------- SHEET MANAGER ----------------

  function sheetRows(){
    return state.pages.map((p,i)=>`<div class="r8SheetRow${i===state.pageIndex?' active':''}" data-r8-sheet="${i}">
      <span>${i+1}</span>
      <input data-r8-sheet-no="${i}" value="${escapeHtml(p.r8SheetNumber||String(i+1))}" title="Sheet number">
      <input data-r8-sheet-title="${i}" value="${escapeHtml(p.r8SheetTitle||p.name||'')}" title="Sheet title">
      <button data-r8-open-sheet="${i}">Open</button>
    </div>`).join('');
  }

  function renderSheetManager(){
    const box=q('#r8SheetList');if(!box)return;
    box.innerHTML=sheetRows();
    box.querySelectorAll('[data-r8-sheet-no]').forEach(el=>el.onchange=()=>{checkpoint();state.pages[Number(el.dataset.r8SheetNo)].r8SheetNumber=el.value;renderPages()});
    box.querySelectorAll('[data-r8-sheet-title]').forEach(el=>el.onchange=()=>{checkpoint();const p=state.pages[Number(el.dataset.r8SheetTitle)];p.r8SheetTitle=el.value;p.name=el.value||p.name;render()});
    box.querySelectorAll('[data-r8-open-sheet]').forEach(b=>b.onclick=()=>{state.pageIndex=Number(b.dataset.r8OpenSheet);state.selected=null;render();fitPage();renderSheetManager()});
  }

  function movePage(delta){
    const i=state.pageIndex,j=i+delta;if(j<0||j>=state.pages.length)return;
    checkpoint();const [p]=state.pages.splice(i,1);state.pages.splice(j,0,p);state.pageIndex=j;state.selected=null;render();fitPage();renderSheetManager();
  }

  // ---------------- CUSTOM PROPERTIES ----------------

  function r8Properties(){
    let box=q('#r8Props');
    if(!box){box=ce('details','r8Props');box.id='r8Props';box.open=true;q('#propEditor')?.appendChild(box)}
    const m=selectedMarkup();
    const eligible=m&&(m.r8Crosswalk||m.r8Arc||m.r8Station||m.r8PrintRegion);
    if(!eligible||state.propertyMode!=='object'){box.classList.add('hidden');return}
    box.classList.remove('hidden');

    if(m.r8Station){
      box.innerHTML=`<summary>R8 Manual Station</summary><div class="r8PropGrid">
        <label>Road<select id="r8PropStationRoad">${roadOptions(m.r8RoadId)}</select></label>
        <label>Station text<input id="r8PropStationText" value="${escapeHtml(m.r8StationText||'STA')}"></label>
        <label>Along road (%)<input id="r8PropStationT" type="number" min="0" max="100" step=".1" value="${(Number(m.r8T||0)*100).toFixed(1)}"></label>
        <label>Offset (ft)<input id="r8PropStationOffset" type="number" step=".5" value="${Number(m.r8OffsetFt)||0}"></label>
      </div>`;
      bindChange('#r8PropStationRoad',v=>m.r8RoadId=v,m);
      bindChange('#r8PropStationText',v=>m.r8StationText=v,m);
      bindChange('#r8PropStationT',v=>m.r8T=clamp(Number(v)/100,0,1),m);
      bindChange('#r8PropStationOffset',v=>m.r8OffsetFt=Number(v)||0,m);
    }else if(m.r8Crosswalk){
      box.innerHTML=`<summary>R8 Manual Crosswalk</summary><div class="r8PropGrid">
        <label>Stripe spacing<input id="r8PropStripeSpacing" type="number" min="3" step="1" value="${Number(m.r8StripeSpacing)||10}"></label>
      </div>`;
      bindChange('#r8PropStripeSpacing',v=>m.r8StripeSpacing=Math.max(3,Number(v)||10),m);
    }else if(m.r8PrintRegion){
      box.innerHTML=`<summary>R8 Print Region</summary><div class="r8PropGrid">
        <label>Name<input id="r8PropRegionName" value="${escapeHtml(m.r8RegionName||'PRINT REGION')}"></label>
      </div><button id="r8PropFitRegion" class="r8Wide">Fit View to This Region</button>`;
      bindChange('#r8PropRegionName',v=>m.r8RegionName=v,m);
      q('#r8PropFitRegion').onclick=fitSelectedRegion;
    }else{
      box.innerHTML=`<summary>R8 Manual Curb Return</summary><small>Move the arc as one object with Select. Delete/recreate it to redefine the three points.</small>`;
    }

    if(isMarkupLocked(m))box.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
  }

  function bindChange(id,fn,m){
    const el=q(id);if(!el)return;
    el.onchange=e=>{if(isMarkupLocked(m))return toast('Layer locked.');checkpoint();fn(e.target.value);m.modified=stamp();render();updateProperties()};
  }

  const priorUpdateProperties=updateProperties;
  updateProperties=function(){priorUpdateProperties();r8Properties()};

  // ---------------- PALETTE ----------------

  function openPalette(){
    let p=q('#r8ProductionPalette');
    if(!p){
      p=ce('section','palette r8ProductionPalette hidden');p.id='r8ProductionPalette';p.dataset.floating='true';
      p.innerHTML=`<div class="paletteHead"><strong>Manual Production</strong><span>R8 combined intersection / sheets</span><button data-r8-close>×</button></div>
      <div class="paletteBody">
        <div class="r8Notice">Manual drafting only. R8 does not generate a TCP layout or choose placement for you.</div>

        <div class="toolSection"><b>Manual Intersection Details</b>
          <div class="r8Grid2">
            <button id="r8StopBar">Stop Bar</button><button id="r8TurnArrow">Direction Arrow</button>
            <button id="r8Crosswalk">Crosswalk</button><button id="r8Median">Median / Island</button>
          </div>
          <button class="r8Wide" id="r8Arc">3-Point Curb Return / Curve</button>
        </div>

        <div class="toolSection"><b>Manual Road Station Label</b>
          <label class="r8Field">Road<select id="r8StationRoad"></select></label>
          <div class="r8Grid2">
            <label>Text<input id="r8StationText" value="STA 0+00"></label>
            <label>Offset ft<input id="r8StationOffset" type="number" step=".5" value="0"></label>
          </div>
          <button class="r8Wide" id="r8PlaceStation">Click Road Position</button>
        </div>

        <div class="toolSection"><b>User-Made Manual Templates</b>
          <label class="r8Field">Template name<input id="r8TemplateName" value="Manual Assembly"></label>
          <div id="r8TemplateObjects" class="r8TemplateObjects"></div>
          <div class="r8Grid2"><button id="r8RefreshTemplateObjects">Refresh Objects</button><button id="r8SaveTemplate">Save Checked Objects</button></div>
          <div id="r8TemplateLibrary" class="r8TemplateLibrary"></div>
        </div>

        <div class="toolSection"><b>Manual Schedule / Legend</b>
          <label class="r8Field">Title<input id="r8ScheduleTitle" value="TCP SCHEDULE"></label>
          <label class="r8Field">Rows — one line per row<textarea id="r8ScheduleRows" rows="4" placeholder="ITEM | DESCRIPTION | QTY"></textarea></label>
          <button class="r8Wide" id="r8InsertSchedule">Insert Manual Table Note</button>
        </div>

        <div class="toolSection"><b>Print Regions</b>
          <label class="r8Field">Region name<input id="r8RegionName" value="PRINT REGION 1"></label>
          <div class="r8Grid2"><button id="r8DrawRegion">Draw Region</button><button id="r8FitRegion">Fit Selected Region</button></div>
          <small>Print regions are ordinary editable guides on their own layer. Hide the Print Regions layer before final PDF export if you do not want the guides printed.</small>
        </div>

        <div class="toolSection"><b>Sheet Manager</b>
          <div id="r8SheetList" class="r8SheetList"></div>
          <div class="r8Grid3"><button id="r8SheetUp">Move Up</button><button id="r8SheetDown">Move Down</button><button id="r8DuplicateSheet">Duplicate</button></div>
        </div>
      </div>`;
      document.body.appendChild(p);
      p.querySelector('[data-r8-close]').onclick=()=>p.classList.add('hidden');

      q('#r8StopBar').onclick=()=>startDragTool('stopBar',{label:'Manual Stop Bar — drag line',subject:'Manual Stop Bar',stroke:'#fff',width:5});
      q('#r8TurnArrow').onclick=()=>startDragTool('turnArrow',{label:'Manual Direction Arrow — drag',subject:'Manual Direction Arrow',stroke:'#fff',width:3});
      q('#r8Crosswalk').onclick=()=>startDragTool('crosswalk',{label:'Manual Crosswalk — drag rectangle'});
      q('#r8Median').onclick=()=>startDragTool('median',{label:'Manual Median / Island — drag rectangle'});
      q('#r8Arc').onclick=startArc;
      q('#r8PlaceStation').onclick=startStationPlacement;
      q('#r8RefreshTemplateObjects').onclick=templateObjectList;
      q('#r8SaveTemplate').onclick=saveManualTemplate;
      q('#r8InsertSchedule').onclick=insertManualSchedule;
      q('#r8DrawRegion').onclick=startPrintRegion;
      q('#r8FitRegion').onclick=fitSelectedRegion;
      q('#r8SheetUp').onclick=()=>movePage(-1);
      q('#r8SheetDown').onclick=()=>movePage(1);
      q('#r8DuplicateSheet').onclick=()=>{duplicatePage();renderSheetManager()};
    }
    q('#r8StationRoad').innerHTML=roadOptions(R8.stationRoadId);
    if(!R8.stationRoadId&&roads()[0])R8.stationRoadId=roads()[0].id;
    if(R8.stationRoadId)q('#r8StationRoad').value=R8.stationRoadId;
    q('#r8StationRoad').onchange=e=>R8.stationRoadId=e.target.value;
    templateObjectList();renderTemplateLibrary();renderSheetManager();
    p.classList.toggle('hidden');
  }

  function installUi(){
    const small=q('.brand small');if(small)small.textContent='0.1 R8';
    document.title='NXT Gen Plans 0.1 R8';
    const pals=q('.paletteButtons');
    if(pals&&!q('#r8ProductionBtn')){
      const b=ce('button','r8ProductionButton');b.id='r8ProductionBtn';b.textContent='Production';
      b.title='R8 manual intersection details, templates, stationing, print regions and sheet production';
      b.onclick=openPalette;pals.appendChild(b);
    }
  }

  installUi();
  window.NXT_R8={openPalette,ensureLayers,loadTemplates,renderSheetManager};
  console.info('NXT Gen Plans R8 combined manual production module loaded.');
})();
