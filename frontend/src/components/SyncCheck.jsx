import { useEffect, useState } from 'react';
import { Shield, Database, AlertTriangle, RefreshCw, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { api } from '../lib/api';

/**
 * SyncCheck overlay - blocks the dashboard until CVE/NVT feed sync is verified.
 * Shows a professional loading screen while checking, with an offline fallback popup.
 */
export default function SyncCheck({ children }) {
  const [status, setStatus] = useState('checking'); // checking | synced | syncing | offline | error
  const [feeds, setFeeds] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkSync();
  }, []);

  async function checkSync() {
    setStatus('checking');
    try {
      const feedData = await api.getFeedsStatus();
      setFeeds(feedData || []);

      if (!feedData || feedData.length === 0) {
        setStatus('error');
        return;
      }

      const anySyncing = feedData.some((f) => f.currently_syncing);
      const anyUnavailable = feedData.some((f) => f.sync_not_available);

      if (anySyncing) {
        setStatus('syncing');
        // Re-check in 10 seconds
        setTimeout(checkSync, 10000);
      } else if (anyUnavailable) {
        setStatus('offline');
      } else {
        setStatus('synced');
      }
    } catch {
      setStatus('offline');
    }
  }

  // If synced or user dismissed the warning, show children
  if (status === 'synced' || dismissed) {
    return children;
  }

  // Overlay
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 480,
        padding: '40px 32px',
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 32,
        }}>
          <Shield size={28} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            ZeroPoint Security
          </span>
        </div>

        {status === 'checking' && (
          <>
            <div style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'rgba(9,132,227,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RefreshCw size={28} style={{
                color: 'var(--accent)',
                animation: 'spin 1.5s linear infinite',
              }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              Verifying Feed Sync Status
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Checking if CVE and NVT databases are up to date...
            </p>
          </>
        )}

        {status === 'syncing' && (
          <>
            <div style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'rgba(253,203,110,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Database size={28} style={{
                color: '#fdcb6e',
                animation: 'spin 2s linear infinite',
              }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              Feed Synchronization in Progress
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              The vulnerability database is currently syncing. This may take several minutes
              depending on the size of the feed data. The dashboard will be available once the
              sync is complete.
            </p>
            {/* Feed progress */}
            <div style={{
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              textAlign: 'left',
              marginBottom: 20,
            }}>
              {feeds.map((f) => (
                <div key={f.type} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  fontSize: 12,
                }}>
                  <span style={{ color: 'var(--text)' }}>{f.type}</span>
                  {f.currently_syncing ? (
                    <span style={{ color: '#fdcb6e', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
                      Syncing
                    </span>
                  ) : (
                    <span style={{ color: 'var(--success, #00b894)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} /> Synced
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Auto-refreshing every 10 seconds...
            </p>
          </>
        )}

        {status === 'offline' && (
          <>
            <div style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'rgba(214,48,49,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <WifiOff size={28} style={{ color: 'var(--critical)' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              Feed Sync Unavailable
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>
              Unable to verify the CVE/NVT feed sync status. This could mean the feed server
              is unreachable or gvmd is still initializing.
            </p>
            <div style={{
              background: 'rgba(253,203,110,0.1)',
              border: '1px solid rgba(253,203,110,0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 24,
              fontSize: 12,
              color: '#fdcb6e',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              textAlign: 'left',
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Scan results may be incomplete if the vulnerability database is not fully synced.
                Proceed with caution.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={checkSync}
                className="btn-secondary btn"
                style={{ fontSize: 13, padding: '10px 20px' }}
              >
                <RefreshCw size={14} /> Retry
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="btn"
                style={{ fontSize: 13, padding: '10px 20px' }}
              >
                Continue Anyway
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'rgba(214,48,49,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={28} style={{ color: 'var(--critical)' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              Feed Status Error
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              Could not retrieve feed metadata from gvmd. The scanner may still be initializing.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={checkSync}
                className="btn-secondary btn"
                style={{ fontSize: 13, padding: '10px 20px' }}
              >
                <RefreshCw size={14} /> Retry
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="btn"
                style={{ fontSize: 13, padding: '10px 20px' }}
              >
                Continue Anyway
              </button>
            </div>
          </>
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
