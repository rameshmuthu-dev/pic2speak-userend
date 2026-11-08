import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, User, Flame } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout as authLogout } from '../redux/slices/authSlice';
import { logout as userLogout, fetchUserProfile } from '../redux/slices/userSlice';
import { fetchMyStats, selectUserProgressStats, selectUserProgressLoading as selectStatsLoading } from '../redux/slices/userProgressSlice';
import { fetchMyRewards, selectTotalCoins, selectTotalGems } from '../redux/slices/rewardSlice';
import { useActiveLanguage, useLanguageOptionsState } from '../hooks/Useactivelanguage';
import profileAvatar from '../assets/profile/profile.webp';
import AuthModal from './AuthModal';
import Loading from '../ui/Loading';

const CoinIcon = ({ className = 'w-5 h-5', title = 'Coin' }) => (
  <svg viewBox="0 0 24 24" className={`inline-block shrink-0 ${className}`} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="8.2" fill="#FBBF24" stroke="#FDE68A" strokeWidth="1" />
    <path d="M6.2 9.2A6.4 6.4 0 0 1 11 5.7" fill="none" stroke="#FEF3C7" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    <text x="12" y="16.4" textAnchor="middle" fontSize="12.5" fontWeight="800" fontFamily="Arial, Helvetica, sans-serif" fill="#B45309">$</text>
  </svg>
);

const GlobeIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </svg>
);

const ChevronIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const BellIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

const MapNavIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4z" />
    <path d="M9 4v13" fill="none" />
    <path d="M15 7v13" fill="none" />
  </svg>
);

const GamepadNavIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8h12a4 4 0 0 1 4 4v3a2.5 2.5 0 0 1-4.3 1.7L16 15H8l-1.7 1.7A2.5 2.5 0 0 1 2 15v-3a4 4 0 0 1 4-4z" />
    <path d="M7 10.5v3" />
    <path d="M5.5 12h3" />
    <circle cx="16" cy="11" r="0.9" fill="currentColor" />
    <circle cx="18.2" cy="13" r="0.9" fill="currentColor" />
  </svg>
);

const CalendarNavIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="5" width="16" height="16" rx="3" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <text x="12" y="17.2" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">17</text>
  </svg>
);

const BarsNavIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <rect x="3" y="12" width="5" height="9" rx="1.5" />
    <rect x="9.5" y="7" width="5" height="14" rx="1.5" />
    <rect x="16" y="3" width="5" height="18" rx="1.5" />
  </svg>
);

const DotsNavIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <circle cx="4.5" cy="12" r="2.2" />
    <circle cx="12" cy="12" r="2.2" />
    <circle cx="19.5" cy="12" r="2.2" />
  </svg>
);

const SHELL_ROUTES = ['/adventure-map', '/sentence-list'];
const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const SHELL_CSS = `
@media (min-width: 1024px) {
  body.app-shell-active #root { padding-left: 18rem; }
}
@media (max-width: 1023.98px) {
  body.app-shell-active #root {
    padding-top: var(--shell-top-h, 0px);
    padding-bottom: var(--shell-bottom-h, 0px);
  }
}
.shell-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.shell-scroll::-webkit-scrollbar { display: none; }
@media (min-width: 1024px) and (max-height: 760px) {
  .shell-short-hide { display: none !important; }
  .shell-short-tight { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
}
`;

const MAP_NAV_ITEMS = [
  { label: 'Play', icon: '🎮' },
  { label: 'Weekly Challenge', icon: '📅' },
  { label: 'My Progress', icon: '📊' },
  { label: 'Vocabulary', icon: '📗' },
  { label: 'Settings', icon: '⚙️' },
];

const SHELL_NAV_ITEMS = [
  { label: 'Play', icon: '🎮' },
  { label: 'Daily Challenge', icon: '📅' },
  { label: 'My Progress', icon: '📊' },
  { label: 'Vocabulary', icon: '📗' },
  { label: 'Settings', icon: '⚙️' },
];

