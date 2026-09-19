(function(){
  var fso=new ActiveXObject("Scripting.FileSystemObject");
  var root=fso.GetParentFolderName(WScript.ScriptFullName);
  function path(n){return fso.BuildPath(root,n);}
  var idx=path("index.html"),bak=path("index.R3.before_R4.html");
  if(!fso.FileExists(bak)){WScript.Echo("No R3 backup index found.");WScript.Quit(1);}
  fso.CopyFile(bak,idx,true);
  WScript.Echo("R3 index.html restored. R4 add-on files were left in place but are no longer loaded.");
})();