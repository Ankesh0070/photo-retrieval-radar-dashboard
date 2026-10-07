const fs = require('fs');
const { parse } = require('csv-parse');
const RR = require('./rules.js');

const SRC = '../Google_Photos_Master_Reviews.csv';
const grp = p => {
  if (p.startsWith('Google Play')) return 'Google Play';
  if (p === 'Apple App Store') return 'App Store';
  if (p.startsWith('Stack Exchange')) return 'Stack Exchange';
  if (p === 'Google Support Community') return 'Google Support';
  if (p === 'Wikipedia (Open Knowledge)') return 'Wikipedia';
  return p;
};
const channel = g => g === 'Google Play' ? 'Android' : g === 'App Store' ? 'iOS' : g === 'YouTube' ? 'YouTube' : 'Community';
const sentOf = r => r == null ? 'unk' : r <= 2 ? 'neg' : r === 3 ? 'neu' : 'pos';
const inc = (o, k, d = 1) => { o[k] = (o[k] || 0) + d; };
const parseDate = s => {
  if (!s || !/^\d{4}-\d{2}/.test(s)) return null;
  const y = +s.slice(0, 4), m = +s.slice(5, 7);
  if (y < 2012 || y > 2026) return null;
  return { y, m, ym: s.slice(0, 7) };
};

const STOP = new Set('the and to is it of my i that this for in not but with on can have app are was be you so as at or if me they when from just all one has had get got been will would do does did no out up its it\'s don\'t can\'t i\'m there your what than then them their which more also very much even only any some like now still about after because really into over too use using used google photos photo pictures picture pics pic images image videos video phone'.split(' '));

const S = {
  total: 0, rated: 0, ratingSum: 0, sent: { neg: 0, pos: 0, neu: 0, unk: 0 }, ratingDist: [0, 0, 0, 0, 0],
  plat: {}, themes: {}, themePlat: {}, monthly: {}, countries: {}, versions: {}, lenBuckets: {}, langs: {}
};
const RET = {
  count: 0, english: 0, gate: 0, retr: 0, lowTotal: 0, ratingSum: 0, rated: 0,
  problems: {}, kinds: {}, clues: {}, forgot: {}, styles: {}, work: {}, branchSets: {},
  yearly: {}, yearlyTotal: {}, platform: {}, channel: {}, probKind: {}, probClue: {}, probWork: {}, probStyle: {},
  probCo: {}, probRating: {}, probYear: {}, kw: {}, kwAll: {}, clueCount: {}, noProblem: 0, thumbs: 0,
  forgotByKind: {}, ratingByClueCount: {}
};
const SAMPLE = [];
const PLATS = [];

function bump(map, id, rec) {
  const o = map[id] || (map[id] = { n: 0, low: 0, rated: 0, rsum: 0, thumbs: 0 });
  o.n++; o.thumbs += rec.thumbs;
  if (rec.rating != null) { o.rated++; o.rsum += rec.rating; if (rec.rating <= 2) o.low++; }
}

function addKw(store, id, text) {
  const w = text.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(x => x.length > 2);
  const seen = new Set();
  const k = store[id] || (store[id] = {});
  for (let i = 0; i < w.length - 1; i++) {
    const a = w[i], b = w[i + 1];
    if (STOP.has(a) || STOP.has(b)) continue;
    const bg = a + ' ' + b;
    if (seen.has(bg)) continue; seen.add(bg);
    k[bg] = (k[bg] || 0) + 1;
  }
}

