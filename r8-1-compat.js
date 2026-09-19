'use strict';
/*
 NXT Gen Plans 0.1 R8.1 — Universal Canvas Compatibility
 Baseline: Git f01c0b3c ("r8 r9")
 Loads AFTER r8-addon.js.

 Goals:
 - R7 manual TCP tools work with OR without a roadway.
 - R8 station labels work with OR without a roadway.
 - Preserve road-attached behavior as an explicit optional mode.
 - Repair relational IDs when duplicating pages.
 - Recreate required R8 layers after older NXP projects are loaded.
 - Make image import through the main Open button reliable.
 - No automatic TCP layout/design.
*/
(() => {
  if(!window.NXT_R5 || !window.NXT_R6 || !window.NXT_R6_1 ||
     !window.NXT_R7 || !window.NXT_R8 ||
     !window.__NXT_R6_1_INTEGRATION ||
     !window.__NXT_R7_MANUAL_TCP ||
     !window.__NXT_R8_COMBINED_MANUAL){
    console.error('R8.1 requires accepted R8/R7/R6.1 baseline.');
    return;
  }
  if(window.__NXT_R8_1_UNIVERSAL_CANVAS)return;
  window.__NXT_R8_1_UNIVERSAL_CANVAS=true;

  const q=s=>document.querySelector(s);
  const stamp=()=>new Date().toISOString();

  function page(){return currentPage()}
  function pageScale(){return Number(page()?.scaleFeetPerInch)||0}
  function feetToPts(ft){
    const s=pageScale();
    return s?Number(ft)/s*72:Number(ft)*2;
  }
  function layerLocked(id){return !!state.layers.find(l=>l.id===id)?.locked}

  // ---------------------------------------------------------------------------
  // LAYER CONTRACT — survive loading older NXP files that predate R8.
  // ---------------------------------------------------------------------------

  const REQUIRED_LAYERS=[
    ['default','Default'],
    ['comments','Review / Comments'],
    ['traffic','Traffic Control'],
    ['measurements','Measurements'],
    ['roadway','Roadways'],
    ['pavement','Permanent Pavement Markings'],
    ['trafficSigns','Traffic Signs'],
    ['trafficDevices','Traffic Devices'],
    ['workZones','Work Zones / Areas'],
    ['tempTraffic','Temporary Striping / Tapers'],
    ['intersectionDetails','Intersection Details'],
    ['sheetProduction','Sheet Production'],
    ['printRegions','Print Regions']
  ];

  function ensureRequiredLayers(){
    if(!Array.isArray(state.layers))state.layers=[];
    for(const [id,name] of REQUIRED_LAYERS){
      if(!state.layers.some(l=>l.id===id)){
        state.layers.push({id,name,visible:true,locked:false});
      }
    }
    if(!state.layers.some(l=>l.id===state.activeLayer))state.activeLayer='default';
  }

  const priorRender=render;
  render=function(){
    ensureRequiredLayers();
    return priorRender();
  };

  // ---------------------------------------------------------------------------
  // UNIVERSAL FREE-CANVAS TCP DRAWING
  // ---------------------------------------------------------------------------

  const FREE_TOOLS=new Set([
    'r81FreeDeviceRun',
    'r81FreeLine',
    'r81FreeTabs',
    'r81FreeTaper',
    'r81FreeStation'
  ]);
  let freePending=null;

  function lineStyle(kind){
    return ({
      dashWhite:['#ffffff',2.2,'12 9'],
      solidWhite:['#ffffff',2.2,''],
      dashYellow:['#f2c230',2.2,'12 9'],
      solidYellow:['#f2c230',2.2,''],
      closure:['#ef6c00',2.5,'8 5'],
      taper:['#ef6c00',2.5,'8 5']
    })[kind]||['#ef6c00',2.5,'8 5'];
  }

  function startFree(tool,config){
    const layer=config.layer;
    if(layerLocked(layer))return toast(`${state.layers.find(l=>l.id===layer)?.name||layer} layer is locked.`);
    freePending={tool,...config};
    state.tool=tool;
    q('#statusTool').textContent=config.status||'Manual Free Canvas — drag';
    q('#canvasScroller').style.cursor='crosshair';
    toast(config.toast||'Drag directly on the plan/image.');
  }

  function addFreeLine(start,end,cfg){
    checkpoint();

    if(cfg.kind==='deviceRun'){
      const m={
        ...baseMarkup('deviceRun',start),
        type:'deviceRun',x:start.x,y:start.y,x2:end.x,y2:end.y,
        layer:'trafficDevices',subject:'Manual Free Device Run',
        stroke:'transparent',width:1,fill:'none',fillOpacity:0,
        deviceKind:cfg.deviceKind||'cone',
        deviceCode:String(cfg.deviceKind||'cone').toUpperCase(),
        deviceSpacing:Math.max(3,feetToPts(cfg.spacingFt||20)),
        r81FreeTcp:true,r81FreeKind:'deviceRun',r81SpacingFt:Number(cfg.spacingFt)||20,
        created:stamp(),modified:stamp()
      };
      page().markups.push(m);state.selected=m.id;
    }else if(cfg.kind==='tabs'){
      const m={
        ...baseMarkup('line',start),
        type:'line',x:start.x,y:start.y,x2:end.x,y2:end.y,
        layer:'tempTraffic',subject:'Manual Free Temporary Tabs',
        stroke:'transparent',width:12,fill:'none',fillOpacity:0,
        r81FreeTcp:true,r81FreeTabs:true,r81FreeKind:'tabs',
        r81SpacingFt:Number(cfg.spacingFt)||20,r81TabColor:cfg.tabColor||'white',
        created:stamp(),modified:stamp()
      };
      page().markups.push(m);state.selected=m.id;
    }else{
      const st=lineStyle(cfg.lineStyle||cfg.kind);
      const m={
        ...baseMarkup('line',start),
        type:'line',x:start.x,y:start.y,x2:end.x,y2:end.y,
        layer:'tempTraffic',
        subject:cfg.kind==='taper'?'Manual Free Taper / Shift Line':'Manual Free Temporary Line',
        stroke:st[0],width:st[1],dash:st[2],fill:'none',fillOpacity:0,
        r81FreeTcp:true,r81FreeKind:cfg.kind||'line',
        r81LineStyle:cfg.lineStyle||cfg.kind||'closure',
        created:stamp(),modified:stamp()
      };
      page().markups.push(m);state.selected=m.id;
    }

    state.propertyMode='object';
    render();setTool('select');updateProperties();
  }

  function addFreeStation(p,cfg){
    if(layerLocked('measurements'))return toast('Measurements layer is locked.');
    addMarkup({
      type:'textbox',layer:'measurements',
      x:p.x-48,y:p.y-12,w:96,h:24,
      text:cfg.text||'STA 0+00',
      subject:'Manual Free Station Label',
      comment:'Free-canvas station label; not tied to a roadway.',
      status:'Open',
      stroke:'#444',width:1,fill:'#ffffff',fillOpacity:.72,
      dash:'',hatch:'none',opacity:1,rotation:0,
      font:'Arial',fontSize:9,textColor:'#222',textAlign:'center',
      r81FreeStation:true
    });
  }

  const svg=q('#pageSvg');
  if(svg){
    svg.addEventListener('pointerdown',e=>{
      if(!FREE_TOOLS.has(state.tool)||e.button!==0)return;
      e.preventDefault();e.stopImmediatePropagation();

      const start=svgPoint(e);
      const cfg=freePending||{};

      if(state.tool==='r81FreeStation'){
        addFreeStation(start,cfg);
        freePending=null;
        return;
      }

      let last=start;
      const move=ev=>{last=svgPoint(ev)};
      const up=ev=>{
        window.removeEventListener('pointermove',move);
        window.removeEventListener('pointerup',up);
        last=svgPoint(ev);
        const d=Math.hypot(last.x-start.x,last.y-start.y);
        if(d<2){setTool('select');freePending=null;return toast('Drag a longer distance.')}
        addFreeLine(start,last,cfg);
        freePending=null;
      };
      window.addEventListener('pointermove',move);
      window.addEventListener('pointerup',up);
    },true);
  }

  // Draw free-canvas temporary tabs.
  function renderFreeTabs(){
    const g=q('#markupLayer');if(!g)return;
    for(const m of (page()?.markups||[])){
      if(!m.r81FreeTabs||!isMarkupVisible(m))continue;
      const dx=m.x2-m.x,dy=m.y2-m.y,len=Math.hypot(dx,dy);
      if(len<.1)continue;
      const ux=dx/len,uy=dy/len;
      const spacing=Math.max(3,feetToPts(Number(m.r81SpacingFt)||20));
      const fill=m.r81TabColor==='yellow'?'#f2c230':'#ffffff';
      for(let d=0;d<=len+.01;d+=spacing){
        const x=m.x+ux*d,y=m.y+uy*d,ang=Math.atan2(dy,dx)*180/Math.PI;
        g.appendChild(svgEl('rect',{
          x:x-3,y:y-1,width:6,height:2,rx:.5,fill,stroke:'#333','stroke-width':.35,
          transform:`rotate(${ang} ${x} ${y})`,'pointer-events':'none'
        }));
      }
    }
  }

  const priorRenderMarkups=renderMarkups;
  renderMarkups=function(){
    // Free device runs store feet canonically and derive drawing spacing each render.
    for(const m of (page()?.markups||[])){
      if(m.r81FreeTcp&&m.r81FreeKind==='deviceRun'){
        m.deviceSpacing=Math.max(3,feetToPts(Number(m.r81SpacingFt)||20));
      }
    }
    priorRenderMarkups();
    renderFreeTabs();
  };

  // ---------------------------------------------------------------------------
  // PATCH R7 PALETTE — explicit Free Canvas vs Road-Attached mode.
  // ---------------------------------------------------------------------------

  const originalR7Handlers=new Map();

  function patchR7Palette(){
    const p=q('#r7ManualPalette');if(!p)return;

    if(!q('#r81R7Mode')){
      const first=p.querySelector('.paletteBody .toolSection');
      if(first){
        const box=document.createElement('div');
        box.className='r81ModeBox';
        box.innerHTML=`<b>Placement Mode</b>
          <label>Mode
            <select id="r81R7Mode">
              <option value="free" selected>Free Canvas / Satellite Image</option>
              <option value="road">Road-Attached</option>
            </select>
          </label>
          <small>Free Canvas requires no roadway. Road-Attached keeps the R7 road-following behavior.</small>`;
        first.parentNode.insertBefore(box,first);
      }
    }

    const bind=(id,freeFn)=>{
      const b=q('#'+id);if(!b||b.dataset.r81Universal==='1')return;
      b.dataset.r81Universal='1';
      originalR7Handlers.set(id,b.onclick);
      b.onclick=()=>{
        if((q('#r81R7Mode')?.value||'free')==='road'){
          return originalR7Handlers.get(id)?.();
        }
        return freeFn();
      };
    };

    bind('r7DeviceRun',()=>startFree('r81FreeDeviceRun',{
      kind:'deviceRun',layer:'trafficDevices',
      deviceKind:q('#r7Device')?.value||'cone',
      spacingFt:Math.max(1,Number(q('#r7DeviceSpacing')?.value)||20),
      status:'Free Device Run — drag start to end',
      toast:'Drag the device run directly over the plan or satellite image.'
    }));

    bind('r7LineRun',()=>startFree('r81FreeLine',{
      kind:'line',layer:'tempTraffic',
      lineStyle:q('#r7LineStyle')?.value||'closure',
      status:'Free Temporary Line — drag start to end',
      toast:'Drag the temporary line directly on the canvas.'
    }));

    bind('r7Tabs',()=>startFree('r81FreeTabs',{
      kind:'tabs',layer:'tempTraffic',
      tabColor:q('#r7TabColor')?.value||'white',
      spacingFt:Math.max(1,Number(q('#r7TabSpacing')?.value)||20),
      status:'Free Temporary Tabs — drag start to end',
      toast:'Drag the tab run directly on the canvas.'
    }));

    bind('r7Taper',()=>startFree('r81FreeTaper',{
      kind:'taper',layer:'tempTraffic',
      lineStyle:'taper',
      status:'Free Taper / Shift Line — drag start to end',
      toast:'Drag the taper/shift line manually. No taper length is calculated.'
    }));

    bind('r7WorkArea',()=>{
      if(layerLocked('workZones'))return toast('Work Zones / Areas layer is locked.');
      window.NXT_R5.startZone('workArea');
      toast('Draw the work-area polygon manually over the image; double-click to finish.');
    });
  }

  const r7Btn=q('#r7ManualBtn');
  if(r7Btn)r7Btn.addEventListener('click',()=>setTimeout(patchR7Palette,0));

  // ---------------------------------------------------------------------------
  // PATCH R8 STATION TOOL — Free Canvas or Road-Relative.
  // ---------------------------------------------------------------------------

  let originalStationHandler=null;

  function patchR8Palette(){
    const p=q('#r8ProductionPalette');if(!p)return;

    if(!q('#r81StationMode')){
      const stationButton=q('#r8PlaceStation');
      const section=stationButton?.closest('.toolSection');
      if(section){
        const mode=document.createElement('label');
        mode.className='r81InlineMode';
        mode.innerHTML=`Placement
          <select id="r81StationMode">
            <option value="free" selected>Free Canvas / Satellite Image</option>
            <option value="road">Road-Relative</option>
          </select>`;
        section.insertBefore(mode,section.querySelector('.r8Field'));
      }
    }

    const b=q('#r8PlaceStation');
    if(b&&b.dataset.r81Universal!=='1'){
      b.dataset.r81Universal='1';
      originalStationHandler=b.onclick;
      b.onclick=()=>{
        if((q('#r81StationMode')?.value||'free')==='road'){
          return originalStationHandler?.();
        }
        startFree('r81FreeStation',{
          layer:'measurements',
          text:(q('#r8StationText')?.value||'STA 0+00').trim(),
          status:'Free Station Label — click location',
          toast:'Click the exact station-label location on the plan/image.'
        });
      };
    }
  }

  const r8Btn=q('#r8ProductionBtn');
  if(r8Btn)r8Btn.addEventListener('click',()=>setTimeout(patchR8Palette,0));

  // ---------------------------------------------------------------------------
  // PAGE DUPLICATION — remap relational IDs.
  // ---------------------------------------------------------------------------

  const priorDuplicatePage=duplicatePage;
  duplicatePage=function(){
    const source=currentPage();
    const oldIds=(source?.markups||[]).map(m=>m.id);
    priorDuplicatePage();

    const clone=currentPage();
    const map=new Map();
    (clone?.markups||[]).forEach((m,i)=>{
      if(oldIds[i])map.set(oldIds[i],m.id);
    });

    for(const m of (clone?.markups||[])){
      if(m.r7RoadId&&map.has(m.r7RoadId))m.r7RoadId=map.get(m.r7RoadId);
      if(m.r8RoadId&&map.has(m.r8RoadId))m.r8RoadId=map.get(m.r8RoadId);
      if(Array.isArray(m.roads))m.roads=m.roads.map(id=>map.get(id)||id);
      m.modified=stamp();
    }
    render();
  };

  // ---------------------------------------------------------------------------
  // IMAGE IMPORT — main Open button must reliably accept PNG/JPG/etc.
  // ---------------------------------------------------------------------------

  const fileOpen=q('#fileOpen');
  if(fileOpen&&fileOpen.onchange&&!fileOpen.dataset.r81ImageFix){
    fileOpen.dataset.r81ImageFix='1';
    const priorFileOpen=fileOpen.onchange;
    fileOpen.onchange=async e=>{
      const f=e.target.files?.[0];
      if(f&&(f.type?.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(f.name||''))){
        e.target.value='';
        try{
          const data=await fileDataUrl(f),img=new Image();
          img.onload=()=>{
            checkpoint();
            const landscape=img.width>=img.height;
            const p=newPage(landscape?792:612,landscape?612:792,'Imported Image');
            p.bg={data,name:f.name};
            state.pages.push(p);
            state.pageIndex=state.pages.length-1;
            state.selected=null;
            render();fitPage();
            toast('Image opened as a plan background.');
          };
          img.onerror=()=>toast('Could not open image.');
          img.src=data;
        }catch(err){
          console.error(err);toast('Image open failed: '+(err.message||err));
        }
        return;
      }
      return priorFileOpen.call(fileOpen,e);
    };
  }

  // Allow importing the same image file twice in a row from Import Image.
  const imageOpen=q('#imageOpen');
  if(imageOpen&&imageOpen.onchange&&!imageOpen.dataset.r81ResetFix){
    imageOpen.dataset.r81ResetFix='1';
    const priorImageOpen=imageOpen.onchange;
    imageOpen.onchange=async e=>{
      try{return await priorImageOpen.call(imageOpen,e)}
      finally{e.target.value=''}
    };
  }

  // ---------------------------------------------------------------------------
  // PROPERTIES FOR FREE-CANVAS TCP OBJECTS.
  // ---------------------------------------------------------------------------

  function installFreeProps(){
    let box=q('#r81FreeProps');
    if(!box){
      box=document.createElement('details');
      box.id='r81FreeProps';box.className='r81FreeProps';box.open=true;
      q('#propEditor')?.appendChild(box);
    }

    const m=selectedMarkup();
    if(!m?.r81FreeTcp||state.propertyMode!=='object'){
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    if(m.r81FreeKind==='deviceRun'){
      box.innerHTML=`<summary>Universal Free TCP</summary>
        <div class="r81PropGrid">
          <label>Device
            <select id="r81PropDevice">
              <option value="cone">Cone</option>
              <option value="drum">Drum</option>
              <option value="verticalPanel">Vertical Panel</option>
              <option value="barricade">Barricade</option>
              <option value="barrier">Barrier</option>
            </select>
          </label>
          <label>Spacing (ft)<input id="r81PropSpacing" type="number" min="1" step="1" value="${Number(m.r81SpacingFt)||20}"></label>
        </div>`;
      q('#r81PropDevice').value=m.deviceKind||'cone';
      q('#r81PropDevice').onchange=e=>{
        if(isMarkupLocked(m))return toast('Layer locked.');
        checkpoint();m.deviceKind=e.target.value;m.deviceCode=e.target.value.toUpperCase();m.modified=stamp();render();
      };
      q('#r81PropSpacing').onchange=e=>{
        if(isMarkupLocked(m))return toast('Layer locked.');
        checkpoint();m.r81SpacingFt=Math.max(1,Number(e.target.value)||20);m.modified=stamp();render();
      };
    }else if(m.r81FreeKind==='tabs'){
      box.innerHTML=`<summary>Universal Free TCP</summary>
        <div class="r81PropGrid">
          <label>Tab color<select id="r81PropTabColor"><option value="white">White</option><option value="yellow">Yellow</option></select></label>
          <label>Spacing (ft)<input id="r81PropSpacing" type="number" min="1" step="1" value="${Number(m.r81SpacingFt)||20}"></label>
        </div>`;
      q('#r81PropTabColor').value=m.r81TabColor||'white';
      q('#r81PropTabColor').onchange=e=>{
        if(isMarkupLocked(m))return toast('Layer locked.');
        checkpoint();m.r81TabColor=e.target.value;m.modified=stamp();render();
      };
      q('#r81PropSpacing').onchange=e=>{
        if(isMarkupLocked(m))return toast('Layer locked.');
        checkpoint();m.r81SpacingFt=Math.max(1,Number(e.target.value)||20);m.modified=stamp();render();
      };
    }else{
      box.innerHTML=`<summary>Universal Free TCP</summary><small>This object is free-canvas geometry and does not require a roadway.</small>`;
    }

    if(isMarkupLocked(m))box.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
  }

  const priorUpdateProperties=updateProperties;
  updateProperties=function(){
    priorUpdateProperties();
    installFreeProps();
  };

  // Initial contract repair.
  ensureRequiredLayers();

  window.NXT_R8_1={
    ensureRequiredLayers,
    patchR7Palette,
    patchR8Palette
  };

  console.info('NXT Gen Plans R8.1 universal canvas compatibility loaded.');
})();
