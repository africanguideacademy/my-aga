// My AGA — builds a student's to-do list and study advice from their profile.
// Rules only (no AI): every recommendation comes straight from the data
// trainers capture in the Student Profile System.
(function () {
  const CFG = window.MYAGA_CONFIG;
  const PG = CFG.POCKET_GUIDE;

  // Same topics and default totals as the Student Profile System
  const NG_MODULES = [
    ['geology', 'Geology', 10, 'geology'], ['astronomy', 'Astronomy', 10, 'astronomy'],
    ['weather', 'Weather and Climate', 10, 'weather-and-climate'], ['ecology', 'Ecology', 10, 'ecology'],
    ['plants', 'Plants', 15, 'plants'], ['invertebrates', 'Invertebrates', 20, 'arthropods'],
    ['amphibians', 'Amphibians', 5, 'amphibians'], ['reptiles', 'Reptiles', 15, 'reptiles'],
    ['birds', 'Birds', 20, 'birds'], ['mammals', 'Mammals', 20, 'mammals'],
    ['lawsTourismEnv', 'Tourism in Botswana & Legislation', 15, 'tourism-and-legislation']
  ];
  const TRAILS_MODULES = [
    ['rifles', 'Advanced Knowledge of Rifles', 32], ['pda', 'Handling PDAs on Foot', 33],
    ['roles', 'Roles and Responsibilities of a Walking Guide', 15]
  ];
  const ARH = [['prep', 'Preparation to use a rifle'], ['quickKill', 'Quick kill exercise'],
    ['malfunction', 'Recovery from malfunction'], ['charge', 'Simulated charge']];
  const ATTR = {
    attributes: [['punctuality', 'Punctuality'], ['presentation', 'Presentation'], ['teamWorker', 'Team Worker'],
      ['empathy', 'Guest and Peer Empathy'], ['leadership', 'Leadership Ability'], ['selfMotivation', 'Self-Motivation and Initiative']],
    comm: [['projection', 'Voice Projection and Tone'], ['vocabulary', 'English Vocabulary and Pronunciation'],
      ['enthusiasm', 'Enthusiasm and Engaging Guests'], ['bodyLanguage', 'Body Language'], ['hosting', 'Ability and Willingness to Host']],
    guiding: [['safetyBriefings', 'Pre-activity and Safety Briefings'], ['designActivity', 'Designing and Selling an Activity'],
      ['keepingInformed', 'Keeping Guests Informed'], ['drivingSkills', 'Driving / Piloting / Poling'],
      ['safetyConsideration', 'Safety and Consideration'], ['awareness', 'Awareness of Tracks and Alarm Calls'],
      ['tracking', 'Tracking and Locating Wildlife'], ['birdId', 'Bird Identification'], ['treeId', 'Tree Identification'],
      ['flowDrive', 'Flow of the Drive'], ['approach', 'Approach and Parking at Sightings'], ['interpretation', 'Interpretation Ability']]
  };
  // Practical tips for each attribute/skill, shown when a score is low
  const TIPS = {
    punctuality: 'Be ready 10 minutes before every activity, briefing and lecture. Set alarms and prepare your kit the night before.',
    presentation: 'Clean uniform, neat appearance and a tidy vehicle every day. Guests judge the first minute.',
    teamWorker: 'Offer help before you are asked: loading vehicles, camp chores, backing up other guides.',
    empathy: 'Watch your guests and fellow students: who is cold, nervous, tired or left out? Adjust and include them.',
    leadership: 'Volunteer to lead activities and briefings. Make clear decisions and explain them calmly.',
    selfMotivation: 'Study in your free time: use the Pocket Guide every day and go out to find answers yourself.',
    projection: 'Practise speaking so the back row can hear you. Slow down and vary your tone to keep interest.',
    vocabulary: 'Learn the correct names and terms for each chapter. Practise saying them out loud.',
    enthusiasm: 'Share your passion: ask guests questions and tell stories, not just facts.',
    bodyLanguage: 'Face your guests, make eye contact, and keep your hands calm and open.',
    hosting: 'Take your turn hosting at meals and around the fire. Learn guests’ names and interests.',
    safetyBriefings: 'Write out your safety briefing and practise it until it is clear, complete and under two minutes.',
    designActivity: 'Plan each activity around your guests’ interests, the weather and the time of day, then "sell" the plan to them.',
    keepingInformed: 'Tell guests where you are going, why, and what to expect. Never leave them guessing.',
    drivingSkills: 'Practise smooth driving: no sudden stops, careful gear changes, and reading the terrain ahead.',
    safetyConsideration: 'Keep safe distances, watch animal body language and never put guests at risk for a photo.',
    awareness: 'Keep scanning: stop for fresh tracks and listen for alarm calls from birds, squirrels and monkeys.',
    tracking: 'Spend time on foot reading tracks and signs. Age the tracks and follow them as far as you can.',
    birdId: 'Use the Birds section of the Pocket Guide every day, both by sight and by call.',
    treeId: 'Learn 5 new trees a week by bark, leaf and shape. Use the Plants section of the Pocket Guide.',
    flowDrive: 'Plan your route so the drive has a story: build up to the highlights and don’t rush sightings.',
    approach: 'Approach slowly at an angle, switch off when parked, and position the vehicle for guests’ view and light.',
    interpretation: 'Link facts into a story: why the animal behaves that way and how it fits the ecosystem.'
  };

  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace('%', '')); return isNaN(n) ? null : n; };
  const pct = (score, max) => { const s = num(score), m = num(max); return s == null || !m ? null : Math.round(s / m * 1000) / 10; };
  const daysUntil = d => { if (!d) return null; const t = new Date(d + 'T00:00:00'); return isNaN(t) ? null : Math.round((t - new Date()) / 864e5); };
  const pgLink = id => PG + '#/s/' + id;

  function coursesOfType(s, type) {
    return (s.coursesData || []).filter(c => c.type === type)
      .sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
  }
  // Scores for one course: per-course assessment first, then the older single-row fields
  function ngScores(s, course) {
    const a = (course && course.assessment) || {};
    const mods = a.modules && Object.keys(a.modules).length ? a.modules : (course ? {} : s.modules || {});
    const max = a.modulesMax && Object.keys(a.modulesMax).length ? a.modulesMax : (s.modulesMax || {});
    return NG_MODULES.map(([k, label, defMax, pg]) => {
      const m = num(max[k]) || defMax;
      return { key: k, label, score: num(mods[k]), max: m, pct: pct(mods[k], m), pg };
    });
  }
  function trailsScores(s, course) {
    const a = (course && course.assessment) || {};
    const t = a.trails && Object.keys(a.trails).length ? a.trails : (course ? {} : s.trails || {});
    const max = a.trailsMax || s.trailsMax || {};
    return TRAILS_MODULES.map(([k, label, defMax]) => {
      const m = num(max[k]) || defMax;
      return { key: k, label, score: num(t[k]), max: m, pct: pct(t[k], m) };
    });
  }
  // Newest course that has trainer scores for this group (a Trails course may have none)
  function latestWith(s, group) {
    const all = (s.coursesData || []).slice().sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
    return all.find(c => c.assessment && c.assessment[group] && Object.values(c.assessment[group]).some(v => num(v) != null)) || null;
  }
  function attrScores(s, course, group) {
    if (course === undefined) course = latestWith(s, group);
    const a = (course && course.assessment) || {};
    const src = a[group] && Object.keys(a[group]).length ? a[group] : (s[group] || {});
    return ATTR[group].map(([k, label]) => ({ key: k, label, score: num(src[k]) }));
  }
  function latestCourse(s) {
    const all = (s.coursesData || []).slice().sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
    return all[0] || null;
  }
  function parseComments(v) { try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function allComments(s) {
    const groups = [['ngComments', 'Nature Guide'], ['arhComments', 'Rifle handling (ARH)'], ['encComments', 'Encounters & walking'],
      ['attrGenericComments', 'General attributes'], ['attrCommComments', 'Communication'], ['attrGuidingComments', 'Guiding skills'],
      ['generalComments', 'General']];
    const out = [];
    groups.forEach(([k, area]) => parseComments(s[k]).forEach(c => { if (c && String(c.text || '').trim()) out.push(Object.assign({ area }, c)); }));
    if (String(s.comments || '').trim()) out.push({ area: 'General', text: s.comments, trainer: '', course: '', date: '' });
    return out.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }

  function build(s) {
    const recs = [];
    const add = (priority, area, title, text, actions) => recs.push({ priority, area, title, text, actions: actions || [] });
    const P = CFG.PASS_MARK;

    // 1. Profile and documents
    const missing = [];
    if (!s.cellNumber) missing.push('cell number');
    if (!s.email) missing.push('email address');
    if (!s.dateOfBirth) missing.push('date of birth');
    if (!s.omangPassport) missing.push('Omang / passport number');
    if (!s.nationality) missing.push('nationality');
    if (missing.length) add('high', 'My details', 'Complete your personal details',
      'We are missing your ' + missing.join(', ') + '. These are needed for your certificates and registration.', [{ label: 'Update my details', tab: 'details' }]);
    if (!s.photoUrl) add('medium', 'My details', 'Upload a passport-style photo',
      'A clear photo of your face against a plain background is used on your profile and certificates.', [{ label: 'Upload photo', tab: 'details' }]);
    const exp = daysUntil(s.passportExpiry);
    if (s.passportExpiry && exp != null && exp < 0) add('high', 'Documents', 'Your passport has expired',
      'Renew it, then update the expiry date and upload a copy of the new passport.', [{ label: 'Update passport', tab: 'details' }]);
    else if (exp != null && exp < 180) add('medium', 'Documents', 'Your passport expires in ' + Math.max(1, Math.round(exp / 30)) + ' month(s)',
      'Many countries and employers need 6 months’ validity. Start the renewal now.', [{ label: 'Update passport', tab: 'details' }]);
    if (s.firstAidCert !== 'Yes') add(s.firstAidCert === 'Expired' ? 'high' : 'medium', 'Documents',
      s.firstAidCert === 'Expired' ? 'Renew your First Aid certificate' : 'Get a valid First Aid certificate',
      'A valid First Aid certificate is required to qualify and work as a guide. When you have it, upload a copy.', [{ label: 'Upload certificate', tab: 'details' }]);
    if (s.driversLicence !== 'Yes') add('low', 'Documents', s.driversLicence === 'Learner' ? 'Finish your driver’s licence' : 'Driver’s licence',
      'Most guiding jobs need a valid driver’s licence (and later a PDP). Update your details once you have it.', [{ label: 'Update my details', tab: 'details' }]);
    if (/FGASA/i.test(s.qualification || '') && !s.fgasaNo) add('medium', 'Membership', 'Add your FGASA membership number',
      'If you are registered with FGASA, add your number so we can link your results.', [{ label: 'Update my details', tab: 'details' }]);

    // 2. Nature Guide theory
    const ng = coursesOfType(s, 'Nature Guide')[0];
    if (ng || (s.modules && Object.values(s.modules).some(v => v))) {
      const scores = ngScores(s, ng).filter(m => m.pct != null);
      const weak = scores.filter(m => m.pct < P).sort((a, b) => a.pct - b.pct);
      weak.forEach(m => add(m.pct < 50 ? 'high' : 'medium', 'Nature Guide', 'Revise ' + m.label + ' (' + m.pct + '%)',
        'You scored ' + m.score + ' out of ' + m.max + '. The pass mark is ' + P + '%. Work through the ' + m.label + ' questions and the manual chapter in the Pocket Guide.',
        [{ label: 'Study ' + m.label, href: pgLink(m.pg) }]));
      if (scores.length && !weak.length) add('low', 'Nature Guide', 'All theory topics above ' + P + '%',
        'Well done. Keep your knowledge fresh with exam practice in the Pocket Guide.', [{ label: 'Exam practice', href: PG + '#/exam' }]);
      if (/^(no|not)/i.test(s.natureGuidePractical || (ng && ng.assessment && ng.assessment.natureGuidePractical) || ''))
        add('high', 'Nature Guide', 'Nature Guide practical not yet passed',
          'Ask your trainer which parts of the practical you need to repeat, and practise them on every drive.');
    }

    // 3. Trails Guide theory, ARH and walking
    const tg = coursesOfType(s, 'Trails Guide')[0];
    if (tg) {
      trailsScores(s, tg).filter(m => m.pct != null && m.pct < P).forEach(m =>
        add(m.pct < 50 ? 'high' : 'medium', 'Trails Guide', 'Revise ' + m.label + ' (' + m.pct + '%)',
          'You scored ' + m.score + ' out of ' + m.max + '. The pass mark is ' + P + '%. Go back over your Trails Guide notes for this topic.'));
      const arh = (tg.assessment && tg.assessment.arh) || s.arh || {};
      ARH.forEach(([k, label]) => {
        if (String(arh[k] || '').trim() === 'No') add('high', 'Rifle handling', label + ' not yet competent',
          'Book extra range time with your trainer and practise safe handling drills until they are automatic.');
      });
      const meets = (tg.assessment && tg.assessment.walkMeetsReqs) || s.walkMeetsReqs;
      if (String(meets).trim() === 'No') add('medium', 'Walking', 'Build up your walking hours and encounters',
        'You do not yet meet the walking requirements. Ask your trainer how many more lead and back-up hours you need.');
    }

    // 4. Attributes and guiding skills (scored 1-10 by trainers)
    ['attributes', 'comm', 'guiding'].forEach(g => attrScores(s, undefined, g).forEach(a => {
      if (a.score != null && a.score <= 5) add(a.score <= 3 ? 'high' : 'medium',
        g === 'guiding' ? 'Guiding skills' : g === 'comm' ? 'Communication' : 'Attributes',
        'Work on: ' + a.label + ' (' + a.score + '/10)', TIPS[a.key] || '',
        a.key === 'birdId' ? [{ label: 'Bird quizzes', href: pgLink('birds') }] : a.key === 'treeId' ? [{ label: 'Plant quizzes', href: pgLink('plants') }] : []);
    }));

    // 5. Benchmarking exam
    const bm = (s.benchmarkingData || []).slice().sort((a, b) => String(b.year || '').localeCompare(String(a.year || '')))[0];
    if (bm) [['theory', 'Theory'], ['slides', 'Slides'], ['sounds', 'Sounds']].forEach(([k, label]) => {
      const p = pct(bm[k + 'Score'] != null ? bm[k + 'Score'] : (bm[k] || {}).score, bm[k + 'Max'] != null ? bm[k + 'Max'] : (bm[k] || {}).max);
      if (p != null && p < P) add('medium', 'Benchmarking', 'Benchmarking ' + label + ': ' + p + '%',
        k === 'sounds' ? 'Practise bird and frog calls in the Pocket Guide "By sound" quizzes.' :
        k === 'slides' ? 'Practise photo identification in the Pocket Guide "By sight" quizzes.' : 'Use exam practice in the Pocket Guide.',
        [{ label: 'Open Pocket Guide', href: k === 'theory' ? PG + '#/exam' : pgLink('birds') }]);
    });

    const order = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => order[a.priority] - order[b.priority]);
  }

  window.MyAgaRecs = { build, ngScores, trailsScores, attrScores, latestWith, coursesOfType, latestCourse, allComments, num, pct, daysUntil,
    NG_MODULES, TRAILS_MODULES, ARH, ATTR };
})();
