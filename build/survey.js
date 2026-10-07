const fs = require('fs');
const { parse } = require('csv-parse/sync');
const src = process.env.TEMP + '\\pr\\Untitled form.csv';
const rows = parse(fs.readFileSync(src, 'utf8'), { columns: true, relax_quotes: true, relax_column_count: true });
const K = Object.keys(rows[0]);
const col = i => K[i];
const clueMap = [
  ['Roughly when it was', 'Rough time'], ['The exact date', 'Exact date'], ['Where it was taken', 'Place'], ['Who was in it', 'Person'],
  ['What it looked like', 'Look / objects'], ['Words or text', 'Text in photo'], ['How you got it', 'How I got it'], ['Why you took it', 'Why I took it'], ['None of these', 'Only knew it existed']
];
const out = rows.map((r, i) => {
  const clues = (r[col(9)] || '').split(';').map(s => s.trim()).filter(Boolean).map(s => (clueMap.find(m => s.startsWith(m[0])) || [0, s])[1]);
  const first = r[col(8)] || '';
  return {
    id: 'R' + String(i + 1).padStart(2, '0'),
    age: r[col(2)], uses: r[col(3)], platform: r[col(4)], lib: r[col(5)], freq: r[col(6)], time: r[col(7)],
    first: first.startsWith('Yes') ? 'Yes, first try' : first.startsWith('Partially') ? 'Partially' : first.startsWith('No') ? 'Failed' : 'No answer',
    clues, scroll: r[col(10)]
  };
});
fs.writeFileSync('survey.json', JSON.stringify(out));
console.log(out.length, 'respondents');
const c = (f) => out.reduce((a, r) => (a[f(r)] = (a[f(r)] || 0) + 1, a), {});
console.log(c(r => r.first), c(r => r.platform), c(r => r.time));
