const fs = require('fs');
let t = fs.readFileSync('template.html', 'utf8');
const html = `
  <div class="eyebrow" style="margin-top:36px">Survey B · deeper retrieval behaviour</div>
  <h2 id="sbH"></h2>
  <p class="lede"><span id="sbN"></span> respondents answered a longer questionnaire about half-remembered photos: what they remember, what they type, why search fails, what they do next, and what would build trust. Names and phone numbers are not shown.</p>
  <div class="grid" id="sbKpis"></div>
  <div class="grid" style="margin-top:14px">
    <div class="card c6"><h3>How often they search for something half remembered</h3><div class="cv short"><canvas id="sbFreq"></canvas></div></div>
    <div class="card c6"><h3>What they last looked for</h3><div class="cv short"><canvas id="sbItem"></canvas></div></div>
    <div class="card c6"><h3>Clues remembered first</h3><div class="sub">Up to 3</div><div class="cv tall"><canvas id="sbClues"></canvas></div></div>
    <div class="card c6"><h3>What they type into search</h3><div class="sub">Up to 3. Compare with the clues on the left.</div><div class="cv tall"><canvas id="sbEnter"></canvas></div></div>
    <div class="card c6"><h3>Confidence they can describe it well enough</h3><div class="cv short"><canvas id="sbConf"></canvas></div></div>
    <div class="card c6"><h3>Biggest reason the search fails</h3><div class="cv"><canvas id="sbFail"></canvas></div></div>
    <div class="card c6"><h3>Very next step after a failed search</h3><div class="cv"><canvas id="sbNext"></canvas></div></div>
    <div class="card c6"><h3>How frustrating a failed search is</h3><div class="cv"><canvas id="sbFrus"></canvas></div></div>
    <div class="card c6"><h3>Preferred help when Photos does not understand</h3><div class="cv"><canvas id="sbPref"></canvas></div></div>
    <div class="card c6"><h3>What builds trust in a result</h3><div class="cv"><canvas id="sbTrust"></canvas></div></div>
    <div class="card c6"><h3>Hardest text to search inside an image</h3><div class="sub">Up to 3</div><div class="cv tall"><canvas id="sbHard"></canvas></div></div>
    <div class="card c6"><h3>What would narrow broad results</h3><div class="sub">Up to 3</div><div class="cv tall"><canvas id="sbNarrow"></canvas></div></div>
    <div class="card c6"><h3>Confidence vs frustration</h3><div class="sub">Count of respondents</div><div class="scroll"><table class="heat" id="sbHeat"></table></div></div>
    <div class="card c6"><h3>Reason for failure vs next step</h3><div class="sub">Count of respondents</div><div class="scroll"><table class="heat" id="sbHeat2"></table></div></div>
    <div class="card c12"><h3>What Survey B says, computed from the responses</h3><div id="sbFind"></div></div>
    <div class="card c12"><h3>In their own words</h3><div class="sub">Recent frustrating experience, verbatim, with the respondent's own answers alongside</div><div id="sbStories"></div></div>
  </div>`;
t = t.replace('<div class="grid" style="margin-top:14px">\n    <div class="card c4"><div class="kpi"><div class="l">Survey responses</div>', () => html + '\n  <div class="grid" style="margin-top:14px">\n    <div class="card c4"><div class="kpi"><div class="l">Survey responses</div>');
t = t.replace('D.survey=/*SURVEY*/;', 'D.survey=/*SURVEY*/;D.surveyB=/*SURVEYB*/;');
t = t.replace(/Survey of <span id="svN"><\/span> people in India \(Oct 2–6, 2026\), anonymised as R01–R23\./, 'Two surveys, anonymised. Survey A: <span id="svN"></span> people (R01–R23, Oct 2–6, 2026) on how often and how long retrieval takes. Survey B: 18 people (S01–S18, Oct 1–3, 2026) on memory, queries and trust.');
t = t.replace(/<div class="eyebrow">Layer 3 · Primary research<\/div>/, '<div class="eyebrow">Layer 3 · Primary research · Survey A</div>');
t = t.replace('<div class="d">Google Form, Oct 2–6, 2026</div>', '<div class="d">Survey A (n=23) + Survey B (n=18) = 41</div>');
t = t.replace("$('svN').textContent=n;$('svK1').textContent=SVALL.length;", "$('svN').textContent=n;$('svK1').textContent=SVALL.length+D.surveyB.length;");
t = t.replace("/* ---------- Theme toggle + boot ---------- */", () => fs.readFileSync('svb.txt', 'utf8') + "\n/* ---------- Theme toggle + boot ---------- */");
fs.writeFileSync('template.html', t);
let a = fs.readFileSync('assemble.js', 'utf8');
a = a.replace(".replace('/*SURVEY*/'", ".replace('/*SURVEYB*/', () => fs.readFileSync('survey2.json','utf8')).replace('/*SURVEY*/'");
fs.writeFileSync('assemble.js', a);
