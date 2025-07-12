let pyodide;

async function loadPyodideAndPackages() {
  pyodide = await loadPyodide(); // loads full Python runtime
  console.log("Pyodide loaded");
  document.getElementById("run-btn").addEventListener("click", runPython);
}

async function runPython() {
  let output = await pyodide.runPythonAsync(`
    from io import StringIO
    import sys
    sys.stdout = StringIO()
    print("hello world")
    sys.stdout.getvalue()
  `);

  document.getElementById("output").textContent = output;
}

// Load Pyodide on page load
loadPyodideAndPackages();
