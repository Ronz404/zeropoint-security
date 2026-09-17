import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, X, Search, FolderClosed, CheckCircle, XCircle,
         Clock, ScanLine, Trash2, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';

/* Map scan config names to user-friendly types */
function scanType(task) {
  const cfg = (task.config?.name || task.scan_config?.name || '').toLowerCase();
  if (cfg.includes('discovery')) return 'Host Discovery';
  if (cfg.includes('full and fast')) return 'Vulnerability';
  if (cfg.includes('tls') || cfg.includes('ssl')) return 'TLS / SSL';
  if (cfg.includes('web')) return 'Web Application';
  return 'Vulnerability';
}

function statusIcon(status) {
  const s = (status || '').toLowerCase();
  if (s === 'done') return <CheckCircle size={16} style={{ color: 'var(--accent)' }} />;
  if (s === 'running' || s === 'requested') return (
    <span className="scan-status-icon">
      <span style={{
        display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
        border: '2px solid var(--accent)', borderTopColor: 'transparent',
        animation: 'spin 1s linear infinite',
      }} />
    </span>
  );
  if (s === 'stopped') return <XCircle size={16} style={{ color: 'var(--critical)' }} />;
  if (s === 'new') return <Clock size={16} style={{ color: 'var(--text-muted)' }} />;
  return <Clock size={16} style={{ color: 'var(--text-muted)' }} />;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const hour = d.getHours();
    const minute = d.getMinutes().toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${months[d.getMonth()]} ${d.getDate()} at ${h12}:${minute} ${ampm}`;
  } catch {
    return dateStr;
  }
}

export default function Scans() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function reload() {
    try {
      const t = await api.listTasks();
      setTasks(t || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = tasks.filter((t) =>
    (t.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="scan-layout">
      {/* Folder sidebar */}
      <div className="scan-folders">
        <div className="folder-title">Folders</div>
        <div className="folder-item active">
          <FolderClosed size={14} />
          <span>My Scans</span>
          <span className="folder-count">{tasks.length}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="scan-main">
        {/* Top bar */}
        <div className="scan-topbar">
          <h2>My Scans</h2>
          <div className="scan-topbar-actions">
            <button className="btn-nessus" onClick={() => navigate('/scans/new')}>
              <Plus size={14} /> New Scan
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="scan-search-bar">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              placeholder="Search Scans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
          </div>
          <span className="scan-count">{filtered.length} Scan{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Scan table */}
        {loading ? (
          <div className="empty" style={{ padding: 60 }}>Loading scans...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <ScanLine size={32} />
            <div>{search ? 'No scans match your search.' : 'No scans yet. Click + New Scan to get started.'}</div>
          </div>
        ) : (
          <table className="scan-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th className="sortable">Name</th>
                <th>Scan Type</th>
                <th>Schedule</th>
                <th></th>
                <th className="sortable">
                  Last Scanned <ChevronDown size={10} style={{ verticalAlign: 'middle' }} />
                </th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const lastRun = t.last_report?.report?.timestamp || '';
                return (
                  <tr key={t.id}>
                    <td>
                      <input type="checkbox" style={{ accentColor: 'var(--accent)' }} />
                    </td>
                    <td>
                      <Link to={`/scans/${t.id}`} className="scan-name">
                        {t.name}
                      </Link>
                    </td>
                    <td>
                      <span className="scan-type-badge">{scanType(t)}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {t.schedule?.name || 'On Demand'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {statusIcon(t.status)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatDate(lastRun)}
                    </td>
                    <td>
                      <div className="scan-actions">
                        <button title="Start scan" onClick={(e) => {
                          e.stopPropagation();
                          api.startTask(t.id).then(reload);
                        }}>
                          <Play size={14} />
                        </button>
                        <button title="Delete scan" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this scan?')) api.deleteTask(t.id).then(reload);
                        }}>
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
