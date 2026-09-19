// Windows Script Host JScript installer for the R4 additive module.
(function(){
  var fso=new ActiveXObject("Scripting.FileSystemObject");
  var shell=new ActiveXObject("WScript.Shell");
  var root=fso.GetParentFolderName(WScript.ScriptFullName);
  function path(n){return fso.BuildPath(root,n);}
  function read(p){
    var s=fso.OpenTextFile(p,1,false,-1),t=s.ReadAll();s.Close();return t;
  }
  function write(p,t){
    var s=fso.OpenTextFile(p,2,true,-1);s.Write(t);s.Close();
  }
  function fail(m){WScript.Echo("ERROR: "+m);WScript.Quit(1);}
  var index=path("index.html"), app=path("app.js");
  if(!fso.FileExists(index))fail("index.html was not found. Run this installer from the NXT Gen Plans repository root.");
  if(!fso.FileExists(app))fail("app.js was not found. This does not look like the R3 repository root.");
  if(!fso.FileExists(path("r4-addon.js"))||!fso.FileExists(path("r4-addon.css")))fail("R4 add-on files are missing.");

  var html=read(index);
  if(html.indexOf("r4-addon.js")<0){
    var backup=path("index.R3.before_R4.html");
    if(!fso.FileExists(backup))fso.CopyFile(index,backup,false);
    html=html.replace("</head>",'<link rel="stylesheet" href="r4-addon.css">\r\n</head>');
    html=html.replace("</body>",'<script src="r4-addon.js"></script>\r\n</body>');
    write(index,html);
  }
  WScript.Echo("PASS: R4 plan-creation add-on installed.");
  WScript.Echo("R3 app.js was NOT modified.");
  WScript.Echo("Your existing START_NXT_GEN_PLANS.bat was NOT modified.");
  WScript.Quit(0);
})();