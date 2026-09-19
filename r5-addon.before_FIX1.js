'use strict';
/*
 NXT Gen Plans 0.1 R5 — Advanced Traffic-Control Design
 Additive to accepted R4. Does not replace app.js, r4-addon.js, standards.js,
 MUTCD assets, or START_NXT_GEN_PLANS.bat.
*/
(() => {
  if(!window.NXT_R4){
    console.error('R5 requires the accepted R4 plan-creation module.');
    return;
  }

  const q=s=>document.querySelector(s);
  const ce=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.innerHTML=h;return n};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stamp=()=>new Date().toISOString();

  const R5={
    road:{lanes:2,laneWidthFt:12,shoulderFt:0,center:'doubleYellow',edge:true},
    marking:{kind:'dashWhite',widthFt:.5},
    zone:{kind:'workArea'},
    snap:true,
    gridFt:5,
    pending:null,
    roadDraft:null
  };

  function ensureDesignLayer(){
    if(!state.layers.some(l=>l.id==='design')) state.layers.push({id:'design',name:'Plan Design',visible:true,locked:false});
  }
  ensureDesignLayer();

  function feetToPts(ft){
    const p=currentPage();
    if(p?.scaleFeetPerInch) return ft/p.scaleFeetPerInch*72;
    return ft*2;
  }
  function gridStepPts(){
    return Math.max(4,feetToPts(Math.max(.5,Number(R5.gridFt)||5)));
  }
  function snapPoint(p){
    if(!R5.snap)return p;
    const s=gridStepPts();
    return {x:Math.round(p.x/s)*s,y:Math.round(p.y/s)*s};
  }

  function polylineLength(points){
    let n=0;
    for(let i=1;i<(points||[]).length;i++) n+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    return n;
  }

  function roadWidthPts(m){
    const lanes=Number(m.lanes)||2,lw=Number(m.laneWidthFt)||12,sh=Number(m.shoulderFt)||0;
    return Math.max(12,feetToPts(lanes*lw+2*sh));
  }

  function eachSegment(points,fn){
    for(let i=1;i<(points||[]).length;i++){
      const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
      if(len<.1)continue;
      fn(a,b,dx,dy,len,-dy/len,dx/len);
    }
  }

  function renderAdvancedRoads(){
    const g=q('#markupLayer'),p=currentPage(); if(!g||!p)return;
    for(const m of p.markups.filter(x=>x.r5RoadPath&&isMarkupVisible(x))){
      const width=roadWidthPts(m),half=width/2;
      eachSegment(m.points,(a,b,dx,dy,len,nx,ny)=>{
        if(m.edgeLine!==false){
          [-half,half].forEach(off=>{
            g.appendChild(svgEl('line',{
              x1:a[0]+nx*off,y1:a[1]+ny*off,x2:b[0]+nx*off,y2:b[1]+ny*off,
              stroke:'#f5f5f5','stroke-width':Math.max(1,width*.018),'pointer-events':'none'
            }));
          });
        }
        const center=m.centerLine||'doubleYellow';
        if(center!=='none'){
          const white=/white/i.test(center),dbl=/double/i.test(center),dash=/dash/i.test(center);
          const color=white?'#ffffff':'#f2c230';
          const offs=dbl?[-2.1,2.1]:[0];
          offs.forEach(off=>{
            const e=svgEl('line',{
              x1:a[0]+nx*off,y1:a[1]+ny*off,x2:b[0]+nx*off,y2:b[1]+ny*off,
              stroke:color,'stroke-width':1.5,'pointer-events':'none'
            });
            if(dash)e.setAttribute('stroke-dasharray','10 7');
            g.appendChild(e);
          });
        }
      });
    }
  }

  function renderMarkingLabels(){
    const g=q('#markupLayer'),p=currentPage(); if(!g||!p)return;
    p.markups.filter(m=>m.r5ZoneLabel&&isMarkupVisible(m)).forEach(m=>{
      const b=bounds(m);if(!b)return;
      const t=svgEl('text',{
        x:b.x+b.w/2,y:b.y+b.h/2,'text-anchor':'middle',
        'font-size':Math.max(8,Math.min(16,Math.min(b.w,b.h)*.12)),
        'font-weight':'700',fill:m.r5LabelColor||'#333','pointer-events':'none'
      });
      t.textContent=m.r5ZoneLabel;g.appendChild(t);
    });
  }

  // Add overlays after both R3 and R4 have rendered.
  const priorRenderMarkups=renderMarkups;
  renderMarkups=function(){
    priorRenderMarkups();
    renderAdvancedRoads();
    renderMarkingLabels();
  };

  function startRoadPath(){
    R5.roadDraft=null;
    setTool('r5RoadPath');
    q('#statusTool').textContent='Road Path — click points, double-click to finish';
    toast('Click road centerline points. Double-click the last point to finish.');
  }

  function finishRoadDraft(select=true){
    const m=R5.roadDraft;if(!m)return;
    if(m.points.length>1){
      const a=m.points.at(-1),b=m.points.at(-2);
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<3)m.points.pop();
    }
    if(m.points.length<2){
      currentPage().markups=currentPage().markups.filter(x=>x!==m);
    }else{
      m.modified=stamp();
      if(select)state.selected=m.id;
    }
    R5.roadDraft=null;render();setTool('select');
  }

  // Capture custom multi-segment roadway tool before R3 pointer handlers.
  q('#pageSvg').addEventListener('click',e=>{
    if(state.tool!=='r5RoadPath')return;
    e.preventDefault();e.stopImmediatePropagation();
    let p=snapPoint(svgPoint(e));
    if(!R5.roadDraft){
      checkpoint();
      const m=baseMarkup('polyline',p);
      m.type='polyline';m.points=[[p.x,p.y]];
      m.layer='design';m.subject='Multi-segment Roadway';
      m.stroke='#707070';m.width=roadWidthPts(R5.road);m.fill='none';m.fillOpacity=0;
      m.r5RoadPath=true;m.lanes=R5.road.lanes;m.laneWidthFt=R5.road.laneWidthFt;
      m.shoulderFt=R5.road.shoulderFt;m.centerLine=R5.road.center;m.edgeLine=R5.road.edge;
      currentPage().markups.push(m);R5.roadDraft=m;
    }else{
      R5.roadDraft.points.push([p.x,p.y]);
    }
    renderMarkups();
  },true);

  q('#pageSvg').addEventListener('dblclick',e=>{
    if(state.tool!=='r5RoadPath')return;
    e.preventDefault();e.stopImmediatePropagation();
    finishRoadDraft(true);
  },true);

  // Pavement markings / masks / zones use the reliable R3 polygon/polyline engine.
  const oldFinishPolyDraft=finishPolyDraft;
  finishPolyDraft=function(select=true){
    const m=state.polyDraft;
    if(m&&R5.pending){
      const p=R5.pending;
      if(p.mode==='marking'){
        m.layer='traffic';m.subject=p.name;m.r5Marking=p.kind;
        m.stroke=p.color;m.width=p.width;m.fill='none';m.fillOpacity=0;m.dash=p.dash||'';
      }else if(p.mode==='zone'){
        m.layer='traffic';m.subject=p.name;m.r5Zone=p.kind;m.r5ZoneLabel=p.label;
        m.stroke=p.stroke;m.width=1.5;m.fill=p.fill;m.fillOpacity=p.opacity;
        m.hatch=p.hatch||'none';m.hatchColor=p.stroke;m.hatchSpacing=12;m.dash=p.dash||'';
      }else if(p.mode==='mask'){
        m.layer='design';m.subject=p.name;m.r5Mask=p.kind;
        m.stroke='#aab0b5';m.width=.8;m.fill='#ffffff';m.fillOpacity=.96;m.hatch='none';
      }
      R5.pending=null;
    }
    return oldFinishPolyDraft(select);
  };

  function startMarking(kind){
    const defs={
      dashWhite:{name:'Dashed White Lane Line',color:'#ffffff',dash:'12 9',width:2.2},
      solidWhite:{name:'Solid White Lane Line',color:'#ffffff',dash:'',width:2.2},
      doubleWhite:{name:'Double White Marking',color:'#ffffff',dash:'',width:4},
      solidYellow:{name:'Solid Yellow Line',color:'#f2c230',dash:'',width:2.2},
      doubleYellow:{name:'Double Yellow Marking',color:'#f2c230',dash:'',width:4},
      dashYellow:{name:'Dashed Yellow Line',color:'#f2c230',dash:'12 9',width:2.2}
    };
    const d=defs[kind]||defs.dashWhite;
    R5.pending={mode:'marking',kind,name:d.name,color:d.color,dash:d.dash,width:d.width};
    setTool('polyline');
    q('#statusTool').textContent=d.name+' — click points, double-click to finish';
  }

  function startZone(kind){
    const defs={
      workArea:{name:'Work Area',label:'WORK AREA',stroke:'#c62828',fill:'#ef5350',opacity:.14,hatch:'diag45',dash:''},
      buffer:{name:'Buffer Space',label:'BUFFER',stroke:'#1565c0',fill:'#64b5f6',opacity:.10,hatch:'none',dash:'8 5'},
      activity:{name:'Activity Area',label:'ACTIVITY AREA',stroke:'#ef6c00',fill:'#ffb74d',opacity:.12,hatch:'diag45',dash:''},
      advance:{name:'Advance Warning Area',label:'ADVANCE WARNING',stroke:'#8d6e63',fill:'#d7ccc8',opacity:.10,hatch:'none',dash:'8 5'},
      termination:{name:'Termination Area',label:'TERMINATION',stroke:'#546e7a',fill:'#b0bec5',opacity:.10,hatch:'none',dash:'8 5'}
    };
    const d=defs[kind]||defs.workArea;
    R5.pending={mode:'zone',kind,name:d.name,label:d.label,stroke:d.stroke,fill:d.fill,opacity:d.opacity,hatch:d.hatch,dash:d.dash};
    setTool('polygon');q('#statusTool').textContent=d.name+' — click boundary, double-click to finish';
  }

  function startMask(kind){
    R5.pending={mode:'mask',kind,name:kind==='lane'?'Lane Mask':'Road Mask'};
    setTool('polygon');q('#statusTool').textContent=(kind==='lane'?'Lane':'Road')+' Mask — click boundary, double-click to finish';
  }

  function addStopBar(){
    R5.pending=null;setTool('line');state.preset.stroke='#ffffff';state.preset.width=5;
    q('#statusTool').textContent='Stop Bar — drag line';
    toast('Drag a stop bar. Use Properties afterward for exact appearance.');
  }

  function addTrafficArrow(){
    setTool('arrow');state.preset.stroke='#ffffff';state.preset.width=3;
    q('#statusTool').textContent='Traffic Direction Arrow — drag';
  }

  function signRows(){
    const rows=new Map(),p=currentPage();
    p.markups.forEach(m=>{
      if(m.type!=='trafficSign')return;
      const k=m.signCode||m.subject||'SIGN';
      const r=rows.get(k)||{code:k,name:m.signName||m.subject||'',qty:0};r.qty++;rows.set(k,r);
    });
    return [...rows.values()].sort((a,b)=>a.code.localeCompare(b.code));
  }

  function insertLegend(){
    const rows=signRows();
    if(!rows.length)return toast('Place at least one MUTCD sign on this sheet first.');
    const c=viewportCenterOnPage();
    const text=['SIGN LEGEND','CODE | DESCRIPTION','------------------------------'];
    rows.forEach(r=>text.push(`${r.code} | ${r.name}${r.qty>1?'  x'+r.qty:''}`));
    addMarkup({
      type:'note',layer:'traffic',x:c.x-175,y:c.y-Math.min(300,55+rows.length*14)/2,w:350,
      h:Math.min(300,55+rows.length*14),text:text.join('\n'),
      subject:'Sign Legend',comment:'Auto-generated from MUTCD signs on current sheet.',status:'Open',
      stroke:'#333',width:1,fill:'#ffffff',fillOpacity:.96,hatch:'none',opacity:1,
      font:'Courier New',fontSize:8.5,textColor:'#111',textAlign:'left'
    });
  }

  function insertTaper(){
    const p=currentPage(),c=viewportCenterOnPage(),lenFt=Number(prompt('Taper length in feet:','100'));
    if(!(lenFt>0))return;
    const widthFt=Number(prompt('Lateral shift / lane width in feet:','12'));
    if(!(widthFt>0))return;
    const len=feetToPts(lenFt),off=feetToPts(widthFt);
    checkpoint();
    const m=baseMarkup('polyline',{x:c.x-len/2,y:c.y});
    m.type='polyline';m.points=[[c.x-len/2,c.y],[c.x+len/2,c.y-off]];
    m.layer='traffic';m.subject='Taper';m.stroke='#ef6c00';m.width=2;m.dash='8 5';
    m.r5Taper=true;m.taperLengthFt=lenFt;m.lateralShiftFt=widthFt;
    currentPage().markups.push(m);state.selected=m.id;render();setTool('select');toast('Taper inserted.');
  }

  function insertNorthArrow(){
    const c=viewportCenterOnPage();
    addMarkup({
      type:'arrow',layer:'design',x:c.x,y:c.y+45,x2:c.x,y2:c.y-45,
      subject:'North Arrow',comment:'',status:'Open',stroke:'#111',width:3,fill:'none',
      fillOpacity:0,dash:'',hatch:'none',opacity:1,startArrow:false
    });
    const m=selectedMarkup(); if(m)m.comment='N';
  }

  function openPalette(){
    let p=q('#r5DesignPalette');
    if(!p){
      p=ce('section','palette r5DesignPalette hidden');
      p.id='r5DesignPalette';p.dataset.floating='true';
      p.innerHTML=`
      <div class="paletteHead"><strong>Advanced TCP Design</strong><span>R5 roadway / markings / zones</span><button data-r5-close>×</button></div>
      <div class="paletteBody">
        <div class="toolSection"><b>Multi-Segment Road</b>
          <div class="r5Form">
            <label>Lanes<input id="r5Lanes" type="number" min="1" max="12" value="${R5.road.lanes}"></label>
            <label>Lane width (ft)<input id="r5LaneWidth" type="number" min="6" max="30" step=".5" value="${R5.road.laneWidthFt}"></label>
            <label>Shoulder (ft)<input id="r5Shoulder" type="number" min="0" max="30" step=".5" value="${R5.road.shoulderFt}"></label>
            <label>Center<select id="r5Center"><option value="doubleYellow">Double Yellow</option><option value="singleYellow">Single Yellow</option><option value="dashYellow">Dashed Yellow</option><option value="dashWhite">Dashed White</option><option value="none">None</option></select></label>
          </div>
          <button class="r5Wide" id="r5Road">Draw Multi-Segment Road</button>
        </div>
        <div class="toolSection"><b>Pavement Markings</b>
          <div class="r5Grid3">
            <button data-r5-mark="dashWhite">Dash White</button><button data-r5-mark="solidWhite">Solid White</button><button data-r5-mark="doubleWhite">Double White</button>
            <button data-r5-mark="dashYellow">Dash Yellow</button><button data-r5-mark="solidYellow">Solid Yellow</button><button data-r5-mark="doubleYellow">Double Yellow</button>
            <button id="r5StopBar">Stop Bar</button><button id="r5Arrow">Flow Arrow</button>
          </div>
        </div>
        <div class="toolSection"><b>Work-Zone Areas</b>
          <div class="r5Grid2">
            <button data-r5-zone="workArea">Work Area</button><button data-r5-zone="buffer">Buffer</button>
            <button data-r5-zone="activity">Activity Area</button><button data-r5-zone="advance">Advance Warning</button>
            <button data-r5-zone="termination">Termination</button><button id="r5Taper">Taper</button>
          </div>
        </div>
        <div class="toolSection"><b>Masks / Plan Editing</b>
          <div class="r5Grid2"><button data-r5-mask="lane">Lane Mask</button><button data-r5-mask="road">Road Mask</button></div>
        </div>
        <div class="toolSection"><b>Drafting / Output</b>
          <div class="r5Grid2"><button id="r5Legend">Insert Sign Legend</button><button id="r5North">North Arrow</button></div>
          <label class="r5Check"><input id="r5Snap" type="checkbox" checked> Snap road points to grid</label>
          <label class="r5Field">Grid spacing (ft)<input id="r5GridFt" type="number" min=".5" max="100" step=".5" value="${R5.gridFt}"></label>
        </div>
      </div>`;
      document.body.appendChild(p);
      p.querySelector('[data-r5-close]').onclick=()=>p.classList.add('hidden');
      q('#r5Road').onclick=()=>{
        R5.road.lanes=Math.max(1,Number(q('#r5Lanes').value)||2);
        R5.road.laneWidthFt=Math.max(1,Number(q('#r5LaneWidth').value)||12);
        R5.road.shoulderFt=Math.max(0,Number(q('#r5Shoulder').value)||0);
        R5.road.center=q('#r5Center').value;R5.snap=q('#r5Snap').checked;R5.gridFt=Number(q('#r5GridFt').value)||5;
        startRoadPath();
      };
      p.querySelectorAll('[data-r5-mark]').forEach(b=>b.onclick=()=>startMarking(b.dataset.r5Mark));
      p.querySelectorAll('[data-r5-zone]').forEach(b=>b.onclick=()=>startZone(b.dataset.r5Zone));
      p.querySelectorAll('[data-r5-mask]').forEach(b=>b.onclick=()=>startMask(b.dataset.r5Mask));
      q('#r5StopBar').onclick=addStopBar;q('#r5Arrow').onclick=addTrafficArrow;
      q('#r5Taper').onclick=insertTaper;q('#r5Legend').onclick=insertLegend;q('#r5North').onclick=insertNorthArrow;
    }
    p.classList.toggle('hidden');
  }

  function installUi(){
    const small=q('.brand small');if(small)small.textContent='0.1 R5';
    document.title='NXT Gen Plans 0.1 R5';
    const pals=q('.paletteButtons');
    if(pals&&!q('#r5AdvancedBtn')){
      const b=ce('button','r5AdvancedButton');b.id='r5AdvancedBtn';b.textContent='TCP+';
      b.title='Advanced temporary traffic-control design tools';b.onclick=openPalette;pals.appendChild(b);
    }
  }

  installUi();
  window.NXT_R5={openPalette,startRoadPath,startMarking,startZone,startMask,insertLegend,insertTaper};
  console.info('NXT Gen Plans R5 advanced traffic-control design module loaded.');
})();
