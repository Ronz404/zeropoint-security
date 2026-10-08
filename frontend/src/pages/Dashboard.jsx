import { useEffect, useState } from 'react';
import { ScanLine, Server, Database, Shield, CheckCircle,
         AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Tooltip from '../components/Tooltip';

/* ------------------------------------------------------------------ */
/* Severity tooltip descriptions (layman-friendly)                     */
/* ------------------------------------------------------------------ */
const severityInfo = {
  critical: {
    label: 'Critical',
    color: '#d63031',
    bg: 'rgba(214,48,49,0.12)',
    border: 'rgba(214,48,49,0.25)',
    icon: '!!',
    tip: 'Critical vulnerabilities can let an attacker take full control of a system without any credentials. These should be patched immediately.',
  },
  high: {
    label: 'High',
    color: '#e17055',
    bg: 'rgba(225,112,85,0.12)',
    border: 'rgba(225,112,85,0.25)',
    icon: '!',
    tip: 'High-severity issues may allow unauthorized access or data theft. They require urgent attention and should be fixed within days.',
  },
  medium: {
    label: 'Medium',
    color: '#fdcb6e',
    bg: 'rgba(253,203,110,0.10)',
    border: 'rgba(253,203,110,0.25)',
    icon: 'M',
    tip: 'Medium-severity findings could be exploited under certain conditions. Plan to fix them in your next maintenance window.',
  },
  low: {
    label: 'Low',
    color: '#00b894',
    bg: 'rgba(0,184,148,0.10)',
    border: 'rgba(0,184,148,0.25)',
    icon: 'L',
    tip: 'Low-severity issues are minor weaknesses. They pose limited risk on their own but should still be addressed over time.',
  },
  info: {
    label: 'Info',
    color: '#74b9ff',
    bg: 'rgba(116,185,255,0.10)',
    border: 'rgba(116,185,255,0.25)',
    icon: 'i',
    tip: 'Informational findings are not vulnerabilities. They report facts about the system (open ports, software versions) that may be useful for security planning.',
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ critical: 0, high: 0, medium: 0, low: 0, info: 0 });
  const [scanCount, setScanCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [cveCount, setCveCount] = useState(null); // null = loading
  const [feedOk, setFeedOk] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [tasks, targets, summary] = await Promise.all([
          api.listTasks().catch(() => []),
          api.listTargets().catch(() => []),
          api.getDashboardSummary().catch(() => ({ critical: 0, high: 0, medium: 0, low: 0, info: 0 })),
        ]);
        setScanCount(tasks.length);
        setTargetCount(targets.length);
        setCounts(summary);
      } catch (e) {
        console.error(e);
      }

      // Fetch CVE/feed counts
      try {
        const info = await api.getSecInfoCounts();
        setCveCount(info?.cve_count ?? info?.cves ?? 0);
      } catch {
        setCveCount(0);
      }

      try {
        const feeds = await api.getFeedsStatus();
        const allSynced = Array.isArray(feeds) && feeds.length > 0
          && feeds.every((f) => !f.currently_syncing && !f.sync_not_available);
        setFeedOk(allSynced);
      } catch {
        setFeedOk(false);
      }
    }
    load();
  }, []);

  const totalFindings = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      {/* ---- Summary cards row ---- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 20,
      }}>
        <SummaryCard
          icon={<ScanLine size={20} />}
          label="Total Scans"
          value={scanCount}
          accent="#0984e3"
          onClick={() => navigate('/scans')}
        />
        <SummaryCard
          icon={<Server size={20} />}
          label="Total Hosts"
          value={targetCount}
          accent="#6c5ce7"
          onClick={() => navigate('/targets')}
        />
        <SummaryCard
          icon={<Shield size={20} />}
          label="Total Findings"
          value={totalFindings}
          accent="#00cec9"
          onClick={() => navigate('/trends')}
        />
        <SummaryCard
          icon={<Database size={20} />}
          label="CVE Database"
          value={cveCount === null ? '...' : cveCount.toLocaleString()}
          accent="#00b894"
          onClick={() => navigate('/cve-browser')}
          badge={
            feedOk === null ? null : feedOk ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: '#00b894', fontWeight: 500,
              }}>
                <CheckCircle size={12} /> Up to date
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: '#fdcb6e', fontWeight: 500,
              }}>
                <AlertTriangle size={12} /> Syncing
              </span>
            )
          }
        />
      </div>

      {/* ---- Severity breakdown ---- */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <h3 className="card-title" style={{ margin: 0 }}>Findings by Severity</h3>
          <button
            onClick={() => navigate('/trends')}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontSize: 12, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 4, fontFamily: 'inherit',
            }}
          >
            View trends <ChevronRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
        }}>
          {Object.entries(severityInfo).map(([key, sev]) => (
            <Tooltip key={key} text={sev.tip} position="bottom" maxWidth={280}>
              <div style={{
                background: sev.bg,
                border: `1px solid ${sev.border}`,
                borderRadius: 8,
                padding: '14px 16px',
                cursor: 'help',
                transition: 'transform 0.15s, box-shadow 0.15s',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${sev.border}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 8,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: sev.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: sev.color, fontWeight: 600 }}>
                    {sev.label}
                  </span>
                  <Info size={11} style={{ color: 'var(--text-muted)', marginLeft: 'auto', opacity: 0.5 }} />
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 700, color: 'var(--text)',
                  lineHeight: 1,
                }}>
                  {counts[key]}
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ---- Quick info ---- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      }}>
        <div className="card">
          <h3 className="card-title">Getting Started</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 8px' }}>
              ZeroPoint Security helps you find and fix vulnerabilities in your network.
              Here is how to get going:
            </p>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Add your hosts under <strong>Targets</strong></li>
              <li>Launch a scan from <strong>Scans</strong></li>
              <li>Review results in <strong>Reports</strong></li>
            </ol>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">System Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <StatRow label="Scan engine" value="OpenVAS (gvmd)" />
            <StatRow label="AI remediation" value="Ollama (llama3.2:3b)" />
            <StatRow label="Feed status" value={
              feedOk === null ? 'Checking...' : feedOk ? 'All feeds synced' : 'Syncing...'
            } ok={feedOk} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function SummaryCard({ icon, label, value, accent, badge, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${accent}20`, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
}

function StatRow({ label, value, ok }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{
        fontWeight: 500,
        color: ok === true ? '#00b894' : ok === false ? '#fdcb6e' : 'var(--text)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {ok === true && <CheckCircle size={12} />}
        {ok === false && <AlertTriangle size={12} />}
        {value}
      </span>
    </div>
  );
}
