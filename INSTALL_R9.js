// NXT Gen Plans 0.1 R9 — additive UTF-8-safe installer
(function(){
  var fso=new ActiveXObject("Scripting.FileSystemObject");
  var root=fso.GetParentFolderName(WScript.ScriptFullName);
  function p(n){return fso.BuildPath(root,n);}
  function die(m,c){WScript.Echo("ERROR: "+m);WScript.Quit(c||1);}
  function read8(fp){
    var s=new ActiveXObject("ADODB.Stream");s.Type=2;s.Charset="utf-8";s.Open();s.LoadFromFile(fp);
    var t=s.ReadText(-1);s.Close();if(t.length&&t.charCodeAt(0)===0xFEFF)t=t.substr(1);return t;
  }
  function write8(fp,t){
    var a=new ActiveXObject("ADODB.Stream");a.Type=2;a.Charset="utf-8";a.Open();a.WriteText(t);a.Position=0;a.Type=1;
    if(a.Size>=3)a.Position=3;var bytes=a.Read();a.Close();
    var b=new ActiveXObject("ADODB.Stream");b.Type=1;b.Open();b.Write(bytes);b.SaveToFile(fp,2);b.Close();
  }

  var required=["index.html","app.js","r4-addon.js","r5-addon.js","r6-addon.js",
    "r6-1-integration.js","r7-addon.js","r8-addon.js","r8-1-compat.js","r9-addon.js","r9-addon.css"];
  for(var i=0;i<required.length;i++)if(!fso.FileExists(p(required[i])))die(required[i]+" is missing.",10+i);

  var r61=read8(p("r6-1-integration.js"));
  if(r61.indexOf("NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER")<0||r61.indexOf("observer.observe(document.body")>=0)die("R6.1 FIX2 baseline is not intact.",30);
  var r7=read8(p("r7-addon.js"));if(r7.indexOf("NXT_R7_MANUAL_TCP")<0)die("R7 baseline is not intact.",31);
  var r8=read8(p("r8-addon.js"));if(r8.indexOf("NXT_R8_COMBINED_MANUAL")<0)die("R8 baseline is not intact.",32);
  var r81=read8(p("r8-1-compat.js"));if(r81.indexOf("NXT_R8_1_UNIVERSAL_CANVAS")<0)die("R8.1 Universal Canvas is not intact.",33);

  var idx=p("index.html"),h=read8(idx);
  if(h.indexOf("<!doctype html>")!==0&&h.indexOf("<!DOCTYPE html>")!==0)die("index.html is not valid UTF-8 HTML.",40);

  var order=['src="app.js"','src="r4-addon.js"','src="r5-addon.js"','src="r6-addon.js"','src="r6-1-integration.js"','src="r7-addon.js"','src="r8-addon.js"','src="r8-1-compat.js"'],last=-1;
  for(var j=0;j<order.length;j++){var pos=h.indexOf(order[j]);if(pos<0||pos<=last)die("Current load order is not intact at "+order[j],41+j);last=pos}

  if(!fso.FileExists(p("index.R8_1.before_R9.html")))fso.CopyFile(idx,p("index.R8_1.before_R9.html"),false);

  h=h.replace(/\s*<link rel="stylesheet" href="r9-addon\.css">\s*/g,"\r\n");
  h=h.replace(/\s*<script src="r9-addon\.js"><\/script>\s*/g,"\r\n");

  var hp=h.indexOf("</head>");if(hp<0)die("</head> not found.",60);
  h=h.substring(0,hp)+'<link rel="stylesheet" href="r9-addon.css">\r\n'+h.substring(hp);

  var anchor='<script src="r8-1-compat.js"></script>',a=h.indexOf(anchor);if(a<0)die("R8.1 script tag not found.",61);
  a+=anchor.length;h=h.substring(0,a)+'\r\n<script src="r9-addon.js"></script>'+h.substring(a);
  write8(idx,h);

  var v=read8(idx),r81p=v.indexOf('src="r8-1-compat.js"'),r9p=v.indexOf('src="r9-addon.js"');
  if(r81p<0||r9p<=r81p)die("R9 load order verification failed.",70);
  if(v.indexOf('href="r9-addon.css"')<0)die("R9 CSS link missing.",71);

  WScript.Echo("PASS: R9 installed additively.");
  WScript.Echo("PASS: R9 loads after R8.1.");
  WScript.Echo("PASS: Existing R3-R8.1 source files were NOT replaced.");
  WScript.Quit(0);
})();