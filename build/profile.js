const fs = require('fs');
const { parse } = require('csv-parse');
const f = '../Google_Photos_Master_Reviews.csv';
const plat = {}, src = {}, lang = {}, yr = {};
let n = 0, totalLen = 0;
fs.createReadStream(f).pipe(parse({ columns: true, relax_quotes: true, relax_column_count: true, skip_records_with_error: true }))
  .on('data', r => {
    n++;
    plat[r.platform] = (plat[r.platform] || 0) + 1;
    src[r.source_type] = (src[r.source_type] || 0) + 1;
    lang[r.language] = (lang[r.language] || 0) + 1;
    const y = (r.date || '').slice(0, 4); yr[y] = (yr[y] || 0) + 1;
    totalLen += (r.content || '').length;
  })
  .on('end', () => { console.log({ n, avgLen: totalLen / n }); console.log(plat, src, lang, yr); });
