// NXT Gen Plans R6.1 Integration Installer
// Baseline: accepted R6 at Git e9b7739d.
// UTF-8 safe and additive.
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

  var idx=p("index.html");
  if(!fso.FileExists(idx))die("index.html was not found.",10);
  for(var i=0;i<4;i++){
    var required=["r4-addon.js","r5-addon.js","r6-addon.js","app.js"][i];
    if(!fso.FileExists(p(required)))die(required+" is missing. R6.1 requires the complete accepted R6 baseline.",11+i);
  }
  if(!fso.FileExists(p("r6-1-integration.js"))||!fso.FileExists(p("r6-1-integration.css")))die("R6.1 files are missing.",16);

  var r5=read8(p("r5-addon.js"));
  if(r5.indexOf("NXT_R5_ROAD_POINTER_FIX1")<0)die("R5 FIX1 marker is missing.",20);
  var r6=read8(p("r6-addon.js"));
  if(r6.indexOf("NXT Gen Plans 0.1 R6")<0||r6.indexOf("window.NXT_R6")<0)die("r6-addon.js does not match the accepted R6 build.",21);

  var h=read8(idx);
  if(h.indexOf("<!doctype html>")!==0&&h.indexOf("<!DOCTYPE html>")!==0)die("index.html is not valid UTF-8 HTML.",30);
  var a=h.indexOf('src="r4-addon.js"'),b=h.indexOf('src="r5-addon.js"'),c=h.indexOf('src="r6-addon.js"');
  if(a<0||b<0||c<0||!(a<b&&b<c))die("R4 -> R5 -> R6 script order is not intact.",31);

  if(!fso.FileExists(p("index.R6.before_R6_1.html")))fso.CopyFile(idx,p("index.R6.before_R6_1.html"),false);

  h=h.replace(/\s*<link rel="stylesheet" href="r6-1-integration\.css">\s*/g,"\r\n");
  h=h.replace(/\s*<script src="r6-1-integration\.js"><\/script>\s*/g,"\r\n");

  var hp=h.indexOf("</head>");if(hp<0)die("</head> not found.",40);
  h=h.substring(0,hp)+'<link rel="stylesheet" href="r6-1-integration.css">\r\n'+h.substring(hp);

  var tag='<script src="r6-addon.js"></script>',pos=h.indexOf(tag);
  if(pos<0)die("R6 script tag was not found.",41);
  pos+=tag.length;
  h=h.substring(0,pos)+'\r\n<script src="r6-1-integration.js"></script>'+h.substring(pos);
  write8(idx,h);

  var v=read8(idx),r4p=v.indexOf('src="r4-addon.js"'),r5p=v.indexOf('src="r5-addon.js"'),r6p=v.indexOf('src="r6-addon.js"'),r61p=v.indexOf('src="r6-1-integration.js"');
  if(r4p<0||r5p<0||r6p<0||r61p<0||!(r4p<r5p&&r5p<r6p&&r6p<r61p))die("Post-install script order verification failed.",50);
  if(v.indexOf('href="r6-1-integration.css"')<0)die("R6.1 stylesheet reference is missing.",51);

  WScript.Echo("PASS: R6.1 installed additively.");
  WScript.Echo("PASS: Load order is R3 -> R4 -> R5 FIX1 -> R6 -> R6.1.");
  WScript.Echo("PASS: app.js, r4-addon.js, r5-addon.js and r6-addon.js were NOT modified.");
  WScript.Quit(0);
})();