const fs = require('fs');
let t = fs.readFileSync('template.html', 'utf8');

const sec = `<section id="research">
  <div class="eyebrow">Layer 3 · Primary research</div>
  <h2 id="svH"></h2>
  <p class="lede">Survey of <span id="svN"></span> people in India (Oct 2–6, 2026), anonymised as R01–R23. Convenience sample from the researcher's network, so read percentages as direction, not as population estimates. Interviews have not been run yet.</p>
  <div class="ctrl"><label for="svFilter">Respondents</label><select id="svFilter"><option value="all">All respondents</option><option value="gp">Google Photos as main app</option></select><span class="sub" id="svFilterN"></span></div>
  <div class="grid" id="svKpis"></div>
  <div class="grid" style="margin-top:14px">
    <div class="card c4"><h3>Did search find it first try?</h3><div class="sub">Last time they searched</div><div class="cv"><canvas id="svFirst"></canvas></div></div>
    <div class="card c4"><h3>How often a known photo goes missing</h3><div class="sub">They know it exists, cannot find it</div><div class="cv"><canvas id="svFreq"></canvas></div></div>
    <div class="card c4"><h3>Time spent hunting</h3><div class="sub">Last time it happened</div><div class="cv"><canvas id="svTime"></canvas></div></div>
    <div class="card c6"><h3>What they remembered before searching</h3><div class="sub">Pick all that apply · % of respondents</div><div class="cv tall"><canvas id="svClue"></canvas></div></div>
    <div class="card c6"><h3>Why they scroll instead of searching</h3><div class="sub">Single choice · % of respondents</div><div class="cv tall"><canvas id="svScroll"></canvas></div></div>
    <div class="card c6"><h3>Clues remembered, by search outcome</h3><div class="sub">% of respondents in each outcome group who named the clue. Group sizes in the header.</div><div class="scroll"><table class="heat" id="svHeatClue"></table></div></div>
    <div class="card c6"><h3>Reason for scrolling, by search outcome</h3><div class="sub">Count of respondents</div><div class="scroll"><table class="heat" id="svHeatScroll"></table></div></div>
    <div class="card c4"><h3>Library size</h3><div class="cv short"><canvas id="svLib"></canvas></div></div>
    <div class="card c4"><h3>Main photo app</h3><div class="cv short"><canvas id="svPlat"></canvas></div></div>
    <div class="card c4"><h3>Age group</h3><div class="cv short"><canvas id="svAge"></canvas></div></div>
    <div class="card c12"><h3>What the survey says, computed from the responses</h3><div id="svFind"></div></div>
    <div class="card c12"><h3>Triangulation: survey vs 117k reviews</h3><div class="scroll"><table id="svTri"></table></div></div>
    <div class="card c12"><h3>Respondent table</h3><div class="sub">Names removed. Each row is one respondent.</div><div class="scroll"><table id="svRows"></table></div></div>
  </div>
  <div class="grid" style="margin-top:14px">
    <div class="card c4"><div class="kpi"><div class="l">Survey responses</div><div class="v" id="svK1"></div><div class="d">Google Form, Oct 2–6, 2026</div></div></div>
    <div class="card c4"><div class="kpi"><div class="l">Interviews completed</div><div class="v">0 / 6</div><div class="d">Target 5–6 from one segment. Pending.</div></div></div>
    <div class="card c4"><div class="kpi"><div class="l">MVP tests completed</div><div class="v">0 / 3</div><div class="d">Same segment. Pending.</div></div></div>
    <div class="card c12"><h3>Hypotheses the interviews must test</h3><div id="hyp"></div></div>
  </div>
</section>`;
t = t.replace(/<section id="research">[\s\S]*?<\/section>/, () => sec);
t = t.replace('<script>const D=/*DATA*/;</script>', '<script>const D=/*DATA*/;D.survey=/*SURVEY*/;</script>');

