'use strict';
/*
 NXT Gen Plans 0.1 R11.2 — Pre-R12 Stabilization
 Baseline: Git 2445585f ("fix r11.1")
 Loads AFTER r11-1-responsive-text.js.

 Fixes only:
 1) Restores/guarantees the R4 "design" layer after old-project load/undo.
 2) Makes R9 duplicates independent of their source group by regenerating r9GroupId.

 No feature additions. No cloud/map integration. No automated TCP design.
*/
(() => {
  if(!window.NXT_R11_1 || !window.__NXT_R11_1_RESPONSIVE_TEXT ||
     !window.NXT_R11 || !window.NXT_R10 || !window.NXT_R9 ||
     !window.NXT_R8_1){
    console.error('R11.2 requires the accepted R11.1 baseline.');
    return;
  }
  if(window.__NXT_R11_2_STABILIZATION)return;
  window.__NXT_R11_2_STABILIZATION=true;

  const DESIGN_LAYER={id:'design',name:'Plan Design',visible:true,locked:false};

  function ensureDesignLayer(){
    if(!Array.isArray(state.layers))state.layers=[];
    if(!state.layers.some(l=>l.id==='design')){
      // Keep Default first; insert Plan Design after Measurements when possible.
      const idx=state.layers.findIndex(l=>l.id==='measurements');
      if(idx>=0)state.layers.splice(idx+1,0,{...DESIGN_LAYER});
      else state.layers.push({...DESIGN_LAYER});
    }
    if(!state.layers.some(l=>l.id===state.activeLayer))state.activeLayer='default';
  }

  // R8.1 already restores the other required layers. R11.2 adds the one
  // historical R4 layer omitted from that contract.
  const priorRender=render;
  render=function(){
    ensureDesignLayer();
    return priorRender();
  };

  // Single-object duplicate: do not silently join the duplicate to the source group.
  const priorDuplicateSelected=duplicateSelected;
  duplicateSelected=function(){
    const source=selectedMarkup();
    const grouped=!!source?.r9GroupId;
    const result=priorDuplicateSelected();
    const clone=selectedMarkup();
    if(grouped&&clone&&clone!==source&&clone.r9GroupId){
      clone.r9GroupId='grp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);
      clone.modified=new Date().toISOString();
      render();
    }
    return result;
  };

  // R9's Duplicate Selection handler is closure-local. Observe the command in
  // capture phase, allow the accepted R9 handler to run, then isolate the clone
  // group IDs on the next task. No handler is replaced.
  document.addEventListener('click',e=>{
    if(e.target?.id!=='r9DuplicateMulti')return;
    setTimeout(()=>{
      const clones=window.NXT_R9?.selectedObjects?.()||[];
      if(!clones.length)return;
      const groupMap=new Map();
      let changed=false;
      for(const m of clones){
        if(!m.r9GroupId)continue;
        if(!groupMap.has(m.r9GroupId)){
          groupMap.set(
            m.r9GroupId,
            'grp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)
          );
        }
        m.r9GroupId=groupMap.get(m.r9GroupId);
        m.modified=new Date().toISOString();
        changed=true;
      }
      if(changed)render();
    },0);
  },true);

  // Repair the current session immediately.
  ensureDesignLayer();

  window.NXT_R11_2={
    ensureDesignLayer,
    audit(){
      const design=state.layers.some(l=>l.id==='design');
      const known=[
        'default','comments','traffic','measurements','design',
        'roadway','pavement','trafficSigns','trafficDevices',
        'workZones','tempTraffic','intersectionDetails',
        'sheetProduction','printRegions'
      ];
      return{
        designLayer:design,
        missingKnownLayers:known.filter(id=>!state.layers.some(l=>l.id===id)),
        pages:state.pages.length,
        markups:state.pages.reduce((n,p)=>n+(p.markups?.length||0),0)
      };
    }
  };

  console.info('NXT Gen Plans R11.2 stabilization loaded.');
})();
