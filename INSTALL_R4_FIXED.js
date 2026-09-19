// NXT Gen Plans R4 - UTF-8 SAFE INSTALLER
// Fixes the R4 installer encoding failure without modifying app.js.

(function () {
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);

  function path(name) {
    return fso.BuildPath(root, name);
  }

  function fail(message, code) {
    WScript.Echo("ERROR: " + message);
    WScript.Quit(code || 1);
  }

  function readUtf8(filePath) {
    var s = new ActiveXObject("ADODB.Stream");
    s.Type = 2; // text
    s.Charset = "utf-8";
    s.Open();
    s.LoadFromFile(filePath);
    var text = s.ReadText(-1);
    s.Close();

    // Strip BOM character if ADODB exposes it.
    if (text.length && text.charCodeAt(0) === 0xFEFF) {
      text = text.substr(1);
    }
    return text;
  }

  function writeUtf8NoBom(filePath, text) {
    var textStream = new ActiveXObject("ADODB.Stream");
    textStream.Type = 2; // text
    textStream.Charset = "utf-8";
    textStream.Open();
    textStream.WriteText(text);

    // Convert to binary and skip UTF-8 BOM (EF BB BF).
    textStream.Position = 0;
    textStream.Type = 1; // binary
    if (textStream.Size >= 3) {
      textStream.Position = 3;
    }
    var bytes = textStream.Read();
    textStream.Close();

    var binaryStream = new ActiveXObject("ADODB.Stream");
    binaryStream.Type = 1;
    binaryStream.Open();
    binaryStream.Write(bytes);
    binaryStream.SaveToFile(filePath, 2); // overwrite
    binaryStream.Close();
  }

  var indexPath = path("index.html");
  var appPath = path("app.js");
  var addonJsPath = path("r4-addon.js");
  var addonCssPath = path("r4-addon.css");
  var backupPath = path("index.R3.before_R4.html");

  if (!fso.FileExists(indexPath)) {
    fail("index.html was not found. Put the R4 installer files in the root of the working NEXT-Gen-Plans repo.", 10);
  }
  if (!fso.FileExists(appPath)) {
    fail("app.js was not found. This does not appear to be the NXT Gen Plans repo root.", 11);
  }
  if (!fso.FileExists(addonJsPath)) {
    fail("r4-addon.js is missing.", 12);
  }
  if (!fso.FileExists(addonCssPath)) {
    fail("r4-addon.css is missing.", 13);
  }

  var html = readUtf8(indexPath);

  // Validate the source document BEFORE touching it.
  if (html.indexOf("<!doctype html>") !== 0 &&
      html.indexOf("<!DOCTYPE html>") !== 0) {
    fail("index.html does not begin with a valid HTML doctype. Installation stopped without modifying the file.", 20);
  }

  if (html.indexOf('<meta charset="utf-8">') < 0 &&
      html.indexOf("<meta charset='utf-8'>") < 0) {
    fail("index.html is not the expected UTF-8 R3 document. Installation stopped without modifying the file.", 21);
  }

  if (html.indexOf('id="app"') < 0 || html.indexOf("app.js") < 0) {
    fail("index.html does not match the expected R3 application structure. Installation stopped.", 22);
  }

  // Create a byte-for-byte backup only if one does not already exist.
  // FileSystemObject.CopyFile does not reinterpret encoding.
  if (!fso.FileExists(backupPath)) {
    fso.CopyFile(indexPath, backupPath, false);
  }

  var changed = false;

  if (html.indexOf('href="r4-addon.css"') < 0) {
    var headTag = "</head>";
    var headPos = html.indexOf(headTag);
    if (headPos < 0) {
      fail("Could not find </head>. No changes were written.", 30);
    }
    html = html.substring(0, headPos) +
      '<link rel="stylesheet" href="r4-addon.css">\r\n' +
      html.substring(headPos);
    changed = true;
  }

  if (html.indexOf('src="r4-addon.js"') < 0) {
    var bodyTag = "</body>";
    var bodyPos = html.lastIndexOf(bodyTag);
    if (bodyPos < 0) {
      fail("Could not find </body>. No changes were written.", 31);
    }
    html = html.substring(0, bodyPos) +
      '<script src="r4-addon.js"></script>\r\n' +
      html.substring(bodyPos);
    changed = true;
  }

  if (changed) {
    writeUtf8NoBom(indexPath, html);
  }

  // Re-read what was actually written and verify it.
  var verify = readUtf8(indexPath);

  if (verify.indexOf("<!doctype html>") !== 0 &&
      verify.indexOf("<!DOCTYPE html>") !== 0) {
    fail("Post-install verification failed: HTML doctype was damaged.", 40);
  }
  if (verify.indexOf('href="r4-addon.css"') < 0) {
    fail("Post-install verification failed: r4-addon.css reference is missing.", 41);
  }
  if (verify.indexOf('src="r4-addon.js"') < 0) {
    fail("Post-install verification failed: r4-addon.js reference is missing.", 42);
  }
  if (verify.indexOf('id="app"') < 0 || verify.indexOf("app.js") < 0) {
    fail("Post-install verification failed: R3 app structure is no longer intact.", 43);
  }

  if (changed) {
    WScript.Echo("PASS: R4 references were installed using UTF-8-safe I/O.");
  } else {
    WScript.Echo("PASS: R4 was already installed. No duplicate references were added.");
  }

  WScript.Echo("PASS: index.html remains valid UTF-8 HTML.");
  WScript.Echo("PASS: app.js was NOT modified.");
  WScript.Echo("PASS: START_NXT_GEN_PLANS.bat was NOT modified.");
  WScript.Quit(0);
})();
