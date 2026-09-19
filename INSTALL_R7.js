// NXT Gen Plans 0.1 R7 - UTF-8 safe additive installer.
(function(){
  var fso=new ActiveXObject("Scripting.FileSystemObject");
  var root=fso.GetParentFolderName(WScript.ScriptFullName);
  function p(n){return fso.BuildPath(root,n)}
  function die(m,c){WScript.Echo("ERROR: "+m);WScript.Quit(c||1)}
  function read8(fp){var s=new ActiveXObject("ADODB.Stream");s.Type=2;s.Charset="utf-8";s.Open();s.LoadFromFile(fp);var t=s.ReadText(-1);s.Close();if(t.length&&t.charCodeAt(0)===0xFEFF)t=t.substr(1);return t}
  function write8(fp,t){var a=new ActiveXObject("ADODB.Stream");a.Type=2;a.Charset="utf-8";a.Open();a.WriteText(t);a.Position=0;a.Type=1;if(a.Size>=3)a.Position=3;var bytes=a.Read();a.Close();var b=new ActiveXObject("ADODB.Stream");b.Type=1;b.Open();b.Write(bytes);b.SaveToFile(fp,2);b.Close()}

  var idx=p("index.html");
  var required=["app.js","r4-addon.js","r5-addon.js","r6-addon.js","r6-1-integration.js","r7-addon.js","r7-addon.css"];
  for(var i=0;i<required.length;i++)if(!fso.FileExists(p(required[i])))die(required[i]+" is missing.",10+i);

  var r61=read8(p("r6-1-integration.js"));
  if(r61.indexOf("NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER")<0)die("R6.1 FIX2 marker is missing. R7 installation stopped.",30);
  if(r61.indexOf("observer.observe(document.body")>=0)die("Recursive R6.1 observer is present. R7 installation stopped.",31);

  var h=read8(idx);
  if(h.indexOf("<!doctype html>")!==0&&h.indexOf("<!DOCTYPE html>")!==0)die("index.html is not valid UTF-8 HTML.",40);
  var p4=h.indexOf('src="r4-addon.js"'),p5=h.indexOf('src="r5-addon.js"'),p6=h.indexOf('src="r6-addon.js"'),p61=h.indexOf('src="r6-1-integration.js"');
  if(p4<0||p5<0||p6<0||p61<0||!(p4<p5&&p5<p6&&p6<p61))die("Current R4 -> R5 -> R6 -> R6.1 load order is not intact.",41);

  if(!fso.FileExists(p("index.R6_1.before_R7.html")))fso.CopyFile(idx,p("index.R6_1.before_R7.html"),false);

  h=h.replace(/\s*<link rel="stylesheet" href="r7-addon\.css">\s*/g,"\r\n");
  h=h.replace(/\s*<script src="r7-addon\.js"><\/script>\s*/g,"\r\n");
  var hp=h.indexOf("</head>");if(hp<0)die("</head> not found.",50);
  h=h.substring(0,hp)+'<link rel="stylesheet" href="r7-addon.css">\r\n'+h.substring(hp);
  var anchor='<script src="r6-1-integration.js"></script>',pos=h.indexOf(anchor);if(pos<0)die("R6.1 integration script tag not found.",51);pos+=anchor.length;
  h=h.substring(0,pos)+'\r\n<script src="r7-addon.js"></script>'+h.substring(pos);write8(idx,h);

  var v=read8(idx),a=v.indexOf('src="app.js"'),b=v.indexOf('src="r4-addon.js"'),c=v.indexOf('src="r5-addon.js"'),d=v.indexOf('src="r6-addon.js"'),e=v.indexOf('src="r6-1-integration.js"'),f=v.indexOf('src="r7-addon.js"');
  if(a<0||b<0||c<0||d<0||e<0||f<0||!(a<b&&b<c&&c<d&&d<e&&e<f))die("Post-install script order verification failed.",60);
  if(v.indexOf('href="r7-addon.css"')<0)die("R7 stylesheet was not linked.",61);

  WScript.Echo("PASS: R7 installed additively.");
  WScript.Echo("PASS: Load order is app.js -> R4 -> R5 -> R6 -> R6.1 FIX2 -> R7.");
  WScript.Echo("PASS: Existing R3/R4/R5/R6/R6.1 files were NOT modified.");
  WScript.Quit(0);
})();
