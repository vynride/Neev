# Pulse PM: Client Brief

**Client:** Northgate Events, Gurugram. Contact: Sameer Bhatia, Operations Head.
**Team:** Lakshmi Gowda (backend, database and frontend features), Pooja Kumari (Docker and deployment). Mentor: Sunita Deshmukh.

Northgate Events plans weddings and corporate offsites with a team of 14. Work is tracked on WhatsApp and a spreadsheet, and tasks get missed close to an event. Sameer wants a simple internal tool where every event is a project with a task board.

## Goals
- One place to see every event, its tasks, owners and due dates.
- Email reminders for tasks that are due or overdue.
- Ready for use before the wedding season bookings open on 1 October 2026.

## Deliverables
- Login with email and password.
- Projects (events) with a Kanban board: To do, In progress, Done. Drag and drop between columns.
- Tasks with assignee, due date and priority.
- Dashboard of open, overdue and completed tasks, and a timeline view.
- Email notifications: task assigned, task due tomorrow, task overdue.
- Deployment on Render and a handover note.

## Agreed scope
- Stack: React and Express, both in TypeScript, PostgreSQL, Docker for local development, `render.yaml` for deployment.
- Login uses a JWT kept in the browser's localStorage.
- **Single-admin access.** Sameer is the only admin. He creates accounts for staff from the user management page. All staff users can see and edit all projects and tasks. The `users` table has a `role` column with two values, admin and member. No other permission levels are in scope.
- Email through a provider chosen by the client, who supplies the API key.
- The AI chat and AI insights features in the base code will be switched off.

## Out of scope
- Roles and permissions beyond the single admin described above.
- Google or other social login.
- Mobile app, attachments, comments, vendor logins, spreadsheet import.

## Timeline and milestones
- 10 August 2026: project start.
- 28 August 2026: boards, tasks and dashboard demo.
- 11 September 2026: email notifications complete (depends on the client's email provider keys).
- 21 September 2026: staging on Render for client testing.
- 28 September 2026: go-live and handover. This date is fixed because of the 1 October season opening.

## Client preferences
- Dark theme by default with a teal accent.
- Uncluttered screens. Staff are not technical.
- Sameer is often at event sites and replies late, usually by WhatsApp voice note.
- He tends to share new ideas during calls. These should be written down and handled through the change-request process in the SOW.

## Access and credentials
- Render and its managed PostgreSQL: created by the team, transferred at handover. The connection string exists only as a Render environment variable.
- Email provider: account owned by the client. The API key was requested on 31 August and received on 5 September. It is stored in the team vault and on Render, not in the repo.
- JWT secret: generated per environment, never committed. `.env.example` lists variable names only.
