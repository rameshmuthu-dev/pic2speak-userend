import React, { useEffect, useState, useCallback, useRef } from 'react';

/* ─────────────────────────────────────────
   Confetti particle – pure CSS animation
   ───────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#34d399', // emerald-400
  '#2dd4bf', // teal-400
  '#67e8f9', // cyan-300
  '#a78bfa', // purple-400
  '#fbbf24', // amber-400
  '#f472b6', // pink-400
  '#60a5fa', // blue-400
];

function ConfettiPiece({ style }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className="confetti-piece"
    />
  );
}

function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 0.6}s`,
      duration: `${1.0 + Math.random() * 0.8}s`,
      size: `${6 + Math.random() * 6}px`,
      rotate: `${Math.random() * 360}deg`,
      shape: Math.random() > 0.5 ? 'square' : 'rect',
    }))
  ).current;

  if (!active) return null;

  return (
    <div aria-hidden="true" className="confetti-container">
      {pieces.map((p) => (
        <ConfettiPiece
          key={p.id}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.shape === 'square' ? p.size : `calc(${p.size} * 0.55)`,
            height: p.shape === 'square' ? p.size : `calc(${p.size} * 1.6)`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main component
   ───────────────────────────────────────── */
const LessonCompletionModal = ({
  isOpen,
  onContinue,
  onClose,
  completedScenes,
  totalScenes,
  lessonTitle = 'Lesson',
}) => {
  // mount/unmount gate
  const [mounted, setMounted] = useState(false);
  // CSS animation phases: 'in' | 'out' | 'idle'
  const [phase, setPhase] = useState('idle');
  // staggered content visibility
  const [contentVisible, setContentVisible] = useState(false);
  // checkmark pop
  const [checkPop, setCheckPop] = useState(false);
  // confetti
  const [confetti, setConfetti] = useState(false);

  const exitTimerRef = useRef(null);
  const staggerTimerRef = useRef(null);
  const confettiTimerRef = useRef(null);

  // ── OPEN ──────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setPhase('idle');
      setContentVisible(false);
      setCheckPop(false);
      setConfetti(false);

      // next frame: trigger entrance
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('in');
        });
      });

      // stagger content
      staggerTimerRef.current = setTimeout(() => {
        setContentVisible(true);
      }, 200);

      // checkmark pop after modal arrives
      const checkTimer = setTimeout(() => setCheckPop(true), 350);

      // confetti after checkmark
      confettiTimerRef.current = setTimeout(() => setConfetti(true), 600);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(staggerTimerRef.current);
        clearTimeout(checkTimer);
        clearTimeout(confettiTimerRef.current);
      };
    }
  }, [isOpen]);

  // ── CLOSE / EXIT ──────────────────────
  const triggerExit = useCallback((callback) => {
    setPhase('out');
    setConfetti(false);
    exitTimerRef.current = setTimeout(() => {
      setMounted(false);
      setPhase('idle');
      setContentVisible(false);
      setCheckPop(false);
      if (callback) callback();
    }, 320);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(exitTimerRef.current);
      clearTimeout(staggerTimerRef.current);
      clearTimeout(confettiTimerRef.current);
    };
  }, []);

  // If closed externally (isOpen → false) after being open
  useEffect(() => {
    if (!isOpen && mounted && phase === 'in') {
      triggerExit(null);
    }
  }, [isOpen, mounted, phase, triggerExit]);

  // ── Escape key ────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        triggerExit(onClose);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mounted, triggerExit, onClose]);

  // ── Scroll lock ───────────────────────
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mounted]);

  if (!mounted) return null;

  const isIn  = phase === 'in';
  const isOut = phase === 'out';

  // modal transform
  const modalStyle = {
    opacity: isIn ? 1 : 0,
    transform: isIn ? 'scale(1) translateY(0)' : isOut ? 'scale(0.95) translateY(8px)' : 'scale(0.85) translateY(20px)',
    transition: 'opacity 0.32s cubic-bezier(0.34, 1.2, 0.64, 1), transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1)',
  };

  // checkmark style
  const checkStyle = {
    opacity: checkPop ? 1 : 0,
    transform: checkPop ? 'scale(1) rotate(0deg)' : 'scale(0.3) rotate(-30deg)',
    transition: 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const staggerBase = (index) => ({
    opacity: contentVisible ? 1 : 0,
    transform: contentVisible ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.4s ease ${0.05 * index + 0.1}s, transform 0.4s ease ${0.05 * index + 0.1}s`,
  });

  return (
    <>
      {/* ── inline styles ── */}
      <style>{`
        @keyframes confetti-fall {
          0%   { opacity: 1; transform: translateY(-10px) rotate(var(--r, 0deg)); }
          80%  { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(220px) rotate(calc(var(--r, 0deg) + 180deg)); }
        }
        .confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: 28px;
          z-index: 1;
        }
        .confetti-piece {
          position: absolute;
          top: -8px;
          border-radius: 2px;
          animation: confetti-fall var(--dur, 1.2s) var(--delay, 0s) ease-out forwards;
          animation-play-state: running;
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-piece { display: none; }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={() => triggerExit(onClose)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          opacity: isIn ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* ── Modal wrapper ── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lesson Completed"
          style={{
            pointerEvents: 'all',
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            ...modalStyle,
          }}
        >
          {/* ── Glow ring ── */}
          <div style={{
            position: 'absolute', inset: '-3px',
            borderRadius: '32px',
            background: 'linear-gradient(135deg, rgba(52,211,153,0.45), rgba(45,212,191,0.3), rgba(103,232,249,0.2))',
            filter: 'blur(12px)',
            zIndex: 0,
            opacity: isIn ? 1 : 0,
            transition: 'opacity 0.5s ease 0.15s',
          }} aria-hidden="true" />

          {/* ── Modal card ── */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(240,253,250,0.98) 60%, rgba(236,254,255,0.98) 100%)',
            borderRadius: '28px',
            border: '1.5px solid rgba(52,211,153,0.35)',
            boxShadow: '0 24px 64px rgba(15,23,42,0.15), 0 4px 16px rgba(45,212,191,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
            padding: '32px 28px 28px',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>

            {/* Confetti */}
            <Confetti active={confetti} />

            {/* Decorative blobs */}
            <div aria-hidden="true" style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '140px', height: '140px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(52,211,153,0.12), transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div aria-hidden="true" style={{
              position: 'absolute', bottom: '-30px', left: '-30px',
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(45,212,191,0.1), transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* ── Close button ── */}
            <button
              onClick={() => triggerExit(onClose)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(248,250,252,0.9)',
                border: '1px solid rgba(203,213,225,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'background 0.15s, box-shadow 0.15s',
                zIndex: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(226,232,240,0.95)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,250,252,0.9)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 1l10 10M11 1L1 11" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>

            {/* ── Checkmark ── */}
            <div style={{ position: 'relative', marginBottom: '20px', zIndex: 2, ...checkStyle }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #34d399, #2dd4bf)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(52,211,153,0.4), 0 2px 8px rgba(45,212,191,0.3)',
              }}>
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                  <path d="M7 17l7 7 13-14" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* ── Lesson title ── */}
            <div style={{ textAlign: 'center', marginBottom: '4px', zIndex: 2, ...staggerBase(0) }}>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: '#2dd4bf',
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px',
              }}>
                {lessonTitle}
              </div>
              <h2 style={{
                fontSize: '26px', fontWeight: 900, color: '#0f4c3a',
                lineHeight: 1.15, margin: 0,
                fontFamily: 'var(--font-display, "Fredoka", sans-serif)',
              }}>
                Lesson Completed!
              </h2>
            </div>

            {/* ── Sub text ── */}
            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '20px', zIndex: 2, ...staggerBase(1) }}>
              Great job! 🎉 You've completed this lesson.
            </p>

            {/* ── Character ── */}
            <div style={{ marginBottom: '20px', zIndex: 2, ...staggerBase(2) }}>
              <div style={{
                width: '110px', height: '110px',
                borderRadius: '50%',
                background: 'linear-gradient(160deg, #ecfdf5, #ccfbf1)',
                border: '2px solid rgba(52,211,153,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '72px', lineHeight: 1,
                boxShadow: '0 4px 16px rgba(52,211,153,0.15)',
              }}>
                🧑🏽‍🎓
              </div>
            </div>

            {/* ── Completion count ── */}
            <div style={{
              width: '100%', marginBottom: '14px', zIndex: 2,
              borderRadius: '16px',
              background: 'rgba(240,253,250,0.8)',
              border: '1.5px solid rgba(52,211,153,0.2)',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '14px',
              ...staggerBase(3),
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #34d399, #2dd4bf)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(52,211,153,0.3)',
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3.5 9.5l4 4 7.5-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {completedScenes} / {totalScenes}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '2px' }}>
                  Sentences Completed
                </div>
              </div>
            </div>

            {/* ── Encouragement ── */}
            <div style={{
              width: '100%', marginBottom: '20px', zIndex: 2,
              borderRadius: '14px',
              background: 'rgba(240,253,250,0.6)',
              border: '1px solid rgba(52,211,153,0.15)',
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              ...staggerBase(4),
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #34d399, #2dd4bf)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: '16px',
              }}>
                ⭐
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f4c3a' }}>You're doing amazing!</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>Keep learning, keep growing.</div>
              </div>
            </div>

            {/* ── Continue button ── */}
            <button
              onClick={() => triggerExit(onContinue)}
              style={{
                width: '100%', padding: '15px 24px',
                borderRadius: '16px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #10b981, #0d9488)',
                color: 'white', fontSize: '16px', fontWeight: 900,
                letterSpacing: '0.02em',
                boxShadow: '0 8px 20px rgba(16,185,129,0.35), 0 2px 6px rgba(13,148,136,0.2)',
                transition: 'transform 0.15s, box-shadow 0.15s, filter 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                zIndex: 2, position: 'relative',
                ...staggerBase(5),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(16,185,129,0.4), 0 3px 8px rgba(13,148,136,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.35), 0 2px 6px rgba(13,148,136,0.2)';
              }}
            >
              Continue
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 9h10M10 5l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

          </div>
        </div>
      </div>
    </>
  );
};

export default LessonCompletionModal;
