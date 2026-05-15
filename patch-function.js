const fs = require('fs');
let func = fs.readFileSync('netlify/functions/create-metaapi-account.mts', 'utf8');
if (!func.includes('import crypto')) {
  func = func.replace('import type { Config }', 'import crypto from "node:crypto";\nimport type { Config }');
  fs.writeFileSync('netlify/functions/create-metaapi-account.mts', func);
  console.log('Added crypto import');
}
