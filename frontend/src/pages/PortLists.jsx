import { useEffect, useState } from 'react';
import { Plus, Trash2, ListOrdered, Lock, Globe, Wifi } from 'lucide-react';
import { api } from '../lib/api';
import { Term } from '../components/Tooltip';
import Modal from '../components/Modal';
import Pagination, { usePagination } from '../components/Pagination';

const PRESETS = [
  { label: 'Web only (80, 443, 8080, 8443)', value: 'T:80,443,8080,8443' },
  { label: 'TCP 1-1024 (well-known)', value: 'T:1-1024' },
  { label: 'TCP 1-65535 (all)', value: 'T:1-65535' },
  { label: 'TCP + UDP 1-1024', value: 'T:1-1024,U:1-1024' },
  { label: 'Custom...', value: '' },
];

export default function PortLists() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', port_range: 'T:1-1024', comment: '', preset: 'T:1-1024' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    setItems(await api.listPortLists().catch(() => []));
  }
  useEffect(() => { reload(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        port_range: form.port_range,
        comment: form.comment || null,
      };
      await api.createPortList(payload);
      setOpen(false);
      setForm({ name: '', port_range: 'T:1-1024', comment: '', preset: 'T:1-1024' });
      reload();
    } catch (err) {
      setError(err.message || 'Failed to create port list');
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id, predefined) {
    if (predefined) {
      alert('Built-in port lists cannot be deleted.');
      return;
    }
    if (!confirm('Delete this port list?')) return;
    try {
      await api.deletePortList(id);
      reload();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  }

  const [paged, pgProps] = usePagination(items, 'port list');

  return (
    <div>
      <div className="page-header">
        <h2>Port Lists</h2>
        <button className="btn" onClick={() => setOpen(true)}>
          <Plus size={14} /> New port list
        </button>
      </div>

      {/* ---- Informative section ---- */}
      <div style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 14, margin: '0 0 12px', color: 'var(--text)' }}>
          Understanding Port Lists
        </h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 10px' }}>
            A <strong style={{ color: 'var(--text)' }}>port</strong> is like a
            numbered doorway on a computer. Each network service (web, email,
            file sharing) listens on a specific port number. When ZeroPoint scans
            a target, it checks these doorways to see which services are running
            and whether they have known vulnerabilities.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Port numbers are managed by the{' '}
            <Term
              label="IANA"
              definition="Internet Assigned Numbers Authority. The global organization that maintains the official registry of port number assignments, ensuring every well-known service gets a unique, recognized port number."
            />{' '}
            (Internet Assigned Numbers Authority), which maintains the official
            registry of which port number belongs to which service.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            <div style={{
              background: 'var(--bg)',
              borderRadius: 6,
              padding: 14,
              border: '1px solid var(--border)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 8, color: 'var(--accent)',
              }}>
                <Wifi size={16} />
                <strong style={{ fontSize: 13 }}>
                  <Term
                    label="TCP"
                    definition="Transmission Control Protocol. A reliable, connection-based protocol. It guarantees data arrives in order and without errors, like a phone call where both sides confirm every message. Used by web browsing, email, file transfers, and most everyday internet services."
                    position="bottom"
                  />
                  {' '} (Transmission Control Protocol)
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>
                Reliable, connection-based. Guarantees data arrives in order and
                without errors. Used by web servers (port 80/443), email (port 25),
                SSH (port 22), and most everyday internet services.
              </p>
            </div>

            <div style={{
              background: 'var(--bg)',
              borderRadius: 6,
              padding: 14,
              border: '1px solid var(--border)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 8, color: '#6c5ce7',
              }}>
                <Globe size={16} />
                <strong style={{ fontSize: 13 }}>
                  <Term
                    label="UDP"
                    definition="User Datagram Protocol. A fast, connectionless protocol. It sends data without waiting for confirmation, like dropping a letter in the mailbox. Used by DNS lookups, video streaming, VoIP calls, and online gaming where speed matters more than perfect delivery."
                    position="bottom"
                  />
                  {' '} (User Datagram Protocol)
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>
                Fast, connectionless. Sends data without waiting for confirmation.
                Used by DNS (port 53), video streaming, VoIP calls, and online
                gaming where speed matters more than perfect delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Port lists define which TCP/UDP ports a scan will probe. Built-in lists
        (locked icon) cannot be modified; create your own for custom scopes.
      </div>

      <div className="table-wrapper">
        {items.length === 0 ? (
          <div className="empty"><ListOrdered size={32} /><div>No port lists loaded.</div></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>TCP</th>
                <th>UDP</th>
                <th>Total</th>
                <th>Source</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.comment && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.comment}</div>}
                  </td>
                  <td>{p.tcp_count ?? '—'}</td>
                  <td>{p.udp_count ?? '—'}</td>
                  <td>{p.total_count ?? '—'}</td>
                  <td>
                    {p.predefined ? (
                      <span className="badge badge-done"><Lock size={10} /> Built-in</span>
                    ) : (
                      <span className="badge badge-new">Custom</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => remove(p.id, p.predefined)}
                      disabled={p.predefined}
                      style={{ opacity: p.predefined ? 0.3 : 1 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination {...pgProps} />
      </div>

      {open && (
        <Modal title="New port list" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My web ports"
                required
              />
            </div>
            <div className="form-group">
              <label>Preset</label>
              <select
                value={form.preset}
                onChange={(e) => setForm({ ...form, preset: e.target.value, port_range: e.target.value || form.port_range })}
              >
                {PRESETS.map((p, i) => (
                  <option key={i} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Port range  (format: T:1-1024,U:53 - T=TCP, U=UDP)</label>
              <input
                value={form.port_range}
                onChange={(e) => setForm({ ...form, port_range: e.target.value })}
                required
              />
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
