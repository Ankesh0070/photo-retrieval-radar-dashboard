const fs = require('fs');
let t = fs.readFileSync('template.html', 'utf8');
const html = `
  <div class="eyebrow" style="margin-top:36px">Interviews · why retrieval fails</div>
  <h2>Four interviewees start from a year or month; two never knew text search existed</h2>
  <p class="lede">Voice interviews with a fixed question guide. Five transcripts were received. Transcripts 2 and 3 are word-for-word the same conversation, so they count once, giving four distinct participants (P1–P4). A sixth transcript has not been provided. Names are removed. Quotes are verbatim from the transcripts, including filler words.</p>
  <div class="grid" id="ivKpis"></div>
  <div class="grid" style="margin-top:14px">
    <div class="card c12"><h3>Themes across interviews</h3><div class="sub">● said explicitly · ◐ partly or implied · – not raised</div><div class="scroll"><table class="heat" id="ivMat"></table></div></div>
    <div class="card c12"><h3>Retrieval journey, side by side</h3><div class="sub">Verbatim answers</div><div class="scroll"><table id="ivJour"></table></div></div>
    <div class="card c12"><h3>What the interviews say</h3><div id="ivFind"></div>
      <div class="take">Read with care: n = 4. P3's call had audio and language difficulty, and the interviewer explained the search option to P3 mid-call, which may have prompted an answer. P1's account is partly about Google Drive photos. Use these as patterns and wording, not percentages.</div></div>
  </div>`;
t = t.replace('<div class="grid" style="margin-top:14px">\n    <div class="card c4"><div class="kpi"><div class="l">Survey responses</div>', () => html + '\n  <div class="grid" style="margin-top:14px">\n    <div class="card c4"><div class="kpi"><div class="l">Survey responses</div>');
t = t.replace('<div class="v">0 / 6</div><div class="d">Target 5–6 from one segment. Pending.</div>', '<div class="v">4 / 6</div><div class="d">Distinct interviews so far; target 5–6</div>');
t = t.replace(' Interviews have not been run yet.', ' Interviews follow below.');
t = t.replace("/* ---------- Theme toggle + boot ---------- */", () => fs.readFileSync('iv.txt', 'utf8') + "\n/* ---------- Theme toggle + boot ---------- */");
fs.writeFileSync('template.html', t);
