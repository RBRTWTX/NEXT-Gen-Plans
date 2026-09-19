'use strict';
/*
 NXT Gen Plans 0.1 R4 Plan Creation Add-on
 Additive extension for the verified R3 foundation.
 Keeps R3 PDF/MUTCD/markup mechanics intact.
*/
(() => {
  const R4 = {
    road: {lanes:2, laneWidthFt:12, shoulderFt:0, center:'doubleYellow', edge:true},
    device: {kind:'cone', code:'CONE', spacingFt:20},
    calibrating:false
  };

  const q = s => document.querySelector(s);
  const ce = (tag, cls, html) => {
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(html!==undefined)n.innerHTML=html;
    return n;
  };
  const nowDate = () => new Date().toISOString().slice(0,10);
  const safe = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stamp = () => new Date().toISOString();

  function addButton(parent, id, text, title, fn, cls=''){
    if(q('#'+id)) return q('#'+id);
    const b=ce('button',cls);
    b.id=id;b.textContent=text;b.title=title;b.onclick=fn;
    parent.appendChild(b);return b;
  }

  function ensureR4Layer(){
    if(!state.layers.some(l=>l.id==='design')){
      state.layers.push({id:'design',name:'Plan Design',visible:true,locked:false});
    }
  }

  function sheetPreset(key){
    const presets={
      letterL:[792,612,'Letter Landscape'],
      letterP:[612,792,'Letter Portrait'],
      ansiB:[1224,792,'ANSI B / 11x17 Landscape'],
      ansiC:[1584,1224,'ANSI C / 17x22 Landscape'],
      ansiD:[2448,1584,'ANSI D / 22x34 Landscape'],
      ansiE:[3168,2448,'ANSI E / 34x44 Landscape'],
      archC:[1728,1296,'ARCH C / 18x24 Landscape'],
      archD:[2592,1728,'ARCH D / 24x36 Landscape'],
      archE:[3456,2592,'ARCH E / 36x48 Landscape'],
      archE1:[3024,2160,'ARCH E1 / 30x42 Landscape']
    };
    return presets[key] || presets.ansiB;
  }

  function baseRect(x,y,w,h,opts={}){
    return {
      id:uid(),type:'rect',layer:'design',x,y,w,h,
      subject:opts.subject||'Title Block',comment:'',status:'Open',
      stroke:opts.stroke||'#111111',width:opts.width??1,
      fill:opts.fill||'#ffffff',fillOpacity:opts.fillOpacity??0,
      dash:opts.dash||'',hatch:'none',hatchColor:'#111111',hatchSpacing:10,
      opacity:1,rotation:0,locked:opts.locked??true,
      r4Template:true,created:stamp(),modified:stamp()
    };
  }

  function baseText(x,y,w,h,text,key='',opts={}){
    return {
      id:uid(),type:'text',layer:'design',x,y,w,h,text,
      subject:opts.subject||'Plan Data',comment:'',status:'Open',
      stroke:'none',width:0,fill:'#ffffff',fillOpacity:0,dash:'',hatch:'none',
      opacity:1,rotation:0,font:opts.font||'Arial',fontSize:opts.fontSize||10,
      textColor:opts.textColor||'#111111',textAlign:opts.textAlign||'left',
      bold:!!opts.bold,italic:false,locked:false,r4Template:true,metaKey:key,
      created:stamp(),modified:stamp()
    };
  }

  function buildTitleBlock(page,type,meta){
    ensureR4Layer();
    const w=page.w,h=page.h;
    const margin=Math.max(18,Math.min(w,h)*0.025);
    const blockH=Math.max(100,Math.min(190,h*.17));
    const blockW=Math.max(390,Math.min(720,w*.42));
    const x=w-margin-blockW,y=h-margin-blockH;
    const rows=[.35,.60,.78];
    page.markups.push(baseRect(margin,margin,w-margin*2,h-margin*2,{width:1.3,locked:true,subject:'Sheet Border'}));
    page.markups.push(baseRect(x,y,blockW,blockH,{width:1.2,locked:true}));
    rows.forEach(r=>page.markups.push(baseRect(x,y+blockH*r,blockW,0.1,{width:.8,locked:true})));
    const split=x+blockW*.70;
    page.markups.push(baseRect(split,y+blockH*.60,0.1,blockH*.40,{width:.8,locked:true}));
    const title=type==='traffic'?'TEMPORARY TRAFFIC CONTROL PLAN':'CIVIL CONSTRUCTION PLAN';
    page.markups.push(baseText(x+8,y+7,blockW-16,26,title,'planType',{fontSize:15,bold:true,textAlign:'center'}));
    page.markups.push(baseText(x+8,y+36,blockW-16,22,meta.projectTitle||'PROJECT TITLE','projectTitle',{fontSize:12,bold:true,textAlign:'center'}));
    if(type==='traffic'){
      page.markups.push(baseText(x+8,y+61,blockW-16,18,meta.roadway||'ROADWAY / STREET','roadway',{fontSize:9,textAlign:'center'}));
      page.markups.push(baseText(x+8,y+79,blockW-16,18,meta.limits||'PROJECT LIMITS','limits',{fontSize:8,textAlign:'center'}));
    }else{
      page.markups.push(baseText(x+8,y+64,blockW-16,20,meta.description||'PLAN DESCRIPTION','description',{fontSize:9,textAlign:'center'}));
    }
    page.markups.push(baseText(x+8,y+blockH*.62,blockW*.67,16,'PREPARED BY: '+(meta.preparedBy||''),'preparedBy',{fontSize:8}));
    page.markups.push(baseText(x+8,y+blockH*.79,blockW*.67,16,'DATE: '+(meta.date||nowDate()),'date',{fontSize:8}));
    page.markups.push(baseText(split+6,y+blockH*.62,blockW*.28,16,'SHEET '+(meta.sheet||'1'),'sheet',{fontSize:9,bold:true,textAlign:'center'}));
    page.markups.push(baseText(split+6,y+blockH*.79,blockW*.28,16,'SCALE '+(meta.scaleLabel||'NTS'),'scaleLabel',{fontSize:8,textAlign:'center'}));
    if(type==='traffic'){
      const noteW=Math.min(w*.33,500),noteH=Math.min(h*.18,180);
      page.markups.push(baseRect(margin+10,h-margin-noteH-10,noteW,noteH,{width:.8,locked:true,subject:'TCP General Notes'}));
      page.markups.push(baseText(margin+18,h-margin-noteH, noteW-16,20,'TEMPORARY TRAFFIC CONTROL NOTES','tcpNotesTitle',{fontSize:10,bold:true}));
      page.markups.push(baseText(margin+18,h-margin-noteH+24,noteW-16,noteH-30,
        '1. Install and maintain traffic control in accordance with the approved plan and applicable current standards.\n2. Field conditions may require adjustment by the responsible authority.\n3. Maintain access and positive guidance throughout the work area.',
        'tcpNotes',{fontSize:7.5}));
    }
  }

  function resetToNewPlan(type,preset,meta){
    checkpoint();
    const [w,h,name]=sheetPreset(preset);
    const page=newPage(w,h,name);
    page.template=type;
    page.meta={...meta};
    page.rotation=0;
    page.scaleFeetPerInch=Number(meta.scaleFeetPerInch)||null;
    page.scaleLabel=page.scaleFeetPerInch?`1" = ${page.scaleFeetPerInch}'`:'NTS';
    page.markups=[];
    buildTitleBlock(page,type,meta);
    state.pdfDoc=null;state.pdfBytes=null;state.pdfFileName=null;
    state.pages=[page];state.pageIndex=0;state.selected=null;
    state.projectName=meta.projectTitle|| (type==='traffic'?'New Traffic Control Plan':'New Civil Plan');
    state.history=[];state.future=[];
    render();fitPage();setTool('select');
    toast(type==='traffic'?'Blank traffic-control plan created.':'Blank civil plan created.');
  }

  function modalShell(id,title,bodyHtml){
    let back=q('#'+id);
    if(back)back.remove();
    back=ce('div','modalBackdrop r4ModalBackdrop');
    back.id=id;
    const m=ce('div','modal r4Modal');
    m.innerHTML=`<h2>${safe(title)}</h2>${bodyHtml}`;
    back.appendChild(m);document.body.appendChild(back);
    return {back,m};
  }

  function openNewPlanWizard(){
    const {back,m}=modalShell('r4NewPlan','New Plan',`
      <div class="r4ChoiceGrid">
        <button type="button" data-type="civil" class="active"><b>Blank Civil Plan</b><span>Engineering sheet with editable civil title block.</span></button>
        <button type="button" data-type="traffic"><b>Blank Traffic Control Plan</b><span>TCP sheet, project data and work-zone notes.</span></button>
      </div>
      <div class="r4FormGrid">
        <label>Sheet size<select id="r4Sheet">
          <option value="ansiB">ANSI B / 11×17</option>
          <option value="ansiC">ANSI C / 17×22</option>
          <option value="ansiD">ANSI D / 22×34</option>
          <option value="ansiE">ANSI E / 34×44</option>
          <option value="archC">ARCH C / 18×24</option>
          <option value="archD">ARCH D / 24×36</option>
          <option value="archE">ARCH E / 36×48</option>
          <option value="archE1">ARCH E1 / 30×42</option>
          <option value="letterL">Letter Landscape</option>
          <option value="letterP">Letter Portrait</option>
        </select></label>
        <label>Project title<input id="r4Project" value="Untitled Project"></label>
        <label class="trafficOnly">Roadway / Street<input id="r4Roadway" placeholder="Roadway / street"></label>
        <label class="trafficOnly">Project limits<input id="r4Limits" placeholder="From / To"></label>
        <label>Prepared by<input id="r4Prepared" placeholder="Name / organization"></label>
        <label>Sheet number<input id="r4SheetNo" value="1"></label>
        <label>Date<input id="r4Date" type="date" value="${nowDate()}"></label>
        <label>Drawing scale<select id="r4Scale">
          <option value="">NTS / not calibrated</option>
          <option value="10">1&quot; = 10'</option><option value="20" selected>1&quot; = 20'</option>
          <option value="30">1&quot; = 30'</option><option value="40">1&quot; = 40'</option>
          <option value="50">1&quot; = 50'</option><option value="100">1&quot; = 100'</option>
        </select></label>
      </div>
      <div class="modalActions"><button id="r4CancelNew">Cancel</button><button id="r4CreateNew" class="primary">Create Plan</button></div>`);
    let type='civil';
    const choices=[...m.querySelectorAll('[data-type]')];
    const refresh=()=>{
      choices.forEach(b=>b.classList.toggle('active',b.dataset.type===type));
      m.querySelectorAll('.trafficOnly').forEach(n=>n.classList.toggle('r4Hidden',type!=='traffic'));
    };
    choices.forEach(b=>b.onclick=()=>{type=b.dataset.type;refresh()});refresh();
    q('#r4CancelNew').onclick=()=>back.remove();
    q('#r4CreateNew').onclick=()=>{
      const scale=Number(q('#r4Scale').value)||null;
      const meta={
        projectTitle:q('#r4Project').value.trim()||'Untitled Project',
        roadway:q('#r4Roadway').value.trim(),limits:q('#r4Limits').value.trim(),
        preparedBy:q('#r4Prepared').value.trim(),sheet:q('#r4SheetNo').value.trim()||'1',
        date:q('#r4Date').value||nowDate(),scaleFeetPerInch:scale,
        scaleLabel:scale?`1" = ${scale}'`:'NTS'
      };
      back.remove();resetToNewPlan(type,q('#r4Sheet').value,meta);
    };
  }

  function metaMarkup(page,key){return page.markups.find(m=>m.metaKey===key)}
  function setMetaText(page,key,value,prefix=''){
    page.meta=page.meta||{};page.meta[key]=value;
    const m=metaMarkup(page,key);
    if(m){m.text=prefix+value;m.modified=stamp()}
  }

  function openPlanSetup(){
    const p=currentPage();
    p.meta=p.meta||{};
    const {back}=modalShell('r4PlanSetup','Plan / Sheet Setup',`
      <div class="r4FormGrid">
        <label>Project title<input id="r4EProject" value="${safe(p.meta.projectTitle||state.projectName||'')}"></label>
        <label>Roadway / Street<input id="r4ERoadway" value="${safe(p.meta.roadway||'')}"></label>
        <label>Project limits<input id="r4ELimits" value="${safe(p.meta.limits||'')}"></label>
        <label>Prepared by<input id="r4EPrepared" value="${safe(p.meta.preparedBy||'')}"></label>
        <label>Sheet number<input id="r4ESheet" value="${safe(p.meta.sheet||'1')}"></label>
        <label>Date<input id="r4EDate" type="date" value="${safe(p.meta.date||nowDate())}"></label>
        <label>Scale (feet per paper inch)<input id="r4EScale" type="number" min="0" step="0.01" value="${p.scaleFeetPerInch||''}" placeholder="Example: 20"></label>
        <label>Scale label<input id="r4EScaleLabel" value="${safe(p.scaleLabel||'NTS')}"></label>
      </div>
      <div class="r4InlineActions"><button id="r4Calibrate">Calibrate from two points…</button></div>
      <div class="modalActions"><button id="r4CancelSetup">Cancel</button><button id="r4SaveSetup" class="primary">Save</button></div>`);
    q('#r4CancelSetup').onclick=()=>back.remove();
    q('#r4Calibrate').onclick=()=>{back.remove();startCalibration()};
    q('#r4SaveSetup').onclick=()=>{
      checkpoint();
      setMetaText(p,'projectTitle',q('#r4EProject').value);
      setMetaText(p,'roadway',q('#r4ERoadway').value);
      setMetaText(p,'limits',q('#r4ELimits').value);
      setMetaText(p,'preparedBy',q('#r4EPrepared').value,'PREPARED BY: ');
      setMetaText(p,'sheet',q('#r4ESheet').value,'SHEET ');
      setMetaText(p,'date',q('#r4EDate').value,'DATE: ');
      p.scaleFeetPerInch=Number(q('#r4EScale').value)||null;
      p.scaleLabel=q('#r4EScaleLabel').value.trim()||(p.scaleFeetPerInch?`1" = ${p.scaleFeetPerInch}'`:'NTS');
      setMetaText(p,'scaleLabel',p.scaleLabel,'SCALE ');
      state.projectName=p.meta.projectTitle||state.projectName;
      back.remove();render();toast('Plan setup updated.');
    };
  }

  function rotateToolbar(){
    const g=q('.zoomGroup'); if(!g)return;
    addButton(g,'r4RotateLeft','↶','Rotate current sheet 90° counterclockwise',()=>rotateCurrentPage(-1),'r4Rotate');
    addButton(g,'r4RotateRight','↷','Rotate current sheet 90° clockwise',()=>rotateCurrentPage(1),'r4Rotate');
  }

  function startCalibration(){
    R4.calibrating=true;
    setTool('r4Calibrate');
    q('#statusTool').textContent='Calibrate Scale — drag known distance';
    toast('Drag between two points with a known real-world distance.');
  }

  function scaleDistanceText(){
    const old=distanceText;
    distanceText=function(m){
      const p=currentPage(),pts=Math.hypot(m.x2-m.x,m.y2-m.y);
      if(p?.scaleFeetPerInch){
        const ft=pts/72*p.scaleFeetPerInch;
        return ft>=100?ft.toFixed(1)+" ft":ft.toFixed(2)+" ft";
      }
      return old(m);
    };
  }

  function roadWidthPoints(settings){
    const p=currentPage();
    const ft=settings.lanes*settings.laneWidthFt + settings.shoulderFt*2;
    if(p?.scaleFeetPerInch) return Math.max(10,ft/p.scaleFeetPerInch*72);
    return Math.max(18,settings.lanes*18 + settings.shoulderFt*1.5);
  }

  function createRoadOverlay(){
    const old=renderMarkups;
    renderMarkups=function(){
      old();
      const g=q('#markupLayer'),p=currentPage();
      if(!g||!p)return;
      p.markups.filter(m=>m.r4Road&&isMarkupVisible(m)).forEach(m=>{
        const dx=m.x2-m.x,dy=m.y2-m.y,len=Math.hypot(dx,dy)||1;
        const nx=-dy/len,ny=dx/len,half=(Number(m.width)||20)/2;
        if(m.edgeLine!==false){
          [-half,half].forEach(off=>{
            const e=svgEl('line',{x1:m.x+nx*off,y1:m.y+ny*off,x2:m.x2+nx*off,y2:m.y2+ny*off,
              stroke:'#f8f8f8','stroke-width':Math.max(1,Math.min(3,half*.06)),'pointer-events':'none'});
            g.appendChild(e);
          });
        }
        const center=m.centerLine||'doubleYellow';
        if(center!=='none'){
          const color=center.toLowerCase().includes('white')?'#ffffff':'#f2c230';
          const dashed=center.toLowerCase().includes('dash');
          if(center.toLowerCase().includes('double')){
            [-2.2,2.2].forEach(off=>{
              const e=svgEl('line',{x1:m.x+nx*off,y1:m.y+ny*off,x2:m.x2+nx*off,y2:m.y2+ny*off,
                stroke:color,'stroke-width':1.6,'pointer-events':'none'});
              if(dashed)e.setAttribute('stroke-dasharray','10 7');g.appendChild(e);
            });
          }else{
            const e=svgEl('line',{x1:m.x,y1:m.y,x2:m.x2,y2:m.y2,stroke:color,'stroke-width':1.6,'pointer-events':'none'});
            if(dashed)e.setAttribute('stroke-dasharray','10 7');g.appendChild(e);
          }
        }
      });
    };
  }

  function roadPointerHandler(){
    q('#pageSvg').addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      if(state.tool==='r4Calibrate'){
        e.preventDefault();e.stopImmediatePropagation();
        const a=svgPoint(e);
        const move=ev=>{};
        const up=ev=>{
          window.removeEventListener('pointerup',up);
          const b=svgPoint(ev),pts=Math.hypot(b.x-a.x,b.y-a.y);
          if(pts<3){setTool('hand');return toast('Calibration line was too short.');}
          const known=Number(prompt('Known real-world distance in feet:', '100'));
          if(known>0){
            checkpoint();currentPage().scaleFeetPerInch=known/(pts/72);
            currentPage().scaleLabel=`1" = ${currentPage().scaleFeetPerInch.toFixed(2)}'`;
            currentPage().meta=currentPage().meta||{};currentPage().meta.scaleFeetPerInch=currentPage().scaleFeetPerInch;
            const sm=metaMarkup(currentPage(),'scaleLabel');if(sm)sm.text='SCALE '+currentPage().scaleLabel;
            render();toast('Scale calibrated: '+currentPage().scaleLabel);
          }
          R4.calibrating=false;setTool('select');
        };
        window.addEventListener('pointerup',up);return;
      }
      if(state.tool!=='r4Road')return;
      e.preventDefault();e.stopImmediatePropagation();checkpoint();
      const a=svgPoint(e),m=baseMarkup('line',a);
      m.layer='design';m.subject='Roadway';m.r4Road=true;m.stroke='#777777';
      m.lanes=R4.road.lanes;m.laneWidthFt=R4.road.laneWidthFt;m.shoulderFt=R4.road.shoulderFt;
      m.centerLine=R4.road.center;m.edgeLine=R4.road.edge;m.width=roadWidthPoints(R4.road);
      currentPage().markups.push(m);
      const move=ev=>{const b=svgPoint(ev);m.x2=b.x;m.y2=b.y;renderMarkups()};
      const up=()=>{
        window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);
        m.modified=stamp();state.selected=m.id;render();setTool('select');toast('Roadway added.');
      };
      window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
    },true);
  }

  function deviceRunSettingsHook(){
    const old=finishDrawing;
    finishDrawing=function(m){
      if(m?.type==='deviceRun'){
        m.layer='traffic';m.deviceKind=R4.device.kind;m.deviceCode=R4.device.code;
        m.subject=`${R4.device.code} Device Run`;
        const p=currentPage();
        m.deviceSpacing=p?.scaleFeetPerInch ? Math.max(8,R4.device.spacingFt/p.scaleFeetPerInch*72) : Math.max(12,R4.device.spacingFt);
        m.deviceSpacingFt=R4.device.spacingFt;
      }
      return old(m);
    };
  }

  function currentManifest(){
    const p=currentPage(),map=new Map();
    const add=(code,name,n=1)=>{
      const k=code||name;if(!k)return;
      const v=map.get(k)||{code:k,name:name||k,qty:0};v.qty+=n;map.set(k,v);
    };
    p.markups.forEach(m=>{
      if(m.type==='trafficSign') add(m.signCode,m.signName||m.subject,1);
      else if(m.type==='device') add(m.deviceCode,m.subject||m.deviceKind,1);
      else if(m.type==='deviceRun'){
        const len=Math.hypot(m.x2-m.x,m.y2-m.y),step=Math.max(1,Number(m.deviceSpacing)||30);
        add(m.deviceCode,m.subject||m.deviceKind,Math.max(1,Math.floor(len/step)+1));
      }
    });
    return [...map.values()].sort((a,b)=>a.code.localeCompare(b.code));
  }

  function insertManifest(){
    const rows=currentManifest();
    if(!rows.length)return toast('No signs or traffic-control devices on this sheet yet.');
    const c=viewportCenterOnPage(),lines=['DEVICE / SIGN MANIFEST','CODE | DESCRIPTION | QTY','--------------------------------'];
    rows.forEach(r=>lines.push(`${r.code} | ${r.name} | ${r.qty}`));
    const h=Math.min(360,60+rows.length*15);
    addMarkup({type:'note',layer:'traffic',x:c.x-180,y:c.y-h/2,w:360,h,text:lines.join('\n'),
      subject:'Traffic Control Manifest',comment:'Auto-generated from current sheet objects.',status:'Open',
      stroke:'#333',width:1,fill:'#ffffff',fillOpacity:.96,hatch:'none',opacity:1,font:'Courier New',
      fontSize:8.5,textColor:'#111',textAlign:'left'});
  }

  function openDesignPalette(){
    let p=q('#r4DesignPalette');
    if(!p){
      p=ce('section','palette r4DesignPalette');p.id='r4DesignPalette';p.dataset.floating='true';
      p.innerHTML=`
        <div class="paletteHead"><strong>Plan / TCP Design</strong><span>R4 creation tools</span><button data-r4-close>×</button></div>
        <div class="paletteBody">
          <div class="toolSection"><b>Plan</b><div class="r4BtnGrid">
            <button id="r4PalNew">New Plan</button><button id="r4PalSetup">Sheet Setup</button>
            <button id="r4PalLeft">Rotate Left</button><button id="r4PalRight">Rotate Right</button>
          </div></div>
          <div class="toolSection"><b>Roadway V1</b>
            <div class="r4FormGrid compact">
              <label>Lanes<input id="r4Lanes" type="number" min="1" max="12" value="${R4.road.lanes}"></label>
              <label>Lane width (ft)<input id="r4LaneWidth" type="number" min="6" max="30" step=".5" value="${R4.road.laneWidthFt}"></label>
              <label>Shoulder each side (ft)<input id="r4Shoulder" type="number" min="0" max="30" step=".5" value="${R4.road.shoulderFt}"></label>
              <label>Center line<select id="r4Center"><option value="doubleYellow">Double Yellow</option><option value="singleYellow">Single Yellow</option><option value="dashYellow">Dashed Yellow</option><option value="dashWhite">Dashed White</option><option value="none">None</option></select></label>
            </div>
            <button class="r4WideAction" id="r4DrawRoad">Draw Road</button>
          </div>
          <div class="toolSection"><b>Channelizing Device Run</b>
            <div class="r4FormGrid compact">
              <label>Device<select id="r4DeviceKind">
                <option value="cone|CONE">Traffic Cone</option><option value="drum|DRUM">Channelizing Drum</option>
                <option value="verticalPanel|VP">Vertical Panel</option><option value="barricade|TYPE-III">Type III Barricade</option>
              </select></label>
              <label>Spacing (ft)<input id="r4DeviceSpacing" type="number" min="1" max="500" value="${R4.device.spacingFt}"></label>
            </div>
            <button class="r4WideAction" id="r4DrawDeviceRun">Draw Device Run</button>
          </div>
          <div class="toolSection"><b>Output / Schedule</b>
            <button class="r4WideAction" id="r4Manifest">Insert Device / Sign Manifest</button>
          </div>
        </div>`;
      document.body.appendChild(p);
      p.querySelector('[data-r4-close]').onclick=()=>p.classList.add('hidden');
      q('#r4PalNew').onclick=openNewPlanWizard;q('#r4PalSetup').onclick=openPlanSetup;
      q('#r4PalLeft').onclick=()=>rotateCurrentPage(-1);q('#r4PalRight').onclick=()=>rotateCurrentPage(1);
      q('#r4DrawRoad').onclick=()=>{
        R4.road.lanes=Math.max(1,Number(q('#r4Lanes').value)||2);
        R4.road.laneWidthFt=Math.max(1,Number(q('#r4LaneWidth').value)||12);
        R4.road.shoulderFt=Math.max(0,Number(q('#r4Shoulder').value)||0);
        R4.road.center=q('#r4Center').value;
        setTool('r4Road');q('#statusTool').textContent='Draw Road — drag centerline';
        toast('Drag from road start to road end.');
      };
      q('#r4DrawDeviceRun').onclick=()=>{
        const [kind,code]=q('#r4DeviceKind').value.split('|');R4.device.kind=kind;R4.device.code=code;
        R4.device.spacingFt=Math.max(1,Number(q('#r4DeviceSpacing').value)||20);
        setTool('deviceRun');q('#statusTool').textContent='Device Run — drag alignment';
        toast('Drag the channelizing-device run.');
      };
      q('#r4Manifest').onclick=insertManifest;
    }
    p.classList.toggle('hidden');
  }

  function installUi(){
    const brand=q('.brand small');if(brand)brand.textContent='0.1 R4';
    document.title='NXT Gen Plans 0.1 R4';
    const fq=q('.fileQuick');
    if(fq){
      const n=ce('button');n.id='r4NewQuick';n.textContent='New';n.title='New civil or traffic-control plan';
      n.onclick=openNewPlanWizard;fq.insertBefore(n,fq.firstChild);
    }
    rotateToolbar();
    const pals=q('.paletteButtons');
    if(pals)addButton(pals,'r4DesignBtn','Plan','Plan creation / TCP design tools',openDesignPalette,'r4PlanButton');
  }

  // Install wrappers before user interaction.
  ensureR4Layer();
  scaleDistanceText();
  createRoadOverlay();
  roadPointerHandler();
  deviceRunSettingsHook();
  installUi();

  window.NXT_R4={openNewPlanWizard,openPlanSetup,openDesignPalette,insertManifest,startCalibration};
  console.info('NXT Gen Plans R4 additive plan-creation module loaded.');
})();
