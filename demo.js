// Demo mode: a made-up student so the page can be tried without the live system.
// Used when config.js has no API_URL, or the page is opened with ?demo.
// Demo login: Student ID DEMO-0001, PIN 123456.
(function () {
  const student = {
    studentId: 'DEMO-0001', surname: 'Demo', firstNames: 'Kagiso', nickname: 'KG', gender: 'Male',
    nationality: 'Botswanan', omangPassport: '000000000', passportExpiry: '2027-03-01', dateOfBirth: '2001-06-14',
    placeOfBirth: 'Maun', cellNumber: '+267 70 000 000', email: '', employerPrivate: 'Private',
    highestEducation: 'BGCSE', firstAidCert: 'Expired', driversLicence: 'Yes',
    bqaNo: 'BQA-00000', fgasaNo: '', qualification: 'Nature Guide, BQA, FGASA',
    coursesData: [
      { code: 'NG-2026-03', startDate: '2026-03-02', endDate: '2026-04-24', venue: 'Kwapa Camp', trainer: 'Grant', type: 'Nature Guide', qualification: 'Nature Guide, BQA, FGASA',
        assessment: { modules: { geology: 8, astronomy: 6, weather: 9, ecology: 8, plants: 10, invertebrates: 14, amphibians: 4, reptiles: 12, birds: 13, mammals: 18, lawsTourismEnv: 12 },
          modulesMax: { geology: 10, astronomy: 10, weather: 10, ecology: 10, plants: 15, invertebrates: 20, amphibians: 5, reptiles: 15, birds: 20, mammals: 20, lawsTourismEnv: 15 },
          natureGuidePractical: 'Yes',
          attributes: { punctuality: 9, presentation: 8, teamWorker: 9, empathy: 7, leadership: 5, selfMotivation: 8 },
          comm: { projection: 4, vocabulary: 7, enthusiasm: 9, bodyLanguage: 7, hosting: 6 },
          guiding: { safetyBriefings: 7, designActivity: 6, keepingInformed: 7, drivingSkills: 8, safetyConsideration: 9, awareness: 7, tracking: 5, birdId: 5, treeId: 6, flowDrive: 7, approach: 8, interpretation: 6 } } },
      { code: 'TG-2026-08', startDate: '2026-08-10', endDate: '2026-08-28', venue: 'Kwapa Camp', trainer: 'Grant', type: 'Trails Guide', qualification: 'Trails Guide',
        assessment: { trails: { rifles: 27, pda: 22, roles: 13 }, trailsMax: { rifles: 32, pda: 33, roles: 15 },
          arh: { prep: 'Yes', quickKill: 'Yes', malfunction: 'No', charge: 'Yes' }, walkMeetsReqs: 'No' } }
    ],
    modules: {}, trails: {}, arh: {},
    lifetimeStats: { encounters: { ebLead: 1, ebBu: 3, ebPart: 6, ecLead: 0, ecBu: 2, ecPart: 4, bbLead: 0, bbBu: 1, bbPart: 3, bcLead: 0, bcBu: 0, bcPart: 2, lionLead: 0, lionBu: 1, lionPart: 2 },
      walkLeadHrs: 12, walkBackupHrs: 34, walkParticipHrs: 56, walkTotalHrs: 102 },
    benchmarkingData: [{ year: '2026', theoryScore: '78', theoryMax: '100', slidesScore: '64', slidesMax: '100', soundsScore: '55', soundsMax: '100', overallScore: '197', overallMax: '300' }],
    ngComments: JSON.stringify([{ trainer: 'Grant', course: 'NG-2026-03', date: '2026-04-20', text: 'Strong on mammals and plants. Amphibians and astronomy need more time - use the Pocket Guide every evening.' }]),
    arhComments: JSON.stringify([{ trainer: 'Grant', course: 'TG-2026-08', date: '2026-08-27', text: 'Calm under pressure on the charge. Malfunction drill too slow - practise clearing the stoppage without looking down.' }]),
    attrCommComments: JSON.stringify([{ trainer: 'Grant', course: 'NG-2026-03', date: '2026-04-22', text: 'Great enthusiasm with guests. Speak up on the vehicle - guests in the back row struggled to hear.' }]),
    generalComments: '[]', encComments: '[]', attrGenericComments: '[]', attrGuidingComments: '[]', comments: '',
    photoUrl: '', photoThumb: '', fileUrl: '', profileFolderUrl: '', lastUpdated: '2026-08-28'
  };
  const inv = { invoiceNo: 'AGA-INV-0142', invoiceUrl: 'https://example.com/invoice.pdf', invoiceTotal: 7860, amountPaid: 1572, invoiceCurrency: 'EUR' };
  const bookings = [Object.assign({ bookingId: 'BK-DEMO01', groupRef: 'BK-DEMO01', courseCode: 'KWP 2701 NG A', courseType: 'Nature Guide', startDate: '2027-01-11', endDate: '2027-01-24', venue: 'Kwapa Camp', camp: 'Kwapa', status: 'Deposit paid', respondedOn: '', reason: '' }, inv),
    Object.assign({ bookingId: 'BK-DEMO02', groupRef: 'BK-DEMO01', courseCode: 'KWP 2701 NG B', courseType: 'Nature Guide', startDate: '2027-01-25', endDate: '2027-02-07', venue: 'Kwapa Camp', camp: 'Kwapa', status: 'Deposit paid', respondedOn: '', reason: '' }, inv)];
  const docs = [{ name: 'Passport / Omang copy - 2026-03-02 (uploaded by student).pdf', url: '#', size: '412 KB', date: '2026/03/02', mimeType: 'application/pdf' }];
  const wait = ms => new Promise(r => setTimeout(r, ms));

  window.MyAgaDemo = {
    async call(p) {
      await wait(350);
      switch (p.portal) {
        case 'login':
          return p.studentId.toUpperCase() === 'DEMO-0001' && p.pin === '123456'
            ? { ok: true, token: 'demo'.padEnd(32, '0'), deviceToken: p.remember ? 'd'.repeat(48) : '', mustChangePin: false }
            : { ok: false, error: 'That Student ID and PIN don’t match. (Demo: DEMO-0001 / 123456)' };
        case 'respondBooking': { const b = bookings.find(x => x.bookingId === p.bookingId); if (!b) return { ok: false, error: 'Booking not found.' };
          if (p.response === 'Declined' && !p.reason) return { ok: false, error: 'Please tell us why you can’t attend.' };
          b.status = p.response; b.reason = p.reason || ''; return { ok: true, status: b.status }; }
        case 'me': return { ok: true, student: JSON.parse(JSON.stringify(student)), bookings: JSON.parse(JSON.stringify(bookings)), editable: Object.keys(student).filter(k => ['nickname', 'gender', 'nationality', 'omangPassport', 'passportExpiry', 'dateOfBirth', 'placeOfBirth', 'cellNumber', 'email', 'employerPrivate', 'highestEducation', 'firstAidCert', 'driversLicence', 'bqaNo', 'fgasaNo'].includes(k)),
          docTypes: ['Proof of payment', 'Passport / Omang copy', 'First Aid certificate', 'Drivers licence', 'Highest education certificate', 'CV', 'FGASA / BQA document', 'Other'] };
        case 'docs': return { ok: true, docs };
        case 'materials': return bookings.some(b => b.status === 'Deposit paid' || b.status === 'Paid in full')
          ? { ok: true, locked: false, materials: [{ group: 'Nature Guide', name: 'AGA Nature Guide Manual (7th edition)', url: '#' }, { group: 'Nature Guide', name: 'Workbook - Birds', url: '#' }] }
          : { ok: true, locked: true, message: 'Your course manual, workbooks and apps open here once your deposit has been received.' };
        case 'updateDetails': Object.assign(student, p.fields); return { ok: true, changed: Object.keys(p.fields) };
        case 'uploadPhoto': student.photoUrl = 'demo'; student.photoThumb = 'data:' + p.mimeType + ';base64,' + p.base64; return { ok: true, photoThumb: student.photoThumb };
        case 'uploadDoc': { const name = p.docType + ' - demo (uploaded by student)'; docs.unshift({ name, url: '#', size: Math.round(p.base64.length * .75 / 1024) + ' KB', date: 'today', mimeType: p.mimeType }); return { ok: true, name }; }
        case 'changePin': return /^\d{6}$/.test(p.newPin) ? { ok: true } : { ok: false, error: 'Your new PIN must be exactly 6 numbers.' };
        case 'logout': return { ok: true };
        case 'resume': return p.deviceToken ? { ok: true, token: 'demo'.padEnd(32, '0'), mustChangePin: false } : { ok: false };
      }
      return { ok: false, error: 'Unknown request.' };
    }
  };
})();
