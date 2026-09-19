'use strict';
/*
 NXT Gen Plans 0.1 R11 — Manual Plan Documentation
 Baseline: Git d684ab29 (r10)
 Loads AFTER r10-addon.js.

 Manual/offline documentation:
 - title blocks
 - revision tables
 - manual tables
 - snapshot legends
 - snapshot manifests
 - sequential click stamper
 - continuation / detail / match-line references

 No cloud. No live maps. No automated TCP design.
 Legend/manifest generation happens only when the user explicitly clicks Insert/Refresh.
*/
(() => {
  if(!window.NXT_R10 || !window.__NXT_R10_LOCAL_LIBRARY ||
     !window.NXT_R9 || !window.__NXT_R9_MANUAL_GEOMETRY){
    console.error('R11 requires the accepted R10 baseline.');
    return;
  }
  if(window.__NXT_R11_PLAN_DOCUMENTATION)return;
  window.__NXT_R11_PLAN_DOCUMENTATION=true;

  const q=s=>document.querySelector(s);
  const ce=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.innerHTML=h;return n};
  const stamp=()=>new Date().toISOString();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const layerId='sheetProduction';

  const R11={
    pendingStamp:null,
    stampNext:1
  };

  function page(){return currentPage()}
  function layerLocked(){return !!state.layers.find(l=>l.id===layerId)?.locked}
  function deep(v){return JSON.parse(JSON.stringify(v))}
  function center(){return viewportCenterOnPage()}

  // -----------------------------------------------------------------------
  // DOCUMENT OBJECT MODEL
  // -----------------------------------------------------------------------

  function addDoc(kind,fields,opts={}){
    if(layerLocked())return toast('Sheet Production layer is locked.');
    checkpoint();
    const c=center(),w=opts.w||330,h=opts.h||150;
    const m={
      id:uid(),type:'r11Doc',layer:layerId,
      x:opts.x??(c.x-w/2),y:opts.y??(c.y-h/2),w,h,
      subject:opts.subject||kind,comment:'R11 manual documentation',status:'Open',
      created:stamp(),modified:stamp(),
      r11Doc:true,r11Kind:kind,r11Fields:deep(fields),
      stroke:'#222',width:1,fill:'#fff',fillOpacity:.96,opacity:1,rotation:0,
      font:'Arial',fontSize:9,textColor:'#111'
    };
    page().markups.push(m);state.selected=m.id;state.propertyMode='object';
    render();setTool('select');updateProperties();
    return m;
  }

  function svgText(g,x,y,text,attrs={}){
    const t=svgEl('text',{x,y,'font-family':'Arial','font-size':attrs.size||8,fill:attrs.fill||'#111','font-weight':attrs.bold?'700':'400','text-anchor':attrs.anchor||'start','pointer-events':'none'});
    t.textContent=String(text??'');g.appendChild(t);return t;
  }

  function wrapText(text,maxChars){
    const words=String(text??'').split(/\s+/),lines=[];let line='';
    for(const word of words){
      const next=line?line+' '+word:word;
      if(next.length>maxChars&&line){lines.push(line);line=word}else line=next;
    }
    if(line)lines.push(line);
    return lines.length?lines:[''];
  }

  function renderTitleBlock(g,m){
    const f=m.r11Fields||{},x=m.x,y=m.y,w=m.w,h=m.h;
    const head=Math.max(24,Math.min(38,h*.18));
    g.appendChild(svgEl('rect',{x,y,width:w,height:h,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:m.stroke||'#222','stroke-width':m.width||1}));
    g.appendChild(svgEl('rect',{x,y,width:w,height:head,fill:'#f2f4f5',stroke:m.stroke||'#222','stroke-width':1}));
    svgText(g,x+8,y+16,f.company||'NXT GEN PLANS',{size:10,bold:true});
    svgText(g,x+w-8,y+16,f.drawingNo||'DRAWING NO.',{size:8,bold:true,anchor:'end'});
    svgText(g,x+8,y+head+15,f.project||'PROJECT',{size:10,bold:true});
    svgText(g,x+8,y+head+30,f.location||'LOCATION',{size:8});
    const rows=[
      ['CLIENT',f.client||''],
      ['ROAD / SITE',f.road||''],
      ['PLAN NO.',f.planNo||''],
      ['SHEET',f.sheet||''],
      ['DATE',f.date||''],
      ['SCALE',f.scale||'NTS'],
      ['PREPARED BY',f.preparedBy||''],
      ['CHECKED BY',f.checkedBy||''],
      ['APPROVED BY',f.approvedBy||''],
      ['PERMIT',f.permit||'']
    ];
    const top=y+head+42,rowH=Math.max(11,(h-head-48)/Math.max(rows.length,1));
    rows.forEach((r,i)=>{
      const yy=top+i*rowH;
      g.appendChild(svgEl('line',{x1:x,y1:yy,x2:x+w,y2:yy,stroke:'#c2c7ca','stroke-width':.5,'pointer-events':'none'}));
      svgText(g,x+6,yy+rowH*.72,r[0],{size:6.6,bold:true,fill:'#555'});
      svgText(g,x+78,yy+rowH*.72,r[1],{size:7.4});
    });
  }

  function renderTable(g,m,title,headers,rows){
    const x=m.x,y=m.y,w=m.w,h=m.h;
    g.appendChild(svgEl('rect',{x,y,width:w,height:h,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:m.stroke||'#222','stroke-width':m.width||1}));
    const titleH=22,headH=18;
    g.appendChild(svgEl('rect',{x,y,width:w,height:titleH,fill:'#f2f4f5',stroke:m.stroke||'#222','stroke-width':1}));
    svgText(g,x+6,y+15,title||'TABLE',{size:9,bold:true});
    const cols=Math.max(1,headers.length),cw=w/cols;
    const top=y+titleH;
    g.appendChild(svgEl('rect',{x,y:top,width:w,height:headH,fill:'#fafafa',stroke:'#777','stroke-width':.6}));
    headers.forEach((h2,i)=>{
      if(i)g.appendChild(svgEl('line',{x1:x+i*cw,y1:top,x2:x+i*cw,y2:y+h,stroke:'#aaa','stroke-width':.5,'pointer-events':'none'}));
      svgText(g,x+i*cw+4,top+12,h2,{size:7,bold:true});
    });
    const bodyH=Math.max(1,h-titleH-headH),rh=Math.max(13,bodyH/Math.max(1,rows.length));
    rows.forEach((row,ri)=>{
      const yy=top+headH+ri*rh;if(yy>y+h-2)return;
      g.appendChild(svgEl('line',{x1:x,y1:yy,x2:x+w,y2:yy,stroke:'#c5c5c5','stroke-width':.45,'pointer-events':'none'}));
      for(let ci=0;ci<cols;ci++){
        const val=Array.isArray(row)?row[ci]:row?.[headers[ci]];
        svgText(g,x+ci*cw+4,yy+Math.min(11,rh*.72),val??'',{size:6.8});
      }
    });
  }

  function renderNote(g,m){
    const f=m.r11Fields||{},x=m.x,y=m.y,w=m.w,h=m.h;
    g.appendChild(svgEl('rect',{x,y,width:w,height:h,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:m.stroke||'#222','stroke-width':m.width||1}));
    svgText(g,x+7,y+16,f.title||'NOTE',{size:9,bold:true});
    let yy=y+30;
    for(const line of wrapText(f.text||'',Math.max(18,Math.floor(w/6.4)))){
      if(yy>y+h-6)break;svgText(g,x+7,yy,line,{size:7.5});yy+=10;
    }
  }

  function renderReference(g,m){
    const f=m.r11Fields||{},x=m.x,y=m.y,w=m.w,h=m.h;
    g.appendChild(svgEl('rect',{x,y,width:w,height:h,rx:3,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:m.stroke||'#222','stroke-width':m.width||1}));
    svgText(g,x+w/2,y+h*.42,f.primary||'SEE SHEET',{size:8,bold:true,anchor:'middle'});
    svgText(g,x+w/2,y+h*.72,f.secondary||'',{size:7,anchor:'middle'});
  }

  function renderDoc(g,m){
    const grp=svgEl('g');grp.dataset.id=m.id;grp.classList.add('markup','r11DocObject');
    if(state.selected===m.id)grp.classList.add('selected');
    grp.setAttribute('opacity',m.opacity??1);
    grp.addEventListener('pointerdown',e=>objectPointerDown(e,m));
    grp.addEventListener('contextmenu',e=>openContext(e,m.id));

    const f=m.r11Fields||{};
    if(m.r11Kind==='titleBlock')renderTitleBlock(grp,m);
    else if(m.r11Kind==='revision')renderTable(grp,m,f.title||'REVISION HISTORY',['REV','DATE','DESCRIPTION','BY'],f.rows||[]);
    else if(m.r11Kind==='table')renderTable(grp,m,f.title||'TABLE',f.headers||['ITEM','DESCRIPTION'],f.rows||[]);
    else if(m.r11Kind==='legend')renderTable(grp,m,f.title||'LEGEND',['SYMBOL / ITEM','DESCRIPTION'],f.rows||[]);
    else if(m.r11Kind==='manifest')renderTable(grp,m,f.title||'MANIFEST',['ITEM','DESCRIPTION','QTY'],f.rows||[]);
    else if(m.r11Kind==='reference')renderReference(grp,m);
    else renderNote(grp,m);

    g.appendChild(grp);
  }

  const priorRenderMarkups=renderMarkups;
  renderMarkups=function(){
    priorRenderMarkups();
    const g=q('#markupLayer');if(!g)return;
    for(const m of (page()?.markups||[])){
      if(m.r11Doc&&isMarkupVisible(m))renderDoc(g,m);
    }
  };

  // -----------------------------------------------------------------------
  // TITLE BLOCK
  // -----------------------------------------------------------------------

  function titleFields(){
    return{
      company:(q('#r11Company')?.value||'').trim(),
      drawingNo:(q('#r11DrawingNo')?.value||'').trim(),
      project:(q('#r11Project')?.value||'').trim(),
      location:(q('#r11Location')?.value||'').trim(),
      client:(q('#r11Client')?.value||'').trim(),
      road:(q('#r11Road')?.value||'').trim(),
      planNo:(q('#r11PlanNo')?.value||'').trim(),
      sheet:(q('#r11Sheet')?.value||'').trim(),
      date:(q('#r11Date')?.value||'').trim(),
      scale:(q('#r11Scale')?.value||'NTS').trim(),
      preparedBy:(q('#r11Prepared')?.value||'').trim(),
      checkedBy:(q('#r11Checked')?.value||'').trim(),
      approvedBy:(q('#r11Approved')?.value||'').trim(),
      permit:(q('#r11Permit')?.value||'').trim()
    };
  }

  function insertTitleBlock(){addDoc('titleBlock',titleFields(),{subject:'Title Block',w:360,h:210})}

  // -----------------------------------------------------------------------
  // REVISION / GENERIC TABLES
  // -----------------------------------------------------------------------

  function parsePipeRows(text,cols){
    return String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(line=>{
      const parts=line.split('|').map(s=>s.trim());
      while(parts.length<cols)parts.push('');
      return parts.slice(0,cols);
    });
  }

  function insertRevision(){
    const rows=parsePipeRows(q('#r11RevisionRows')?.value,4);
    if(!rows.length)return toast('Enter at least one revision row.');
    addDoc('revision',{title:(q('#r11RevisionTitle')?.value||'REVISION HISTORY').trim(),rows},{subject:'Revision Table',w:380,h:Math.max(110,45+rows.length*18)});
  }

  function insertTable(){
    const headers=(q('#r11TableHeaders')?.value||'ITEM | DESCRIPTION').split('|').map(s=>s.trim()).filter(Boolean);
    if(!headers.length)return toast('Enter table headers.');
    const rows=parsePipeRows(q('#r11TableRows')?.value,headers.length);
    if(!rows.length)return toast('Enter at least one table row.');
    addDoc('table',{title:(q('#r11TableTitle')?.value||'TABLE').trim(),headers,rows},{subject:'Manual Table',w:400,h:Math.max(110,48+rows.length*18)});
  }

  // -----------------------------------------------------------------------
  // LEGEND / MANIFEST SNAPSHOTS
  // -----------------------------------------------------------------------

  function describeMarkup(m){
    if(m.type==='trafficSign')return{
      key:'sign:'+String(m.signCode||m.signName||m.subject||'Traffic Sign'),
      item:m.signCode||m.signName||'Traffic Sign',
      desc:m.signName||m.subject||m.signCode||'Traffic Sign'
    };
    if(m.type==='device')return{
      key:'device:'+String(m.deviceKind||m.deviceCode||m.subject||'Device'),
      item:m.deviceCode||m.deviceKind||'Device',
      desc:m.subject||m.deviceKind||'Traffic Control Device'
    };
    if(m.type==='deviceRun'||(m.r9Path&&m.r9Kind==='deviceRun'))return{
      key:'run:'+String(m.deviceKind||m.r9DeviceKind||'Device Run'),
      item:'DEVICE RUN',
      desc:`${m.deviceKind||m.r9DeviceKind||'Device'} Run`
    };
    if(m.r5Zone)return{key:'zone:'+String(m.subject||'Work Area'),item:'AREA',desc:m.subject||'Work Area'};
    if(m.r5Marking||m.r9Path&&['line','tabs','taper'].includes(m.r9Kind))return{key:'marking:'+String(m.subject||'Marking'),item:'MARKING',desc:m.subject||'Pavement / Temporary Marking'};
    if(m.r8Crosswalk)return{key:'crosswalk',item:'CROSSWALK',desc:'Crosswalk'};
    if(m.r8Arc)return{key:'curbReturn',item:'CURB',desc:'Curb Return / Curve'};
    return null;
  }

  function snapshotRows(withQty){
    const map=new Map();
    for(const m of (page()?.markups||[])){
      if(m.r11Doc||m.r8PrintRegion||!isMarkupVisible(m))continue;
      const d=describeMarkup(m);if(!d)continue;
      if(!map.has(d.key))map.set(d.key,{...d,qty:0});
      map.get(d.key).qty++;
    }
    const list=[...map.values()].sort((a,b)=>a.item.localeCompare(b.item));
    return withQty?list.map(x=>[x.item,x.desc,String(x.qty)]):list.map(x=>[x.item,x.desc]);
  }

  function insertLegend(){
    const rows=snapshotRows(false);if(!rows.length)return toast('No legend-eligible visible traffic-control objects are on this page.');
    addDoc('legend',{title:(q('#r11LegendTitle')?.value||'LEGEND').trim(),rows},{subject:'Legend Snapshot',w:340,h:Math.max(100,45+rows.length*17)});
  }

  function insertManifest(){
    const rows=snapshotRows(true);if(!rows.length)return toast('No manifest-eligible visible traffic-control objects are on this page.');
    addDoc('manifest',{title:(q('#r11ManifestTitle')?.value||'MANIFEST').trim(),rows},{subject:'Manifest Snapshot',w:370,h:Math.max(100,45+rows.length*17)});
  }

  function refreshSelectedSnapshot(){
    const m=selectedMarkup();if(!m?.r11Doc||!['legend','manifest'].includes(m.r11Kind))return toast('Select an R11 legend or manifest first.');
    if(isMarkupLocked(m))return toast('Layer locked.');
    checkpoint();
    m.r11Fields.rows=snapshotRows(m.r11Kind==='manifest');
    m.modified=stamp();render();updateProperties();toast(`${m.r11Kind==='manifest'?'Manifest':'Legend'} snapshot refreshed.`);
  }

  // -----------------------------------------------------------------------
  // NUMBER STAMPER
  // -----------------------------------------------------------------------

  function beginNumberStamper(){
    if(layerLocked())return toast('Sheet Production layer is locked.');
    R11.stampNext=Number(q('#r11StampStart')?.value)||1;
    R11.pendingStamp={
      prefix:q('#r11StampPrefix')?.value||'',
      suffix:q('#r11StampSuffix')?.value||'',
      increment:Number(q('#r11StampIncrement')?.value)||1,
      shape:q('#r11StampShape')?.value||'circle'
    };
    state.tool='r11NumberStamp';
    q('#statusTool').textContent='Number Stamper — click repeatedly; Esc to finish';
    q('#canvasScroller').style.cursor='crosshair';
    toast('Click each stamp location manually. Esc stops the stamper.');
  }

  const svg=q('#pageSvg');
  svg.addEventListener('pointerdown',e=>{
    if(state.tool!=='r11NumberStamp'||e.button!==0)return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);

  svg.addEventListener('click',e=>{
    if(state.tool!=='r11NumberStamp'||!R11.pendingStamp)return;
    e.preventDefault();e.stopImmediatePropagation();
    const p=window.NXT_R9?.snapPoint?window.NXT_R9.snapPoint(svgPoint(e)):svgPoint(e);
    const cfg=R11.pendingStamp,text=`${cfg.prefix}${R11.stampNext}${cfg.suffix}`;
    checkpoint();
    const m={
      id:uid(),type:'r11Doc',layer:layerId,x:p.x-18,y:p.y-12,w:36,h:24,
      subject:'Sequential Number Stamp',comment:'R11 manual number stamper',status:'Open',
      created:stamp(),modified:stamp(),r11Doc:true,r11Kind:'reference',
      r11Fields:{primary:text,secondary:'',stampShape:cfg.shape},
      stroke:'#222',width:1,fill:'#fff',fillOpacity:.96,opacity:1,rotation:0
    };
    page().markups.push(m);R11.stampNext+=cfg.increment;renderMarkups();
    q('#statusTool').textContent=`Number Stamper — next ${cfg.prefix}${R11.stampNext}${cfg.suffix}`;
  },true);

  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&state.tool==='r11NumberStamp'){
      R11.pendingStamp=null;setTool('select');
    }
  },true);

  // -----------------------------------------------------------------------
  // CONTINUATION / DETAIL REFERENCES
  // -----------------------------------------------------------------------

  function insertReference(kind){
    const primary=(q('#r11RefPrimary')?.value||({
      continuation:'SEE CONTINUATION',
      detail:'DETAIL A',
      match:'MATCH LINE A-A'
    }[kind]||'REFERENCE')).trim();
    const secondary=(q('#r11RefSecondary')?.value||'').trim();
    addDoc('reference',{primary,secondary,referenceKind:kind},{subject:'Plan Reference',w:170,h:48});
  }

  function insertNote(){
    const title=(q('#r11NoteTitle')?.value||'NOTE').trim(),text=(q('#r11NoteText')?.value||'').trim();
    if(!text)return toast('Enter note text.');
    addDoc('note',{title,text},{subject:'Documentation Note',w:340,h:140});
  }

  // -----------------------------------------------------------------------
  // PROPERTIES / DOCUMENT EDITOR
  // -----------------------------------------------------------------------

  function loadSelectedIntoPalette(){
    const m=selectedMarkup();if(!m?.r11Doc)return toast('Select an R11 documentation object.');
    openPalette(true);
    const f=m.r11Fields||{};
    if(m.r11Kind==='titleBlock'){
      const map={
        r11Company:'company',r11DrawingNo:'drawingNo',r11Project:'project',r11Location:'location',
        r11Client:'client',r11Road:'road',r11PlanNo:'planNo',r11Sheet:'sheet',r11Date:'date',
        r11Scale:'scale',r11Prepared:'preparedBy',r11Checked:'checkedBy',r11Approved:'approvedBy',r11Permit:'permit'
      };
      for(const [id,k] of Object.entries(map))if(q('#'+id))q('#'+id).value=f[k]||'';
    }else if(m.r11Kind==='revision'){
      q('#r11RevisionTitle').value=f.title||'REVISION HISTORY';
      q('#r11RevisionRows').value=(f.rows||[]).map(r=>r.join(' | ')).join('\n');
    }else if(m.r11Kind==='table'){
      q('#r11TableTitle').value=f.title||'TABLE';
      q('#r11TableHeaders').value=(f.headers||[]).join(' | ');
      q('#r11TableRows').value=(f.rows||[]).map(r=>r.join(' | ')).join('\n');
    }else if(m.r11Kind==='note'){
      q('#r11NoteTitle').value=f.title||'NOTE';q('#r11NoteText').value=f.text||'';
    }else if(m.r11Kind==='reference'){
      q('#r11RefPrimary').value=f.primary||'';q('#r11RefSecondary').value=f.secondary||'';
    }
    toast('Selected document loaded into the Documentation palette. Use Update Selected.');
  }

  function updateSelectedFromPalette(){
    const m=selectedMarkup();if(!m?.r11Doc)return toast('Select an R11 documentation object.');
    if(isMarkupLocked(m))return toast('Layer locked.');
    checkpoint();
    if(m.r11Kind==='titleBlock')m.r11Fields=titleFields();
    else if(m.r11Kind==='revision')m.r11Fields={title:(q('#r11RevisionTitle').value||'REVISION HISTORY').trim(),rows:parsePipeRows(q('#r11RevisionRows').value,4)};
    else if(m.r11Kind==='table'){
      const headers=(q('#r11TableHeaders').value||'ITEM | DESCRIPTION').split('|').map(s=>s.trim()).filter(Boolean);
      m.r11Fields={title:(q('#r11TableTitle').value||'TABLE').trim(),headers,rows:parsePipeRows(q('#r11TableRows').value,headers.length)};
    }else if(m.r11Kind==='note')m.r11Fields={title:(q('#r11NoteTitle').value||'NOTE').trim(),text:q('#r11NoteText').value||''};
    else if(m.r11Kind==='reference')m.r11Fields={...m.r11Fields,primary:q('#r11RefPrimary').value||'',secondary:q('#r11RefSecondary').value||''};
    else return toast('Legend/manifest content is refreshed with Refresh Selected Snapshot.');
    m.modified=stamp();render();updateProperties();toast('Selected documentation object updated.');
  }

  function r11Properties(){
    let box=q('#r11Props');
    if(!box){box=ce('details','r11Props');box.id='r11Props';box.open=true;q('#propEditor')?.appendChild(box)}
    const m=selectedMarkup();
    if(!m?.r11Doc||state.propertyMode!=='object'){box.classList.add('hidden');return}
    box.classList.remove('hidden');
    box.innerHTML=`<summary>R11 Documentation</summary>
      <div class="r11PropMeta"><b>${esc(m.r11Kind)}</b><span>${esc(m.subject||'Documentation')}</span></div>
      <div class="r11PropActions">
        <button id="r11EditSelected">Load in Documentation Palette</button>
        ${['legend','manifest'].includes(m.r11Kind)?'<button id="r11RefreshSnapshot">Refresh Snapshot</button>':''}
      </div>`;
    q('#r11EditSelected').onclick=loadSelectedIntoPalette;
    if(q('#r11RefreshSnapshot'))q('#r11RefreshSnapshot').onclick=refreshSelectedSnapshot;
    if(isMarkupLocked(m))box.querySelectorAll('button').forEach(el=>el.disabled=true);
  }

  const priorUpdateProperties=updateProperties;
  updateProperties=function(){priorUpdateProperties();r11Properties()};

  // -----------------------------------------------------------------------
  // PALETTE
  // -----------------------------------------------------------------------

  function openPalette(forceOpen=false){
    let p=q('#r11DocPalette');
    if(!p){
      p=ce('section','palette r11DocPalette hidden');p.id='r11DocPalette';p.dataset.floating='true';
      p.innerHTML=`<div class="paletteHead"><strong>Documentation</strong><span>R11 manual plan production</span><button data-r11-close>×</button></div>
      <div class="paletteBody">
        <div class="r11Notice">Documentation only. Legends/manifests are snapshots created or refreshed only when you explicitly request it.</div>

        <details open><summary>Title Block</summary>
          <div class="r11Grid2">
            <label>Company<input id="r11Company"></label><label>Drawing No.<input id="r11DrawingNo"></label>
            <label>Project<input id="r11Project"></label><label>Location<input id="r11Location"></label>
            <label>Client<input id="r11Client"></label><label>Road / Site<input id="r11Road"></label>
            <label>Plan No.<input id="r11PlanNo"></label><label>Sheet<input id="r11Sheet"></label>
            <label>Date<input id="r11Date"></label><label>Scale<input id="r11Scale" value="NTS"></label>
            <label>Prepared By<input id="r11Prepared"></label><label>Checked By<input id="r11Checked"></label>
            <label>Approved By<input id="r11Approved"></label><label>Permit<input id="r11Permit"></label>
          </div>
          <button class="r11Wide" id="r11InsertTitle">Insert Title Block</button>
        </details>

        <details><summary>Revision Table</summary>
          <label class="r11Field">Title<input id="r11RevisionTitle" value="REVISION HISTORY"></label>
          <label class="r11Field">Rows — REV | DATE | DESCRIPTION | BY<textarea id="r11RevisionRows" rows="5" placeholder="0 | 09/19/2026 | INITIAL ISSUE | JN"></textarea></label>
          <button class="r11Wide" id="r11InsertRevision">Insert Revision Table</button>
        </details>

        <details><summary>Manual Table</summary>
          <label class="r11Field">Title<input id="r11TableTitle" value="TABLE"></label>
          <label class="r11Field">Headers<input id="r11TableHeaders" value="ITEM | DESCRIPTION"></label>
          <label class="r11Field">Rows<textarea id="r11TableRows" rows="5" placeholder="1 | Example row"></textarea></label>
          <button class="r11Wide" id="r11InsertTable">Insert Table</button>
        </details>

        <details><summary>Legend / Manifest Snapshot</summary>
          <label class="r11Field">Legend title<input id="r11LegendTitle" value="LEGEND"></label>
          <label class="r11Field">Manifest title<input id="r11ManifestTitle" value="MANIFEST"></label>
          <div class="r11Grid2"><button id="r11InsertLegend">Insert Legend Snapshot</button><button id="r11InsertManifest">Insert Manifest Snapshot</button></div>
          <button class="r11Wide" id="r11RefreshSelected">Refresh Selected Snapshot</button>
          <small>Counts/entries reflect visible placed objects only at the moment you click Insert or Refresh. Device runs count as runs, not inferred cone quantities.</small>
        </details>

        <details><summary>Sequential Number Stamper</summary>
          <div class="r11Grid2">
            <label>Start<input id="r11StampStart" type="number" value="1"></label><label>Increment<input id="r11StampIncrement" type="number" value="1"></label>
            <label>Prefix<input id="r11StampPrefix" placeholder="D-"></label><label>Suffix<input id="r11StampSuffix"></label>
            <label>Shape<select id="r11StampShape"><option value="circle">Circle</option><option value="square">Square</option><option value="plain">Plain</option></select></label>
          </div>
          <button class="r11Wide" id="r11StartStamper">Start Click Stamper</button>
        </details>

        <details><summary>Continuation / Detail References</summary>
          <label class="r11Field">Primary<input id="r11RefPrimary" value="SEE SHEET 2"></label>
          <label class="r11Field">Secondary<input id="r11RefSecondary" value="FOR CONTINUATION"></label>
          <div class="r11Grid3"><button data-r11-ref="continuation">Continuation</button><button data-r11-ref="detail">Detail</button><button data-r11-ref="match">Match Line</button></div>
        </details>

        <details><summary>Plan Note</summary>
          <label class="r11Field">Title<input id="r11NoteTitle" value="NOTE"></label>
          <label class="r11Field">Text<textarea id="r11NoteText" rows="5"></textarea></label>
          <button class="r11Wide" id="r11InsertNote">Insert Note</button>
        </details>

        <div class="toolSection"><b>Edit Selected Documentation</b>
          <div class="r11Grid2"><button id="r11LoadSelected">Load Selected</button><button id="r11UpdateSelected">Update Selected</button></div>
        </div>
      </div>`;
      document.body.appendChild(p);
      p.querySelector('[data-r11-close]').onclick=()=>p.classList.add('hidden');
      q('#r11InsertTitle').onclick=insertTitleBlock;
      q('#r11InsertRevision').onclick=insertRevision;
      q('#r11InsertTable').onclick=insertTable;
      q('#r11InsertLegend').onclick=insertLegend;
      q('#r11InsertManifest').onclick=insertManifest;
      q('#r11RefreshSelected').onclick=refreshSelectedSnapshot;
      q('#r11StartStamper').onclick=beginNumberStamper;
      p.querySelectorAll('[data-r11-ref]').forEach(b=>b.onclick=()=>insertReference(b.dataset.r11Ref));
      q('#r11InsertNote').onclick=insertNote;
      q('#r11LoadSelected').onclick=loadSelectedIntoPalette;
      q('#r11UpdateSelected').onclick=updateSelectedFromPalette;
    }
    if(forceOpen)p.classList.remove('hidden');else p.classList.toggle('hidden');
  }

  function installUi(){
    const small=q('.brand small');if(small)small.textContent='0.1 R11';
    document.title='NXT Gen Plans 0.1 R11';
    const pals=q('.paletteButtons');
    if(pals&&!q('#r11DocBtn')){
      const b=ce('button','r11DocButton');b.id='r11DocBtn';b.textContent='Docs';
      b.title='R11 title blocks, revisions, tables, legend/manifest snapshots and plan references';
      b.onclick=()=>openPalette(false);pals.appendChild(b);
    }
  }

  installUi();

  window.NXT_R11={
    openPalette,
    insertLegend,
    insertManifest,
    refreshSelectedSnapshot
  };

  console.info('NXT Gen Plans R11 manual plan documentation loaded.');
})();
