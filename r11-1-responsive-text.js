'use strict';
/*
 NXT Gen Plans 0.1 R11.1 — Responsive Text / Layout Compatibility
 Baseline: Git cb849895 (r11)
 Loads AFTER r11-addon.js.

 Fixes:
 - R3 text/textbox/note reflow + shrink-to-fit during live resize
 - R4 title-block text inherits the R3 fix
 - R5/R8 note-based legends/schedules inherit the R3 fix
 - R11 title blocks/tables/legend/manifest/notes/references fully recompute
   layout from current object w/h after every drag-resize
 - R10 placed copies inherit responsive rendering by object type
*/
(() => {
  if(!window.NXT_R11 || !window.__NXT_R11_PLAN_DOCUMENTATION ||
     !window.NXT_R10 || !window.__NXT_R10_LOCAL_LIBRARY){
    console.error('R11.1 requires the accepted R11 baseline.');
    return;
  }
  if(window.__NXT_R11_1_RESPONSIVE_TEXT)return;
  window.__NXT_R11_1_RESPONSIVE_TEXT=true;

  const q=s=>document.querySelector(s);
  const BASE_TEXT_TYPES=new Set(['text','textbox','note']);

  // ---------------------------------------------------------------------
  // TEXT MEASUREMENT / WRAPPING
  // ---------------------------------------------------------------------

  function linesFor(text,width,fontSize,pad=8){
    const paragraphs=String(text??'').split(/\r?\n/);
    const maxChars=Math.max(1,Math.floor(Math.max(8,width-pad*2)/(Math.max(5,fontSize)*.56)));
    const out=[];
    for(const para of paragraphs){
      if(!para){out.push('');continue}
      const words=para.split(/\s+/);let line='';
      for(const word of words){
        if(word.length>maxChars){
          if(line){out.push(line);line=''}
          for(let i=0;i<word.length;i+=maxChars)out.push(word.slice(i,i+maxChars));
          continue;
        }
        const next=line?line+' '+word:word;
        if(next.length>maxChars&&line){out.push(line);line=word}else line=next;
      }
      if(line)out.push(line);
    }
    return out.length?out:[''];
  }

  function fittedText(text,w,h,maxFont,minFont=5,pad=6,lineRatio=1.18){
    let fs=Math.max(minFont,Number(maxFont)||12),lines=linesFor(text,w,fs,pad);
    const usableH=Math.max(6,h-pad*2);
    while(fs>minFont){
      const lineH=fs*lineRatio;
      if(lines.length*lineH<=usableH)break;
      fs=Math.max(minFont,fs-.5);
      lines=linesFor(text,w,fs,pad);
    }
    const lineH=fs*lineRatio;
    const maxLines=Math.max(1,Math.floor(usableH/lineH));
    return{fontSize:fs,lineHeight:lineH,lines:lines.slice(0,maxLines)};
  }

  function fitSingleLine(text,maxWidth,maxFont,minFont=4.5){
    let fs=Math.max(minFont,Number(maxFont)||8);
    const len=Math.max(1,String(text??'').length);
    while(fs>minFont&&len*fs*.56>Math.max(4,maxWidth))fs=Math.max(minFont,fs-.4);
    return fs;
  }

  function textNode(g,x,y,text,attrs={}){
    const t=svgEl('text',{
      x,y,
      'font-family':attrs.font||'Arial',
      'font-size':attrs.size||8,
      fill:attrs.fill||'#111',
      'font-weight':attrs.bold?'700':'400',
      'font-style':attrs.italic?'italic':'normal',
      'text-anchor':attrs.anchor||'start',
      'pointer-events':'none'
    });
    t.textContent=String(text??'');g.appendChild(t);return t;
  }

  function multilineText(g,x,y,w,h,text,opts={}){
    const pad=opts.pad??5;
    const fit=fittedText(text,w,h,opts.maxFont||10,opts.minFont||4.5,pad,opts.lineRatio||1.17);
    let anchor='start',tx=x+pad;
    if(opts.align==='center'){anchor='middle';tx=x+w/2}
    else if(opts.align==='right'){anchor='end';tx=x+w-pad}
    const node=svgEl('text',{
      'font-family':opts.font||'Arial',
      'font-size':fit.fontSize,
      fill:opts.fill||'#111',
      'font-weight':opts.bold?'700':'400',
      'font-style':opts.italic?'italic':'normal',
      'text-anchor':anchor,
      'pointer-events':'none'
    });
    fit.lines.forEach((line,i)=>{
      const sp=svgEl('tspan',{x:tx});
      if(i===0)sp.setAttribute('y',y+pad+fit.fontSize);
      else sp.setAttribute('dy',fit.lineHeight);
      sp.textContent=line;node.appendChild(sp);
    });
    g.appendChild(node);
    return fit;
  }

  // ---------------------------------------------------------------------
  // R3 / R4 / R5 / R8 BASE TEXT OBJECTS
  // ---------------------------------------------------------------------

  function rerenderBaseText(g,m){
    // Remove the legacy rect + text nodes for this specific markup.
    [...g.querySelectorAll('[data-id]')].filter(n=>n.dataset.id===m.id).forEach(n=>n.remove());

    const group=svgEl('g');
    group.dataset.id=m.id;
    group.classList.add('markup','r111ResponsiveText');
    if(state.selected===m.id)group.classList.add('selected');
    group.addEventListener('pointerdown',e=>objectPointerDown(e,m));
    group.addEventListener('contextmenu',e=>openContext(e,m.id));
    group.addEventListener('dblclick',e=>{e.stopPropagation();editText(m)});

    if(m.type!=='text'||Number(m.width)!==0){
      const r=svgEl('rect',{
        x:m.x,y:m.y,width:Math.max(1,m.w),height:Math.max(1,m.h),
        rx:m.type==='note'?3:0
      });
      commonAttrs(r,m);
      // commonAttrs installs duplicate interaction listeners on the rect; make
      // the group the interaction target instead.
      r.style.pointerEvents='none';
      if(m.type==='text'&&Number(m.width)===0)r.setAttribute('stroke','none');
      group.appendChild(r);
    }

    if(state.editing!==m.id){
      multilineText(group,m.x,m.y,Math.max(1,m.w),Math.max(1,m.h),m.text||'',{
        maxFont:m.fontSize||14,
        minFont:5,
        pad:m.type==='text'?3:5,
        font:m.font||'Arial',
        fill:m.textColor||m.stroke||'#111',
        bold:!!m.bold,
        italic:!!m.italic,
        align:m.textAlign||'left',
        lineRatio:1.18
      });
    }
    g.appendChild(group);
  }

  // ---------------------------------------------------------------------
  // R11 RESPONSIVE DOCUMENT OBJECTS
  // ---------------------------------------------------------------------

  function docGroup(m){
    const g=svgEl('g');
    g.dataset.id=m.id;g.classList.add('markup','r11DocObject','r111ResponsiveDoc');
    if(state.selected===m.id)g.classList.add('selected');
    g.setAttribute('opacity',m.opacity??1);
    g.addEventListener('pointerdown',e=>objectPointerDown(e,m));
    g.addEventListener('contextmenu',e=>openContext(e,m.id));
    return g;
  }

  function responsiveTitle(g,m){
    const f=m.r11Fields||{},x=m.x,y=m.y,w=Math.max(80,m.w),h=Math.max(60,m.h);
    const scale=Math.max(.55,Math.min(1.65,Math.min(w/360,h/210)));
    const pad=Math.max(4,6*scale);
    const head=Math.max(20,Math.min(h*.20,34*scale));
    const projectBand=Math.max(30,Math.min(h*.22,48*scale));
    const border=m.stroke||'#222';

    g.appendChild(svgEl('rect',{x,y,width:w,height:h,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:border,'stroke-width':m.width||1}));
    g.appendChild(svgEl('rect',{x,y,width:w,height:head,fill:'#f2f4f5',stroke:border,'stroke-width':1}));

    const companyFs=fitSingleLine(f.company||'NXT GEN PLANS',w*.62,10*scale,5);
    textNode(g,x+pad,y+head*.64,f.company||'NXT GEN PLANS',{size:companyFs,bold:true});
    const drawingFs=fitSingleLine(f.drawingNo||'DRAWING NO.',w*.30,8*scale,4.5);
    textNode(g,x+w-pad,y+head*.64,f.drawingNo||'DRAWING NO.',{size:drawingFs,bold:true,anchor:'end'});

    const projectTop=y+head;
    g.appendChild(svgEl('line',{x1:x,y1:projectTop+projectBand,x2:x+w,y2:projectTop+projectBand,stroke:'#999','stroke-width':.6,'pointer-events':'none'}));

    multilineText(g,x+pad,projectTop+2,w-pad*2,projectBand*.48,f.project||'PROJECT',{
      maxFont:10*scale,minFont:5,pad:1,bold:true
    });
    multilineText(g,x+pad,projectTop+projectBand*.47,w-pad*2,projectBand*.48,f.location||'LOCATION',{
      maxFont:8*scale,minFont:4.5,pad:1
    });

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

    const bodyY=projectTop+projectBand;
    const bodyH=Math.max(10,y+h-bodyY);
    const rowH=bodyH/rows.length;
    const labelW=Math.max(52,Math.min(w*.29,110));
    const valueX=x+labelW;
    g.appendChild(svgEl('line',{x1:valueX,y1:bodyY,x2:valueX,y2:y+h,stroke:'#c2c7ca','stroke-width':.5,'pointer-events':'none'}));

    rows.forEach((row,i)=>{
      const yy=bodyY+i*rowH;
      if(i)g.appendChild(svgEl('line',{x1:x,y1:yy,x2:x+w,y2:yy,stroke:'#cdd1d3','stroke-width':.45,'pointer-events':'none'}));
      const labelFs=fitSingleLine(row[0],labelW-pad*2,Math.min(7.2*scale,rowH*.52),4);
      const valueFs=fitSingleLine(row[1],Math.max(10,w-labelW-pad*2),Math.min(8*scale,rowH*.56),4);
      textNode(g,x+pad,yy+rowH*.68,row[0],{size:labelFs,bold:true,fill:'#555'});
      textNode(g,valueX+pad,yy+rowH*.68,row[1],{size:valueFs});
    });
  }

  function wrappedCellLines(text,width,fontSize,maxLines=3){
    return linesFor(text,width,fontSize,3).slice(0,maxLines);
  }

  function responsiveTable(g,m,title,headers,rows){
    const x=m.x,y=m.y,w=Math.max(90,m.w),h=Math.max(55,m.h);
    const border=m.stroke||'#222';
    const scale=Math.max(.55,Math.min(1.6,Math.min(w/380,h/150)));
    const titleH=Math.max(17,Math.min(h*.17,24*scale));
    const headerH=Math.max(15,Math.min(h*.14,20*scale));
    const cols=Math.max(1,headers.length);
    const cw=w/cols;

    g.appendChild(svgEl('rect',{x,y,width:w,height:h,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:border,'stroke-width':m.width||1}));
    g.appendChild(svgEl('rect',{x,y,width:w,height:titleH,fill:'#f2f4f5',stroke:border,'stroke-width':1}));
    const titleFs=fitSingleLine(title||'TABLE',w-12,Math.min(10*scale,titleH*.55),4.5);
    textNode(g,x+6,y+titleH*.68,title||'TABLE',{size:titleFs,bold:true});

    const hy=y+titleH;
    g.appendChild(svgEl('rect',{x,y:hy,width:w,height:headerH,fill:'#fafafa',stroke:'#777','stroke-width':.6}));

    for(let i=1;i<cols;i++){
      g.appendChild(svgEl('line',{x1:x+i*cw,y1:hy,x2:x+i*cw,y2:y+h,stroke:'#aaa','stroke-width':.5,'pointer-events':'none'}));
    }

    headers.forEach((head,i)=>{
      const fs=fitSingleLine(head,cw-8,Math.min(7.5*scale,headerH*.50),4);
      textNode(g,x+i*cw+4,hy+headerH*.67,head,{size:fs,bold:true});
    });

    const bodyY=hy+headerH;
    const bodyH=Math.max(1,y+h-bodyY);
    const rowCount=Math.max(1,rows.length);
    const rh=bodyH/rowCount;

    rows.forEach((row,ri)=>{
      const ry=bodyY+ri*rh;
      if(ri)g.appendChild(svgEl('line',{x1:x,y1:ry,x2:x+w,y2:ry,stroke:'#c5c5c5','stroke-width':.45,'pointer-events':'none'}));
      for(let ci=0;ci<cols;ci++){
        const val=Array.isArray(row)?row[ci]:row?.[headers[ci]];
        const maxFs=Math.min(7*scale,Math.max(4,rh*.42));
        let fs=maxFs,lns=wrappedCellLines(val??'',cw-8,fs,Math.max(1,Math.floor(rh/(fs*1.12))));
        while(fs>4&&lns.length*fs*1.12>rh-3){
          fs-=.4;lns=wrappedCellLines(val??'',cw-8,fs,Math.max(1,Math.floor(rh/(fs*1.12))));
        }
        lns.forEach((ln,li)=>{
          textNode(g,x+ci*cw+4,ry+Math.min(rh-2,fs+3+li*fs*1.1),ln,{size:fs});
        });
      }
    });
  }

  function responsiveNote(g,m){
    const f=m.r11Fields||{},x=m.x,y=m.y,w=Math.max(60,m.w),h=Math.max(40,m.h);
    g.appendChild(svgEl('rect',{x,y,width:w,height:h,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:m.stroke||'#222','stroke-width':m.width||1}));
    const titleH=Math.max(18,Math.min(28,h*.20));
    const titleFs=fitSingleLine(f.title||'NOTE',w-12,Math.min(9,titleH*.52),4.5);
    textNode(g,x+6,y+titleH*.68,f.title||'NOTE',{size:titleFs,bold:true});
    g.appendChild(svgEl('line',{x1:x,y1:y+titleH,x2:x+w,y2:y+titleH,stroke:'#ccc','stroke-width':.5,'pointer-events':'none'}));
    multilineText(g,x+2,y+titleH+1,w-4,h-titleH-3,f.text||'',{
      maxFont:m.fontSize||8,
      minFont:4.5,
      pad:5,
      font:m.font||'Arial',
      fill:m.textColor||'#111',
      lineRatio:1.18
    });
  }

  function responsiveReference(g,m){
    const f=m.r11Fields||{},x=m.x,y=m.y,w=Math.max(30,m.w),h=Math.max(20,m.h);
    const shape=f.stampShape||'box';
    if(shape==='circle'){
      g.appendChild(svgEl('ellipse',{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:m.stroke||'#222','stroke-width':m.width||1}));
    }else if(shape==='plain'){
      // no box
    }else{
      g.appendChild(svgEl('rect',{x,y,width:w,height:h,rx:3,fill:m.fill||'#fff','fill-opacity':m.fillOpacity??.96,stroke:m.stroke||'#222','stroke-width':m.width||1}));
    }
    const pFs=fitSingleLine(f.primary||'SEE SHEET',w-10,Math.min(9,h*.30),4.5);
    textNode(g,x+w/2,y+h*.43,f.primary||'SEE SHEET',{size:pFs,bold:true,anchor:'middle'});
    if(f.secondary){
      const sFs=fitSingleLine(f.secondary,w-10,Math.min(7.5,h*.23),4);
      textNode(g,x+w/2,y+h*.72,f.secondary,{size:sFs,anchor:'middle'});
    }
  }

  function rerenderDoc(g,m){
    [...g.querySelectorAll('[data-id]')].filter(n=>n.dataset.id===m.id).forEach(n=>n.remove());
    const grp=docGroup(m),f=m.r11Fields||{};
    if(m.r11Kind==='titleBlock')responsiveTitle(grp,m);
    else if(m.r11Kind==='revision')responsiveTable(grp,m,f.title||'REVISION HISTORY',['REV','DATE','DESCRIPTION','BY'],f.rows||[]);
    else if(m.r11Kind==='table')responsiveTable(grp,m,f.title||'TABLE',f.headers||['ITEM','DESCRIPTION'],f.rows||[]);
    else if(m.r11Kind==='legend')responsiveTable(grp,m,f.title||'LEGEND',['SYMBOL / ITEM','DESCRIPTION'],f.rows||[]);
    else if(m.r11Kind==='manifest')responsiveTable(grp,m,f.title||'MANIFEST',['ITEM','DESCRIPTION','QTY'],f.rows||[]);
    else if(m.r11Kind==='reference')responsiveReference(grp,m);
    else responsiveNote(grp,m);
    g.appendChild(grp);
  }

  // ---------------------------------------------------------------------
  // FINAL RENDER PASS AFTER R11
  // ---------------------------------------------------------------------

  const priorRenderMarkups=renderMarkups;
  renderMarkups=function(){
    priorRenderMarkups();
    const g=q('#markupLayer');if(!g)return;

    for(const m of currentPage().markups){
      if(!isMarkupVisible(m))continue;
      if(BASE_TEXT_TYPES.has(m.type))rerenderBaseText(g,m);
      else if(m.r11Doc)rerenderDoc(g,m);
    }
    renderSelection();
  };

  // Make inline text editing use the same shrink-to-fit font as display.
  const priorPositionInlineEditor=positionInlineEditor;
  positionInlineEditor=function(){
    priorPositionInlineEditor();
    const m=selectedMarkup();
    if(!m||state.editing!==m.id||!BASE_TEXT_TYPES.has(m.type))return;
    const fit=fittedText(m.text||'',Math.max(1,m.w),Math.max(1,m.h),m.fontSize||14,5,m.type==='text'?3:5,1.18);
    const s=96/72*state.zoom;
    const ed=q('#inlineEditor');
    if(ed)ed.style.fontSize=(fit.fontSize*s)+'px';
  };

  // Mark existing text objects as responsive for diagnostics/project inspection.
  function markResponsive(){
    for(const p of state.pages||[]){
      for(const m of p.markups||[]){
        if(BASE_TEXT_TYPES.has(m.type)||m.r11Doc)m.r111ResponsiveText=true;
      }
    }
  }

  const priorRender=render;
  render=function(){
    markResponsive();
    return priorRender();
  };

  markResponsive();
  render();

  window.NXT_R11_1={
    fittedText,
    linesFor
  };

  console.info('NXT Gen Plans R11.1 responsive text/layout compatibility loaded.');
})();
