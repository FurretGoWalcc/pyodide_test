let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide(); // loads full Python runtime
  console.log("Pyodide loaded");
  document.getElementById("run-btn").addEventListener("click", runPython);
  window.pyodide = pyodide; // for browser console usage
}

async function loadPackages() {
  // Mount your bundled code into Pyodide's filesystem
  const response = await fetch("bundle.zip"); // create this next
  const buffer = await response.arrayBuffer();
  pyodide.FS.writeFile("/tmp/bundle.zip", new Uint8Array(buffer));
  pyodide.runPython(`
    import zipfile
    import sys
    zipfile.ZipFile("/tmp/bundle.zip").extractall(path="/")
    sys.path.insert(0, "/dep")
  `);
}

async function talv() {
  // Read file from html element
  const file = document.getElementById("file-input").files[0];
  const data = await file.arrayBuffer();

  // Write file to Pyodide's virtual filesystem
  const filePath = "/tmp/upload.SC2Replay";  // or whatever extension your tool expects
  pyodide.FS.writeFile(filePath, new Uint8Array(data)); 

  // Mimic using talv's tool from CLI
  let output = await pyodide.runPythonAsync(`
    from s2repdump.main import cli
    import sys
    sys.argv = ["s2repdump", "--bank-rebuild", "${filePath}"]
    from io import StringIO
    import contextlib

    with contextlib.redirect_stdout(StringIO()) as f:
        cli()
    result = f.getvalue()
  `);

  document.getElementById("output").textContent = output;
}

function findUACBankFiles() {
  const results = [];

  const entries = pyodide.FS.readdir("/home/pyodide/out/");
  for (const name of entries) {
    if (name === "." || name === "..") continue;

    const dirPath = "/home/pyodide/out/" + "/" + name;
    try {
      const stat = pyodide.FS.stat(dirPath);

      if (pyodide.FS.isDir(stat.mode)) {
        for (const file of pyodide.FS.readdir(dirPath)) {
          if (file === "UACBANK.SC2Bank") {
            // Extract player ID from parent directory name
            const segments = fullPath.split("/");
            const playerId = segments.length >= 2 ? segments[segments.length - 2] : "Unknown";
            results.push({ playerId, path: dirPath+"/"+file });
         }
        }
      }
    } catch (e) {
      console.warn("Failed to stat", dirPath, e);
    }
  }
  return results;
}

function renderUACBankLinks(files) {
  const list = document.getElementById("file-list");
  list.innerHTML = "";

  for (const file of files) {
    const data = pyodide.FS.readFile(file.path);
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.playerId}-UACBANK.SC2Bank`;
    link.textContent = `${file.playerId}: UACBANK.SC2Bank`;

    const li = document.createElement("li");
    li.appendChild(link);
    list.appendChild(li);
  }
}

async function runPython() {
  await talv();
  renderUACBankLinks(findUACBankFiles);
}

// Load Pyodide on page load
initPyodide();
loadPackages();
