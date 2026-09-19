# Context

Shared vocabulary for this project. Use these terms in code, docs and conversation.

## People

- **Student**: a Barabari graduate working on a freelance client project. Primary user.
- **Mentor**: the senior person assigned to a student's project. Sees tickets and FYIs.
- **Client**: the external person or company that owns the project. Not a user of this system.
- **Admin**: Barabari team member with a read-only view across projects.

## External systems

- **CodeGuru**: Barabari's platform for technical assessment. Gives domain scores, assignment averages, attendance, activity and portfolio status.
- **Samvad Saathi**: Barabari's mock-interview platform. Gives knowledge and speech scores.
- **ClickUp**: Barabari's project management tool. Source of tasks.

## Core terms

- **Project**: one client engagement. Has a brief, a repo, meetings, tasks, one or more students and one mentor.
- **Project card**: a structured summary of a project of about 500 tokens: goals, deliverables, deadlines, decisions, open questions, client preferences. Always in the agent's prompt.
- **Repo map**: the file tree of a project's repo with a one-line purpose per file, plus an architecture summary.
- **Chunk**: a searchable piece of a project document or meeting transcript, stored with its embedding.
- **Category**: one of six kinds of question. Decides the prompt section the agent uses.
- **Scope tag**: `project_specific` or `generic`. Decides whether project tools are used.
- **Session**: one conversation between a student and the AI mentor on one project.
- **Session log**: the append-only record of a session, including tool calls.
- **Student memory**: a markdown document about one student: strengths, weak domains, recurring struggles, what works for them.
- **Project memory**: the project card plus a running log of decisions and open client questions.
- **Citation**: a pointer from an answer to its source: a file and line, a document section, a meeting timestamp, a task or a knowledge base entry.
- **Grounded**: an answer with at least one citation.

## Escalation terms

- **Next action**: what the system did with a question: `answered`, `clarify`, `ask_client` or `escalated`.
- **Ask client**: the missing fact is something only the client knows. The answer includes a drafted message to the client.
- **Retry**: the single second attempt after a student marks an answer not resolved.
- **Ticket**: a question that reached the mentor. Carries context and a draft answer.
- **Draft answer**: the AI's proposed reply on a ticket, for the mentor to approve, edit or rewrite.
- **FYI**: a non-blocking notice to the mentor about a sensitive topic. Needs no reply.
- **Knowledge base**: mentor-approved answers, searched before any new escalation.
- **Deflection**: a question resolved without a mentor.
- **Nudge**: a proactive, rule-based reminder to a student, such as a deadline at risk.

## Meeting terms

- **Meeting**: a past client call. Its transcript and summary are project context the agent can search and cite.
- **Segment**: one speaker turn in a meeting transcript, with a timestamp.
