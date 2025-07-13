# Purpose
This tool is a web-based deployment of [Talv's command line utility](https://github.com/Talv/sc2-repdump/tree/master), designed around recreating Starcraft 2 bankfiles from a replay.
The site can be found [here](https://furretgowalcc.github.io/s2webbankrebuilder/), with included directions.

# Implementation
- This tool uses [pyodide](https://pyodide.org/en/stable/), which allows webpages to run a subset of pure-python in the browser. This handily sidesteps the issue of backends and hosting that would typically be necessary for deployment, and instead let's this project just use
static files served up by GitHub Pages.
- The site itself is nothing fancy- some HTML elements with a backing script to do the heavy lifting of processing the replay.
- Pyodide has some [built-in](https://pyodide.org/en/stable/usage/packages-in-pyodide.html) Python packages, but several of the packages used in this project are not trivially availiable, and so are packaged into bundle.zip and served up to the site on load. This zip file can be
generated as an artifact of this project's workflow, although it must currently be manually updated and pushed to the repo.
