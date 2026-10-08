import { useState, useRef, useEffect } from 'react';

/**
 * Reusable hover tooltip component.
 * Wraps children and shows a tooltip on hover.
 *
 * @param {string} text - Tooltip content
 * @param {string} [position='top'] - 'top' | 'bottom' | 'left' | 'right'
 * @param {number} [maxWidth=260] - Max width of tooltip popup
 * @param {React.ReactNode} children - Element to attach tooltip to
 */
export default function Tooltip({ text, position = 'top', maxWidth = 260, children }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapRef = useRef(null);
  const tipRef = useRef(null);
  const timer = useRef(null);

  function show() {
    timer.current = setTimeout(() => setVisible(true), 200);
  }

  function hide() {
    clearTimeout(timer.current);
    setVisible(false);
  }

  useEffect(() => {
    if (!visible || !wrapRef.current || !tipRef.current) return;
    const wr = wrapRef.current.getBoundingClientRect();
    const tp = tipRef.current.getBoundingClientRect();
    let top = 0, left = 0;

    switch (position) {
      case 'bottom':
        top = wr.height + 8;
        left = (wr.width - tp.width) / 2;
        break;
      case 'left':
        top = (wr.height - tp.height) / 2;
        left = -(tp.width + 8);
        break;
      case 'right':
        top = (wr.height - tp.height) / 2;
        left = wr.width + 8;
        break;
      default: // top
        top = -(tp.height + 8);
        left = (wr.width - tp.width) / 2;
    }

    // Clamp to viewport
    const absLeft = wr.left + left;
    if (absLeft < 8) left += (8 - absLeft);
    if (absLeft + tp.width > window.innerWidth - 8) left -= (absLeft + tp.width - window.innerWidth + 8);

    setCoords({ top, left });
  }, [visible, position]);

  return (
    <span
      ref={wrapRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {children}
      {visible && (
        <span
          ref={tipRef}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            maxWidth,
            padding: '8px 12px',
            background: '#1a2028',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            color: '#dfe6e9',
            fontSize: 12,
            lineHeight: 1.5,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            whiteSpace: 'normal',
            animation: 'tooltip-fade 0.15s ease',
          }}
        >
          {text}
        </span>
      )}

      <style>{`
        @keyframes tooltip-fade {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}

/**
 * Inline technical term with dotted underline + tooltip.
 * Use for NVT, SCAP, CERT, GVMD, IANA, TCP, UDP, etc.
 */
export function Term({ label, definition, position = 'top' }) {
  return (
    <Tooltip text={definition} position={position} maxWidth={300}>
      <span style={{
        borderBottom: '1px dotted rgba(255,255,255,0.35)',
        cursor: 'help',
        color: 'inherit',
      }}>
        {label}
      </span>
    </Tooltip>
  );
}
