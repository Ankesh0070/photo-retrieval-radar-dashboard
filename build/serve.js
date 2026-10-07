const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
http.createServer((q, s) => {
  const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(p, (e, b) => {
    if (e) { s.writeHead(404); return s.end('nf'); }
    s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain', 'Cache-Control': 'no-store' });
    s.end(b);
  });
}).listen(8123);
