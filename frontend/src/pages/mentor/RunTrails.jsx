import React, { useEffect, useState } from 'react';
import { mentorDeskService } from '../../services/mentorDeskService';
import { errorMessage } from '../../services/apiClient';
import { PageHeader, SectionCard, Loading } from '../../components/ui/Bits';

export default function RunTrails() {
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [query, setQuery] = useState('');
  const [runs, setRuns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [verdict, setVerdict] = useState('correct');
  const [critical, setCritical] = useState('');
  const [notes, setNotes] = useState('');
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState('');
  const [expectedRefs, setExpectedRefs] = useState('');
  const [forbiddenText, setForbiddenText] = useState('');
  const [requiredText, setRequiredText] = useState('');
  const [latestEval, setLatestEval] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    mentorDeskService.listProjects()
      .then((rows) => { setProjects(rows); setProjectId(rows[0]?.id || ''); })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const search = async (id = projectId, q = query) => {
    try { setRuns(await mentorDeskService.listRuns(id, q)); setError(''); }
    catch (err) { setError(errorMessage(err)); }
  };

  useEffect(() => {
    if (projectId) {
      setSelected(null); search(projectId, '');
      mentorDeskService.listEvalCases(projectId).then(setCases).catch((err) => setError(errorMessage(err)));
      mentorDeskService.getLatestEval(projectId).then(setLatestEval).catch((err) => setError(errorMessage(err)));
      mentorDeskService.listAuditEvents(projectId).then(setAuditEvents).catch((err) => setError(errorMessage(err)));
    }
  }, [projectId]);

  const open = async (id) => {
    try {
      const row = await mentorDeskService.getRun(id);
      setSelected(row);
      setVerdict(row.review?.verdict || 'correct');
      setCritical(row.review?.critical_failure || '');
      setNotes(row.review?.notes || '');
      setCaseId('');
      setExpectedRefs((row.events.find((event) => event.name === 'agent.response')?.output?.citations || [])
        .filter((citation) => citation.type === 'requirement').map((citation) => citation.ref).join('\n'));
      setForbiddenText('');
      setRequiredText('');
    } catch (err) { setError(errorMessage(err)); }
  };

  const saveReview = async () => {
    try {
      const review = await mentorDeskService.reviewRun(selected.id, {
        verdict, critical_failure: critical || null, notes,
        expected_reviewed_at: selected.review?.reviewed_at || null
      });
      setSelected({ ...selected, review });
      await search();
    } catch (err) { setError(errorMessage(err)); }
  };

  const parseLines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);

  const saveCase = async () => {
    try {
      if (caseId) {
        await mentorDeskService.updateEvalCase(caseId, parseLines(expectedRefs), parseLines(forbiddenText), parseLines(requiredText));
      } else {
        await mentorDeskService.createEvalCase(selected.id, parseLines(expectedRefs), parseLines(forbiddenText), parseLines(requiredText));
      }
      setCases(await mentorDeskService.listEvalCases(projectId));
      setError('');
    } catch (err) { setError(errorMessage(err)); }
  };

  const openCase = (row) => {
    setCaseId(row.id);
    setExpectedRefs(row.expected_refs.join('\n'));
    setForbiddenText(row.forbidden_text.join('\n'));
    setRequiredText((row.required_text || []).join('\n'));
  };

  if (!projects) return <Loading />;
  return <>
    <PageHeader title="Run trails" subtitle="Inspect questions, model calls, tools, sources and outcomes. Review live answers here." />
    {error && <div className="notice-error">{error}</div>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input value={query} placeholder="Search questions" onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') search(); }} />
      <button onClick={() => search()}>Search</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(500px, 2fr)', gap: 16, alignItems: 'start' }}>
      <SectionCard title={`Runs (${runs.length})`}>
        {runs.length === 0 && <p>No runs found.</p>}
        {runs.map((run) => <button key={run.id} onClick={() => open(run.id)}
          style={{ display: 'block', width: '100%', padding: 10, textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
          <strong>{run.question}</strong>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)' }}>
            {new Date(run.created_at).toLocaleString()} · {run.outcome} · {run.event_count} events
            {run.review && ` · ${run.review.verdict}`}
          </span>
        </button>)}
      </SectionCard>
      <SectionCard title={selected ? `Run ${selected.id.slice(0, 12)}` : 'Select a run'}>
        {selected && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><strong>Question</strong><p style={{ whiteSpace: 'pre-wrap' }}>{selected.question}</p></div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            Student {selected.actor_id} · Outcome {selected.outcome} · Session {selected.session_id || 'none'}
          </div>
          {selected.events.map((event, index) => <details key={`${event.span_id}-${index}`}>
            <summary>{event.name} · {new Date(event.timestamp).toLocaleTimeString()}</summary>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 420, overflow: 'auto', fontSize: 12 }}>
              {JSON.stringify({ input: event.input, output: event.output, attributes: event.attributes }, null, 2)}
            </pre>
          </details>)}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong>Mentor review</strong>
            <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
              <option value="correct">Correct</option><option value="incorrect">Incorrect</option><option value="uncertain">Uncertain</option>
            </select>
            <select value={critical} onChange={(e) => { setCritical(e.target.value); if (e.target.value) setVerdict('incorrect'); }}>
              <option value="">No critical failure</option>
              <option value="cross_project_disclosure">Cross-project disclosure</option>
              <option value="unsupported_requirement">Unsupported requirement claim</option>
            </select>
            <textarea rows={3} value={notes} placeholder="What should change?" onChange={(e) => setNotes(e.target.value)} />
            <button onClick={saveReview}>Save review</button>
          </div>
          {selected.review?.verdict === 'correct' && <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong>{caseId ? 'Edit regression case' : 'Add to regression set'}</strong>
            <label>Required requirement citations (one per line)
              <textarea rows={2} value={expectedRefs} onChange={(e) => setExpectedRefs(e.target.value)} />
            </label>
            <label>Forbidden project content (one phrase per line)
              <textarea rows={2} value={forbiddenText} onChange={(e) => setForbiddenText(e.target.value)} />
            </label>
            <label>Required answer facts (one phrase per line)
              <textarea rows={2} value={requiredText} onChange={(e) => setRequiredText(e.target.value)} />
            </label>
            <button disabled={!expectedRefs.trim() && !forbiddenText.trim() && !requiredText.trim()} onClick={saveCase}>Save regression case</button>
          </div>}
        </div>}
      </SectionCard>
    </div>
    <SectionCard title={`Regression set (${cases.length})`} hint="Engineering runs this fixed set after model, prompt or requirement changes.">
      <p>Latest run: {latestEval ? `${latestEval.status}${latestEval.stale ? ' (stale after source or configuration change)' : ''} · ${latestEval.passed} passed, ${latestEval.failed} failed` : 'none yet'}</p>
      {cases.map((row) => <button key={row.id} onClick={async () => { await open(row.source_trace_id); openCase(row); }}
        style={{ display: 'block', textAlign: 'left', width: '100%', padding: 8, borderBottom: '1px solid var(--color-border)' }}>
        {row.question} · {row.expected_refs.length} required citations{row.source_changed ? ' · review after source change' : ''}
      </button>)}
    </SectionCard>
    <SectionCard title="Change audit" hint="Mentor publications, feedback and reviews for this project.">
      {auditEvents.length === 0 && <p>No change events yet.</p>}
      {auditEvents.map((event) => <details key={event.id} style={{ padding: 8, borderBottom: '1px solid var(--color-border)' }}>
        <summary>{event.action} · {event.actor_id} · {new Date(event.created_at).toLocaleString()}</summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12 }}>
          {JSON.stringify({ target_id: event.target_id, before: event.before, after: event.after }, null, 2)}
        </pre>
      </details>)}
    </SectionCard>
  </>;
}
