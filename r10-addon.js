'use strict';
/*
 NXT Gen Plans 0.1 R10 — Local Scratchpad / Libraries
 Baseline: Git 2ecfbe2a (r9)
 Loads AFTER r9-addon.js.

 Fully local/offline:
 - folder-based scratchpad
 - save one object or R9 multi-selection
 - reusable manual assemblies
 - local custom symbol import
 - saved appearance/style library
 - JSON backup/export/import
 - optional import of existing R8 templates
 - context-menu "Add to Scratchpad"

 No cloud. No live maps. No automated TCP layout.
*/
(() => {
  if(!window.NXT_R9 || !window.__NXT_R9_MANUAL_GEOMETRY ||
     !window.NXT_R8_1 || !window.__NXT_R8_1_UNIVERSAL_CANVAS){
    console.error('R10 requires the accepted R9 baseline.');
    return;
  }
  if(window.__NXT_R10_LOCAL_LIBRARY)return;
  window.__NXT_R10_LOCAL_LIBRARY=true;

  const q=s=>document.querySelector(s);
  const ce=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.innerHTML=h;return n};
  const stamp=()=>new Date().toISOString();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const STORE_KEY='nxt_r10_local_library_v1';
  const DEFAULT_FOLDERS=[
    ['general','General'],
    ['traffic','Traffic Control'],
    ['details','Details'],
    ['titleblocks','Title Blocks'],
    ['notes','Notes'],
    ['symbols','Custom Symbols']
  ];

  const APPEARANCE_FIELDS=[
    'stroke','width','fill','fillOpacity','dash','hatch','hatchColor','hatchSpacing',
    'opacity','rotation','font','fontSize','textColor','textAlign','bold','italic'
  ];

  const R10={
    data:null,
    folder:'general',
    search:'',
    pendingItem:null,
    placementMode:'preserve'
  };

  function page(){return currentPage()}
  function deep(v){return JSON.parse(JSON.stringify(v))}
  function newId(prefix='lib'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
  function selectedSingle(){return selectedMarkup()}
  function multiSelected(){
    try{return window.NXT_R9.selectedObjects?.()||[]}catch{return[]}
  }

  function defaultData(){
    return{
      format:'NXT Gen Plans Local Library',
      version:1,
      created:stamp(),
      modified:stamp(),
      folders:DEFAULT_FOLDERS.map(([id,name])=>({id,name})),
      items:[],
      styles:[]
    };
  }

  function normalizeData(d){
    if(!d||typeof d!=='object')d=defaultData();
    if(!Array.isArray(d.folders))d.folders=[];
    if(!Array.isArray(d.items))d.items=[];
    if(!Array.isArray(d.styles))d.styles=[];
    for(const [id,name] of DEFAULT_FOLDERS){
      if(!d.folders.some(f=>f.id===id))d.folders.push({id,name});
    }
    d.format='NXT Gen Plans Local Library';
    d.version=1;
    d.modified=d.modified||stamp();
    return d;
  }

  function loadData(){
    try{
      const raw=localStorage.getItem(STORE_KEY);
      R10.data=normalizeData(raw?JSON.parse(raw):defaultData());
    }catch(err){
      console.warn('R10 library load failed',err);
      R10.data=defaultData();
    }
  }

  function persist(){
    R10.data.modified=stamp();
    try{
      localStorage.setItem(STORE_KEY,JSON.stringify(R10.data));
      return true;
    }catch(err){
      console.error(err);
      toast('Local library storage is full. Export the library JSON and remove large items.');
      return false;
    }
  }

  loadData();

  function folderById(id){return R10.data.folders.find(f=>f.id===id)||null}
  function currentFolder(){return folderById(R10.folder)||R10.data.folders[0]||null}

  // -----------------------------------------------------------------------
  // LIBRARY ELIGIBILITY / RELATIONAL SAFETY
  // -----------------------------------------------------------------------

  function relationalUnsupported(m){
    return !!(m?.r7Attached||m?.r8Station||m?.r6Intersection);
  }

  function selectedForSave(){
    const many=multiSelected();
    if(many.length)return many;
    const one=selectedSingle();
    return one?[one]:[];
  }

  function validateBundle(items){
    if(!items.length)return'No object is selected.';
    const bad=items.find(relationalUnsupported);
    if(bad)return`${bad.subject||bad.type||'Selected object'} is road/relationship-attached and cannot be stored as a free reusable Scratchpad object.`;
    return null;
  }

  function unionBounds(items){
    const bs=items.map(m=>bounds(m)).filter(Boolean);
    if(!bs.length)return{x:0,y:0,w:1,h:1};
    const x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y));
    const r=Math.max(...bs.map(b=>b.x+b.w)),bt=Math.max(...bs.map(b=>b.y+b.h));
    return{x,y,w:r-x,h:bt-y};
  }

  function sanitizeStoredObject(m){
    const c=deep(m);
    delete c.locked;
    delete c.created;
    delete c.modified;
    return c;
  }

  function makeBundle(name,items,folderId){
    const b=unionBounds(items);
    const center={x:b.x+b.w/2,y:b.y+b.h/2};
    const objects=items.map(sanitizeStoredObject);
    return{
      id:newId('item'),
      folderId,
      name:name||'Reusable Assembly',
      kind:objects.length===1?'object':'assembly',
      created:stamp(),
      modified:stamp(),
      center,
      bounds:b,
      objects
    };
  }

  function saveSelectionToScratchpad(){
    const items=selectedForSave(),err=validateBundle(items);
    if(err)return toast(err);

    const def=items.length===1?(items[0].subject||items[0].type||'Reusable Object'):`Assembly (${items.length} objects)`;
    const name=(prompt('Scratchpad item name:',def)||'').trim();
    if(!name)return;

    const folder=currentFolder();if(!folder)return toast('Create a Scratchpad folder first.');
    const item=makeBundle(name,items,folder.id);
    R10.data.items.push(item);
    if(persist()){renderLibrary();toast(`Saved "${name}" to ${folder.name}.`)}
  }

  // -----------------------------------------------------------------------
  // ITEM PLACEMENT
  // -----------------------------------------------------------------------

  function remapRelations(clones,idMap,groupMap){
    for(const m of clones){
      if(m.r7RoadId&&idMap.has(m.r7RoadId))m.r7RoadId=idMap.get(m.r7RoadId);
      if(m.r8RoadId&&idMap.has(m.r8RoadId))m.r8RoadId=idMap.get(m.r8RoadId);
      if(Array.isArray(m.roads))m.roads=m.roads.map(id=>idMap.get(id)||id);
      if(m.r9GroupId){
        if(!groupMap.has(m.r9GroupId))groupMap.set(m.r9GroupId,newId('grp'));
        m.r9GroupId=groupMap.get(m.r9GroupId);
      }
    }
  }

  function targetLayerFor(m){
    if(R10.placementMode==='active')return state.activeLayer||'default';
    if(state.layers.some(l=>l.id===m.layer))return m.layer;
    return state.activeLayer||'default';
  }

  async function hydrateSign(m){
    if(m.type!=='trafficSign'||m.assetData||!m.assetPath)return;
    try{
      const asset=await fetchSignAssetData({
        code:m.signCode||'SIGN',
        name:m.signName||m.subject||'Sign',
        svg:m.assetPath
      });
      m.assetData=asset.data;
      m.assetAspect=asset.aspect||m.assetAspect||1;
    }catch(err){console.warn('R10 sign hydration failed',err)}
  }

  async function placeItemAt(item,p){
    if(!item?.objects?.length)return toast('Scratchpad item is empty.');

    const layers=[...new Set(item.objects.map(targetLayerFor))];
    const locked=layers.find(id=>state.layers.find(l=>l.id===id)?.locked);
    if(locked)return toast(`${state.layers.find(l=>l.id===locked)?.name||locked} layer is locked.`);

    checkpoint();

    const idMap=new Map(),groupMap=new Map(),clones=[];
    for(const original of item.objects){
      const c=deep(original),oldId=c.id;
      c.id=uid();idMap.set(oldId,c.id);
      c.layer=targetLayerFor(c);
      c.created=c.modified=stamp();
      clones.push(c);
    }

    remapRelations(clones,idMap,groupMap);

    const cx=Number(item.center?.x)||0,cy=Number(item.center?.y)||0;
    const dx=p.x-cx,dy=p.y-cy;

    for(const c of clones){
      await hydrateSign(c);
      const orig=deep(c);
      translateMarkup(c,dx,dy,orig);
    }

    page().markups.push(...clones);
    state.selected=clones.length===1?clones[0].id:null;
    if(clones.length>1){
      window.NXT_R9.clearMulti?.();
    }
    render();setTool('select');updateProperties();
    toast(`Placed "${item.name}".`);
  }

  const svg=q('#pageSvg');
  svg.addEventListener('pointerdown',e=>{
    if(state.tool!=='r10PlaceLibrary'||e.button!==0)return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);

  svg.addEventListener('click',e=>{
    if(state.tool!=='r10PlaceLibrary'||!R10.pendingItem)return;
    e.preventDefault();e.stopImmediatePropagation();
    const item=R10.pendingItem;R10.pendingItem=null;
    const p=window.NXT_R9.snapPoint?window.NXT_R9.snapPoint(svgPoint(e)):svgPoint(e);
    placeItemAt(item,p).catch(err=>{console.error(err);toast('Scratchpad placement failed.')});
  },true);

  function armPlace(id){
    const item=R10.data.items.find(x=>x.id===id);if(!item)return;
    R10.pendingItem=item;
    state.tool='r10PlaceLibrary';
    q('#statusTool').textContent=`Place Scratchpad — ${item.name}`;
    q('#canvasScroller').style.cursor='crosshair';
    toast('Click the insertion point.');
  }

  // -----------------------------------------------------------------------
  // FOLDERS
  // -----------------------------------------------------------------------

  function createFolder(){
    const name=(prompt('New Scratchpad folder name:','New Folder')||'').trim();if(!name)return;
    const folder={id:newId('folder'),name};R10.data.folders.push(folder);R10.folder=folder.id;
    if(persist())renderLibrary();
  }

  function renameFolder(){
    const f=currentFolder();if(!f)return;
    const name=(prompt('Rename folder:',f.name)||'').trim();if(!name)return;
    f.name=name;if(persist())renderLibrary();
  }

  function deleteFolder(){
    const f=currentFolder();if(!f)return;
    if(['general','traffic','details','titleblocks','notes','symbols'].includes(f.id))return toast('Built-in library folders cannot be deleted.');
    const count=R10.data.items.filter(x=>x.folderId===f.id).length;
    if(!confirm(`Delete folder "${f.name}"? ${count} item(s) will be moved to General.`))return;
    R10.data.items.forEach(x=>{if(x.folderId===f.id)x.folderId='general'});
    R10.data.folders=R10.data.folders.filter(x=>x.id!==f.id);R10.folder='general';
    if(persist())renderLibrary();
  }

  // -----------------------------------------------------------------------
  // CUSTOM SYMBOL IMPORT
  // -----------------------------------------------------------------------

  let symbolInput=null;

  function ensureSymbolInput(){
    if(symbolInput)return symbolInput;
    symbolInput=document.createElement('input');
    symbolInput.type='file';symbolInput.accept='image/png,image/jpeg,image/webp,image/svg+xml';symbolInput.hidden=true;
    document.body.appendChild(symbolInput);
    symbolInput.onchange=async e=>{
      const f=e.target.files?.[0];e.target.value='';if(!f)return;
      try{
        const data=await fileDataUrl(f),aspect=await imageAspect(data);
        const w=90,h=Math.max(24,Math.min(110,w/(aspect||1)));
        const obj={
          id:'library_symbol',type:'stamp',layer:'default',
          x:-w/2,y:-h/2,w,h,text:f.name.replace(/\.[^.]+$/,''),
          assetData:data,assetAspect:aspect||1,
          subject:f.name.replace(/\.[^.]+$/,''),comment:'R10 local custom symbol',status:'Open',
          stroke:'#666',width:0,fill:'#fff',fillOpacity:0,dash:'',hatch:'none',opacity:1,rotation:0
        };
        const folder=currentFolder()||folderById('symbols');
        const item={
          id:newId('item'),folderId:folder?.id||'symbols',
          name:f.name.replace(/\.[^.]+$/,''),kind:'symbol',created:stamp(),modified:stamp(),
          center:{x:0,y:0},bounds:{x:-w/2,y:-h/2,w,h},previewData:data,objects:[obj]
        };
        R10.data.items.push(item);
        if(persist()){renderLibrary();toast('Custom symbol added to local Scratchpad.')}
      }catch(err){console.error(err);toast('Custom symbol import failed.')}
    };
    return symbolInput;
  }

  function importSymbol(){ensureSymbolInput().click()}

  // -----------------------------------------------------------------------
  // LOCAL STYLE LIBRARY
  // -----------------------------------------------------------------------

  function captureAppearance(m){
    const style={};
    for(const k of APPEARANCE_FIELDS)if(m[k]!==undefined)style[k]=deep(m[k]);
    return style;
  }

  function saveStyle(){
    const m=selectedSingle()||multiSelected()[0];if(!m)return toast('Select an object first.');
    const name=(prompt('Style name:',(m.subject||m.type||'Object')+' Style')||'').trim();if(!name)return;
    R10.data.styles.push({id:newId('style'),name,created:stamp(),appearance:captureAppearance(m)});
    if(persist())renderStyles();
  }

  function styleTargets(){
    const many=multiSelected();if(many.length)return many;
    const one=selectedSingle();return one?[one]:[];
  }

  function applyStyle(id){
    const st=R10.data.styles.find(x=>x.id===id);if(!st)return;
    const targets=styleTargets();if(!targets.length)return toast('Select one or more objects first.');
    if(targets.some(isMarkupLocked))return toast('One or more selected objects are on locked layers.');
    checkpoint();
    for(const m of targets){Object.assign(m,deep(st.appearance));m.modified=stamp()}
    render();updateProperties();toast(`Applied "${st.name}".`);
  }

  function setStyleDefault(id){
    const st=R10.data.styles.find(x=>x.id===id);if(!st)return;
    Object.assign(state.preset,deep(st.appearance));
    toast(`"${st.name}" is now the current drawing appearance.`);
  }

  function deleteStyle(id){
    R10.data.styles=R10.data.styles.filter(x=>x.id!==id);if(persist())renderStyles();
  }

  // -----------------------------------------------------------------------
  // IMPORT LEGACY R8 TEMPLATES
  // -----------------------------------------------------------------------

  function importR8Templates(){
    let list=[];
    try{list=JSON.parse(localStorage.getItem('nxt_r8_manual_templates')||'[]')}catch{}
    if(!Array.isArray(list)||!list.length)return toast('No R8 templates were found.');

    let folder=R10.data.folders.find(f=>f.name==='Legacy R8 Templates');
    if(!folder){folder={id:newId('folder'),name:'Legacy R8 Templates'};R10.data.folders.push(folder)}

    let added=0;
    for(const t of list){
      if(!Array.isArray(t.objects)||!t.objects.length)continue;
      const signature='r8:'+String(t.id||t.name||'');
      if(R10.data.items.some(x=>x.legacySignature===signature))continue;
      const b=unionBounds(t.objects);
      R10.data.items.push({
        id:newId('item'),folderId:folder.id,name:t.name||'R8 Template',kind:t.objects.length===1?'object':'assembly',
        created:stamp(),modified:stamp(),legacySignature:signature,
        center:t.center||{x:b.x+b.w/2,y:b.y+b.h/2},bounds:b,
        objects:t.objects.map(sanitizeStoredObject)
      });
      added++;
    }
    R10.folder=folder.id;
    if(persist()){renderLibrary();toast(`${added} R8 template${added===1?'':'s'} imported.`)}
  }

  // -----------------------------------------------------------------------
  // JSON BACKUP / IMPORT
  // -----------------------------------------------------------------------

  function exportLibrary(){
    const out=deep(R10.data);
    out.exported=stamp();
    download(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}),'NXT_Gen_Plans_Local_Library.json');
    toast('Local library JSON exported.');
  }

  let importInput=null;
  function ensureImportInput(){
    if(importInput)return importInput;
    importInput=document.createElement('input');importInput.type='file';importInput.accept='application/json,.json';importInput.hidden=true;
    document.body.appendChild(importInput);
    importInput.onchange=async e=>{
      const f=e.target.files?.[0];e.target.value='';if(!f)return;
      try{
        const incoming=normalizeData(JSON.parse(await f.text()));
        if(incoming.format!=='NXT Gen Plans Local Library')return toast('That file is not an NXT local library.');

        const replace=confirm('Replace the current local library?\n\nOK = Replace\nCancel = Merge');
        if(replace){
          R10.data=incoming;
        }else{
          const folderMap=new Map();
          for(const f2 of incoming.folders){
            let local=R10.data.folders.find(x=>x.name.toLowerCase()===String(f2.name).toLowerCase());
            if(!local){local={id:newId('folder'),name:f2.name};R10.data.folders.push(local)}
            folderMap.set(f2.id,local.id);
          }
          for(const item of incoming.items||[]){
            const c=deep(item);c.id=newId('item');c.folderId=folderMap.get(item.folderId)||'general';c.created=c.modified=stamp();R10.data.items.push(c);
          }
          for(const st of incoming.styles||[]){
            const c=deep(st);c.id=newId('style');c.created=stamp();R10.data.styles.push(c);
          }
        }
        R10.folder='general';if(persist()){renderLibrary();renderStyles();toast('Local library imported.')}
      }catch(err){console.error(err);toast('Library import failed.')}
    };
    return importInput;
  }
  function importLibrary(){ensureImportInput().click()}

  // -----------------------------------------------------------------------
  // ITEM MANAGEMENT
  // -----------------------------------------------------------------------

  function renameItem(id){
    const item=R10.data.items.find(x=>x.id===id);if(!item)return;
    const name=(prompt('Rename Scratchpad item:',item.name)||'').trim();if(!name)return;
    item.name=name;item.modified=stamp();if(persist())renderLibrary();
  }

  function deleteItem(id){
    const item=R10.data.items.find(x=>x.id===id);if(!item)return;
    if(!confirm(`Delete "${item.name}" from the local Scratchpad?`))return;
    R10.data.items=R10.data.items.filter(x=>x.id!==id);if(persist())renderLibrary();
  }

  function moveItem(id,folderId){
    const item=R10.data.items.find(x=>x.id===id);if(!item||!folderById(folderId))return;
    item.folderId=folderId;item.modified=stamp();if(persist())renderLibrary();
  }

  function itemIcon(item){
    if(item.previewData)return`<img class="r10Thumb" src="${item.previewData}" alt="">`;
    if(item.kind==='assembly')return'<span class="r10Glyph">▦</span>';
    if(item.objects?.[0]?.type==='trafficSign')return'<span class="r10Glyph">◇</span>';
    if(item.objects?.[0]?.type==='device')return'<span class="r10Glyph">▲</span>';
    if(item.objects?.[0]?.r9Path)return'<span class="r10Glyph">⌁</span>';
    return'<span class="r10Glyph">□</span>';
  }

  function renderFolderSelect(){
    const sel=q('#r10FolderSelect');if(!sel)return;
    const current=R10.folder;
    sel.innerHTML=R10.data.folders.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('');
    if(R10.data.folders.some(f=>f.id===current))sel.value=current;
    else{R10.folder=R10.data.folders[0]?.id||'general';sel.value=R10.folder}
  }

  function renderLibrary(){
    renderFolderSelect();
    const box=q('#r10Items');if(!box)return;
    const needle=R10.search.toLowerCase().trim();
    const items=R10.data.items.filter(x=>x.folderId===R10.folder&&(!needle||String(x.name).toLowerCase().includes(needle)));
    box.innerHTML=items.length?items.map(item=>`
      <div class="r10Item" data-r10-item="${item.id}">
        ${itemIcon(item)}
        <div class="r10ItemMeta"><b>${esc(item.name)}</b><small>${item.objects?.length||0} object${(item.objects?.length||0)===1?'':'s'} · ${esc(item.kind||'object')}</small></div>
        <button data-r10-place="${item.id}" title="Place">Place</button>
        <button data-r10-more="${item.id}" title="Rename">✎</button>
        <button data-r10-delete="${item.id}" title="Delete">×</button>
      </div>`).join(''):'<div class="r10Empty">No items in this folder.</div>';

    box.querySelectorAll('[data-r10-place]').forEach(b=>b.onclick=()=>armPlace(b.dataset.r10Place));
    box.querySelectorAll('[data-r10-more]').forEach(b=>b.onclick=()=>renameItem(b.dataset.r10More));
    box.querySelectorAll('[data-r10-delete]').forEach(b=>b.onclick=()=>deleteItem(b.dataset.r10Delete));

    // Double-click anywhere on a row to arm placement.
    box.querySelectorAll('[data-r10-item]').forEach(row=>row.ondblclick=e=>{
      if(e.target.closest('button'))return;armPlace(row.dataset.r10Item);
    });
  }

  function renderStyles(){
    const box=q('#r10Styles');if(!box)return;
    box.innerHTML=R10.data.styles.length?R10.data.styles.map(st=>`
      <div class="r10StyleRow">
        <span>${esc(st.name)}</span>
        <button data-r10-style-apply="${st.id}">Apply</button>
        <button data-r10-style-default="${st.id}">Default</button>
        <button data-r10-style-delete="${st.id}">×</button>
      </div>`).join(''):'<div class="r10Empty">No saved styles.</div>';
    box.querySelectorAll('[data-r10-style-apply]').forEach(b=>b.onclick=()=>applyStyle(b.dataset.r10StyleApply));
    box.querySelectorAll('[data-r10-style-default]').forEach(b=>b.onclick=()=>setStyleDefault(b.dataset.r10StyleDefault));
    box.querySelectorAll('[data-r10-style-delete]').forEach(b=>b.onclick=()=>deleteStyle(b.dataset.r10StyleDelete));
  }

  // -----------------------------------------------------------------------
  // PALETTE / CONTEXT MENU
  // -----------------------------------------------------------------------

  function openPalette(){
    let p=q('#r10LibraryPalette');
    if(!p){
      p=ce('section','palette r10LibraryPalette hidden');p.id='r10LibraryPalette';p.dataset.floating='true';
      p.innerHTML=`<div class="paletteHead"><strong>Local Library</strong><span>R10 Scratchpad · offline</span><button data-r10-close>×</button></div>
      <div class="paletteBody">
        <div class="r10Notice">Stored only in this NXT browser profile unless you export the library JSON. No cloud or online account is used.</div>

        <div class="toolSection"><b>Scratchpad</b>
          <div class="r10FolderRow">
            <select id="r10FolderSelect"></select>
            <button id="r10FolderAdd" title="New folder">+</button>
            <button id="r10FolderRename" title="Rename folder">✎</button>
            <button id="r10FolderDelete" title="Delete folder">×</button>
          </div>
          <input id="r10Search" class="r10Search" placeholder="Search this folder">
          <div class="r10PlaceMode"><label>Place using<select id="r10PlacementMode"><option value="preserve">Saved layers</option><option value="active">Current active layer</option></select></label></div>
          <div class="r10Grid2"><button id="r10SaveSelection">Add Selection</button><button id="r10ImportSymbol">Import Symbol</button></div>
          <div id="r10Items" class="r10Items"></div>
        </div>

        <div class="toolSection"><b>Saved Styles</b>
          <button class="r10Wide" id="r10SaveStyle">Save Selected Appearance</button>
          <div id="r10Styles" class="r10Styles"></div>
        </div>

        <div class="toolSection"><b>Library Transfer</b>
          <div class="r10Grid2"><button id="r10Export">Export JSON</button><button id="r10Import">Import JSON</button></div>
          <button class="r10Wide" id="r10ImportR8">Import Existing R8 Templates</button>
          <small>JSON export is the offline backup/transfer format for Scratchpad folders, objects and styles.</small>
        </div>
      </div>`;
      document.body.appendChild(p);

      p.querySelector('[data-r10-close]').onclick=()=>p.classList.add('hidden');
      q('#r10FolderSelect').onchange=e=>{R10.folder=e.target.value;renderLibrary()};
      q('#r10FolderAdd').onclick=createFolder;
      q('#r10FolderRename').onclick=renameFolder;
      q('#r10FolderDelete').onclick=deleteFolder;
      q('#r10Search').oninput=e=>{R10.search=e.target.value;renderLibrary()};
      q('#r10PlacementMode').onchange=e=>R10.placementMode=e.target.value;
      q('#r10SaveSelection').onclick=saveSelectionToScratchpad;
      q('#r10ImportSymbol').onclick=importSymbol;
      q('#r10SaveStyle').onclick=saveStyle;
      q('#r10Export').onclick=exportLibrary;
      q('#r10Import').onclick=importLibrary;
      q('#r10ImportR8').onclick=importR8Templates;
    }
    q('#r10PlacementMode').value=R10.placementMode;
    renderLibrary();renderStyles();
    p.classList.toggle('hidden');
  }

  function installContext(){
    const cm=q('#contextMenu');if(!cm||q('#r10ContextScratch'))return;
    const hr=document.createElement('hr'),b=document.createElement('button');
    b.id='r10ContextScratch';b.textContent='Add to Scratchpad';
    b.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();cm.classList.add('hidden');saveSelectionToScratchpad();
    });
    cm.insertBefore(hr,cm.lastElementChild);
    cm.insertBefore(b,cm.lastElementChild);
  }

  function installUi(){
    const small=q('.brand small');if(small)small.textContent='0.1 R10';
    document.title='NXT Gen Plans 0.1 R10';
    const pals=q('.paletteButtons');
    if(pals&&!q('#r10LibraryBtn')){
      const b=ce('button','r10LibraryButton');b.id='r10LibraryBtn';b.textContent='Library';
      b.title='R10 local Scratchpad, reusable assemblies, symbols and styles';
      b.onclick=openPalette;pals.appendChild(b);
    }
    installContext();
  }

  // Escape cancels pending item placement.
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&state.tool==='r10PlaceLibrary'){
      R10.pendingItem=null;setTool('select');
    }
  },true);

  installUi();

  window.NXT_R10={
    openPalette,
    saveSelectionToScratchpad,
    armPlace,
    exportLibrary,
    importLibrary,
    data:()=>R10.data
  };

  console.info('NXT Gen Plans R10 local Scratchpad/library loaded.');
})();
