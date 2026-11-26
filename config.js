// My AGA settings.
// API_URL: the /exec URL of the "AGA Public API" Apps Script web app (public side of the Student Profile System)
// (the same deployment the Profile System uses; StudentPortal.js answers the requests).
// Leave it empty, or open the site with ?demo, to see the page with a made-up student.
window.MYAGA_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyHWg0TVkMkyyF36A5PQmIUM3zqHRcczOKopHJ0tZwb81X9cugs66jTWFwdHO6Wy6wA/exec',
  POCKET_GUIDE: 'https://africanguideacademy.github.io/aga-study/',
  PASS_MARK: 75,
  // Booking form declaration: [document name, link]. Add each document's link
  // (e.g. a Google Drive "anyone with the link" PDF) so students can read it.
  BOOKING_DOCS: [
    ['Booking Terms and Conditions', ''],
    ['Waiver and Indemnity', ''],
    ['AGA Code of Conduct', ''],
    ['Learning Policy and Course Structure', ''],
    ['Learnership Agreement Form', ''],
    ['The Preparation Manual', '']
  ],
  CONTACT_EMAIL: 'africanguideacademy@gmail.com'
};
