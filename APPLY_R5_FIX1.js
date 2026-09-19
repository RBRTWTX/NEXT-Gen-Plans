// NXT Gen Plans R5 FIX1
// Repairs the TCP+ multi-segment roadway event collision without modifying R3/R4.

(function () {
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);

  function p(name) { return fso.BuildPath(root, name); }
  function fail(msg, code) { WScript.Echo("ERROR: " + msg); WScript.Quit(code || 1); }

  function readUtf8(filePath) {
    var s = new ActiveXObject("ADODB.Stream");
    s.Type = 2;
    s.Charset = "utf-8";
    s.Open();
    s.LoadFromFile(filePath);
    var text = s.ReadText(-1);
    s.Close();
    if (text.length && text.charCodeAt(0) === 0xFEFF) text = text.substr(1);
    return text;
  }

  function writeUtf8NoBom(filePath, text) {
    var t = new ActiveXObject("ADODB.Stream");
    t.Type = 2;
    t.Charset = "utf-8";
    t.Open();
    t.WriteText(text);
    t.Position = 0;
    t.Type = 1;
    if (t.Size >= 3) t.Position = 3;
    var bytes = t.Read();
    t.Close();

    var b = new ActiveXObject("ADODB.Stream");
    b.Type = 1;
    b.Open();
    b.Write(bytes);
    b.SaveToFile(filePath, 2);
    b.Close();
  }

  var target = p("r5-addon.js");
  var backup = p("r5-addon.before_FIX1.js");

  if (!fso.FileExists(target)) fail("r5-addon.js was not found in this folder.", 10);

  var src = readUtf8(target);

  if (src.indexOf("NXT Gen Plans 0.1 R5") < 0 ||
      src.indexOf("r5RoadPath") < 0 ||
      src.indexOf("window.NXT_R5") < 0) {
    fail("r5-addon.js does not match the expected pushed R5 build. No changes made.", 20);
  }

  if (src.indexOf("NXT_R5_ROAD_POINTER_FIX1") >= 0) {
    WScript.Echo("PASS: R5 FIX1 is already present. No duplicate patch added.");
    WScript.Quit(0);
  }

  if (!fso.FileExists(backup)) {
    fso.CopyFile(target, backup, false);
  }

  var patch = [
    "",
    "/* NXT_R5_ROAD_POINTER_FIX1",
    "   R3's generic pointerdown handler treats unknown tools as box-drawing tools.",
    "   r5RoadPath is click-driven, so capture its pointerdown first and prevent",
    "   only the R3 pointerdown from changing the tool before R5 receives click.",
    "*/",
    "(() => {",
    "  if (window.__NXT_R5_ROAD_POINTER_FIX1) return;",
    "  window.__NXT_R5_ROAD_POINTER_FIX1 = true;",
    "  const svg = document.querySelector('#pageSvg');",
    "  if (!svg) { console.error('R5 FIX1: #pageSvg not found.'); return; }",
    "  svg.addEventListener('pointerdown', e => {",
    "    if (state.tool !== 'r5RoadPath' || e.button !== 0) return;",
    "    e.stopImmediatePropagation();",
    "  }, true);",
    "  const btn = document.querySelector('#r5AdvancedBtn');",
    "  if (btn) btn.title = 'Advanced temporary traffic-control design tools — R5 FIX1';",
    "  console.info('NXT R5 FIX1: multi-segment roadway pointer collision repaired.');",
    "})();",
    ""
  ].join("\r\n");

  writeUtf8NoBom(target, src + patch);

  var verify = readUtf8(target);
  if (verify.indexOf("NXT_R5_ROAD_POINTER_FIX1") < 0 ||
      verify.indexOf("e.stopImmediatePropagation();") < 0) {
    fail("Post-write verification failed.", 30);
  }

  WScript.Echo("PASS: R5 FIX1 applied.");
  WScript.Echo("PASS: r5-addon.js remains UTF-8.");
  WScript.Echo("PASS: R3 app.js, R4, index.html and launcher were NOT modified.");
  WScript.Quit(0);
})();