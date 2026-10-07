const fs = require('fs');
let t = fs.readFileSync('template.html', 'utf8');
let rag = fs.readFileSync('rag.txt', 'utf8').replace('<button class="fp" data-q=', '<button class="btn" data-q=');
let n = 0;
function rep(a, b) { if (!t.includes(a)) { console.error('MISSING', a.slice(0, 70)); process.exitCode = 1; return; } t = t.replace(a, () => b); n++; }
rep('<a href="#engine">Discovery engine</a>', '<a href="#engine">Discovery engine</a><a href="#rag">Ask evidence</a>');
rep('<section id="decomp">', `<section id="rag">
  <div class="eyebrow">Ask the evidence · RAG bot</div>
  <h2>Ask why retrieval fails and get cited answers with a summary</h2>
  <p class="lede">The bot searches <span id="ragCorpus"></span>, picks the most relevant pieces and answers only from them. Citations such as [R12] jump to the source on the right. <b id="ragMode"></b></p>
  <div class="grid">
    <div class="card c8"><div id="ragChips" style="display:flex;gap:8px;flex-wrap:wrap"></div>
      <div class="ctrl" style="margin-top:12px"><input type="text" id="ragIn" placeholder="Ask about expressing, understanding, evaluating or refining…" aria-label="Your question"><button class="btn primary" id="ragGo">Ask</button><button class="btn" id="ragStop" hidden>Stop</button></div>
      <div id="ragOutWrap" hidden><div class="eyebrow" style="margin-top:8px">Question</div><p id="ragQ" style="font-weight:600;margin:0 0 6px"></p><div id="ragOut" class="ragout" aria-live="polite"></div></div></div>
    <div class="card c4"><h3>Retrieved evidence</h3><div class="sub">Click a citation to highlight its source</div><div id="ragSrc" style="max-height:640px;overflow:auto"></div></div>
  </div>
</section>

<section id="decomp">`);
rep('a{color:var(--accent)}\n</style>', `a{color:var(--accent)}
.ragout h4{font:600 17px var(--f-display);margin:18px 0 6px}
.ragout p{margin:6px 0;max-width:82ch}.ragout ul{margin:6px 0;padding-left:20px}.ragout li{margin:4px 0;max-width:82ch}
.cite{font:500 11px var(--f-mono);padding:1px 7px;border-radius:999px;border:1px solid var(--line);background:var(--soft);text-decoration:none;margin:0 2px;white-space:nowrap}
.rev.hl{background:var(--soft);outline:2px solid var(--accent);border-radius:8px;padding-inline:8px}
</style>`);
rep('const cnt=r=>r[1].filter(x=>x===\'●\').length;', 'window.RC_IV=IV;const cnt=r=>r[1].filter(x=>x===\'●\').length;');
rep('/* ---------- Theme toggle + boot ---------- */', rag + '\n/* ---------- Theme toggle + boot ---------- */');
fs.writeFileSync('template.html', t);
console.log('applied', n);