const MORE_SHEET_ITEMS = [
  { icon: '📗', label: 'Vocabulary' },
  { icon: '⚙️', label: 'Settings' },
  { icon: '🔔', label: 'Notifications', badge: 3 },
  { icon: '❓', label: 'Help & Support' },
  { icon: 'ℹ️', label: 'About Pic2Speak' },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'map', label: 'Map', Icon: MapNavIcon },
  { id: 'play', label: 'Play', Icon: GamepadNavIcon },
  { id: 'weekly', label: 'Weekly', Icon: CalendarNavIcon },
  { id: 'progress', label: 'Progress', Icon: BarsNavIcon },
  { id: 'more', label: 'More', Icon: DotsNavIcon },
];

const LanguageDropdown = ({ languagesList, resolvedLanguage, onSelect, variant = 'compact', loading = false, error = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const hasLanguages = languagesList.length > 0;
  const currentName = loading
    ? 'Loading...'
    : error
    ? 'Unavailable'
    : hasLanguages
    ? (languagesList.find((l) => l.code === resolvedLanguage)?.name || resolvedLanguage)
    : 'No languages';

  const filteredLanguages = [...languagesList]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((l) => l.name.toLowerCase().includes(query.trim().toLowerCase()));

  const toggleOpen = () => !loading && !error && hasLanguages && setIsOpen((p) => !p);
  const isCard = variant === 'card';
  const enabled = hasLanguages && !loading && !error;

  return (
    <div ref={wrapperRef} className={`relative min-w-0 ${isCard ? 'flex-1' : 'shrink-0'}`}>
      {isCard ? (
        <button onClick={toggleOpen} disabled={!enabled} className={`relative w-full overflow-hidden rounded-2xl border border-indigo-950/60 bg-[#121629] shell-short-tight px-3 py-3 text-left shadow-sm transition-shadow duration-300 ${enabled ? 'cursor-pointer hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}>
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1b223d] text-cyan-400 ring-1 ring-indigo-900/60">
              <GlobeIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-white">{currentName}</span>
            <ChevronIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
      ) : (
        <button onClick={toggleOpen} disabled={!enabled} className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-full border border-indigo-400/50 bg-[#0f1a3a]/90 text-white font-semibold text-[11px] sm:text-xs flex items-center gap-1 max-w-full whitespace-nowrap shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-colors ${enabled ? 'cursor-pointer hover:border-indigo-300/80' : 'opacity-50 cursor-not-allowed'}`}>
          <GlobeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 text-teal-300" />
          <span className="hidden min-[360px]:inline max-w-[55px] sm:max-w-[72px] truncate">{currentName}</span>
          <ChevronIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}
      {isOpen && hasLanguages && (
        <div className={`absolute ${isCard ? 'left-0' : 'right-0'} mt-2 w-56 max-w-[calc(100vw-2rem)] bg-[#0b0e1b] rounded-2xl shadow-2xl border border-indigo-950 overflow-hidden z-50`}>
          <div className="p-2 border-b border-indigo-950">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search language..." className="w-full px-3 py-1.5 text-xs bg-[#121629] text-white border border-indigo-950 rounded-full focus:outline-none focus:border-cyan-400" />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredLanguages.length ? (
              filteredLanguages.map((l) => (
                <button key={l.code} onClick={() => { onSelect(l.code); setIsOpen(false); setQuery(''); }} className={`w-full text-left px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-indigo-950/50 ${l.code === resolvedLanguage ? 'bg-indigo-950 text-cyan-300' : 'text-slate-300'}`}>
                  {l.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">No language found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AnimatedSheet = ({ isOpen, onClose, direction = 'bottom', children }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setIsRendered(false);
  };

  if (!isRendered) return null;

  const isTop = direction === 'top';
  const isCenteredDesktop = isTop;
  const desktopWrapperClass = isCenteredDesktop ? 'lg:justify-center lg:items-center' : '';
  const desktopSheetClass = isCenteredDesktop ? 'lg:w-[560px] lg:rounded-[32px] lg:shadow-2xl' : '';
  const transitionDuration = REDUCED_MOTION ? '0ms' : '450ms';
  const sheetTransform = isVisible ? 'translateY(0)' : (isTop ? 'translateY(-100%)' : 'translateY(100%)');
  const backdropOpacity = isVisible ? 1 : 0;

  return (
    <div className={`${direction === 'bottom' ? 'lg:hidden' : ''} fixed inset-0 z-[200] flex flex-col ${isTop ? 'justify-start' : 'justify-end'} ${desktopWrapperClass}`}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" style={{ opacity: backdropOpacity, transition: `opacity ${transitionDuration} ease-out` }} onClick={onClose} />
      <div className={`bg-[#0b0e1b] text-white w-full flex flex-col relative z-10 border border-indigo-950 ${isTop ? 'rounded-b-3xl lg:max-h-none' : 'rounded-t-3xl max-h-[88vh]'} ${desktopSheetClass}`} style={{ transform: sheetTransform, transition: `transform ${transitionDuration} ${isVisible ? 'ease-out' : 'ease-in-out'}` }} onTransitionEnd={handleAnimationEnd}>
        {children}
      </div>
    </div>
  );
};

const Navbar = ({ languageSelector = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  const dropdownRef = useRef(null);
  const moreRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const shellTopRef = useRef(null);
  const shellBottomRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, isLoading: authLoading } = useSelector((state) => state.auth);
  const { user: profileUser, loading: userLoading } = useSelector((state) => state.user);
  const progressStats = useSelector(selectUserProgressStats);
  const statsLoading = useSelector(selectStatsLoading);
  const totalCoins = useSelector(selectTotalCoins);
  const totalGems = useSelector(selectTotalGems);
  const mapTitle = useSelector((state) => state.adventureMap?.publishedMap?.mapTitle) || 'Adventure Map';

  const isLoading = authLoading || userLoading;
  const streak = profileUser?.streak || 0;
  const userIdentifier = profileUser?.name ? profileUser.name.substring(0, 2).toUpperCase() : 'SU';

  const isShellRoute = SHELL_ROUTES.some((route) => location.pathname === route || location.pathname.startsWith(`${route}/`));
  const showShell = isShellRoute && isAuthenticated;

  const [activeLanguage, setActiveLanguage] = useActiveLanguage();
  const { languages: languagesList, status: languagesStatus, error: languagesError } = useLanguageOptionsState(showShell);
  const languagesLoading = showShell && languagesStatus !== 'succeeded' && !languagesError;
  const resolvedLanguage = languagesList.some((l) => l.code === activeLanguage) ? activeLanguage : (languagesList[0]?.code || null);

  useEffect(() => {
    if (isAuthenticated) {
      setShowLogin(false);
      dispatch(fetchUserProfile());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (showShell) {
      dispatch(fetchMyStats());
      dispatch(fetchMyRewards());
    }
  }, [showShell, dispatch]);

  useEffect(() => {
    setIsOpen(false);
    setShowDropdown(false);
    setShowMoreDropdown(false);
    setShowMobileProfile(false);
    setShowMobileMore(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showShell) return undefined;
    document.body.classList.add('app-shell-active');
    return () => document.body.classList.remove('app-shell-active');
  }, [showShell]);

  useEffect(() => {
    if (!showShell) return undefined;
    const root = document.documentElement;
    const measure = () => {
      root.style.setProperty('--shell-top-h', `${shellTopRef.current?.getBoundingClientRect().height || 0}px`);
      root.style.setProperty('--shell-bottom-h', `${shellBottomRef.current?.getBoundingClientRect().height || 0}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (shellTopRef.current) observer.observe(shellTopRef.current);
    if (shellBottomRef.current) observer.observe(shellBottomRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty('--shell-top-h');
      root.style.removeProperty('--shell-bottom-h');
    };
  }, [showShell]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setShowMoreDropdown(false);
      }
      if (isOpen && mobileMenuRef.current && menuButtonRef.current && !mobileMenuRef.current.contains(event.target) && !menuButtonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.clear();
    dispatch(authLogout());
    dispatch(userLogout());
    setShowDropdown(false);
    setIsOpen(false);
    setShowMobileProfile(false);
    setShowMobileMore(false);
    navigate('/');
  };

  const goToMap = () => navigate('/adventure-map');
  const handleBrandClick = () => navigate(isAuthenticated ? '/adventure-map' : '/');
  const brandDestination = isAuthenticated ? '/adventure-map' : '/';
  const navLinkClass = ({ isActive }) => `hover:text-cyan-400 transition-colors ${isActive ? 'text-cyan-400' : ''}`;
  const mobileNavLinkClass = ({ isActive }) => `block text-lg font-semibold hover:text-cyan-400 ${isActive ? 'text-cyan-400' : 'text-slate-300'}`;

  const handleBottomNavClick = (id) => {
    if (id === 'map') goToMap();
    if (id === 'more') setShowMobileMore(true);
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0b0e1b] p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-indigo-950 backdrop-blur-md">
            <Loading message="Authenticating..." />
            <div className="mt-4 text-center">
              <p className="text-cyan-400 font-black text-xl tracking-tighter">Pic2Speak</p>
            </div>
          </div>
        </div>
      )}

      {showShell && (
        <>
          <style>{SHELL_CSS}</style>
          <aside className="hidden lg:flex fixed left-0 top-0 w-72 h-[100dvh] bg-[#0b0e1b] flex-col border-r border-indigo-950 shrink-0 overflow-hidden z-30 text-white">
            <div className="p-3.5 flex flex-col h-full gap-2.5 min-h-0">
              <div className="flex flex-col gap-2.5 shrink-0">
                <div className="flex flex-col gap-2 shrink-0 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex flex-col gap-0 min-w-0">
                      <button type="button" onClick={handleBrandClick} aria-label="Pic2Speak home" className="flex flex-col items-start gap-0 min-w-0 bg-transparent border-0 p-0 text-left cursor-pointer">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shadow-[0_0_14px_rgba(45,212,191,0.6)] shrink-0 border-2 border-teal-200/60">P2S</span>
                          <span className="text-xl font-black text-white whitespace-nowrap leading-none tracking-tight">Pic<span className="text-teal-300">2</span>Speak</span>
                        </span>
                        <span className="text-[11px] text-teal-300 font-semibold whitespace-nowrap leading-tight mt-1"><span className="text-yellow-300">✦</span> One step at a time</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0 pr-0.5">
                    <LanguageDropdown languagesList={languagesList} resolvedLanguage={resolvedLanguage} onSelect={setActiveLanguage} variant="card" loading={languagesLoading} error={languagesError} />
                    <div role="button" aria-label="Notifications" className="relative shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#0f1a3a]/90 border border-indigo-400/50 text-white cursor-pointer shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:border-indigo-300/80 transition-colors">
                      <BellIcon className="w-5 h-5" />
                      <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f1a3a] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>
                  </div>
                </div>

                <div onClick={() => setShowMobileProfile(true)} className="flex items-center gap-3 bg-[#121629] border border-indigo-950 rounded-[22px] p-2.5 shadow-sm shrink-0 cursor-pointer hover:bg-[#1a213b] transition-colors">
                  <div className="w-11 h-11 rounded-full bg-cyan-950 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-cyan-500/40">
                    <img src={profileAvatar} className="w-[90%] h-[90%] object-contain" alt="Profile" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-[14px] truncate">{userLoading ? 'Loading...' : profileUser?.name || 'User'}</p>
                    <p className="shell-short-hide text-[10px] text-slate-400 mb-1 truncate leading-tight">Let's learn together!</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-[9px] font-bold text-white bg-cyan-600 rounded-full px-2 py-0.5 shrink-0 shadow-sm">{statsLoading ? '...' : `Level ${progressStats?.level ?? 1}`}</span>
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressStats?.progressPercent ?? 0}%` }} />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 text-right font-bold leading-none">{statsLoading ? '...' : `${progressStats?.currentLevelXP ?? 0} / ${progressStats?.nextLevelXP ?? 100} XP`}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 shrink-0">
                  <div className="bg-[#121629] border border-indigo-950 rounded-xl py-1 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-base leading-none">🔥</span>
                    <span className="text-xs font-bold text-white mt-0.5">{profileUser?.streak ?? 0}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-tight font-bold">Streak</span>
                  </div>
                  <div className="bg-[#121629] border border-indigo-950 rounded-xl py-1 flex flex-col items-center justify-center shadow-sm">
                    <CoinIcon className="w-4 h-4" />
                    <span className="text-xs font-bold text-white mt-0.5">{totalCoins}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-tight font-bold">Coins</span>
                  </div>
                  <div className="bg-[#121629] border border-indigo-950 rounded-xl py-1 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-base leading-none">💎</span>
                    <span className="text-xs font-bold text-white mt-0.5">{totalGems}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-tight font-bold">Gems</span>
                  </div>
                </div>
              </div>

              <nav className="shell-scroll flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto overscroll-contain pb-1">
                <button onClick={goToMap} className="w-full flex items-center gap-3 px-3 py-2 shell-short-tight bg-cyan-950/80 text-cyan-300 font-bold rounded-xl transition-colors text-[13px] text-left cursor-pointer border-l-4 border-cyan-400 shadow-sm">
                  <span className="text-base">🗺️</span><span className="truncate">{mapTitle}</span>
                </button>
                {SHELL_NAV_ITEMS.map((navItem, i) => (
                  <button key={i} className="w-full flex items-center gap-3 px-3 py-2 shell-short-tight text-slate-300 font-semibold rounded-xl hover:bg-[#121629] hover:text-cyan-400 transition-colors text-[13px] text-left cursor-pointer">
                    <span className="text-base">{navItem.icon}</span><span>{navItem.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-2.5 shrink-0 border-t border-indigo-950 bg-[#0b0e1b]">
                <button className="w-full flex items-center gap-3 bg-[#1e1910] border border-amber-500/30 p-2.5 rounded-2xl text-left hover:bg-[#272115] transition-colors cursor-pointer shadow-sm">
                  <span className="text-2xl shrink-0">👑</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-amber-400 leading-tight">Go Premium</p>
                    <p className="text-[10px] text-amber-200/70 leading-snug truncate">Unlock all levels & AI!</p>
                  </div>
                  <span className="ml-auto w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px] shrink-0 shadow-sm">→</span>
                </button>
              </div>
            </div>
          </aside>

          <header ref={shellTopRef} className="lg:hidden fixed top-0 inset-x-0 w-full bg-[#0b0e1b] text-white z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-1.5 sm:pb-2">
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 border-2 border-teal-400/50 bg-gradient-to-r from-[#0c2b3d] via-[#0e2140] to-[#101a3d] shadow-[0_0_22px_rgba(45,212,191,0.35),inset_0_0_18px_rgba(45,212,191,0.08)]">
                <button type="button" onClick={handleBrandClick} aria-label="Pic2Speak home" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 bg-transparent border-0 p-0 text-left cursor-pointer">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 border-2 border-teal-200/60 shadow-[0_0_14px_rgba(45,212,191,0.6)] text-white font-black text-[10px] sm:text-xs tracking-tight">P2S</span>
                  <span className="flex flex-col min-w-0 leading-tight">
                    <span className="text-sm sm:text-lg font-black text-white tracking-tight truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">Pic<span className="text-teal-300">2</span>Speak</span>
                    <span className="hidden min-[350px]:flex items-center gap-1 text-[9px] sm:text-xs font-semibold text-teal-300 truncate">
                      <span className="text-yellow-300">✦</span>
                      <span className="truncate">One step at a time</span>
                    </span>
                  </span>
                </button>

                <LanguageDropdown languagesList={languagesList} resolvedLanguage={resolvedLanguage} onSelect={setActiveLanguage} loading={languagesLoading} error={languagesError} />

                <div role="button" aria-label="Notifications" className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center border border-indigo-400/50 bg-[#0f1a3a]/90 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] cursor-pointer hover:border-indigo-300/80 transition-colors">
                  <BellIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#101a3d] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>

                <button onClick={() => setShowMobileProfile(true)} aria-label="Profile" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 border-2 border-teal-200/60 shadow-[0_0_14px_rgba(45,212,191,0.6)] text-white font-black text-xs sm:text-sm">{userIdentifier}</button>
              </div>
            </div>
          </header>

          <div ref={shellBottomRef} className="lg:hidden fixed bottom-0 inset-x-0 w-full bg-[#0b0e1b] text-white z-40 px-2 pt-1" style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}>
            <nav className="flex items-stretch justify-between rounded-[24px] px-1 py-1 border-2 border-teal-400/40 bg-gradient-to-b from-[#0e2a45]/95 to-[#0a1530]/95 backdrop-blur-md shadow-[0_0_24px_rgba(45,212,191,0.3),inset_0_0_20px_rgba(45,212,191,0.06)]">
              {BOTTOM_NAV_ITEMS.map(({ id, label, Icon }) => {
                const isActive = id === 'map';
                return (
                  <button key={id} type="button" onClick={() => handleBottomNavClick(id)} className="relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 pb-2.5 bg-transparent border-0 cursor-pointer transition-transform active:scale-95">
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isActive ? 'text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.9)]' : 'text-indigo-200/85'}`} />
                    <span className={`text-[10px] sm:text-xs font-bold leading-none ${isActive ? 'text-teal-300' : 'text-indigo-100/85'}`}>{label}</span>
                    {isActive && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-8 sm:w-10 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.9)]" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <AnimatedSheet isOpen={showMobileProfile} onClose={() => setShowMobileProfile(false)} direction="top">
            <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-indigo-950">
              <h2 className="text-[22px] font-bold text-white">My Profile</h2>
              <button onClick={() => setShowMobileProfile(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121629] text-slate-300 hover:bg-[#1a213b] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="lg:hidden w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-3 shrink-0" />
            <div className="lg:hidden px-5 pb-3 flex items-center justify-between shrink-0 border-b border-indigo-950">
              <h2 className="text-xl font-bold text-white">My Profile</h2>
              <button onClick={() => setShowMobileProfile(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121629] text-slate-300 font-bold text-base leading-none">✕</button>
            </div>
            <div className="px-5 lg:px-6 pb-6 lg:pb-6 flex flex-col gap-4 lg:gap-5 overflow-y-auto lg:overflow-visible max-h-[85vh] lg:max-h-none pt-4">
              <div className="flex items-center gap-5">
                <div className="w-[100px] h-[100px] lg:w-[115px] lg:h-[115px] rounded-full bg-cyan-950 flex items-center justify-center shrink-0 border-4 border-[#0b0e1b] shadow-sm relative ring-1 ring-cyan-500/40">
                  <img src={profileAvatar} className="w-[90%] h-[90%] object-contain" alt="Profile" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#0b0e1b] text-white text-[10px]">✏️</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-xl lg:text-2xl truncate mb-0.5">{userLoading ? 'Loading...' : profileUser?.name || 'User'}</p>
                  <p className="text-[13px] text-slate-400 mb-2 truncate">Let's learn together!</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-white bg-cyan-600 rounded-full px-2.5 py-0.5 shrink-0">{statsLoading ? '...' : `Level ${progressStats?.level ?? 1}`}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[160px]">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressStats?.progressPercent ?? 0}%` }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold text-right max-w-[160px] ml-auto">{statsLoading ? '...' : `${progressStats?.currentLevelXP ?? 0} / ${progressStats?.nextLevelXP ?? 100} XP`}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#121629] border border-indigo-950 rounded-[16px] py-3 flex flex-col items-center shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                  <span className="text-2xl mb-0.5">🔥</span>
                  <span className="text-[15px] font-black text-white">{profileUser?.streak ?? 0}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Streak</span>
                </div>
                <div className="bg-[#121629] border border-indigo-950 rounded-[16px] py-3 flex flex-col items-center shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                  <CoinIcon className="w-6 h-6 mb-0.5" />
                  <span className="text-[15px] font-black text-white">{totalCoins}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Coins</span>
                </div>
                <div className="bg-[#121629] border border-indigo-950 rounded-[16px] py-3 flex flex-col items-center shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                  <span className="text-2xl mb-0.5">💎</span>
                  <span className="text-[15px] font-black text-white">{totalGems}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Gems</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-4 bg-[#121629] border border-indigo-950 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] cursor-pointer hover:bg-[#1a213b] transition-colors">
                  <div className="flex items-center gap-3"><span className="text-xl">👤</span><span className="font-bold text-white text-[14px]">Account Information</span></div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <button className="w-full flex items-center justify-between bg-[#1e1910] border border-amber-500/30 p-4 rounded-2xl text-left shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-[#272115] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👑</span>
                    <div><p className="text-[14px] font-bold text-amber-400 leading-tight">Go Premium</p><p className="text-[10px] font-medium text-amber-200/70 mt-0.5 leading-tight">Unlock all levels, AI & more!</p></div>
                  </div>
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-rose-950/70 transition-colors">
                  <span className="text-xl">🚪</span>
                  <span className="font-bold text-rose-400 text-[14px]">Logout</span>
                </button>
              </div>
            </div>
          </AnimatedSheet>

          <AnimatedSheet isOpen={showMobileMore} onClose={() => setShowMobileMore(false)} direction="bottom">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-3 shrink-0" />
            <div className="px-5 pb-3 flex items-center justify-between shrink-0 border-b border-indigo-950">
              <h2 className="text-xl font-bold text-white">More</h2>
              <button onClick={() => setShowMobileMore(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121629] text-slate-300 font-bold">✕</button>
            </div>
            <div className="overflow-y-auto px-5 pb-10 flex flex-col gap-1 pt-2">
              {MORE_SHEET_ITEMS.map(({ icon, label, badge }) => (
                <div key={label} className="flex items-center justify-between py-3.5 border-b border-indigo-950/80 last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl w-7 text-center">{icon}</span>
                    <span className="font-bold text-slate-200 text-[15px]">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && <span className="bg-red-500 text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{badge}</span>}
                    <span className="text-slate-500 font-bold text-lg">›</span>
                  </div>
                </div>
              ))}
              <button className="w-full flex items-center justify-between bg-[#1e1910] border border-amber-500/30 p-4 rounded-3xl text-left shadow-sm mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👑</span>
                  <div><p className="text-base font-bold text-amber-400">Go Premium</p><p className="text-xs text-amber-200/70">Unlock all levels, AI & more!</p></div>
                </div>
                <span className="text-amber-400 font-bold text-xl">›</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-4 py-4 px-2 text-left">
                <span className="text-2xl">🚪</span>
                <span className="font-bold text-rose-400 text-[15px]">Logout</span>
              </button>
            </div>
          </AnimatedSheet>
        </>
      )}

      {!showShell && (
        <nav className="bg-[#0b0e1b] text-white border-b border-indigo-950 sticky top-0 z-40 shadow-sm rounded-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to={brandDestination} className="flex items-center gap-2.5 shrink-0" aria-label="Pic2Speak home">
                <div className="bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-teal-200/60 shadow-[0_0_14px_rgba(45,212,191,0.6)]">P2S</div>
                <span className="text-xl font-black text-white tracking-tight">Pic<span className="text-teal-300">2</span>Speak</span>
              </Link>
              <div className="hidden md:flex items-center gap-4 lg:gap-6 text-slate-200 font-semibold min-w-0">
                {isAuthenticated && profileUser && (
                  <>
                    <NavLink to="/adventure-map" className={navLinkClass}>Adventure Map</NavLink>
                    {languageSelector && (
                      <div className="shrink-0">{languageSelector}</div>
                    )}
                    <div className="flex items-center gap-1.5 bg-[#1e1610] px-3 py-1.5 rounded-full border border-orange-500/30 group transition-all shrink-0">
                      <Flame size={18} className="text-orange-500 fill-orange-500 group-hover:scale-110 transition-transform" />
                      <span className="text-orange-400 font-bold text-sm">{streak}</span>
                    </div>
                    <div className="relative shrink-0" ref={moreRef}>
                      <button onClick={() => setShowMoreDropdown(!showMoreDropdown)} className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors font-semibold text-sm">
                        More
                        <ChevronDown size={15} className={`transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showMoreDropdown && (
                        <div className="absolute right-0 mt-3 w-48 bg-[#0b0e1b] rounded-2xl shadow-2xl border border-indigo-950 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                          {MAP_NAV_ITEMS.map((item) => (
                            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-indigo-950/50 hover:text-cyan-400 transition-colors font-semibold text-left" onClick={() => setShowMoreDropdown(false)}>
                              <span>{item.icon}</span> {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                <a href="#about" className="hover:text-cyan-400 transition-colors cursor-pointer shrink-0">About</a>
                {isAuthenticated && profileUser ? (
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 bg-[#121629] hover:bg-[#1a213b] p-1 pr-3 rounded-full transition-all border border-indigo-950">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">{userIdentifier}</div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 mt-3 w-48 bg-[#0b0e1b] rounded-2xl shadow-2xl border border-indigo-950 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-indigo-950">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-bold text-white truncate">{profileUser.name}</p>
                        </div>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-indigo-950/50 hover:text-cyan-400 transition-colors font-semibold">
                          <User size={18} /> Profile
                        </button>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-950/40 transition-colors font-bold">
                          <LogOut size={18} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setShowLogin(true)} className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-6 py-2 rounded-xl font-bold hover:from-cyan-400 hover:to-teal-400 transition-all active:scale-95 shadow-md shadow-cyan-500/20 shrink-0">
                    Get Started
                  </button>
                )}
              </div>
              <div className="md:hidden flex items-center gap-3">
                {isAuthenticated && profileUser && (
                  <div className="flex items-center gap-2">
                    {languageSelector && <div className="shrink-0">{languageSelector}</div>}
                    <div className="flex items-center gap-1.5 bg-[#1e1610] px-2 py-1 rounded-lg border border-orange-500/30">
                      <Flame size={16} className="text-orange-500 fill-orange-500" />
                      <span className="text-orange-400 font-black text-xs">{streak}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">{userIdentifier}</div>
                  </div>
                )}
                <button ref={menuButtonRef} onClick={() => setIsOpen(!isOpen)} className="text-cyan-400 p-1">
                  {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>
          {isOpen && (
            <div ref={mobileMenuRef} className="md:hidden bg-[#0b0e1b] text-white border-t border-indigo-950 rounded-b-2xl px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
              {isAuthenticated && profileUser && (
                <>
                  <div className="pb-4 mb-2 border-b border-indigo-950 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-black text-white">{profileUser.name}</p>
                      <p className="text-xs text-slate-400">Student Account</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">{userIdentifier}</div>
                  </div>
                  <NavLink to="/adventure-map" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    🗺️ Adventure Map
                  </NavLink>
                  <div className="flex flex-col gap-1 border-t border-indigo-950 pt-3">
                    {MAP_NAV_ITEMS.map((item) => (
                      <button key={item.label} onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-base font-semibold text-slate-300 hover:text-cyan-400 py-1.5 text-left w-full">
                        <span>{item.icon}</span> {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <a href="#about" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-slate-300 hover:text-cyan-400">About</a>
              <div className="pt-4 border-t border-indigo-950">
                {!isAuthenticated ? (
                  <button onClick={() => { setShowLogin(true); setIsOpen(false); }} className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-cyan-950">
                    Get Started
                  </button>
                ) : (
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-400 font-bold py-3">
                    <LogOut size={20} /> Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>
      )}

      <AuthModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default Navbar;