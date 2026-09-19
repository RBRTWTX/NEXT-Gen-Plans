// NXT Gen Plans R6 - UTF-8 safe additive installer.
// Requires accepted R5 FIX1. Does not alter R3/R4/R5 source files.
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

  var idx=p("index.html"),r5=p("r5-addon.js");
  if(!fso.FileExists(idx))die("index.html not found.",10);
  if(!fso.FileExists(p("app.js"))||!fso.FileExists(p("r4-addon.js"))||!fso.FileExists(r5))die("R3/R4/R5 baseline files are missing.",11);
  if(!fso.FileExists(p("r6-addon.js"))||!fso.FileExists(p("r6-addon.css")))die("R6 add-on files are missing.",12);

  var r5src=read8(r5);
  if(r5src.indexOf("NXT_R5_ROAD_POINTER_FIX1")<0)die("Accepted R5 FIX1 marker is missing. R6 installation stopped.",13);

  var h=read8(idx);
  if(h.indexOf("<!doctype html>")!==0&&h.indexOf("<!DOCTYPE html>")!==0)die("index.html is not valid UTF-8 HTML.",20);
  if(h.indexOf('src="r4-addon.js"')<0||h.indexOf('src="r5-addon.js"')<0)die("R4/R5 load order is incomplete.",21);
  if(h.indexOf('id="app"')<0||h.indexOf("app.js")<0)die("Unexpected R3 application structure.",22);

  if(!fso.FileExists(p("index.R5.before_R6.html")))fso.CopyFile(idx,p("index.R5.before_R6.html"),false);

  var changed=false;
  if(h.indexOf('href="r6-addon.css"')<0){
    var hp=h.indexOf("</head>");if(hp<0)die("</head> not found.",30);
    h=h.substring(0,hp)+'<link rel="stylesheet" href="r6-addon.css">\r\n'+h.substring(hp);changed=true;
  }
  if(h.indexOf('src="r6-addon.js"')<0){
    var r5tag='<script src="r5-addon.js"></script>';
    var pos=h.indexOf(r5tag);
    if(pos<0)die("Could not locate the R5 script tag.",31);
    pos+=r5tag.length;
    h=h.substring(0,pos)+'\r\n<script src="r6-addon.js"></script>'+h.substring(pos);changed=true;
  }

  if(changed)write8(idx,h);
  var v=read8(idx);
  var a=v.indexOf('src="r4-addon.js"'),b=v.indexOf('src="r5-addon.js"'),c=v.indexOf('src="r6-addon.js"');
  if(a<0||b<0||c<0||!(a<b&&b<c)||v.indexOf('href="r6-addon.css"')<0)die("Post-install load-order verification failed.",40);

  WScript.Echo(changed?"PASS: R6 installed additively.":"PASS: R6 was already installed; no duplicate references added.");
  WScript.Echo("PASS: Script order remains app.js -> R4 -> R5 -> R6.");
  WScript.Echo("PASS: app.js, r4-addon.js and r5-addon.js were NOT modified.");
  WScript.Quit(0);
})();