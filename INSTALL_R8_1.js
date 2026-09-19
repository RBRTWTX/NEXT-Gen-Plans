// NXT Gen Plans 0.1 R8.1 Universal Canvas Compatibility Installer
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
    "r6-1-integration.js","r7-addon.js","r8-addon.js","r8-1-compat.js","r8-1-compat.css"];
  for(var i=0;i<required.length;i++)if(!fso.FileExists(p(required[i])))die(required[i]+" is missing.",10+i);

  var r61=read8(p("r6-1-integration.js"));
  if(r61.indexOf("NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER")<0||r61.indexOf("observer.observe(document.body")>=0)
    die("Accepted R6.1 FIX2 baseline is not intact.",30);

  var r7=read8(p("r7-addon.js"));
  if(r7.indexOf("NXT_R7_MANUAL_TCP")<0||r7.indexOf("window.NXT_R7")<0)
    die("Accepted R7 baseline is not intact.",31);

  var r8=read8(p("r8-addon.js"));
  if(r8.indexOf("NXT_R8_COMBINED_MANUAL")<0||r8.indexOf("window.NXT_R8")<0)
    die("Accepted R8 baseline is not intact.",32);

  var idx=p("index.html"),h=read8(idx);
  if(h.indexOf("<!doctype html>")!==0&&h.indexOf("<!DOCTYPE html>")!==0)die("index.html is not valid UTF-8 HTML.",40);

  var order=[
    'src="app.js"','src="r4-addon.js"','src="r5-addon.js"','src="r6-addon.js"',
    'src="r6-1-integration.js"','src="r7-addon.js"','src="r8-addon.js"'
  ],last=-1;
  for(var j=0;j<order.length;j++){
    var pos=h.indexOf(order[j]);
    if(pos<0||pos<=last)die("Current runtime load order is not intact at "+order[j],41+j);
    last=pos;
  }

  if(!fso.FileExists(p("index.R8.before_R8_1.html")))fso.CopyFile(idx,p("index.R8.before_R8_1.html"),false);

  h=h.replace(/\s*<link rel="stylesheet" href="r8-1-compat\.css">\s*/g,"\r\n");
  h=h.replace(/\s*<script src="r8-1-compat\.js"><\/script>\s*/g,"\r\n");

  var hp=h.indexOf("</head>");if(hp<0)die("</head> not found.",60);
  h=h.substring(0,hp)+'<link rel="stylesheet" href="r8-1-compat.css">\r\n'+h.substring(hp);

  var anchor='<script src="r8-addon.js"></script>',p8=h.indexOf(anchor);
  if(p8<0)die("R8 script tag not found.",61);
  p8+=anchor.length;
  h=h.substring(0,p8)+'\r\n<script src="r8-1-compat.js"></script>'+h.substring(p8);

  write8(idx,h);

  var v=read8(idx),a=v.indexOf('src="r8-addon.js"'),b=v.indexOf('src="r8-1-compat.js"');
  if(a<0||b<0||b<=a)die("R8.1 load order verification failed.",70);
  if(v.indexOf('href="r8-1-compat.css"')<0)die("R8.1 CSS reference missing.",71);

  WScript.Echo("PASS: R8.1 installed additively.");
  WScript.Echo("PASS: R7/R8 source files were NOT replaced.");
  WScript.Echo("PASS: R8.1 loads after R8.");
  WScript.Quit(0);
})();