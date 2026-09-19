// NXT Gen Plans 0.1 R11.1 — responsive text installer
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

  var required=["index.html","app.js","r6-1-integration.js","r8-1-compat.js","r9-addon.js","r10-addon.js","r11-addon.js","r11-1-responsive-text.js","r11-1-responsive-text.css"];
  for(var i=0;i<required.length;i++)if(!fso.FileExists(p(required[i])))die(required[i]+" is missing.",10+i);

  var r61=read8(p("r6-1-integration.js"));
  if(r61.indexOf("NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER")<0||r61.indexOf("observer.observe(document.body")>=0)die("R6.1 FIX2 baseline is not intact.",30);
  if(read8(p("r8-1-compat.js")).indexOf("NXT_R8_1_UNIVERSAL_CANVAS")<0)die("R8.1 baseline missing.",31);
  if(read8(p("r9-addon.js")).indexOf("NXT_R9_MANUAL_GEOMETRY")<0)die("R9 baseline missing.",32);
  if(read8(p("r10-addon.js")).indexOf("NXT_R10_LOCAL_LIBRARY")<0)die("R10 baseline missing.",33);
  if(read8(p("r11-addon.js")).indexOf("NXT_R11_PLAN_DOCUMENTATION")<0)die("R11 baseline missing.",34);

  var idx=p("index.html"),h=read8(idx);
  if(h.indexOf("<!doctype html>")!==0&&h.indexOf("<!DOCTYPE html>")!==0)die("index.html is not valid UTF-8 HTML.",40);

  var order=['src="app.js"','src="r4-addon.js"','src="r5-addon.js"','src="r6-addon.js"','src="r6-1-integration.js"','src="r7-addon.js"','src="r8-addon.js"','src="r8-1-compat.js"','src="r9-addon.js"','src="r10-addon.js"','src="r11-addon.js"'],last=-1;
  for(var j=0;j<order.length;j++){var pos=h.indexOf(order[j]);if(pos<0||pos<=last)die("Current load order is not intact at "+order[j],41+j);last=pos}

  if(!fso.FileExists(p("index.R11.before_R11_1.html")))fso.CopyFile(idx,p("index.R11.before_R11_1.html"),false);

  h=h.replace(/\s*<link rel="stylesheet" href="r11-1-responsive-text\.css">\s*/g,"\r\n");
  h=h.replace(/\s*<script src="r11-1-responsive-text\.js"><\/script>\s*/g,"\r\n");

  var hp=h.indexOf("</head>");if(hp<0)die("</head> not found.",60);
  h=h.substring(0,hp)+'<link rel="stylesheet" href="r11-1-responsive-text.css">\r\n'+h.substring(hp);

  var anchor='<script src="r11-addon.js"></script>',a=h.indexOf(anchor);if(a<0)die("R11 script tag not found.",61);
  a+=anchor.length;h=h.substring(0,a)+'\r\n<script src="r11-1-responsive-text.js"></script>'+h.substring(a);
  write8(idx,h);

  var v=read8(idx),p11=v.indexOf('src="r11-addon.js"'),p111=v.indexOf('src="r11-1-responsive-text.js"');
  if(p11<0||p111<=p11)die("R11.1 load order verification failed.",70);
  if(v.indexOf('href="r11-1-responsive-text.css"')<0)die("R11.1 CSS link missing.",71);

  WScript.Echo("PASS: R11.1 responsive text fix installed additively.");
  WScript.Echo("PASS: R11.1 loads after R11.");
  WScript.Echo("PASS: Existing R3-R11 runtime modules were NOT replaced.");
  WScript.Quit(0);
})();