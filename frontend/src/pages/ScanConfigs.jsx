import { useEffect, useState } from 'react';
import { Lock, SlidersHorizontal, Trash2, Info } from 'lucide-react';
import { api } from '../lib/api';
import { Term } from '../components/Tooltip';
import Tooltip from '../components/Tooltip';
import Pagination, { usePagination } from '../components/Pagination';

/* ------------------------------------------------------------------ */
/* Subtopic descriptions for known scan configs                        */
/* ------------------------------------------------------------------ */
const CONFIG_DESCRIPTIONS = {
  'Discovery': {
    subtitle: 'Network discovery and enumeration',
    detail: 'Identifies live hosts, open ports, and running services without testing for vulnerabilities. Use this for initial network mapping and asset inventory.',
  },
  'Host Discovery': {
    subtitle: 'Ping-based host detection',
    detail: 'Quickly finds which IP addresses are online using ping and ARP requests. The fastest scan type, ideal for checking how many devices are on a network segment.',
  },
  'System Discovery': {
    subtitle: 'OS and service fingerprinting',
    detail: 'Detects operating systems, installed software, and service versions on each host. Useful for building an accurate asset inventory before running deeper scans.',
  },
  'Full and fast': {
    subtitle: 'Comprehensive vulnerability assessment',
    detail: 'Runs all available NVT checks that are safe for production systems. This is the recommended config for a thorough vulnerability scan without causing service disruptions.',
  },
  'Full and fast ultimate': {
    subtitle: 'Maximum depth vulnerability scan',
    detail: 'Includes every NVT, even tests that may slow down or temporarily disrupt services. Best for lab environments or maintenance windows when you need the most complete picture.',
  },
  'Full and very deep': {
    subtitle: 'Deep scan with extended timeouts',
    detail: 'Similar to Full and fast but with longer timeouts and more retries. Catches vulnerabilities on slow or heavily loaded systems that faster scans might miss.',
  },
  'Full and very deep ultimate': {
    subtitle: 'Exhaustive deep scan',
    detail: 'The most thorough scan config available. Combines every test with extended timeouts. Use in controlled environments only, as it may impact system performance.',
  },
  'GaussDB 100 V300R001C20 Security Hardening Guide (Apache)': {
    subtitle: 'GaussDB Apache hardening compliance',
    detail: 'Checks Apache configurations against the GaussDB 100 V300R001C20 security hardening guide. For organizations running GaussDB that need to verify their Apache setup.',
  },
  'EulerOS Linux Security Configuration': {
    subtitle: 'EulerOS hardening compliance',
    detail: 'Validates that EulerOS Linux systems follow the recommended security configuration baseline.',
  },
  'empty': {
    subtitle: 'Blank starting point',
    detail: 'An empty config with no tests selected. Clone it and add specific NVT families to build a custom, targeted scan configuration from scratch.',
  },
  'Base': {
    subtitle: 'Minimal infrastructure checks',
    detail: 'Covers basic infrastructure tests only. A lightweight starting point when you want to check fundamental security without running a full assessment.',
  },
  'Log4Shell': {
    subtitle: 'CVE-2021-44228 detection',
    detail: 'Specifically targets the critical Log4Shell vulnerability (CVE-2021-44228) in Apache Log4j. Run this to quickly check if any of your Java applications are affected.',
  },
};

export default function ScanConfigs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const data = await api.listScanConfigsDetailed();
      setItems(data || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  async function remove(id, name) {
    if (!confirm(`Delete custom config "${name}"?`)) return;
    try {
      await api.deleteScanConfig(id);
      reload();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  }

  function getDescription(name) {
    return CONFIG_DESCRIPTIONS[name] || null;
  }

  const [paged, pgProps] = usePagination(items, 'config');

  return (
    <div>
      <div className="page-header">
        <h2>Scan Configs</h2>
      </div>

      {/* Informative blurb */}
      <div style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        fontSize: 13,
        color: 'var(--text-muted)',
        lineHeight: 1.7,
      }}>
        Scan configs control <em>what</em> gets tested during a vulnerability scan.
        Each config is a selection of{' '}
        <Term
          label="NVT"
          definition="Network Vulnerability Test. A small script that checks one specific weakness on a target. OpenVAS ships tens of thousands of NVTs, organized into families like 'Web application abuses' or 'Denial of Service'."
        />{' '}
        families (groups of related tests). Built-in configs cover common use cases.
        For targeted assessments, clone a built-in config and enable only the
        NVT families relevant to your environment.
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="empty"><SlidersHorizontal size={32} /><div>No scan configs loaded.</div></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Families</th>
                <th>NVTs</th>
                <th>Usage</th>
                <th>Source</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => {
                const desc = getDescription(c.name);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong>{c.name}</strong>
                        {desc && (
                          <Tooltip text={desc.detail} position="right" maxWidth={320}>
                            <Info size={13} style={{ color: 'var(--text-muted)', opacity: 0.5, cursor: 'help', flexShrink: 0 }} />
                          </Tooltip>
                        )}
                      </div>
                      {desc ? (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {desc.subtitle}
                        </div>
                      ) : c.comment ? (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.comment}</div>
                      ) : null}
                    </td>
                    <td>{c.family_count ?? '—'}</td>
                    <td>{c.nvt_count_total ?? '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.usage_type || 'scan'}</td>
                    <td>
                      {c.predefined ? (
                        <span className="badge badge-done"><Lock size={10} /> Built-in</span>
                      ) : (
                        <span className="badge badge-new">Custom</span>
                      )}
                    </td>
                    <td>
                      {!c.predefined && (
                        <button
                          className="btn-icon"
                          title="Delete this custom config"
                          onClick={() => remove(c.id, c.name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination {...pgProps} />
      </div>
    </div>
  );
}
