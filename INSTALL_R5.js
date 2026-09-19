// NXT Gen Plans R5 - UTF-8 safe additive installer.
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
  if(!fso.FileExists(idx))die("index.html not found.",10);
  if(!fso.FileExists(p("r4-addon.js")))die("Accepted R4 is missing. R5 will not install.",11);
  if(!fso.FileExists(p("r5-addon.js"))||!fso.FileExists(p("r5-addon.css")))die("R5 add-on files are missing.",12);
  var h=read8(idx);
  if(h.indexOf("<!doctype html>")!==0&&h.indexOf("<!DOCTYPE html>")!==0)die("index.html is not valid UTF-8 HTML.",20);
  if(h.indexOf('src="r4-addon.js"')<0)die("R4 is not linked in index.html. R5 requires the accepted R4 baseline.",21);
  if(h.indexOf('id="app"')<0||h.indexOf("app.js")<0)die("Unexpected application structure.",22);
  if(!fso.FileExists(p("index.R4.before_R5.html")))fso.CopyFile(idx,p("index.R4.before_R5.html"),false);
  var changed=false;
  if(h.indexOf('href="r5-addon.css"')<0){
    var hp=h.indexOf("</head>");if(hp<0)die("</head> not found.",30);
    h=h.substring(0,hp)+'<link rel="stylesheet" href="r5-addon.css">\r\n'+h.substring(hp);changed=true;
  }
  if(h.indexOf('src="r5-addon.js"')<0){
    var bp=h.lastIndexOf("</body>");if(bp<0)die("</body> not found.",31);
    h=h.substring(0,bp)+'<script src="r5-addon.js"></script>\r\n'+h.substring(bp);changed=true;
  }
  if(changed)write8(idx,h);
  var v=read8(idx);
  if(v.indexOf('src="r4-addon.js"')<0||v.indexOf('src="r5-addon.js"')<0||v.indexOf('href="r5-addon.css"')<0)die("Post-install verification failed.",40);
  WScript.Echo(changed?"PASS: R5 installed safely.":"PASS: R5 already installed; no duplicate references added.");
  WScript.Echo("PASS: R3 app.js and R4 add-on were not modified.");
  WScript.Quit(0);
})();