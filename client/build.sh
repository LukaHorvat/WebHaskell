pulp build
psc-bundle "./output/**/*.js" -m Main --main Main -o scriptRaw.js
browserify --node scriptRaw.js -o script.js
rm scriptRaw.js
