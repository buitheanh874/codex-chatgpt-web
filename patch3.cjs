const fs = require('fs');
let content = fs.readFileSync('src/adapters/chatgpt-web/browser-worker.ts', 'utf8');
content = content.replace('name: "context_overflow.md",', 'name: "context_overflow.txt",');
content = content.replace('mimeType: "text/markdown",', 'mimeType: "text/plain",');
fs.writeFileSync('src/adapters/chatgpt-web/browser-worker.ts', content);
console.log('Patched file type to .txt');
