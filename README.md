# My AGA — student portal

Each AGA student logs in with their **Student ID + 6-number PIN**. They can then:

- see their to-do list, built from their results, trainer scores and profile (`recommendations.js`)
- see their progress: Nature Guide and Trails Guide theory, ARH, attributes, walking hours, encounters and benchmarking
- read their trainers' notes
- update their personal details, upload a profile photo and upload documents (passport, certificates, CV)

## How it fits together

| Part | Where |
|---|---|
| This website (static, no data in it) | GitHub Pages: `africanguideacademy/my-aga` |
| Backend | `AGA Student Profiles/StudentPortal.js` in the **AGA Student Profile System** Apps Script. It answers POST requests whose JSON has a `portal` action. |
| Data | Student Profiles sheet, tab **Students** (read and write own row only) |
| Logins | Same sheet, tab **Portal Access** (PINs stored as salted SHA-256 hashes) |
| Change log | Same sheet, tab **Portal Changes** (every edit and upload a student makes, with the old and new value) |
| Uploads | The student's normal folder: `My Drive/Training/Student Profiles/Surname_First_ID/` |

## Bookings (how most students get their login)

1. Reservations open the **📨 Bookings** tab in the Student Profile System and fill in the basics from the booking form: name, email, cell, course.
2. The system then:
   - creates the profile, or adds the course to an existing student (matched on Omang/passport or full name)
   - adds a row to the **Bookings** tab (status *Invited*)
   - makes a first-time PIN if the student has no login yet
   - emails the invitation (reply-to reservations@guidetrainingcourses.com)
   - shows a copy-ready WhatsApp message
3. The student logs in, chooses their own PIN, and **confirms or declines** their place (declining needs a reason). Reservations get an email either way.
4. The Bookings tab shows, for each course, who was emailed, logged in, uploaded a photo and documents, and what details are still missing. It also has a **Resend** button.

Backend: `AGA Student Profiles/Bookings.js`.

Trainers can also issue or reset a PIN for any student. Open the student, click **My AGA login**, and the PIN is shown once.

## Settings

`config.js` sets `API_URL` to the Student Profile System's `/exec` URL. While `API_URL` is empty, or when you add `?demo` to the address, the site runs in demo mode with a made-up student (DEMO-0001 / 123456).

## Test locally

```
node tools/serve.js 8765
```

Then open http://localhost:8765/?demo
