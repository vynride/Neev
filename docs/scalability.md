# Scalability

The expensive part of this product is one thing: an AI mentor answer. It is a classifier call
plus one to three rounds of the strong model with tools, and takes 10 to 20 seconds. Everything
here is about not paying that cost more often than needed, and about keeping mentors' time flat
as the number of students grows.

## Shared answers: a general question is answered once

Many first questions are not about the project at all: "What is an API?", "How does a database
work?", "What is a webhook?". They read the same for every student on every project, and new
cohorts ask them again every few months. The answer is generated once, stored, and served to
everyone who asks the same thing later, for as long as it keeps helping.

Measured on the running app, same question from four students:

| Asked as | Path | Time |
|---|---|---|
| "What is a webhook?" (first time) | mentor agent, strong model | 14 to 17 s |
| "Can you explain what a webhook is?" | direct match, no model call | 1.3 s |
| "hey, I keep hearing the word webhook, what does it mean" | fast-model check, then stored as a new wording | 2.4 s |
| the same loose wording again, another student | direct match, no model call | 0.5 s |
| "What is a webhook secret?" | judged different, answered fresh | 12 s |

### How it decides two questions are the same

Each stored question keeps its embedding in Postgres (pgvector, table `shared_answers`). A new
question is embedded and compared by cosine similarity with its nearest stored question.

| Similarity | Meaning | What happens |
|---|---|---|
| 0.86 and above | the same question | the stored answer is served. No model call. |
| 0.72 to 0.86 | a rewording, or a neighbouring question | the fast model answers one yes/no: would one answer serve both? |
| below 0.72 | different | the mentor agent answers as usual |

The middle band exists because embeddings alone cannot separate these two, measured with our
embedding model against "What is an API?":

- "Hey, can you explain to me what an API means": 0.79, the same question
- "What is an API key?": 0.785, a different question

A single threshold would either miss the first or wrongly serve the second. The yes/no check is
one small call to the fast model, against several calls to the strong one. When it says yes, the
new wording is saved as an alias with its own embedding, so the next student who words it that
way is a direct match with no model call. The cache gets cheaper the more it is used.

### What may be stored

An answer is shared only if it would read correctly to any student:

- the classifier marked the question `generic`, and it is the opening question of a chat (later
  questions can depend on what was said before)
- under 300 characters, no code block
- not sensitive, not a client-message draft, not a request for the human mentor
- for a general question the model returns two parts: `message`, a standalone explanation, and
  `project_note`, one to three sentences tying it to her project. The asker sees both. Only
  `message` is stored.
- a last guard refuses to store text that still names the project, the client or the student,
  or that contains a citation

Spoken questions skip the cache, because a call needs a short spoken answer, not a written one.

### Self-improvement: students flag, mentors fix, everyone benefits

A saved answer is marked **Fast** in the chat, so the student knows it was not written for her
just now. Under it is the usual "Did this solve it?".

1. She clicks **No**. The chat asks what was wrong, with quick reasons ("Too hard to follow",
   "Not what I asked", "I think it is wrong", "I need an example") and her own words.
2. Her question, the saved answer and her reason go to her mentor as a ticket, automatically.
   The ticket says that this answer is shown to every student who asks the question.
3. While the ticket is open the saved answer is held back: anyone who asks gets a fresh answer
   from the mentor agent, and that fresh answer is not saved beside the one under review.
4. The mentor corrects the answer. Their version is delivered into her chat, replaces the saved
   answer, and is served from then on as "Fast · checked by <mentor>".
5. A mentor's answer to any other ticket also joins the shared answers when the question was a
   general one. It always joins the mentor knowledge base, as before.

So the weakest answers are the ones that get a human's attention, once, and the correction
reaches every later student at no further cost.

Also kept per answer: `hits`, `helped`, `rejected`, `last_used_at` and `reviewed_by`, so stale
or weak entries can be reviewed or pruned. Hits are counted as `shared_hit` events and reported
as `answered_from_shared` in the metrics. The mentor sees a `shared_answer` step in the chat's
tool trace, with the similarity.

### Cost of a lookup

One embedding call per question, shared with the searches that were already happening: the
knowledge base search and the document search embed the same text, so recent vectors are kept in
memory and one question is embedded once instead of three or four times. The nearest-neighbour
lookup is one query. At the current size a sequential scan is fine; past a few tens of
thousands of stored questions, add an HNSW index on `shared_answers.embedding`.

## The other layers

| Layer | What it saves |
|---|---|
| Mentor knowledge base | a mentor answers a question once; the same question from anyone later is answered from it (cosine 0.80) instead of opening a ticket |
| Escalation sequence | the mentor sees a question only after the AI failed twice, with a draft answer and the context attached |
| Prefetch | the classifier, knowledge base search and document search run in parallel before the first model round |
| Repo map in the prompt | the agent does not spend a tool round discovering the codebase |
| Background work | repo sync and memory summaries run after the response is sent |
| Stateless API | sessions live in MongoDB and everything else in Postgres, so more API workers can be added behind the proxy without shared state |

## Known limits

- A shared answer is pitched at the level of the student who first asked. The project note and
  the level adaptation are lost for later askers, in exchange for an instant answer. They can
  always ask a follow-up, which is answered fresh with their profile.
- The cache is per language. A Hindi wording of an English question scores about 0.4 to 0.6 and
  is answered fresh, which is the right outcome: she should get a Hindi answer.
- The in-memory embedding cache is per process.
