const fs = require('fs');
const t = fs.readFileSync('template.html', 'utf8');
const rules = fs.readFileSync('rules.js', 'utf8');
const data = fs.readFileSync('data.json', 'utf8').replace(/</g, '\\u003c').replace(new RegExp('[\\u2028\\u2029]', 'g'), ' ');
const out = t.replace('/*RULES*/', () => rules).replace('/*DATA*/', () => data).replace('/*SURVEYB*/', () => fs.readFileSync('survey2.json','utf8')).replace('/*SURVEY*/', () => fs.readFileSync('survey.json','utf8'));
fs.writeFileSync('../dashboard.html', out);
console.log('dashboard.html', (out.length / 1e6).toFixed(2), 'MB');

