import { useEffect, useState } from 'react';
import { Plus, Trash2, Bell, Mail } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', recipient: '', on_severity_at_least: 7.0, comment: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    setItems(await api.listAlerts().catch(() => []));
  }
  useEffect(() => { reload(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createEmailAlert({
        name: form.name,
        recipient: form.recipient,
        on_severity_at_least: parseFloat(form.on_severity_at_least),
        comment: form.comment || null,
      });
      setOpen(false);
      setForm({ name: '', recipient: '', on_severity_at_least: 7.0, comment: '' });
      reload();
    } catch (err) {
      setError(err.message || 'Failed to create alert');
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this alert?')) return;
    try { await api.deleteAlert(id); reload(); }
    catch (err) { alert(`Failed: ${err.message}`); }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Alerts</h2>
        <button className="btn" onClick={() => setOpen(true)}>
          <Plus size={14} /> New email alert
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Email alerts fire when a scan completes with findings at or above your
        severity threshold. Requires SMTP to be configured on the gvmd host.
        Useful for SMEs with no 24/7 SOC team.
      </div>

      <div className="table-wrapper">
        {items.length === 0 ? (
          <div className="empty">
            <Bell size={32} />
            <div>No alerts configured.</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              Create one to receive email notifications when critical findings appear.
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Event</th>
                <th>Condition</th>
                <th>Method</th>
                <th>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                    {a.comment && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.comment}</div>}
                  </td>
                  <td style={{ fontSize: 12 }}>{a.event || '—'}</td>
                  <td style={{ fontSize: 12 }}>{a.condition || '—'}</td>
                  <td><Mail size={12} style={{ marginRight: 4 }} />{a.method || '—'}</td>
                  <td>
                    <span className={`badge ${a.active ? 'badge-done' : 'badge-stopped'}`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => remove(a.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title="New email alert" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Alert name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Critical findings alert"
                required
              />
            </div>
            <div className="form-group">
              <label>Recipient email</label>
              <input
                type="email"
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder="security@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Trigger when severity is at least</label>
              <select
                value={form.on_severity_at_least}
                onChange={(e) => setForm({ ...form, on_severity_at_least: e.target.value })}
              >
                <option value="9.0">9.0+ (Critical only)</option>
                <option value="7.0">7.0+ (High and above)</option>
                <option value="4.0">4.0+ (Medium and above)</option>
                <option value="0.1">0.1+ (Any finding)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Comment</label>
              <input
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
              />
            </div>
            {error && (
              <div style={{ background: 'rgba(214,48,49,0.15)', color: 'var(--critical)',
                padding: '10px 12px', borderRadius: 4, fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-secondary btn" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
