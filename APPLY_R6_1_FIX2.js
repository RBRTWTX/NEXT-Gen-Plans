// NXT Gen Plans R6.1 FIX2
// Robust structural repair for TCP+ freeze.
(function(){
  var fso=new ActiveXObject("Scripting.FileSystemObject");
  var root=fso.GetParentFolderName(WScript.ScriptFullName);
  function p(n){return fso.BuildPath(root,n);}
  function die(m,c){WScript.Echo("ERROR: "+m);WScript.Quit(c||1);}
  function read8(fp){var s=new ActiveXObject("ADODB.Stream");s.Type=2;s.Charset="utf-8";s.Open();s.LoadFromFile(fp);var t=s.ReadText(-1);s.Close();if(t.length&&t.charCodeAt(0)===0xFEFF)t=t.substr(1);return t;}
  function write8(fp,t){var a=new ActiveXObject("ADODB.Stream");a.Type=2;a.Charset="utf-8";a.Open();a.WriteText(t);a.Position=0;a.Type=1;if(a.Size>=3)a.Position=3;var bytes=a.Read();a.Close();var b=new ActiveXObject("ADODB.Stream");b.Type=1;b.Open();b.Write(bytes);b.SaveToFile(fp,2);b.Close();}
  var file=p("r6-1-integration.js"),backup=p("r6-1-integration.before_FIX2.js");
  if(!fso.FileExists(file))die("r6-1-integration.js was not found.",10);
  var src=read8(file);
  if(src.indexOf("NXT Gen Plans 0.1 R6.1")<0||src.indexOf("NXT_R6_1_INTEGRATION")<0)die("r6-1-integration.js does not match the R6.1 integration build.",20);
  if(src.indexOf("NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER")>=0){WScript.Echo("PASS: R6.1 FIX2 is already installed.");WScript.Quit(0);}
  if(!fso.FileExists(backup))fso.CopyFile(file,backup,false);
  var n=src.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
  var start=n.indexOf("const observer=new MutationObserver");if(start<0)start=n.indexOf("const observer = new MutationObserver");
  if(start>=0){
    var observePos=n.indexOf("observer.observe(document.body",start);if(observePos<0)die("MutationObserver declaration found, but observer.observe(document.body...) was not found.",21);
    var observeEnd=n.indexOf(";",observePos);if(observeEnd<0)die("Could not find the end of observer.observe(...).",22);observeEnd++;
    n=n.substring(0,start)+"/* NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER\n   Removed body-wide MutationObserver because health-badge DOM updates could recursively retrigger it and freeze TCP+. */\n"+n.substring(observeEnd);
  } else {
    var u=n.indexOf("'use strict';");if(u>=0){u=n.indexOf("\n",u)+1;n=n.substring(0,u)+"/* NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER */\n"+n.substring(u);}
  }
  if(n.indexOf("NXT_R6_1_FIX2_DIRECT_HOOKS")<0){
    var insertAt=n.lastIndexOf("window.NXT_R6_1=");if(insertAt<0)die("Could not find R6.1 export anchor.",23);
    var hooks="\n  /* NXT_R6_1_FIX2_DIRECT_HOOKS */\n  const r61RoadBtn=q('#r6RoadBtn');\n  if(r61RoadBtn){r61RoadBtn.addEventListener('click',()=>setTimeout(()=>{installR6PaletteGuards();guardIntersectionButton();},0));}\n  if(tcpBtn){tcpBtn.addEventListener('click',()=>setTimeout(()=>{installTcpHealth();},0));}\n\n";
    n=n.substring(0,insertAt)+hooks+n.substring(insertAt);
  }
  write8(file,n.replace(/\n/g,"\r\n"));
  var v=read8(file);
  if(v.indexOf("NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER")<0)die("FIX2 marker is missing after write.",30);
  if(v.indexOf("NXT_R6_1_FIX2_DIRECT_HOOKS")<0)die("Direct hooks are missing after write.",31);
  if(v.indexOf("observer.observe(document.body")>=0)die("Body-wide observer is still present.",32);
  WScript.Echo("PASS: R6.1 FIX2 applied.");
  WScript.Echo("PASS: Body-wide DOM observer is gone.");
  WScript.Echo("PASS: TCP+ and Road+ now use direct palette-open hooks.");
  WScript.Echo("PASS: R3/R4/R5/R6 files were NOT modified.");
  WScript.Quit(0);
})();