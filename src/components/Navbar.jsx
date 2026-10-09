import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, User, Flame } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout as authLogout } from '../redux/slices/authSlice';
import { logout as userLogout, fetchUserProfile } from '../redux/slices/userSlice';
import {
  fetchMyStats,
  selectUserProgressStats,
  selectUserProgressLoading as selectStatsLoading,
} from '../redux/slices/userProgressSlice';
import {
  fetchMyRewards,
  selectTotalCoins,
  selectTotalGems,
} from '../redux/slices/rewardSlice';
import { useActiveLanguage, useLanguageOptions } from '../hooks/Useactivelanguage';
import profileAvatar from '../assets/profile/profile.webp';
import AuthModal from './AuthModal';
import Loading from '../ui/Loading';

/* ─────────────────────────────────────────────────────────────
   CONFIG
   ───────────────────────────────────────────────────────────── */

const SHELL_ROUTES = ['/adventure-map', '/sentence-list'];

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
/* Sidebar scroll area: scrolls when screen is short, scrollbar hidden */
.shell-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.shell-scroll::-webkit-scrollbar { display: none; }
`;

const MAP_NAV_ITEMS = [
  { label: 'Play',             icon: '🎮' },
  { label: 'Weekly Challenge', icon: '📅' },
  { label: 'My Progress',      icon: '📊' },
  { label: 'Vocabulary',       icon: '📗' },
  { label: 'Settings',         icon: '⚙️' },
];

const SHELL_NAV_ITEMS = [
  { label: 'Play',            icon: '🎮' },
  { label: 'Daily Challenge', icon: '📅' },
  { label: 'My Progress',     icon: '📊' },
  { label: 'Vocabulary',      icon: '📗' },
  { label: 'Settings',        icon: '⚙️' },
];

const MORE_SHEET_ITEMS = [
  { icon: '📗', label: 'Vocabulary' },
  { icon: '⚙️', label: 'Settings' },
  { icon: '🔔', label: 'Notifications', badge: 3 },
  { icon: '❓', label: 'Help & Support' },
  { icon: 'ℹ️', label: 'About Pic2Speak' },
];

/* ─────────────────────────────────────────────────────────────
   LANGUAGE DROPDOWN
   ───────────────────────────────────────────────────────────── */

const LanguageDropdown = ({ languagesList, resolvedLanguage, onSelect, variant = 'compact' }) => {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasLanguages = languagesList.length > 0;
  const currentName = hasLanguages
    ? (languagesList.find((l) => l.code === resolvedLanguage)?.name || resolvedLanguage)
    : 'No languages';
  const filteredLanguages = [...languagesList]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((l) => l.name.toLowerCase().includes(query.trim().toLowerCase()));

  const toggleOpen = () => hasLanguages && setIsOpen((p) => !p);
  const isCard = variant === 'card';

  return (
    <div ref={wrapperRef} className={`relative min-w-0 ${isCard ? 'flex-1' : ''}`}>
      {isCard ? (
        <button
          onClick={toggleOpen}
          disabled={!hasLanguages}
          className={`relative w-full overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-100 via-cyan-100 to-cyan-200 px-3 py-3 text-left shadow-sm transition-shadow duration-300 ${hasLanguages ? 'cursor-pointer hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-teal-600 ring-1 ring-teal-200">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-black">{currentName}</span>
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
      ) : (
        <button
          onClick={toggleOpen}
          disabled={!hasLanguages}
          className={`bg-white h-9 px-3 rounded-full shadow-sm border border-slate-200 font-bold text-slate-700 text-xs flex items-center gap-1.5 max-w-full whitespace-nowrap transition-colors ${hasLanguages ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50 cursor-not-allowed'}`}
        >
          <span className="shrink-0">🌐</span>
          <span className="truncate">{currentName}</span>
          <span className={`text-[9px] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
      )}

      {isOpen && hasLanguages && (
        <div className="absolute left-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search language..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-full focus:outline-none focus:border-teal-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredLanguages.length ? (
              filteredLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { onSelect(l.code); setIsOpen(false); setQuery(''); }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-50 ${l.code === resolvedLanguage ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}
                >
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

/* ─────────────────────────────────────────────────────────────
   ANIMATED SHEET
   ───────────────────────────────────────────────────────────── */

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
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        style={{
          opacity: backdropOpacity,
          transition: `opacity ${transitionDuration} ease-out`,
        }}
        onClick={onClose}
      />
      <div
        className={`bg-white w-full flex flex-col relative z-10 ${isTop ? 'rounded-b-3xl lg:max-h-none' : 'rounded-t-3xl max-h-[88vh]'} ${desktopSheetClass}`}
        style={{
          transform: sheetTransform,
          transition: `transform ${transitionDuration} ${isVisible ? 'ease-out' : 'ease-in-out'}`,
        }}
        onTransitionEnd={handleAnimationEnd}
      >
        {children}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   NAVBAR
   ───────────────────────────────────────────────────────────── */

const Navbar = ({ languageSelector = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  const dropdownRef   = useRef(null);
  const moreRef       = useRef(null);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const shellTopRef    = useRef(null);
  const shellBottomRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, isLoading: authLoading } = useSelector((state) => state.auth);
  const { user: profileUser, loading: userLoading } = useSelector((state) => state.user);
  const progressStats = useSelector(selectUserProgressStats);
  const statsLoading  = useSelector(selectStatsLoading);
  const totalCoins    = useSelector(selectTotalCoins);
  const totalGems     = useSelector(selectTotalGems);
  const mapTitle      = useSelector((state) => state.adventureMap?.publishedMap?.mapTitle) || 'Adventure Map';

  const isLoading      = authLoading || userLoading;
  const streak         = profileUser?.streak || 0;
  const userIdentifier = profileUser?.name ? profileUser.name.substring(0, 2).toUpperCase() : '??';

  const isShellRoute = SHELL_ROUTES.some(
    (route) => location.pathname === route || location.pathname.startsWith(`${route}/`)
  );
  const showShell = isShellRoute && isAuthenticated;

  const [activeLanguage, setActiveLanguage] = useActiveLanguage();
  const languagesList = useLanguageOptions(showShell);
  const resolvedLanguage = languagesList.some((l) => l.code === activeLanguage)
    ? activeLanguage
    : (languagesList[0]?.code || null);

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
      if (
        isOpen &&
        mobileMenuRef.current &&
        menuButtonRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !menuButtonRef.current.contains(event.target)
      ) {
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

  const navLinkClass = ({ isActive }) =>
    `hover:text-[#14B8A6] transition-colors ${isActive ? 'text-[#14B8A6]' : ''}`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block text-lg font-semibold hover:text-[#14B8A6] ${isActive ? 'text-[#14B8A6]' : 'text-slate-700'}`;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/15 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white/90 p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-white/50 backdrop-blur-md">
            <Loading message="Authenticating..." />
            <div className="mt-4 text-center">
              <p className="text-[#14B8A6] font-black text-xl tracking-tighter">Pic2Speak</p>
            </div>
          </div>
        </div>
      )}

      {/* APP SHELL */}
      {showShell && (
        <>
          <style>{SHELL_CSS}</style>

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:flex fixed left-0 top-0 w-72 h-[100dvh] bg-white flex-col border-r border-slate-100 shrink-0 overflow-hidden z-30">
            <div className="p-3.5 flex flex-col h-full gap-2.5 min-h-0">
              {/* Top Section (scrolls if screen is short, so it never runs under Premium) */}
              <div className="shell-scroll flex flex-col gap-2.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {/* Header */}
                <div className="flex flex-col gap-2 shrink-0 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex flex-col gap-0 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="bg-[#14B8A6] w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0">P2S</div>
                        <span className="text-xl font-bold text-[#0F172A] whitespace-nowrap leading-none">Pic2<span className="text-[#14B8A6]">Speak</span></span>
                      </div>
                      <p className="text-[11px] text-teal-600 font-semibold whitespace-nowrap leading-tight mt-1">
                        ✨ One step at a time
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0 pr-0.5">
                    <LanguageDropdown languagesList={languagesList} resolvedLanguage={resolvedLanguage} onSelect={setActiveLanguage} variant="card" />
                    <div
                      role="button"
                      aria-label="Notifications"
                      className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 cursor-pointer shadow-sm hover:bg-slate-50 hover:border-teal-200 transition-colors"
                    >
                      <span className="text-sm leading-none">🔔</span>
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    </div>
                  </div>
                </div>

                {/* User Profile */}
                <div onClick={() => setShowMobileProfile(true)} className="flex items-center gap-3 bg-white border border-slate-100 rounded-[22px] p-2.5 shadow-sm shrink-0 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-full bg-[#dcf5fa] flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={profileAvatar} className="w-[90%] h-[90%] object-contain" alt="Profile" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0F172A] text-[14px] truncate">{userLoading ? 'Loading...' : profileUser?.name || 'User'}</p>
                    <p className="text-[10px] text-slate-500 mb-1 truncate leading-tight">Let's learn together!</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-[9px] font-bold text-white bg-teal-500 rounded-full px-2 py-0.5 shrink-0 shadow-sm">{statsLoading ? '...' : `Level ${progressStats?.level ?? 1}`}</span>
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressStats?.progressPercent ?? 0}%` }} />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 text-right font-bold leading-none">{statsLoading ? '...' : `${progressStats?.currentLevelXP ?? 0} / ${progressStats?.nextLevelXP ?? 100} XP`}</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-1.5 shrink-0">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl py-1 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-base leading-none">🔥</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5">{profileUser?.streak ?? 0}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-tight font-bold">Streak</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl py-1 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-base leading-none">🪙</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5">{totalCoins}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-tight font-bold">Coins</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl py-1 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-base leading-none">💎</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5">{totalGems}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-tight font-bold">Gems</span>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1.5 mt-1 pb-2 shrink-0">
                  <button
                    onClick={goToMap}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-teal-50 text-teal-700 font-bold rounded-xl transition-colors text-[13px] text-left cursor-pointer border-l-4 border-teal-500 shadow-sm"
                  >
                    <span className="text-base">🗺️</span><span className="truncate">{mapTitle}</span>
                  </button>
                  {SHELL_NAV_ITEMS.map((navItem, i) => (
                    <button key={i} className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:text-teal-700 transition-colors text-[13px] text-left cursor-pointer">
                      <span className="text-base">{navItem.icon}</span><span>{navItem.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Go Premium Bottom (always separate from the nav, never overlaps) */}
              <div className="pt-2.5 shrink-0 border-t border-slate-100 bg-white">
                <button className="w-full flex items-center gap-3 bg-[#FFFBF0] border border-[#FDE68A] p-2.5 rounded-2xl text-left hover:bg-[#FEF3C7] transition-colors cursor-pointer shadow-sm">
                  <span className="text-2xl shrink-0">👑</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#D97706] leading-tight">Go Premium</p>
                    <p className="text-[10px] text-[#92400E] leading-snug truncate">Unlock all levels & AI!</p>
                  </div>
                  <span className="ml-auto w-5 h-5 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[10px] shrink-0 shadow-sm">→</span>
                </button>
              </div>
            </div>
          </aside>

          {/* MOBILE TOP BAR */}
          <div
            ref={shellTopRef}
            className="lg:hidden fixed top-0 inset-x-0 w-full bg-white z-40 shadow-sm flex flex-col rounded-b-3xl"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex items-center justify-between px-4 py-2 gap-2">
              <div className="flex flex-col gap-0 min-w-0 shrink">
                <div className="flex items-center gap-1.5">
                  <div className="bg-[#14B8A6] w-7 h-7 rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-sm shrink-0">P2S</div>
                  <span className="text-[18px] font-bold text-[#0F172A] whitespace-nowrap leading-none tracking-tight">Pic2<span className="text-[#14B8A6]">Speak</span></span>
                </div>
                <p className="text-[9px] text-teal-600 font-bold whitespace-nowrap leading-tight ml-[34px] motion-safe:animate-pulse">
                  ✨ One step at a time
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <LanguageDropdown languagesList={languagesList} resolvedLanguage={resolvedLanguage} onSelect={setActiveLanguage} />
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100 shadow-sm cursor-pointer">
                  <span className="text-sm">🔔</span>
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                </div>
                <button onClick={() => setShowMobileProfile(true)} className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                  {userIdentifier}
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE BOTTOM NAV */}
          <div
            ref={shellBottomRef}
            className="lg:hidden fixed bottom-0 inset-x-0 w-full bg-white z-40 border-t border-slate-100 shadow-[0_-2px_12px_rgba(0,0,0,0.07)] rounded-t-3xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-around px-2 py-3">
              <button onClick={goToMap} className="flex flex-col items-center gap-1 w-16 cursor-pointer bg-transparent border-none p-0">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <span className="text-[26px] leading-none">🗺️</span>
                </div>
                <span className="text-[12px] leading-tight font-bold text-teal-600">Map</span>
                <div className="w-4 h-0.5 bg-[#14B8A6] rounded-full mt-0.5" />
              </button>
              <div className="flex flex-col items-center gap-1 w-16 cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-[26px] leading-none">🎮</span>
                </div>
                <span className="text-[12px] leading-tight font-semibold text-[#000000]">Play</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-16 cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-[26px] leading-none">📅</span>
                </div>
                <span className="text-[12px] leading-tight font-semibold text-[#000000]">Weekly</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-16 cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-[26px] leading-none">📊</span>
                </div>
                <span className="text-[12px] leading-tight font-semibold text-[#000000]">Progress</span>
              </div>
              <button onClick={() => setShowMobileMore(true)} className="flex flex-col items-center gap-1 w-16 cursor-pointer bg-transparent border-none p-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-[24px] font-bold text-[#64748B] leading-none">•••</span>
                </div>
                <span className="text-[12px] leading-tight font-semibold text-[#000000]">More</span>
              </button>
            </div>
          </div>

          {/* PROFILE SHEET */}
          <AnimatedSheet isOpen={showMobileProfile} onClose={() => setShowMobileProfile(false)} direction="top">
            <div className="hidden lg:flex items-center justify-between px-6 py-4">
              <h2 className="text-[22px] font-bold text-[#0F172A]">My Profile</h2>
              <button onClick={() => setShowMobileProfile(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="lg:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />
            <div className="lg:hidden px-5 pb-3 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-[#0F172A]">My Profile</h2>
              <button onClick={() => setShowMobileProfile(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-base leading-none">✕</button>
            </div>

            <div className="px-5 lg:px-6 pb-6 lg:pb-6 flex flex-col gap-4 lg:gap-5 overflow-y-auto lg:overflow-visible max-h-[85vh] lg:max-h-none">
              <div className="flex items-center gap-5">
                <div className="w-[100px] h-[100px] lg:w-[115px] lg:h-[115px] rounded-full bg-[#dcf5fa] flex items-center justify-center shrink-0 border-4 border-white shadow-sm relative">
                  <img src={profileAvatar} className="w-[90%] h-[90%] object-contain" alt="Profile" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center border-2 border-white text-white text-[10px]">✏️</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0F172A] text-xl lg:text-2xl truncate mb-0.5">{userLoading ? 'Loading...' : profileUser?.name || 'User'}</p>
                  <p className="text-[13px] text-slate-500 mb-2 truncate">Let's learn together!</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-white bg-teal-500 rounded-full px-2.5 py-0.5 shrink-0">{statsLoading ? '...' : `Level ${progressStats?.level ?? 1}`}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[160px]">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressStats?.progressPercent ?? 0}%` }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold text-right max-w-[160px] ml-auto">{statsLoading ? '...' : `${progressStats?.currentLevelXP ?? 0} / ${progressStats?.nextLevelXP ?? 100} XP`}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-100 rounded-[16px] py-3 flex flex-col items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="text-2xl mb-0.5">🔥</span>
                  <span className="text-[15px] font-black text-[#0F172A]">{profileUser?.streak ?? 0}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Streak</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-[16px] py-3 flex flex-col items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="text-2xl mb-0.5">🪙</span>
                  <span className="text-[15px] font-black text-[#0F172A]">{totalCoins}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Coins</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-[16px] py-3 flex flex-col items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="text-2xl mb-0.5">💎</span>
                  <span className="text-[15px] font-black text-[#0F172A]">{totalGems}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Gems</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3"><span className="text-xl">👤</span><span className="font-bold text-[#0F172A] text-[14px]">Account Information</span></div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>

                <button className="w-full flex items-center justify-between bg-[#FFFBF0] border border-[#FDE68A] p-4 rounded-2xl text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:bg-[#fef3c7] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👑</span>
                    <div><p className="text-[14px] font-bold text-[#D97706] leading-tight">Go Premium</p><p className="text-[10px] font-medium text-[#B45309] mt-0.5 leading-tight">Unlock all levels, AI &amp; more!</p></div>
                  </div>
                  <svg className="w-4 h-4 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:bg-rose-100 transition-colors"
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-bold text-rose-600 text-[14px]">Logout</span>
                </button>
              </div>
            </div>
          </AnimatedSheet>

          {/* MORE SHEET */}
          <AnimatedSheet isOpen={showMobileMore} onClose={() => setShowMobileMore(false)} direction="bottom">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />
            <div className="px-5 pb-3 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-[#0F172A]">More</h2>
              <button onClick={() => setShowMobileMore(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            </div>
            <div className="overflow-y-auto px-5 pb-10 flex flex-col gap-1">
              {MORE_SHEET_ITEMS.map(({ icon, label, badge }) => (
                <div key={label} className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl w-7 text-center">{icon}</span>
                    <span className="font-bold text-slate-700 text-[15px]">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && <span className="bg-red-500 text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{badge}</span>}
                    <span className="text-slate-300 font-bold text-lg">›</span>
                  </div>
                </div>
              ))}
              <button className="w-full flex items-center justify-between bg-[#FFFBF0] border border-[#FDE68A] p-4 rounded-3xl text-left shadow-sm mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👑</span>
                  <div><p className="text-base font-bold text-[#D97706]">Go Premium</p><p className="text-xs text-[#92400E]">Unlock all levels, AI &amp; more!</p></div>
                </div>
                <span className="text-[#D97706] font-bold text-xl">›</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-4 py-4 px-2 text-left">
                <span className="text-2xl">🚪</span>
                <span className="font-bold text-rose-600 text-[15px]">Logout</span>
              </button>
            </div>
          </AnimatedSheet>
        </>
      )}

      {/* LEGACY TOP NAVBAR */}
      {!showShell && (
        <nav className="bg-white border-b-2 border-[#14B8A6]/10 sticky top-0 z-40 shadow-sm rounded-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <div className="bg-[#14B8A6] w-9 h-9 rounded-xl flex items-center justify-center text-white font-black">P2S</div>
                <span className="text-xl font-bold text-[#0F172A]">Pic2<span className="text-[#14B8A6]">Speak</span></span>
              </Link>

              <div className="hidden md:flex items-center gap-4 lg:gap-6 text-[#334155] font-semibold min-w-0">
                {isAuthenticated && profileUser && (
                  <>
                    <NavLink to="/adventure-map" className={navLinkClass}>Adventure Map</NavLink>
                    {languageSelector && (
                      <div className="shrink-0">{languageSelector}</div>
                    )}
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 group transition-all shrink-0">
                      <Flame size={18} className="text-orange-500 fill-orange-500 group-hover:scale-110 transition-transform" />
                      <span className="text-orange-700 font-bold text-sm">{streak}</span>
                    </div>

                    <div className="relative shrink-0" ref={moreRef}>
                      <button
                        onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                        className="flex items-center gap-1.5 text-slate-600 hover:text-[#14B8A6] transition-colors font-semibold text-sm"
                      >
                        More
                        <ChevronDown size={15} className={`transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showMoreDropdown && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                          {MAP_NAV_ITEMS.map((item) => (
                            <button
                              key={item.label}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-[#14B8A6]/5 hover:text-[#14B8A6] transition-colors font-semibold text-left"
                              onClick={() => setShowMoreDropdown(false)}
                            >
                              <span>{item.icon}</span> {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <a href="#about" className="hover:text-[#14B8A6] transition-colors cursor-pointer shrink-0">About</a>

                {isAuthenticated && profileUser ? (
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-1 pr-3 rounded-full transition-all border border-slate-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#14B8A6] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {userIdentifier}
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-slate-50">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-bold text-slate-800 truncate">{profileUser.name}</p>
                        </div>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-[#14B8A6]/5 hover:text-[#14B8A6] transition-colors font-semibold">
                          <User size={18} /> Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                        >
                          <LogOut size={18} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="bg-[#14B8A6] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#0F766E] transition-all active:scale-95 shadow-md shadow-[#14B8A6]/20 shrink-0"
                  >
                    Get Started
                  </button>
                )}
              </div>

              <div className="md:hidden flex items-center gap-3">
                {isAuthenticated && profileUser && (
                  <div className="flex items-center gap-2">
                    {languageSelector && <div className="shrink-0">{languageSelector}</div>}
                    <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                      <Flame size={16} className="text-orange-500 fill-orange-500" />
                      <span className="text-orange-700 font-black text-xs">{streak}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#14B8A6] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      {userIdentifier}
                    </div>
                  </div>
                )}
                <button
                  ref={menuButtonRef}
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-[#14B8A6] p-1"
                >
                  {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              ref={mobileMenuRef}
              className="md:hidden bg-white border-t border-gray-100 rounded-b-2xl px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200"
            >
              {isAuthenticated && profileUser && (
                <>
                  <div className="pb-4 mb-2 border-b border-gray-50 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-black text-slate-800">{profileUser.name}</p>
                      <p className="text-xs text-slate-400">Student Account</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-bold text-xs">{userIdentifier}</div>
                  </div>

                  <NavLink to="/adventure-map" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    🗺️ Adventure Map
                  </NavLink>

                  <div className="flex flex-col gap-1 border-t border-slate-50 pt-3">
                    {MAP_NAV_ITEMS.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 text-base font-semibold text-slate-700 hover:text-[#14B8A6] py-1.5 text-left w-full"
                      >
                        <span>{item.icon}</span> {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <a href="#about" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-slate-700 hover:text-[#14B8A6]">About</a>

              <div className="pt-4 border-t border-gray-100">
                {!isAuthenticated ? (
                  <button
                    onClick={() => { setShowLogin(true); setIsOpen(false); }}
                    className="w-full bg-[#14B8A6] text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-100"
                  >
                    Get Started
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-3"
                  >
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