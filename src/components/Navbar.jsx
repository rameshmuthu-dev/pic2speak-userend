import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, User, Flame } from 'lucide-react'; // Added Flame icon
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import AuthModal from './AuthModal';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null); 
  const menuButtonRef = useRef(null);

  const dispatch = useDispatch();
  
  /**
   * DATA SOURCE:
   * 'auth' slice handles login status.
   * 'user' slice handles profile details like streaks.
   */
  const { user: authUser } = useSelector((state) => state.auth);
  const { user: profileData } = useSelector((state) => state.user);

  // Use profileData if available (for streaks), otherwise fallback to authUser
  const activeUser = profileData || authUser;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      if (
        isOpen && 
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target) &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (activeUser) setShowLogin(false);
  }, [activeUser]);

  const userIdentifier = activeUser?.name ? activeUser.name.substring(0, 2).toUpperCase() : '??';

  return (
    <>
      <nav className="bg-white border-b-2 border-[#14B8A6]/10 sticky top-0 z-40 shadow-sm rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-[#14B8A6] w-9 h-9 rounded-xl flex items-center justify-center text-white font-black">P2S</div>
              <span className="text-xl font-bold text-[#0F172A]">
                Pic2<span className="text-[#14B8A6]">Speak</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 text-[#334155] font-semibold">
              {activeUser && (
                <>
                  <Link to="/lessons" className="hover:text-[#14B8A6] transition-colors">Lessons</Link>
                  <Link to="/practice" className="hover:text-[#14B8A6] transition-colors">Practice</Link>
                  
                  {/* STREAK DISPLAY: The Fire Icon */}
                  <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 group transition-all">
                    <Flame size={18} className="text-orange-500 fill-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="text-orange-700 font-bold text-sm">
                      {activeUser?.streak || 0}
                    </span>
                  </div>
                </>
              )}
              
              <a href="#about" className="hover:text-[#14B8A6] transition-colors cursor-pointer">About</a>

              {activeUser ? (
                <div className="relative" ref={dropdownRef}>
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
                        <p className="text-sm font-bold text-slate-800 truncate">{activeUser.name}</p>
                      </div>

                      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-[#14B8A6]/5 hover:text-[#14B8A6] transition-colors font-semibold">
                        <User size={18} /> Profile
                      </button>

                      <button
                        onClick={() => {
                          dispatch(logout());
                          setShowDropdown(false);
                        }}
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
                  className="bg-[#14B8A6] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#0F766E] transition-all active:scale-95 shadow-md shadow-[#14B8A6]/20"
                >
                  Get Started
                </button>
              )}
            </div>

            {/* Mobile Menu Icon */}
            <div className="md:hidden flex items-center gap-3">
              {activeUser && (
                <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                  <Flame size={16} className="text-orange-500 fill-orange-500" />
                  <span className="text-orange-700 font-black text-xs">{activeUser?.streak || 0}</span>
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

        {/* Mobile Navigation Content */}
        {isOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden bg-white border-t border-gray-100 rounded-b-2xl px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200"
          >
            {activeUser && (
              <>
                <div className="pb-4 mb-2 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-black text-slate-800">{activeUser.name}</p>
                    <p className="text-xs text-slate-400">Student Account</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-bold text-xs">
                    {userIdentifier}
                  </div>
                </div>
                <Link to="/lessons" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-slate-700 hover:text-[#14B8A6]">Lessons</Link>
                <Link to="/practice" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-slate-700 hover:text-[#14B8A6]">Practice</Link>
              </>
            )}
            <a href="#about" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-slate-700 hover:text-[#14B8A6]">About</a>

            <div className="pt-4 border-t border-gray-100">
              {!activeUser ? (
                <button
                  onClick={() => { setShowLogin(true); setIsOpen(false); }}
                  className="w-full bg-[#14B8A6] text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-100"
                >
                  Get Started
                </button>
              ) : (
                <button
                  onClick={() => { dispatch(logout()); setIsOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-3"
                >
                  <LogOut size={20} /> Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default Navbar;