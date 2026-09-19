// NXT Gen Plans 0.1 R11.2 — additive stabilization installer
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

  var required=[
    "index.html","app.js","r6-1-integration.js","r8-1-compat.js",
    "r9-addon.js","r10-addon.js","r11-addon.js",
    "r11-1-responsive-text.js","r11-2-stabilization.js"
  ];
  for(var i=0;i<required.length;i++)if(!fso.FileExists(p(required[i])))die(required[i]+" is missing.",10+i);

  if(read8(p("r6-1-integration.js")).indexOf("NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER")<0)die("R6.1 FIX2 marker missing.",30);
  if(read8(p("r6-1-integration.js")).indexOf("observer.observe(document.body")>=0)die("Recursive R6.1 observer found.",31);
  if(read8(p("r8-1-compat.js")).indexOf("NXT_R8_1_UNIVERSAL_CANVAS")<0)die("R8.1 missing.",32);
  if(read8(p("r9-addon.js")).indexOf("NXT_R9_MANUAL_GEOMETRY")<0)die("R9 missing.",33);
  if(read8(p("r10-addon.js")).indexOf("NXT_R10_LOCAL_LIBRARY")<0)die("R10 missing.",34);
  if(read8(p("r11-addon.js")).indexOf("NXT_R11_PLAN_DOCUMENTATION")<0)die("R11 missing.",35);
  if(read8(p("r11-1-responsive-text.js")).indexOf("NXT_R11_1_RESPONSIVE_TEXT")<0)die("R11.1 missing.",36);

  var idx=p("index.html"),h=read8(idx);
  var order=[
    'src="app.js"','src="r4-addon.js"','src="r5-addon.js"',
    'src="r6-addon.js"','src="r6-1-integration.js"',
    'src="r7-addon.js"','src="r8-addon.js"','src="r8-1-compat.js"',
    'src="r9-addon.js"','src="r10-addon.js"','src="r11-addon.js"',
    'src="r11-1-responsive-text.js"'
  ],last=-1;
  for(var j=0;j<order.length;j++){
    var pos=h.indexOf(order[j]);
    if(pos<0||pos<=last)die("Runtime order is not intact at "+order[j],40+j);
    last=pos;
  }

  if(!fso.FileExists(p("index.R11_1.before_R11_2.html")))fso.CopyFile(idx,p("index.R11_1.before_R11_2.html"),false);

  h=h.replace(/\s*<script src="r11-2-stabilization\.js"><\/script>\s*/g,"\r\n");
  var anchor='<script src="r11-1-responsive-text.js"></script>';
  var a=h.indexOf(anchor);if(a<0)die("R11.1 script tag not found.",70);
  a+=anchor.length;
  h=h.substring(0,a)+'\r\n<script src="r11-2-stabilization.js"></script>'+h.substring(a);
  write8(idx,h);

  var v=read8(idx),p111=v.indexOf('src="r11-1-responsive-text.js"'),p112=v.indexOf('src="r11-2-stabilization.js"');
  if(p111<0||p112<=p111)die("R11.2 load order verification failed.",71);

  WScript.Echo("PASS: R11.2 stabilization installed.");
  WScript.Echo("PASS: Existing R3-R11.1 runtime modules were NOT replaced.");
  WScript.Quit(0);
})();