const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace("innerHTML = \`\\\${accountBalance.toLocaleString()}\`;", "innerHTML = \`$${accountBalance.toLocaleString()}\`;");
fs.writeFileSync('index.html', html);
