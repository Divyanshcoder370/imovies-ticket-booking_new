import React, { useState } from 'react';
import { Film, MapPin, Ticket, ShieldAlert, BookOpen, LogOut, LogIn } from 'lucide-react';
import { User } from '../types';
import { ApiClient } from '../services/api';

interface NavbarProps {
  currentTab: 'movies' | 'cinemas' | 'bookings' | 'admin' | 'docs';
  setCurrentTab: (tab: 'movies' | 'cinemas' | 'bookings' | 'admin' | 'docs') => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedCity,
  setSelectedCity,
  user,
  setUser,
  onOpenAuthModal
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const cities = ['New York', 'Los Angeles', 'Chicago', 'London'];

  const handleQuickPersona = async (role: 'user' | 'admin') => {
    try {
      const email = role === 'admin' ? 'admin@imovies.com' : 'user@imovies.com';
      const password = role === 'admin' ? 'admin123' : 'user123';
      const res = await ApiClient.login(email, password);
      setUser(res.user);
      setShowUserDropdown(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    ApiClient.logout();
    setUser(null);
    setShowUserDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setCurrentTab('movies')}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                IMovies
                <span className="text-[10px] font-medium tracking-widest uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Cinema
                </span>
              </span>
            </div>
          </button>

          {/* City selector dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer pr-1"
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-zinc-900 text-zinc-200">
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('movies')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentTab === 'movies'
                ? 'text-white bg-zinc-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setCurrentTab('cinemas')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentTab === 'cinemas'
                ? 'text-white bg-zinc-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Cinemas
          </button>
          <button
            onClick={() => setCurrentTab('bookings')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'bookings'
                ? 'text-white bg-zinc-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Ticket className="w-4 h-4" />
            My Tickets
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'admin'
                ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Admin
          </button>
          <button
            onClick={() => setCurrentTab('docs')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'docs'
                ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-800/40'
                : 'text-zinc-400 hover:text-indigo-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Architecture & Docs
          </button>
        </nav>

        {/* User Account / Persona Switcher */}
        <div className="relative shrink-0 flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-semibold text-[11px]">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline font-medium">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 px-1 py-0.2 rounded bg-amber-950/50">
                  {user.role}
                </span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="font-semibold text-zinc-100">{user.name}</p>
                    <p className="text-zinc-400 text-[11px] truncate">{user.email}</p>
                    <p className="text-[10px] text-amber-400 mt-1 uppercase">Role: {user.role}</p>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[10px] text-zinc-500 uppercase font-semibold">
                      Switch Role
                    </p>
                    <button
                      onClick={() => handleQuickPersona('user')}
                      className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-800/80 flex items-center justify-between cursor-pointer"
                    >
                      <span>Sarah Connor (Member)</span>
                      {user.role === 'user' && <span className="text-amber-400 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => handleQuickPersona('admin')}
                      className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-800/80 flex items-center justify-between cursor-pointer"
                    >
                      <span>Cinema Admin</span>
                      {user.role === 'admin' && <span className="text-amber-400 font-bold">✓</span>}
                    </button>
                  </div>

                  <div className="border-t border-zinc-800 pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickPersona('user')}
                className="hidden sm:inline-flex px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition cursor-pointer"
                title="Quick demo user sign in"
              >
                Demo User
              </button>
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
