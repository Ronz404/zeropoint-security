import { useEffect, useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

function severityColor(score) {
  const s = parseFloat(score);
  if (Number.isNaN(s)) return 'var(--text-muted)';
  if (s >= 9) return 'var(--critical)';
  if (s >= 7) return 'var(--high)';
  if (s >= 4) return 'var(--medium)';
  if (s > 0) return 'var(--low)';
  return 'var(--info)';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Reports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listReports()
      .then((data) => { setItems(data); setLoading(false); })
      .catch(() => { setItems([]); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Reports</h2>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty">Loading reports…</div>
        ) : items.length === 0 ? (
          <div className="empty">
            <FileText size={32} />
            <div>No reports yet. Run a scan to generate one.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Findings</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.task_name || r.name || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(r.creation_time)}</td>
                  <td>
                    <span className="badge badge-done">{r.scan_status || '—'}</span>
                  </td>
                  <td>
                    <strong style={{ color: severityColor(r.severity) }}>
                      {r.severity != null ? parseFloat(r.severity).toFixed(1) : '—'}
                    </strong>
                  </td>
                  <td>{r.result_count_full ?? '—'}</td>
                  <td>
                    <div className="flex">
                      <Link className="btn-icon" to={`/reports/${r.id}`} title="View findings">
                        <Eye size={14} />
                      </Link>
                      <a
                        className="btn-icon"
                        href={api.exportReportUrl(r.id, 'pdf')}
                        title="Download PDF"
                      >
                        <Download size={14} />
                        <span style={{ marginLeft: 4, fontSize: 11 }}>PDF</span>
                      </a>
                      <a
                        className="btn-icon"
                        href={api.exportReportUrl(r.id, 'csv')}
                        title="Download CSV"
                        style={{ fontSize: 11 }}
                      >
                        CSV
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
