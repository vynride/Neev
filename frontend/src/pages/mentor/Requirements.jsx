import React, { useEffect, useState } from 'react';
import { mentorDeskService } from '../../services/mentorDeskService';
import { errorMessage } from '../../services/apiClient';
import { PageHeader, SectionCard, Loading } from '../../components/ui/Bits';

const emptyDraft = { title: '', body: '', effective_date: '' };

export default function Requirements() {
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    mentorDeskService.listProjects()
      .then((rows) => { setProjects(rows); setProjectId(rows[0]?.id || ''); })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const refresh = async (id) => {
    const rows = await mentorDeskService.listRequirements(id);
    setItems(rows);
    return rows;
  };

  useEffect(() => {
    if (!projectId) return;
    setSelected(null);
    setDraft(emptyDraft);
    refresh(projectId).catch((err) => setError(errorMessage(err)));
  }, [projectId]);

  const open = async (id) => {
    setError('');
    try {
      const row = await mentorDeskService.getRequirement(projectId, id);
      const hasDraft = row.draft_title != null || row.draft_body != null;
      setSelected(row);
      setDraft({
        title: row.draft_title ?? row.title,
        body: row.draft_body ?? row.body,
        effective_date: (hasDraft ? row.draft_effective_date : row.effective_date) || ''
      });
    } catch (err) { setError(errorMessage(err)); }
  };

  const submit = async (publish = false) => {
    setBusy(true); setError(''); setNotice('');
    try {
      let row = selected;
      if (!row) {
        row = await mentorDeskService.createRequirement(projectId, {
          ...draft, effective_date: draft.effective_date || null
        });
      } else if (row.draft_title !== draft.title || row.draft_body !== draft.body ||
          ((row.draft_title != null ? row.draft_effective_date : row.effective_date) || '') !== draft.effective_date) {
        row = await mentorDeskService.saveRequirement(projectId, row.id, {
          ...draft, effective_date: draft.effective_date || null,
          expected_revision: row.draft_revision
        });
      }
      if (publish) {
        row = await mentorDeskService.publishRequirement(projectId, row.id, row.draft_revision);
        setNotice(`Version ${row.version} is live. Cached answers have been invalidated.`);
      } else {
        setNotice('Draft saved. Students cannot see it yet.');
      }
      await refresh(projectId);
      await open(row.id);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  if (!projects) return <Loading />;

  return <>
    <PageHeader title="Requirements" subtitle="Edit and publish project requirements. Published versions take precedence in student answers." />
    {error && <div className="notice-error">{error}</div>}
    {notice && <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-primary-subtle)' }}>{notice}</div>}
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
      <span>Project</span>
      <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
    </label>
    {projectId && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(420px, 2fr)', gap: 16, alignItems: 'start' }}>
      <SectionCard title="Records" action={<button onClick={() => { setSelected(null); setDraft(emptyDraft); setNotice(''); }}>New requirement</button>}>
        {items.length === 0 && <p>No requirements yet.</p>}
        {items.map((row) => <button key={row.id} onClick={() => open(row.id)}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: 10, borderBottom: '1px solid var(--color-border)' }}>
          <strong>{row.draft_title || row.title}</strong>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)' }}>
            {row.status === 'published' ? `Published v${row.version}` : 'Draft'}{row.draft_title ? ' · unpublished edits' : ''}
          </span>
        </button>)}
      </SectionCard>
      <SectionCard title={selected ? 'Edit requirement' : 'New requirement'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>Title<input value={draft.title} maxLength={200} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label>Requirement<textarea value={draft.body} rows={9} maxLength={10000} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
          <label>Effective date<input type="date" value={draft.effective_date || ''} onChange={(e) => setDraft({ ...draft, effective_date: e.target.value })} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={busy || !draft.title.trim() || !draft.body.trim()} onClick={() => submit(false)}>Save draft</button>
            <button disabled={busy || !draft.title.trim() || !draft.body.trim()} onClick={() => submit(true)}>Publish</button>
          </div>
          {selected?.history?.length > 0 && <details>
            <summary>Version history ({selected.history.length})</summary>
            {selected.history.map((version) => <div key={version.version} style={{ padding: 10, borderBottom: '1px solid var(--color-border)' }}>
              <strong>v{version.version}: {version.title}</strong> · {new Date(version.published_at).toLocaleString()}
              <p style={{ whiteSpace: 'pre-wrap' }}>{version.body}</p>
            </div>)}
          </details>}
        </div>
      </SectionCard>
    </div>}
  </>;
}
