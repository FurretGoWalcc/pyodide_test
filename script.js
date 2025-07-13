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

function findUACBankFiles(path = "/home/pyodide/out") {
  const results = [];

  const entries = pyodide.FS.readdir(path);
  for (const name of entries) {
    if (name === "." || name === "..") continue;

    const fullPath = path + "/" + name;
    try {
      const stat = pyodide.FS.stat(fullPath);

      if (pyodide.FS.isDir(stat.mode)) {
        results.push(...findUACBankFiles(fullPath)); // Recurse
      } else if (pyodide.FS.isFile(stat.mode) && name === "UACBANK.SC2Bank") {
        // Extract player ID from parent directory name
        const segments = fullPath.split("/");
        const playerId = segments.length >= 2 ? segments[segments.length - 3] : "Unknown";
        results.push({ playerId, path: fullPath });
      }
    } catch (e) {
      console.warn("Failed to stat", fullPath, e);
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

async function startup() {
  await initPyodide();
  await loadPackages();
}
async function runPython() {
  await talv();
  renderUACBankLinks(findUACBankFiles());
}

startup()
