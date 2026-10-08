import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Reusable pagination component.
 *
 * @param {number} total       - Total number of items
 * @param {number} page        - Current page (1-based)
 * @param {number} pageSize    - Items per page
 * @param {function} onPage    - (newPage) => void
 * @param {function} onSize    - (newSize) => void
 * @param {string}  [noun]     - Item noun for display (e.g. "scan", "target")
 */
export default function Pagination({ total, page, pageSize, onPage, onSize, noun = 'item' }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  if (total <= 10 && pageSize >= total) return null; // hide when everything fits

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      fontSize: 12,
      color: 'var(--text-muted)',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      {/* Left: showing X-Y of Z */}
      <span>
        Showing <strong style={{ color: 'var(--text)' }}>{from}</strong>
        {' '}&ndash;{' '}
        <strong style={{ color: 'var(--text)' }}>{to}</strong>
        {' '}of{' '}
        <strong style={{ color: 'var(--text)' }}>{total}</strong>
        {' '}{total === 1 ? noun : `${noun}s`}
      </span>

      {/* Center: page buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PgBtn onClick={() => onPage(1)} disabled={page <= 1} title="First page">
          <ChevronsLeft size={14} />
        </PgBtn>
        <PgBtn onClick={() => onPage(page - 1)} disabled={page <= 1} title="Previous page">
          <ChevronLeft size={14} />
        </PgBtn>

        {pageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>&hellip;</span>
          ) : (
            <PgBtn
              key={p}
              active={p === page}
              onClick={() => onPage(p)}
            >
              {p}
            </PgBtn>
          )
        )}

        <PgBtn onClick={() => onPage(page + 1)} disabled={page >= totalPages} title="Next page">
          <ChevronRight size={14} />
        </PgBtn>
        <PgBtn onClick={() => onPage(totalPages)} disabled={page >= totalPages} title="Last page">
          <ChevronsRight size={14} />
        </PgBtn>
      </div>

      {/* Right: page size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>Per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onSize(Number(e.target.value))}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text)',
            fontSize: 12,
            padding: '3px 6px',
            fontFamily: 'inherit',
          }}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function PgBtn({ children, active, disabled, onClick, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        minWidth: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 4,
        background: active ? 'rgba(9,132,227,0.15)' : 'transparent',
        color: active ? 'var(--accent)' : disabled ? 'var(--text-muted)' : 'var(--text)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        fontFamily: 'inherit',
        padding: '0 4px',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

/** Generate page number array with ellipses. */
function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

/**
 * Hook for pagination state.
 * Returns [paginatedItems, paginationProps].
 *
 * Usage:
 *   const [paged, pgProps] = usePagination(allItems, 'scan');
 *   // render paged rows, then <Pagination {...pgProps} />
 */
export function usePagination(items, noun = 'item', defaultSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);

  // Reset to page 1 when items change or pageSize changes
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);

  const start = (safePage - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return [paged, {
    total,
    page: safePage,
    pageSize,
    onPage: (p) => setPage(Math.max(1, Math.min(p, totalPages))),
    onSize: (s) => { setPageSize(s); setPage(1); },
    noun,
  }];
}

