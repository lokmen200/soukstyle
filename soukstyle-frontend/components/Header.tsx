// components/Header.tsx
'use client';

import { useState } from 'react';
import { FaUser, FaCartPlus, FaBars } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '../lib/authContext';
import AuthModal from './AuthModal';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const { token, user, logout } = useAuth();

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  return (
    <>
      <header className="bg-primary-green text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold tracking-tight">SoukStyle</Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="hover:text-accent-gold transition">Home</Link>
            <Link href="/shops" className="hover:text-accent-gold transition">Shops</Link>
            <Link href="/categories" className="hover:text-accent-gold transition">Categories</Link>
            <Link href="/cart" className="hover:text-accent-gold transition">Cart</Link>
            {token && <Link href="/profile" className="hover:text-accent-gold transition">Profile</Link>}
          </nav>
          <div className="flex items-center space-x-4">
            <button onClick={toggleLanguage} className="text-sm bg-white text-primary-green px-2 py-1 rounded hover:bg-gray-100 transition">
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            {token ? (
              <>
                <Link href="/profile" className="hover:text-accent-gold"><FaUser size={20} /></Link>
                <button onClick={logout} className="text-sm hover:text-accent-gold transition">Logout</button>
              </>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="hover:text-accent-gold"><FaUser size={20} /></button>
            )}
            <Link href="/cart" className="hover:text-accent-gold"><FaCartPlus size={20} /></Link>
            <FaBars className="md:hidden cursor-pointer hover:text-accent-gold" size={20} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary-green p-4 mt-2 rounded-b-lg shadow-md">
            <Link href="/" className="block py-2 hover:text-accent-gold transition">Home</Link>
            <Link href="/shops" className="block py-2 hover:text-accent-gold transition">Shops</Link>
            <Link href="/categories" className="block py-2 hover:text-accent-gold transition">Categories</Link>
            <Link href="/cart" className="block py-2 hover:text-accent-gold transition">Cart</Link>
            {token ? <Link href="/profile" className="block py-2 hover:text-accent-gold transition">Profile</Link> : null}
            {token ? <button onClick={logout} className="block py-2 hover:text-accent-gold transition w-full text-left">Logout</button> : null}
          </div>
        )}
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}