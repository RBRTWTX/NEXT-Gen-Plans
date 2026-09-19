'use strict';
/* NXT Gen Plans 0.1 R11.3 — Base Plan Drawing Stack\n Baseline: Git a7328f2e (cleanup) */
(()=>{
 if(!window.NXT_R11_2||!window.__NXT_R11_2_STABILIZATION||!window.NXT_R11_1||!window.NXT_R10||!window.NXT_R9||!window.NXT_R8_1||!window.NXT_R7||!window.NXT_R6){console.error('R11.3 requires the accepted R11.2 baseline.');return}
 if(window.__NXT_R11_3_BASE_PLAN_STACK)return;
 window.__NXT_R11_3_BASE_PLAN_STACK=true;
 const q=s=>document.querySelector(s);
 function ensureBasePlanLayer(){const svg=q('#pageSvg'),markup=q('#markupLayer');if(!svg||!markup)return null;let base=q('#basePlanLayer');if(!base){base=document.createElementNS('http://www.w3.org/2000/svg','g');base.id='basePlanLayer';svg.insertBefore(base,markup)}else if(base.nextElementSibling!==markup)svg.insertBefore(base,markup);return base}
 function isRoad(m){return !!(m&&(m.r6Road||m.r5RoadPath||m.r4Road))}
 function isBasePlanObject(m){return !!(m&&(isRoad(m)||m.r6Intersection||m.r5Mask||m.layer==='pavement'||m.r5Marking))}
 function baseIds(){return new Set((currentPage()?.markups||[]).filter(isBasePlanObject).map(m=>m.id))}
 function isLegacyRoadDecoration(el,hasRoads){if(!hasRoads||!el||el.dataset?.id)return false;if(el.classList?.contains('r6RoadMarking')||el.classList?.contains('r6TempStriping'))return true;if(el.tagName?.toLowerCase()==='line'&&el.getAttribute('pointer-events')==='none'&&!el.classList?.length)return true;return false}
 function organizeDrawingStack(){const base=ensureBasePlanLayer(),markup=q('#markupLayer');if(!base||!markup)return;base.replaceChildren();const ids=baseIds(),hasRoads=(currentPage()?.markups||[]).some(isRoad);for(const el of [...markup.children]){const id=el.dataset?.id;if((id&&ids.has(id))||isLegacyRoadDecoration(el,hasRoads))base.appendChild(el)}}
 const priorRenderMarkups=renderMarkups;
 renderMarkups=function(){priorRenderMarkups();organizeDrawingStack()};
 const priorRender=render;
 render=function(){const result=priorRender();organizeDrawingStack();return result};
 const cm=q('#contextMenu');if(cm)cm.addEventListener('click',e=>{const cmd=e.target?.dataset?.cmd;if(cmd!=='front'&&cmd!=='back')return;const m=selectedMarkup();if(!isBasePlanObject(m))return;e.preventDefault();e.stopImmediatePropagation();cm.classList.add('hidden');toast('Base-plan objects stay below traffic-control and markup objects.')},true);
 const small=q('.brand small');if(small)small.textContent='0.1 R11.3';document.title='NXT Gen Plans 0.1 R11.3';
 ensureBasePlanLayer();render();
 window.NXT_R11_3={ensureBasePlanLayer,organizeDrawingStack,isBasePlanObject};
 console.info('NXT Gen Plans R11.3 base-plan drawing stack loaded.');
})();
