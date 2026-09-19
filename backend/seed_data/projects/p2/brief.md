# SkillBridge LMS: Client Brief

**Client:** SkillBridge Coaching Centre, Pune. Contact: Devendra Kulkarni, Director.
**Team:** Meenakshi Iyer (frontend and client communication), Pooja Kumari (backend and deployment). Mentor: Farhan Qureshi.

SkillBridge runs classroom coaching in spoken English, Tally and computer skills. Devendra wants to sell recorded versions online to students in nearby towns.

## Goals
- Sell recorded courses online with one-time payment per course.
- Let the centre's four teachers upload and organise their own courses.
- Let students watch lectures, track progress and rate a course.
- Run the site on the centre's existing domain so it looks official.
- The site should feel fast and responsive. The client has said several times that the current build "feels slow and non-responsive".

## Deliverables
- Public pages: home, course list with search, course details with free preview lecture.
- Student area: my enrollments, video player with chapter and lecture list, progress tracking, rating.
- Educator area: dashboard, add course, my courses, students enrolled.
- Payments through Stripe with enrolment confirmed by webhook.
- Deployment on the client's domain and a handover document.

## Agreed scope
- Stack: React (Vite) client, Express server, MongoDB, Clerk for login, Stripe for payments, Cloudinary for thumbnails. Lecture videos are YouTube unlisted links.
- A course contains chapters and a chapter contains lectures. Each lecture has a title, duration, video link and a free-preview flag.
- Clerk and Stripe both notify the server through webhooks. Users are created from the Clerk webhook and purchases are completed from the Stripe webhook.
- Client and server are deployed as two separate Vercel projects. Each folder has its own `vercel.json`.
- Four educator accounts and 8 courses at launch.

## Out of scope
- Live classes and video calls.
- Certificates, quizzes and assignments.
- Hosting video files, subscriptions, instalments.
- Moving or changing the client's business email.

## Timeline and milestones
- 29 June 2026: project start.
- 24 July 2026: course browsing and player demo.
- 21 August 2026: payments and educator area complete.
- 11 September 2026: testing complete, client sign-off on staging.
- 25 September 2026: site live on client domain.
- 30 September 2026: handover.

## Client preferences
- Blue and white, matching the centre's signboard. Logo supplied as PNG.
- Simple English. Many students are first-time online buyers on low-cost Android phones.
- Devendra reviews the site on his phone and the office desktop.
- Prefers phone calls, after 6 pm on weekdays.

## Access and credentials
- Domain: registered with GoDaddy in Devendra's name. The centre's business email runs on the same domain and is used daily by staff. Devendra has offered to share the GoDaddy login; delegate access is preferred.
- Clerk, Stripe, MongoDB Atlas, Cloudinary: accounts exist; Stripe is in the client's name. Keys and webhook signing secrets are kept only in Vercel environment settings and the team vault.
- Vercel: team account, to be transferred at handover.
- No secrets are committed.