const js = `
/* ---------- Primary research: survey ---------- */
const SVALL=D.survey;
const SVS={'Muscle memory / habit (used to endless social media scrolling)':'Habit / muscle memory','Search is unreliable, so I don\\'t bother':'Search is unreliable','Didn’t realize search could find specific photos':'Did not know search can do this','Easier than thinking of search keywords':'Easier than thinking of keywords'};
const shortScroll=s=>SVS[s]||s;
const TIMEO=['1 to 2 minutes','5 to 15 minutes','Over 30 minutes','I spent hours scrolling across multiple days'];
const TIMEL=['1–2 min','5–15 min','30+ min','Hours over days'];
const FREQO=['Rarely','A few times a year','A few times a month','Weekly or more'];
const LIBO=['1000-5000','5000-10000','10000-20000','20000+'];
const FIRSTO=['Yes, first try','Partially','Failed','No answer'];
let SV=SVALL;
const svCount=(f)=>{const o={};SV.forEach(r=>{const v=f(r);o[v]=(o[v]||0)+1});return o};
const svPct=(n)=>SV.length?+(100*n/SV.length).toFixed(0):0;
function svRebuild(){
  SV=$('svFilter').value==='gp'?SVALL.filter(r=>r.platform==='Google Photos'):SVALL;
  $('svFilterN').textContent='n = '+SV.length;
  svText();buildCharts();
}
function svText(){
  const n=SV.length,f=svCount(r=>r.first);
  const part=f['Partially']||0,yes=f['Yes, first try']||0,fail=f['Failed']||0;
  const slow=SV.filter(r=>r.time!==TIMEO[0]).length;
  const cc={};SV.forEach(r=>r.clues.forEach(c=>cc[c]=(cc[c]||0)+1));
  const ce=Object.entries(cc).sort((a,b)=>b[1]-a[1]);
  const none=cc['Only knew it existed']||0;
  const sc=svCount(r=>shortScroll(r.scroll));
  const avoid=(sc['Search is unreliable']||0)+(sc['Did not know search can do this']||0)+(sc['Easier than thinking of keywords']||0);
  const avgC=g=>{const a=SV.filter(r=>r.first===g&&!r.clues.includes('Only knew it existed'));return a.length?(a.reduce((s,r)=>s+r.clues.length,0)/a.length):null};
  const gpU=SV.filter(r=>r.uses!=='Never used it'&&r.uses!=='No, I use something else');
  $('svH').textContent=\`\${svPct(part)}% say search only partly worked the last time, and \${svPct(slow)}% needed 5+ minutes to find the photo\`;
  $('svN').textContent=n;$('svK1').textContent=SVALL.length;
  $('svKpis').innerHTML=[
   ['Search worked first try',svPct(yes)+'%',yes+' of '+n],
   ['Partly worked',svPct(part)+'%',part+' needed rephrasing or got few results'],
   ['Failed completely',svPct(fail)+'%',fail+' of '+n],
   ['Spent 5+ min hunting',svPct(slow)+'%',slow+' of '+n],
   ['Do not rely on search',svPct(avoid)+'%','scroll because search is unreliable, unknown or harder to phrase'],
   ['Remembered only “it exists”',svPct(none)+'%',none+' had no other clue to type'],
   ['Miss a known photo monthly+',svPct(SV.filter(r=>r.freq==='A few times a month'||r.freq==='Weekly or more').length)+'%','a few times a month or weekly'],
   ['Hunt scale',(SV.filter(r=>LIBO.indexOf(r.lib)>=1).length)+' of '+n,'have 5,000+ photos']
  ].map(k=>\`<div class="card kpi c3"><div class="l">\${esc(k[0])}</div><div class="v">\${esc(k[1])}</div><div class="d">\${esc(k[2])}</div></div>\`).join('');
  const lines=[];
  lines.push(\`Search is not failing outright. \${part} of \${n} (\${svPct(part)}%) got a partial result that needed rephrasing or had few matches, \${yes} (\${svPct(yes)}%) found it first time, and only \${fail} failed completely. The gap sits between "something came back" and "the right photo is confirmed".\`);
  lines.push(\`\${ce[0]?esc(ce[0][0]):'–'} is the most remembered clue (\${ce[0]?svPct(ce[0][1]):0}%), followed by \${ce[1]?esc(ce[1][0]):'–'} (\${ce[1]?svPct(ce[1][1]):0}%). People hold several fuzzy clues together, which keyword search handles one at a time.\`);
  const a1=avgC('Partially'),a2=avgC('Yes, first try');
  if(a1!=null&&a2!=null)lines.push(\`Respondents whose search only partly worked named on average \${a1.toFixed(1)} clue types; those who succeeded first try named \${a2.toFixed(1)}. Clue count alone does not explain success, so the issue is how clues are combined, not how many are remembered.\`);
  lines.push(\`\${svPct(none)}% remembered nothing except that the photo exists. For them there is no query to type.\`);
  lines.push(\`\${svPct(avoid)}% scroll because they distrust search, did not know it could find specific photos, or find keywords hard to think of. Only \${svPct(sc['Habit / muscle memory']||0)}% scroll out of habit. Scrolling is a workaround for failed trust and expression, not a preference.\`);
  lines.push(\`\${gpU.length} of \${n} use Google Photos at least occasionally; \${svCount(r=>r.platform)['Google Photos']||0} name it as their main app.\`);
  $('svFind').innerHTML=lines.map(l=>\`<div class="rev"><p>\${l}</p></div>\`).join('');
}
function distBar(id,keys,labels,getter,color,horiz){
  chart(id,()=>{const c=svCount(getter);const ks=keys||Object.keys(c).sort((a,b)=>c[b]-c[a]);
    const ds=[{data:ks.map(k=>svPct(c[k]||0)),backgroundColor:color||css('--accent')}];
    const cfg=(horiz?hbar:bar)((labels||ks).map((l,i)=>l+' ('+(c[ks[i]]||0)+')'),ds,{plugins:{legend:{display:false}},scales:horiz?{x:{beginAtZero:true,max:100,title:{display:true,text:'% of respondents'}},y:{grid:{display:false}}}:{x:{grid:{display:false}},y:{beginAtZero:true,max:100,title:{display:true,text:'% of respondents'}}}});
    return cfg;});
}
chart('svFirst',()=>{const c=svCount(r=>r.first);return{type:'doughnut',data:{labels:FIRSTO.map(k=>k+' ('+(c[k]||0)+')'),datasets:[{data:FIRSTO.map(k=>c[k]||0),backgroundColor:[css('--pos'),css('--neu'),css('--neg'),css('--unk')],borderColor:css('--panel'),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'bottom'}}}}});
distBar('svFreq',FREQO,FREQO,r=>r.freq,css('--neu'),true);
distBar('svTime',TIMEO,TIMEL,r=>r.time,css('--neg'),true);
chart('svClue',()=>{const cc={};SV.forEach(r=>r.clues.forEach(c=>cc[c]=(cc[c]||0)+1));const ks=Object.keys(cc).sort((a,b)=>cc[b]-cc[a]);return hbar(ks.map(k=>k+' ('+cc[k]+')'),[{data:ks.map(k=>svPct(cc[k])),backgroundColor:ks.map(k=>k==='Only knew it existed'?css('--neg'):css('--accent'))}],{plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100,title:{display:true,text:'% of respondents'}},y:{grid:{display:false}}}})});
distBar('svScroll',null,null,r=>shortScroll(r.scroll),css('--accent'),true);
distBar('svLib',LIBO,LIBO,r=>r.lib,css('--accent'),false);
distBar('svPlat',null,null,r=>r.platform==='Apple Photos / iCloud Photos'?'Apple Photos':r.platform==='Just a device gallery'?'Device gallery':r.platform,css('--accent'),true);
distBar('svAge',['16-24','24-30','30-40','40+'],['16–24','24–30','30–40','40+'],r=>r.age,css('--accent'),false);
$('svFilter').onchange=svRebuild;
function svTables(){
  const oc=['Yes, first try','Partially','Failed'];
  const cc={};SV.forEach(r=>r.clues.forEach(c=>cc[c]=(cc[c]||0)+1));const ks=Object.keys(cc).sort((a,b)=>cc[b]-cc[a]);
  const g=o=>SV.filter(r=>r.first===o);
  let h='<tr><th class="r">Clue</th>'+oc.map(o=>'<th>'+o+' (n='+g(o).length+')</th>').join('')+'</tr>';
  ks.forEach(k=>{const v=oc.map(o=>g(o).length?100*g(o).filter(r=>r.clues.includes(k)).length/g(o).length:0);const mx=Math.max(...v,1);
    h+='<tr><td class="r">'+esc(k)+'</td>'+v.map(x=>'<td class="h" style="background:color-mix(in srgb,var(--accent) '+Math.round(x*0.75)+'%,var(--panel))">'+(x?Math.round(x)+'%':'·')+'</td>').join('')+'</tr>'});
  $('svHeatClue').innerHTML=h;
  const sl=[...new Set(SV.map(r=>shortScroll(r.scroll)))];
  let h2='<tr><th class="r">Why they scroll</th>'+oc.map(o=>'<th>'+o+'</th>').join('')+'</tr>';
  sl.forEach(s=>{h2+='<tr><td class="r">'+esc(s)+'</td>'+oc.map(o=>{const v=SV.filter(r=>r.first===o&&shortScroll(r.scroll)===s).length;return '<td class="h" style="background:color-mix(in srgb,var(--neg) '+Math.min(75,v*14)+'%,var(--panel))">'+(v||'·')+'</td>'}).join('')+'</tr>'});
  $('svHeatScroll').innerHTML=h2;
  $('svRows').innerHTML='<tr><th>ID</th><th>Age</th><th>App</th><th>Library</th><th>How often</th><th>Time</th><th>First try</th><th>Clues remembered</th><th>Why scroll</th></tr>'+SV.map(r=>'<tr><td>'+r.id+'</td><td>'+r.age+'</td><td>'+esc(r.platform.replace(' / iCloud Photos',''))+'</td><td>'+r.lib+'</td><td>'+r.freq+'</td><td>'+esc(TIMEL[TIMEO.indexOf(r.time)]||r.time)+'</td><td>'+r.first+'</td><td>'+r.clues.map(c=>'<span class="pill">'+esc(c)+'</span>').join('')+'</td><td>'+esc(shortScroll(r.scroll))+'</td></tr>').join('');
}
function svTri(){
  const rev=(id)=>pct((RET.problems[id]||{n:0}).n,RET.count,0);
  const n=SV.length,f=svCount(r=>r.first),sc=svCount(r=>shortScroll(r.scroll));
  const rows=[
   ['Search returns something but not the right thing',svPct(f['Partially']||0)+'% partial first try','"Search returns nothing / the wrong thing" + "Finding things is hard": '+rev('search_fail')+' + '+rev('hard_find')+' of retrieval reviews'],
   ['Scrolling is the fallback',svPct(sc['Habit / muscle memory']||0)+'% habit; '+svPct((sc['Search is unreliable']||0)+(sc['Did not know search can do this']||0)+(sc['Easier than thinking of keywords']||0))+'% distrust or cannot phrase','Scroll is the top workaround: '+((RET.work.scroll||{}).n||0)+' mentions; "Scrolling forever" reaches '+rev('scroll')+' of reviews'],
   ['Fuzzy clues, not exact ones',svPct(SV.filter(r=>r.clues.includes('Rough time')).length)+'% remember rough time vs '+svPct(SV.filter(r=>r.clues.includes('Exact date')).length)+'% exact date','Wrong dates / order: '+rev('dates')+'; "wants smarter search": '+rev('smart_search')],
   ['Nothing to type',svPct(SV.filter(r=>r.clues.includes('Only knew it existed')).length)+'% only know it exists','Memory gap stated outright in '+pct(Object.values(RET.forgot).reduce((a,b)=>a+b.n,0),RET.count,0)+' of reviews']
  ];
  $('svTri').innerHTML='<tr><th>Signal</th><th>Survey (n='+n+')</th><th>Reviews (n='+RET.count+' retrieval)</th></tr>'+rows.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>').join('');
}
const _svText=svText;svText=function(){_svText();svTables();svTri()};
`;
// make svText reassignable (function declaration is fine to reassign in sloppy mode inside IIFE)
t = t.replace("/* ---------- Theme toggle + boot ---------- */", () => js + "\nsvText();$('svFilterN').textContent='n = '+SV.length;\n/* ---------- Theme toggle + boot ---------- */");
fs.writeFileSync('template.html', t);
