let pyodide;

async function loadPyodideAndPackages() {
  pyodide = await loadPyodide(); // loads full Python runtime
  console.log("Pyodide loaded");
  document.getElementById("run-btn").addEventListener("click", runPython);

  // Mount your bundled code into Pyodide's filesystem
  const response = await fetch("bundle.zip"); // create this next
  const buffer = await response.arrayBuffer();
  pyodide.FS.writeFile("/tmp/bundle.zip", new Uint8Array(buffer));
  pyodide.runPython(`
    import zipfile
    import sys
    zipfile.ZipFile("/tmp/bundle.zip").extractall()
    sys.path.insert(0, "/dep")
  `);
}

async function runPython() {
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

// Load Pyodide on page load
loadPyodideAndPackages();