const stream = fs.createReadStream(SRC).pipe(parse({ columns: true, relax_quotes: true, relax_column_count: true, skip_records_with_error: true }));
stream.on('data', r => {
  S.total++;
  const g = grp(r.platform);
  const rating = r.rating !== '' && !isNaN(+r.rating) ? Math.round(+r.rating) : null;
  const sent = sentOf(rating);
  const text = (r.content || '').trim();
  const thumbs = +r.thumbs_up_count || 0;
  const d = parseDate(r.date);
  S.sent[sent]++;
  if (rating != null) { S.rated++; S.ratingSum += rating; S.ratingDist[rating - 1]++; }
  const P = S.plat[g] || (S.plat[g] = { n: 0, rated: 0, rsum: 0, neg: 0, pos: 0, neu: 0, unk: 0 });
  P.n++; P[sent]++; if (rating != null) { P.rated++; P.rsum += rating; }
  if (d) {
    const M = S.monthly[d.ym] || (S.monthly[d.ym] = { n: 0, rated: 0, rsum: 0, neg: 0 });
    M.n++; if (rating != null) { M.rated++; M.rsum += rating; if (rating <= 2) M.neg++; }
  }
  const c = r.country || 'Global'; inc(S.countries, c);
  if (r.app_version && rating != null && rating <= 2) inc(S.versions, r.app_version);
  const lb = text.length < 40 ? '<40' : text.length < 100 ? '40-99' : text.length < 200 ? '100-199' : text.length < 400 ? '200-399' : '400+';
  inc(S.lenBuckets, lb);

  // general themes (all languages: keyword rules are English so only count english text)
  const eng = RR.isEnglish(text);
  if (eng) {
    let any = false;
    for (const th of RR.THEMES) if (th.re.test(text)) {
      any = true;
      const T = S.themes[th.id] || (S.themes[th.id] = { neg: 0, pos: 0, neu: 0, unk: 0, n: 0 });
      T[sent]++; T.n++;
      const TP = S.themePlat[th.id] || (S.themePlat[th.id] = {});
      inc(TP, channel(g));
    }
    if (!any) inc(S.themes, 'other_n');
    S.engN = (S.engN || 0) + 1;
  }

  if (!eng) return;
  RET.english++;
  const a = RR.analyze(text);
  if (!a.retrieval) return;
  // community / video sources are broad: require an explicit Google Photos reference
  if (channel(g) === 'Community' || g === 'YouTube') { if (!/google ?photos|g-?photos|picasa|google\+|photos app/i.test(text)) return; }
  RET.count++;
  const core = RR.coreOf(text);
  const rec = { rating, thumbs };
  const ch = channel(g);
  const year = d ? d.y : null;
  RET.thumbs += thumbs;
  if (rating != null) { RET.rated++; RET.ratingSum += rating; if (rating <= 2) RET.lowTotal++; }
  inc(RET.platform, g); inc(RET.channel, ch);
  if (year) { inc(RET.yearlyTotal, year); }
  const probs = a.problems;
  if (!probs.length) RET.noProblem++;
  const branches = new Set();
  for (const pid of probs) {
    bump(RET.problems, pid, rec);
    const o = RET.problems[pid];
    o.byCh = o.byCh || {}; inc(o.byCh, ch);
    o.byPlat = o.byPlat || {}; inc(o.byPlat, g);
    if (year) { o.byYear = o.byYear || {}; inc(o.byYear, year); }
    const bid = RR.PROBLEMS.find(p => p.id === pid).branch; branches.add(bid);
    for (const k of a.kinds) { const key = pid + '|' + k; inc(RET.probKind, key); }
    for (const k of a.clues) inc(RET.probClue, pid + '|' + k);
    for (const k of a.work) inc(RET.probWork, pid + '|' + k);
    for (const k of a.styles) inc(RET.probStyle, pid + '|' + k);
    if (rating != null) inc(RET.probRating, pid + '|' + rating);
    for (const q of probs) if (q !== pid) inc(RET.probCo, pid + '|' + q);
    if (rating != null && rating <= 2) addKw(RET.kw, pid, core);
  }
  for (const b of branches) { const o = RET.branchSets[b] || (RET.branchSets[b] = { n: 0, low: 0, rated: 0 }); o.n++; if (rating != null) { o.rated++; if (rating <= 2) o.low++; } }
  for (const k of a.kinds) bump(RET.kinds, k, rec);
  for (const k of a.clues) bump(RET.clues, k, rec);
  for (const k of a.forgot) bump(RET.forgot, k, rec);
  for (const k of a.styles) bump(RET.styles, k, rec);
  for (const k of a.work) bump(RET.work, k, rec);
  if (year) for (const pid of probs) inc(RET.yearly, year + '|' + pid);
  for (const f of a.forgot) for (const k of a.kinds) inc(RET.forgotByKind, f + '|' + k);
  const cc = a.clues.length; if (rating != null) { const o = RET.ratingByClueCount[cc] || (RET.ratingByClueCount[cc] = { n: 0, s: 0 }); o.n++; o.s += rating; }
  inc(RET.clueCount, cc);
  addKw(RET.kwAll, 'all', core);
  SAMPLE.push({ t: text.slice(0, 460), q: core.slice(0, 220), r: rating, p: g, y: year, h: thumbs, a: probs, k: a.kinds, c: a.clues, f: a.forgot, w: a.work, s: a.styles, v: d ? d.ym : null });
});
stream.on('end', () => {
  const pTop = (store, id, n = 14) => Object.entries(store[id] || {}).filter(([, v]) => v >= 3).sort((a, b) => b[1] - a[1]).slice(0, n);
  const kw = {}; for (const p of RR.PROBLEMS) kw[p.id] = pTop(RET.kw, p.id);
  const kwAll = pTop(RET.kwAll, 'all', 40);
  // choose sample: rank by thumbs and diversity
  SAMPLE.sort((a, b) => b.h - a.h);
  const top = SAMPLE.slice(0, 2200);
  const rest = SAMPLE.slice(2200).filter((x, i) => i % 4 === 0).slice(0, 2300);
  const sample = top.concat(rest);
  const out = {
    meta: { built: new Date().toISOString(), source: 'Google_Photos_Master_Reviews.csv' },
    S: { ...S, avg: S.ratingSum / S.rated },
    RET: { ...RET, kw, kwAll, sampleSize: sample.length, retrievalTotal: SAMPLE.length },
    defs: {
      problems: RR.PROBLEMS.map(({ id, label, branch }) => ({ id, label, branch })),
      kinds: RR.KINDS.map(({ id, label }) => ({ id, label })),
      clues: RR.CLUES.map(({ id, label }) => ({ id, label })),
      forgot: RR.FORGOT.map(({ id, label }) => ({ id, label })),
      styles: RR.STYLES.map(({ id, label }) => ({ id, label })),
      work: RR.WORKAROUNDS.map(({ id, label }) => ({ id, label })),
      themes: RR.THEMES.map(({ id, label }) => ({ id, label }))
    },
    sample
  };
  fs.writeFileSync('data.json', JSON.stringify(out));
  console.log('total', S.total, 'english', RET.english, 'retrieval', RET.count, 'noProblem', RET.noProblem, 'sample', sample.length);
  console.log('size MB', (fs.statSync('data.json').size / 1e6).toFixed(2));
  const rows = RR.PROBLEMS.map(p => { const o = RET.problems[p.id] || { n: 0, low: 0, rated: 1 }; return [p.id, o.n, (100 * o.low / o.rated).toFixed(0) + '%low']; });
  console.log(rows.map(r => r.join(' ')).join('\n'));
});
