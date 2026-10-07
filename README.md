# Photo Retrieval Radar: Dashboard + "Ask the Evidence" RAG Bot

A research dashboard on one question: **why do people fail to re-find a photo they only half remember in Google Photos?**

It combines three layers of evidence:

- **117,037 public reviews and posts** (Google Play, App Store, Reddit, Hacker News, Stack Exchange, Google Support). A rule-based classifier tags **1,169 retrieval stories** (a photo noun, a finding action and a friction cue in one sentence) and groups them into problem types and metric-tree branches.
- **Two surveys:** Survey A (n=23) and Survey B (n=18).
- **Four distinct voice interviews** (five transcripts received; two were identical).

The page ends with a **RAG bot** that answers questions about this evidence, with clickable citations and a closing summary.

Open [`dashboard.html`](dashboard.html) directly in a browser. It is one self-contained file (about 0.9 MB, data inlined) and needs no server. Charts use Chart.js 4.4.1 from cdnjs, so you need an internet connection for the charts to draw.

## Repo layout

```
dashboard.html        built deliverable
build/
  template.html       page shell: layout, CSS, Chart.js charts, all sections incl. RAG bot
  rag.txt             RAG bot source (also already merged into template.html)
  rules.js            review classifier: keyword/regex rules -> problem types, branches
  assemble.js         final build: template.html + rules.js + JSON data -> ../dashboard.html
  data.json           aggregates + 1,169 retrieval-story samples from the review corpus
  survey.json         Survey A, anonymised rows R01-R23
  survey2.json        Survey B, anonymised rows S01-S18
  analyze.js          review CSV -> data.json (needs the raw CSV, see below)
  profile.js          quick profile of the raw review CSV (platforms, sources, languages, years)
  survey.js           Survey A form export -> survey.json (needs the original export)
  survey2.js          Survey B form export -> survey2.json (needs the original export)
  patch.js            history: added the Survey A section to template.html
  patch2.js           history: added the Survey B section
  patch3.js           history: added the Interviews section
  patch-rag.js        history: added the RAG bot section
  iv.txt, svb.txt     source fragments for the Interviews and Survey B renderers
  serve.js            tiny static server for local preview
```

The `patch*.js` scripts were one-time edits and are **already applied** to `template.html`. Do not run them again, or the sections will be duplicated. Edit `template.html` directly instead.

## Rebuild

```bash
cd build
npm install        # only needed for analyze.js / profile.js (csv-parse)
node assemble.js   # writes ../dashboard.html
node serve.js      # optional: http://localhost:8123/dashboard.html
```

`assemble.js` alone is enough to rebuild the page from the files in this repo.

To regenerate `data.json` you also need `Google_Photos_Master_Reviews.csv` (the raw review export, about 54 MB, **not included**). Place it in the repo root, next to `dashboard.html`, then run `node analyze.js` from `build/`. `survey.js` and `survey2.js` read the original Google Forms exports, which are also not included. `survey.json` and `survey2.json` are the final outputs and are all the dashboard needs.

## The RAG bot

- **Corpus:** about 1,269 retrievable pieces: 1,169 coded reviews, 23 Survey A rows, 18 Survey B rows, 28 interview quotes, and 31 computed facts (for example, per-problem share and rating, per-branch counts, survey percentages).
- **Retrieval:** BM25 over the corpus. The four research questions (express, understand, evaluate, refine) add a boost to matching problem tags. It picks about 19 pieces, mixed across sources.
- **Answering:** if the viewer has granted Claude access (the Artifact `sample` capability), the retrieved pieces go to Claude with a strict instruction to answer only from that evidence and cite sources like `[SB05]`. Citations that are not in the retrieved set are removed. If AI is unavailable, the same four questions get a computed, cited answer built from the numbers, so the bot always answers.
- **Output:** each question gets Answer, Evidence and Confidence, followed by a final Summary. Clicking a citation highlights its source in the side panel.

The AI path needs the page to be hosted as a Claude Artifact with `capabilities: {sample: {}}`. When opened as a plain local file, the bot runs in computed-answer mode.

## Reading the numbers

- Review coding is rule-based, so category counts are **lower bounds**.
- Both surveys are small convenience samples from one network (n=23, n=18), and the interviews are n=4. Read the percentages as patterns, not population estimates.
- Respondent names, phone numbers and emails are not in this repo. Survey rows are anonymised; review text is from public sources.
