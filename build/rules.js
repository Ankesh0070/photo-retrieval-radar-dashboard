// Shared rule-based coding engine. Works in Node and in the browser (window.RetrievalRules).
(function (root) {
  const R = (s, f) => new RegExp(s, f || 'i');
  const PHOTO = R('\\b(photos?|pics?|pictures?|images?|videos?|clips?|screenshots?|selfies?|memories|album|albums|gallery)\\b');
  const GATE = R('\\b(find|finding|found|search|searching|searches|locate|looking for|look for|retriev\\w*|where (is|are|did|do)|can\'?t see|cannot see|not showing|missing|disappear\\w*|vanish\\w*|scroll\\w*|browse|browsing|sort\\w*|filter\\w*|recover\\w*|restore\\w*)\\b');

  // Problem taxonomy: id -> {label, branch, re}
  // Branches mirror the metric decomposition: EXPRESS / UNDERSTAND / EVALUATE / REFINE / ACCESS / NAV
  const PROBLEMS = [
    { id: 'vanish', label: 'Photos vanish / are not showing', branch: 'ACCESS',
      re: R('((photos?|pics?|pictures?|images?|videos?|albums?|memories|folders?)[^.!?]{0,45}(missing|disappear\\w*|vanish\\w*|gone|lost|not (showing|appearing|there|visible)|don\'?t (show|appear)|deleted (by itself|on its own|automatically))|(missing|disappear\\w*|vanish\\w*|lost|can\'?t see)[^.!?]{0,25}(photos?|pics?|pictures?|images?|videos?|albums?|memories|folders?))') },
    { id: 'search_fail', label: 'Search returns nothing / the wrong thing', branch: 'UNDERSTAND',
      re: R('(search\\w*[^.!?]{0,60}(no results?|nothing|wrong|useless|doesn\'?t work|does not work|can\'?t|cannot|bad|terrible|poor|irrelevant|inaccurate|not accurate|broken|garbage|worse|fails?|unreliable|random|rubbish|sucks)|(no results?|nothing|wrong|useless|terrible|poor|irrelevant|inaccurate|garbage|random)[^.!?]{0,40}search)') },
    { id: 'smart_search', label: 'Wants smarter / natural-language search', branch: 'EXPRESS',
      re: R('(natural language|describe (it|the|what|a)|ai search|smart(er)? search|better search|improve (the )?search|search (by|for) (colou?r|clothes|clothing|text|object|content|description|scene|emotion|activity)|ask photos|gemini|search (should|could|would)|wish (it|i|search)[^.!?]{0,40}search|semantic|keywords?)') },
    { id: 'hard_find', label: 'Finding things is hard (unspecified)', branch: 'UNDERSTAND',
      re: R('(can\'?t|cannot|couldn\'?t|unable to|impossible to|hard to|difficult to|struggle to|trouble|no way to|takes? (forever|ages|too long) to|never find|hardly find)[^.!?]{0,25}(find|locate|search|look up|retriev)') },
    { id: 'scroll', label: 'Scrolling forever through a huge / old library', branch: 'EVALUATE',
      re: R('(scroll\\w*|endless|thousands of (photos|pictures|pics|images)|huge (library|collection)|too many (photos|pictures|pics)|years of (photos|pictures)|swipe (through|and swipe)|go(ing)? through (all|every|hundreds|thousands)|zoom out|pinch)') },
    { id: 'dates', label: 'Wrong dates / photos out of order', branch: 'EVALUATE',
      re: R('(wrong (date|time|order)|incorrect (date|time)|(date|dates|timestamps?)[^.!?]{0,40}(wrong|incorrect|mess\\w*|mixed|off|changed|missing)|out of order|not in order|chronolog\\w*|sort(ed|ing)? by (date|time)|order of (the )?(photos|pictures)|date taken|upload(ed)? date|timeline[^.!?]{0,30}(wrong|mess|jumbl|mixed))') },
    { id: 'people', label: 'People / face / pet grouping fails', branch: 'UNDERSTAND',
      re: R('(face (group|grouping|recognition|detect\\w*|match\\w*|id)|facial|people (and|&) pets|people album|group(ed|ing)? (faces|people)|same person|(wrong|different) person|label(l)?ing (people|faces)|name (the )?(people|faces)|pets? (group|detect|recogn))') },
    { id: 'albums', label: 'Albums / folders / organising are hard', branch: 'NAV',
      re: R('(album|albums|folders?|organi[sz]\\w*|collections?|library tab|device folders?|move (photos|pictures)|sort(ing)? (photos|pictures) into)') },
    { id: 'ui_change', label: 'UI changes made things harder to find', branch: 'NAV',
      re: R('((update|updated|redesign\\w*|new (ui|layout|design|version|look|interface)|latest version|changed)[^.!?]{0,60}(find|search|navigate|harder|confus\\w*|worse|clutter\\w*|hidden|buried)|used to (be|let|show|have|work)|bring back|removed (the )?(ability|option|feature|button)|where (did|has|is) the)') },
    { id: 'deleted_rec', label: "Deleted / archived items can't be recovered or found", branch: 'ACCESS',
      re: R('(trash|recycle|bin\\b|recover\\w*|restor\\w*|archive[sd]?|permanently deleted|locked folder|hidden folder|deleted (them|it|my|by mistake|accidentally))') },
    { id: 'tags', label: "Can't add own tags / notes / captions", branch: 'EXPRESS',
      re: R('(add (a )?(tags?|captions?|labels?|notes?|descriptions?|keywords?)|custom (tags?|labels?)|tag (my|photos|pictures)|caption[s]?\\b|rename (photos?|pictures?|files?)|file ?names?|notes? (to|on|for) (photos?|pictures?)|hashtags?)') },
    { id: 'location', label: "Location / places don't help", branch: 'UNDERSTAND',
      re: R('(location (data|info|search|tag\\w*|history)|geo-?tag\\w*|\\bgps\\b|map view|places? (search|view|tab)|search (by|for) (location|place|city)|photos? (on|by) (a )?map|\\bmap\\b)') },
    { id: 'documents', label: 'Documents, screenshots & text in images', branch: 'UNDERSTAND',
      re: R('(screenshots?|documents?|receipts?|\\bocr\\b|text (in|from|inside) (the |an? )?(photos?|images?|pictures?)|search(ing)? (for )?text|scan(ned|ning)?|prescription|invoice|bills?\\b|\\bpdf\\b|handwrit\\w*|whatsapp (images?|photos?|media))') },
    { id: 'backup_gap', label: 'Not backed up / sync gaps make photos unfindable', branch: 'ACCESS',
      re: R('((back(ed)? ?up|sync\\w*|upload\\w*)[^.!?]{0,50}(fail\\w*|stuck|not|never|won\'?t|doesn\'?t|missing|partial|incomplete|pending|waiting|error)|(not|never|won\'?t|didn\'?t|isn\'?t|stuck|pending|waiting)[^.!?]{0,30}(back(ed)? ?up|sync\\w*|upload\\w*)|waiting for (sync|backup|upload)|preparing to back)') },
    { id: 'dupes', label: "Edited versions / duplicates can't be found", branch: 'ACCESS',
      re: R('(duplicat\\w*|two copies|multiple copies|edited (version|copy)|original (photo|version|file)|copy of (my|the) (photo|picture)|versions? of)') },
    { id: 'shared', label: "Shared / partner photos can't be found", branch: 'ACCESS',
      re: R('(partner sharing|shared (with me|album|library|photos|pictures)|sharing (link|library)|photos? (from|shared by) (my )?(wife|husband|partner|mom|dad|friend|family)|received (photos|pictures))') },
    { id: 'refine', label: 'No filters / history / way to refine a search', branch: 'REFINE',
      re: R('(filter(ing)? (by|results|the search|search)|search filters?|refine\\w*|narrow (down|it|results)|search history|recent searches?|saved searches|advanced search|sort results|search (by|with) (multiple|more than one|several)|combine (search|filters)|more specific|specific(ally)? search|search within|exclude)') }
  ];

  const KINDS = [
    { id: 'video', label: 'Videos & clips', re: R('\\b(videos?|clips?|movies?|footage|reels?|mp4)\\b') },
    { id: 'screenshot', label: 'Screenshots', re: R('\\bscreenshots?|screen ?caps?\\b') },
    { id: 'document', label: 'Documents / receipts / IDs', re: R('\\b(documents?|receipts?|invoices?|prescriptions?|bills?|passports?|\\bid cards?|aadhaar|licen[sc]e|forms?|certificates?|pdfs?|scanned|handwrit\\w*)\\b') },
    { id: 'old', label: 'Old photos (years back)', re: R('(\\bold (photos?|pictures?|pics?|images?|videos?|memories)|years? (ago|back)|from (the )?(past|childhood)|childhood|decades?|\\b(19[89]\\d|20[01]\\d)\\b|older (photos?|pictures?)|oldest)') },
    { id: 'migration', label: 'Old phone / account / migration', re: R('(old (phone|device|account|android|iphone)|new phone|switch(ed|ing)? (phones?|devices?|accounts?)|transfer(red|ring)?|migrat\\w*|moved (to|from)|restor\\w* (from|on) (a )?new|factory reset|takeout)') },
    { id: 'family', label: 'Family, kids & people', re: R('\\b(kids?|child(ren)?|baby|babies|son|daughter|mom|mum|dad|wife|husband|family|grand(ma|pa|mother|father|kids?)|friends?|wedding|birthday)\\b') },
    { id: 'travel', label: 'Trips, places & events', re: R('\\b(trip|trips|travel\\w*|vacation|holiday|holidays|honeymoon|tour|beach|mountain|hike|hiking|cruise|concert|festival|graduation|party)\\b') },
    { id: 'pets', label: 'Pets', re: R('\\b(dogs?|cats?|pets?|puppy|kitten)\\b') }
  ];

  const CLUES = [
    { id: 'person', label: 'Who (person)', re: R('\\b(my (mom|mum|dad|wife|husband|son|daughter|kids?|child(ren)?|baby|brother|sister|friends?|family|girlfriend|boyfriend|grand\\w+|partner)|people|person|faces?|selfie|selfies)\\b') },
    { id: 'place', label: 'Where (place)', re: R('\\b(location|place|places|city|country|beach|park|house|home|hotel|restaurant|cafe|trip|vacation|holiday|travel\\w*|map|gps|mountain|village)\\b') },
    { id: 'time', label: 'When (rough time)', re: R('\\b(years? ago|months? ago|last (year|month|summer|winter|week|christmas)|back in|in (19|20)\\d\\d|\\b(19|20)\\d\\d\\b|january|february|march|april|june|july|august|september|october|november|december|summer|winter|christmas|childhood|date|dates|decade)\\b') },
    { id: 'event', label: 'What occasion (event)', re: R('\\b(wedding|birthday|party|graduation|concert|festival|funeral|anniversary|honeymoon|christmas|diwali|new year|reunion|trip|vacation|holiday|ceremony)\\b') },
    { id: 'scene', label: 'What it looked like (object/scene)', re: R('\\b(dress|shirt|colou?r|red|blue|green|pink|black|white|dog|cat|car|food|sunset|sunrise|snow|beach|cake|tree|flower|building|mountain|outfit|wearing)\\b') },
    { id: 'text', label: 'Text inside the image', re: R('\\b(text|words?|written|caption|handwrit\\w*|ocr|document|receipt|screenshot|name on|number on)\\b') },
    { id: 'source', label: 'Where it came from (app/device)', re: R('\\b(whatsapp|instagram|facebook|snapchat|telegram|messenger|downloaded|camera roll|samsung|iphone|pixel|old phone|sd card|screenshot|screen ?shot)\\b') }
  ];

  const FORGOT = [
    { id: 'no_recall', label: "Can't remember details", re: R('(can\'?t|cannot|don\'?t|do not|didn\'?t|couldn\'?t|no) (really )?(remember|recall|recollect|know (when|where|what|which|the name|the date))') },
    { id: 'vague', label: 'Only vague memory ("somewhere", "somehow")', re: R('\\b(somewhere|somehow|something like|some (photo|picture)|a (photo|picture) (of|with) something|kind of|sort of|roughly|around (the )?(time|\\d{4})|i think)\\b') },
    { id: 'no_words', label: "Doesn't know what to type", re: R('(don\'?t know (what|how|which) (to )?(search|type|word|keyword|term)|what (word|keyword|term)s? (to|should)|not sure (what|how) to search|right (words?|keywords?|terms?))') },
    { id: 'forgot_name', label: 'Forgot who / where / name', re: R('(forgot|forget|forgotten|can\'?t (think of|recall))[^.!?]{0,30}(name|who|where|when|date|place)') }
  ];

  const STYLES = [
    { id: 'keyword', label: 'Types a keyword', re: R('(search(ed|ing)? (for )?["“\'‘][^"”\'’]{2,30}["”\'’]|typed|type in|keyword|search term|search bar|search box)') },
    { id: 'date', label: 'Searches by date / time', re: R('(search\\w* (by|for|with) (date|month|year|time)|by date|by month|by year|date range|jump to (a )?date|date picker|around (the )?(date|year))') },
    { id: 'person_place', label: 'Searches by person / place', re: R('(search\\w* (by|for|with) (person|face|name|people|location|place|city)|people (tab|search|album)|places? (tab|search))') },
    { id: 'natural', label: 'Describes it in natural language', re: R('(natural language|describe|describing|description|ask(ing)? (it|photos|gemini)|type (what|a sentence)|query|conversational|chat(bot)? with)') },
    { id: 'scroll', label: 'Gives up and scrolls', re: R('(scroll\\w*|manually|one by one|by hand|swipe through|go through (all|every|each))') },
    { id: 'other_app', label: 'Checks another app / source', re: R('(whatsapp|facebook|instagram|dropbox|onedrive|icloud|amazon photos|samsung (gallery|cloud)|gallery app|google drive|email|sent (it|them) to)') }
  ];

  const WORKAROUNDS = [
    { id: 'scroll', label: 'Scroll the timeline manually', re: R('(scroll\\w*|manually|one by one|by hand|go through (all|every|each))') },
    { id: 'other_app', label: 'Use another gallery / cloud', re: R('(switch(ed|ing)? to|moved to|using|use|went back to|back to)[^.!?]{0,25}(icloud|amazon photos|dropbox|onedrive|samsung gallery|gallery app|\\bf-?droid\\b|ente|immich|synology|nextcloud|simple gallery|photoprism|google drive|other app)') },
    { id: 'download', label: 'Download / export everything (Takeout)', re: R('(takeout|download(ed|ing)? (all|everything|my)|export\\w*|backup (to|on) (an? )?(external|hard|drive|pc|computer|usb)|external (drive|hard))') },
    { id: 'albums', label: 'Make manual albums / favourites', re: R('(create(d)? (an? )?albums?|make (an? )?albums?|put (them|it|photos) in (an? )?album|manually (organi[sz]e|sort|tag)|favou?rites?|star(red|ring)?)') },
    { id: 'rollback', label: 'Roll back / use old app version', re: R('(old(er)? version|roll(ed|ing)? back|downgrad\\w*|apkmirror|apk\\b)') },
    { id: 'ask_others', label: 'Ask someone / check chats', re: R('(ask(ed)? (my|a)? ?(friend|family|wife|husband|mom|dad|sister|brother)|check(ed)? (my )?(whatsapp|chats?|messages?|email))') },
    { id: 'quit', label: 'Give up / uninstall', re: R('(uninstall\\w*|giv(e|en|ing) up|deleted the app|leaving google photos|stopped using|no longer use|done with|cancel(l?ed|ling)? (my )?(subscription|google one)|switch(ed|ing)? (away|from))') }
  ];

  const THEMES = [
    { id: 'backup', label: 'Backup & sync failures', re: R('(back(ed)? ?up|sync\\w*|upload\\w*|waiting for|preparing to back)') },
    { id: 'sharing', label: 'Sharing & albums', re: R('(shar(e|ed|ing)|album|albums|partner|link)') },
    { id: 'storage', label: 'Storage & paid plan issues', re: R('(storage|google one|subscription|free up|full|15 ?gb|pay|paid|price|\\bplan\\b|quota|space)') },
    { id: 'search', label: 'Search & AI features', re: R('(search\\w*|find|ai\\b|gemini|ask photos|magic|smart|suggest\\w*|recogni\\w*|face)') },
    { id: 'editing', label: 'Editing tools', re: R('(edit\\w*|filter|crop|enhance|magic eraser|retouch|collage|lighting|portrait|unblur|sky|cinematic)') },
    { id: 'crash', label: 'Crashes / performance', re: R('(crash\\w*|freez\\w*|lag\\w*|slow\\w*|stuck|bug\\w*|glitch\\w*|battery|drain\\w*|force close|not responding|loading|hang)') },
    { id: 'memories', label: 'Notifications & memories', re: R('(memor(y|ies)|notification\\w*|on this day|highlights?|reminders?|throwback)') },
    { id: 'ui', label: 'UI / redesign complaints', re: R('(redesign\\w*|new (ui|layout|design|look|interface)|\\bui\\b|\\bux\\b|interface|layout|navigation|used to|bring back|clutter\\w*)') },
    { id: 'missing', label: 'Missing / deleted photos', re: R('(missing|disappear\\w*|vanish\\w*|lost (my|all)|gone|deleted (my|all|them|by))') },
    { id: 'video', label: 'Video quality / compression', re: R('(video\\w*)[^.!?]{0,40}(quality|compress\\w*|blur\\w*|resolution|stutter|pixel\\w*)|(quality|compress\\w*)[^.!?]{0,40}video') },
    { id: 'login', label: 'Login / account access', re: R('(log ?in|sign ?in|account|password|verification|locked out|2fa|two-factor)') },
    { id: 'trash', label: 'Deletion / trash behavior', re: R('(trash|recycle|bin\\b|delete\\w*|restor\\w*|permanently)') },
    { id: 'support', label: 'Customer support', re: R('(support|customer service|contact (google|us)|help (center|forum)|no (reply|response)|ticket)') }
  ];

  const SENT_POS = R('\\b(love|great|excellent|amazing|awesome|perfect|best|good|fantastic|wonderful|useful|helpful|easy|thank)\\w*');
  const SENT_NEG = R('\\b(hate|worst|terrible|awful|horrible|useless|bad|annoying|frustrat\\w*|garbage|trash|rubbish|sucks?|disappoint\\w*|waste|broken|ridiculous|pathetic|unacceptable|angry)\\b');

  function isEnglish(t) {
    if (!t || t.length < 12) return false;
    const letters = t.replace(/[^A-Za-zÀ-￿]/g, '');
    if (!letters.length) return false;
    const ascii = (t.match(/[A-Za-z]/g) || []).length;
    if (ascii / letters.length < 0.9) return false;
    const stop = (t.toLowerCase().match(/\b(the|and|to|is|it|of|my|i|that|this|for|in|not|but|with|on|can|have|app|photos?)\b/g) || []).length;
    return stop >= 2;
  }

  function matchIds(list, t) { const out = []; for (const x of list) if (x.re.test(t)) out.push(x.id); return out; }

  const FRICTION = R('(can\'?t|cannot|couldn\'?t|unable|hard|difficult|impossible|struggl\\w*|trouble|missing|disappear\\w*|vanish\\w*|gone|lost|no longer|not (show|find|work|see|appear|able|there|visible)|n\'?t (show|find|work|see|appear|let|allow)|wrong|useless|worse|worst|terrible|annoying|frustrat\\w*|confus\\w*|used to|wish|should|why|how (do|can|to)|never|where (is|are|did|do|has|can|to)|slow|forever|endless|nothing|no way|no option|lack|need(s)? (to|a|an)|please add|bring back|fix)');

  function splitSentences(t) { return t.split(/(?<=[.!?\n])\s+|\n+/).map(s => s.trim()).filter(Boolean); }

  // A "retrieval core" = sentences that combine a photo noun, a finding action and a friction cue.
  function coreOf(t) {
    const out = [];
    for (const s of splitSentences(t)) if (PHOTO.test(s) && GATE.test(s) && FRICTION.test(s)) out.push(s);
    return out.join(' ');
  }

  function analyze(text) {
    const full = String(text || '');
    const t = coreOf(full);
    const retrieval = t.length > 0;
    return {
      retrieval,
      problems: matchIds(PROBLEMS, t),
      kinds: matchIds(KINDS, full),
      clues: matchIds(CLUES, full),
      forgot: matchIds(FORGOT, full),
      styles: matchIds(STYLES, full),
      work: matchIds(WORKAROUNDS, full),
      themes: matchIds(THEMES, full),
      tone: SENT_NEG.test(full) ? (SENT_POS.test(full) ? 0 : -1) : (SENT_POS.test(full) ? 1 : 0)
    };
  }

  const api = { coreOf, PROBLEMS, KINDS, CLUES, FORGOT, STYLES, WORKAROUNDS, THEMES, analyze, isEnglish, PHOTO, GATE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RetrievalRules = api;
})(typeof window !== 'undefined' ? window : globalThis);

