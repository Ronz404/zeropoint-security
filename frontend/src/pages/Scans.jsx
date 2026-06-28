import { useEffect, useState } from 'react';
import { Plus, Play, Square, Trash2, ScanLine } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';

function statusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'running' || s === 'requested') return <span className="badge badge-running">{status}</span>;
  if (s === 'done' || s === 'stopped') return <span className="badge badge-done">{status}</span>;
  if (s === 'new') return <span className="badge badge-new">{status}</span>;
  return <span className="badge badge-stopped">{status || '—'}</span>;
}

export default function Scans() {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [scanners, setScanners] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    name: '', target_id: '', config_id: '', scanner_id: '', schedule_id: '',
  });

  async function reload() {
    setTasks(await api.listTasks().catch(() => []));
  }

  async function loadFormData() {
    const [t, c, s, sched] = await Promise.all([
      api.listTargets().catch(() => []),
      api.listScanConfigs().catch(() => []),
      api.listScanners().catch(() => []),
      api.listSchedules().catch(() => []),
    ]);
    setTargets(t); setConfigs(c); setScanners(s); setSchedules(sched);
  }

  useEffect(() => { reload(); }, []);

  async function openModal() {
    await loadFormData();
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.schedule_id) delete payload.schedule_id;
    await api.createTask(payload);
    setOpen(false);
    setForm({ name: '', target_id: '', config_id: '', scanner_id: '', schedule_id: '' });
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Scans</h2>
        <button className="btn" onClick={openModal}>
          <Plus size={14} /> New scan
        </button>
      </div>

      <div className="table-wrapper">
        {tasks.length === 0 ? (
          <div className="empty">
            <ScanLine size={32} />
            <div>No scans yet. Create a target first, then schedule a scan.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Severity</th>
                <th>Last run</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>{t.progress ?? 0}%</td>
                  <td>{t.severity ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {t.last_report?.report?.timestamp || '—'}
                  </td>
                  <td>
                    <div className="flex">
                      <button className="btn-icon" title="Start" onClick={() => api.startTask(t.id).then(reload)}>
                        <Play size={14} />
                      </button>
                      <button className="btn-icon" title="Stop" onClick={() => api.stopTask(t.id).then(reload)}>
                        <Square size={14} />
                      </button>
                      <button className="btn-icon" title="Delete" onClick={async () => {
                        if (confirm('Delete this scan?')) { await api.deleteTask(t.id); reload(); }
                      }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title="New scan" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Target</label>
              <select value={form.target_id} onChange={(e) => setForm({ ...form, target_id: e.target.value })} required>
                <option value="">— select —</option>
                {targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Scan config</label>
              <select value={form.config_id} onChange={(e) => setForm({ ...form, config_id: e.target.value })} required>
                <option value="">— select —</option>
                {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Scanner</label>
              <select value={form.scanner_id} onChange={(e) => setForm({ ...form, scanner_id: e.target.value })} required>
                <option value="">— select —</option>
                {scanners.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Schedule (optional)</label>
              <select value={form.schedule_id} onChange={(e) => setForm({ ...form, schedule_id: e.target.value })}>
                <option value="">Run on demand</option>
                {schedules.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary btn" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn">Create</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
