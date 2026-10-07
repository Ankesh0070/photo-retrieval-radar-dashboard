const fs = require('fs');
const { parse } = require('csv-parse/sync');
const src = 'C:\\Users\\Ankesh\\Downloads\\Contact Information (Responses) - Form Responses 1 (1).csv';
const rows = parse(fs.readFileSync(src, 'utf8'), { columns: true, relax_quotes: true, relax_column_count: true, skip_empty_lines: true });
const K = Object.keys(rows[0]);
const OPT = {
  clues: ['Person/persons', 'Place', 'Approximate time/period', 'Event/occasion', 'Word/name', 'Brand/shop/company', 'Object visible in the image', 'How the image looked'],
  enter: ['A description of what is in the image', "A person's name", 'A place', 'A date/month/year', 'A number/amount', 'A word or phrase visible in the image', 'A combination of several clues', "I usually don't search; I scroll"],
  hard: ['Names', 'Phone numbers', 'Addresses', 'Amounts/prices', 'Dates', 'Invoice/bill numbers', 'Handwritten text', 'Non-English text', "I don't usually search text inside images"],
  narrow: ['Person', 'Place', 'Approximate date/time', 'Event', 'Image type', 'Source (WhatsApp, Camera, Screenshot, etc.)', 'Specific word/text', 'Number/amount', 'Objects in the image']
};
const pick = (s, list) => list.filter(o => s.includes(o));
const out = rows.filter(r => r[K[1]] && r[K[2]]).map((r, i) => ({
  id: 'S' + String(i + 1).padStart(2, '0'),
  freq: r[K[2]].trim(), item: r[K[3]].trim(), clues: pick(r[K[4]], OPT.clues), conf: r[K[5]].trim(),
  enter: pick(r[K[6]], OPT.enter), known: r[K[7]].trim(), fail: r[K[8]].trim(), next: r[K[9]].trim(),
  hard: pick(r[K[10]], OPT.hard), frus: r[K[11]].trim(), narrow: pick(r[K[12]], OPT.narrow),
  pref: r[K[13]].trim(), trust: r[K[14]].trim(), story: (r[K[15]] || '').replace(/\s+/g, ' ').trim(),
  follow: /^yes/i.test((r[K[16]] || '').trim())
}));
fs.writeFileSync('survey2.json', JSON.stringify(out));
console.log(out.length, 'respondents; willing follow-up:', out.filter(r => r.follow).length);
const bad = out.filter(r => !r.clues.length || !r.enter.length || !r.hard.length || !r.narrow.length);
console.log('rows with empty multi-select parse:', bad.map(b => b.id));
