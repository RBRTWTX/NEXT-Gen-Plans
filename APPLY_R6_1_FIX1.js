// NXT Gen Plans R6.1 FIX1
// Removes recursive MutationObserver freeze from r6-1-integration.js.
(function(){
  var fso=new ActiveXObject("Scripting.FileSystemObject");
  var root=fso.GetParentFolderName(WScript.ScriptFullName);

  function p(n){return fso.BuildPath(root,n);}
  function die(m,c){WScript.Echo("ERROR: "+m);WScript.Quit(c||1);}

  function read8(fp){
    var s=new ActiveXObject("ADODB.Stream");
    s.Type=2;s.Charset="utf-8";s.Open();s.LoadFromFile(fp);
    var t=s.ReadText(-1);s.Close();
    if(t.length&&t.charCodeAt(0)===0xFEFF)t=t.substr(1);
    return t;
  }

  function write8(fp,t){
    var a=new ActiveXObject("ADODB.Stream");
    a.Type=2;a.Charset="utf-8";a.Open();a.WriteText(t);a.Position=0;a.Type=1;
    if(a.Size>=3)a.Position=3;
    var bytes=a.Read();a.Close();
    var b=new ActiveXObject("ADODB.Stream");
    b.Type=1;b.Open();b.Write(bytes);b.SaveToFile(fp,2);b.Close();
  }

  var file=p("r6-1-integration.js");
  var backup=p("r6-1-integration.before_FIX1.js");

  if(!fso.FileExists(file))die("r6-1-integration.js was not found.",10);

  var src=read8(file);

  if(src.indexOf("NXT Gen Plans 0.1 R6.1")<0 || src.indexOf("NXT_R6_1_INTEGRATION")<0){
    die("r6-1-integration.js does not match the R6.1 build.",20);
  }

  if(src.indexOf("NXT_R6_1_FIX1_NO_RECURSIVE_OBSERVER")>=0){
    WScript.Echo("PASS: R6.1 FIX1 is already installed.");
    WScript.Quit(0);
  }

  if(!fso.FileExists(backup))fso.CopyFile(file,backup,false);

  var oldBlock = "  const observer=new MutationObserver(()=>{\\r\\n"+
    "    installLayerPanelTools();\\r\\n"+
    "    installR6PaletteGuards();\\r\\n"+
    "    guardIntersectionButton();\\r\\n"+
    "    installTcpHealth();\\r\\n"+
    "  });\\r\\n"+
    "  observer.observe(document.body,{childList:true,subtree:true});\\r\\n\\r\\n"+
    "  installLayerPanelTools();\\r\\n"+
    "  installR6PaletteGuards();\\r\\n"+
    "  guardIntersectionButton();\\r\\n"+
    "  installTcpHealth();\\r\\n";

  var newBlock = "  /* NXT_R6_1_FIX1_NO_RECURSIVE_OBSERVER\\r\\n"+
    "     Removed the body-wide MutationObserver because installTcpHealth()\\r\\n"+
    "     mutated the DOM and recursively retriggered the observer.\\r\\n"+
    "  */\\r\\n"+
    "  installLayerPanelTools();\\r\\n"+
    "  installR6PaletteGuards();\\r\\n"+
    "  guardIntersectionButton();\\r\\n\\r\\n"+
    "  const roadBtn=q('#r6RoadBtn');\\r\\n"+
    "  if(roadBtn){\\r\\n"+
    "    roadBtn.addEventListener('click',()=>setTimeout(()=>{\\r\\n"+
    "      installR6PaletteGuards();\\r\\n"+
    "      guardIntersectionButton();\\r\\n"+
    "    },0));\\r\\n"+
    "  }\\r\\n\\r\\n"+
    "  if(tcpBtn){\\r\\n"+
    "    tcpBtn.addEventListener('click',()=>setTimeout(()=>{\\r\\n"+
    "      installTcpHealth();\\r\\n"+
    "    },0));\\r\\n"+
    "  }\\r\\n";

  // Normalize line endings for robust matching.
  var norm=src.replace(/\r\n/g,"\n");
  var oldNorm=oldBlock.replace(/\r\n/g,"\n");
  var newNorm=newBlock.replace(/\r\n/g,"\n");

  if(norm.indexOf(oldNorm)<0){
    die("Expected recursive observer block was not found. No changes made.",21);
  }
  norm=norm.replace(oldNorm,newNorm);

  var oldHealth = "    badge.classList.toggle('bad',!s.ok);\\n"+
    "    badge.textContent=s.ok?'TCP+ integration verified: road, markings, zones, masks and output controls loaded.':\\n"+
    "      `TCP+ integration problem: ${s.missing.length?'missing '+s.missing.join(', '):''} markings ${s.markCount}/6, zones ${s.zoneCount}/5, masks ${s.maskCount}/2`;\\n";

  var newHealth = "    badge.classList.toggle('bad',!s.ok);\\n"+
    "    const msg=s.ok?'TCP+ integration verified: road, markings, zones, masks and output controls loaded.':\\n"+
    "      `TCP+ integration problem: ${s.missing.length?'missing '+s.missing.join(', '):''} markings ${s.markCount}/6, zones ${s.zoneCount}/5, masks ${s.maskCount}/2`;\\n"+
    "    if(badge.textContent!==msg)badge.textContent=msg;\\n";

  if(norm.indexOf(oldHealth)>=0)norm=norm.replace(oldHealth,newHealth);

  write8(file,norm.replace(/\n/g,"\r\n"));

  var v=read8(file);
  if(v.indexOf("NXT_R6_1_FIX1_NO_RECURSIVE_OBSERVER")<0)die("Post-write verification failed.",30);
  if(v.indexOf("new MutationObserver")>=0)die("Recursive MutationObserver is still present.",31);

  WScript.Echo("PASS: R6.1 FIX1 applied.");
  WScript.Echo("PASS: Recursive DOM observer removed.");
  WScript.Echo("PASS: TCP+ and Road+ now use direct palette-open hooks.");
  WScript.Echo("PASS: R3/R4/R5/R6 source files were NOT modified.");
  WScript.Quit(0);
})();