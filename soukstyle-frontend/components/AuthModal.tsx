// components/AuthModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useAuth } from '../lib/authContext';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const address = { wilaya, city, street };
        await signup(name, email, password, address);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <DialogBackdrop className="fixed inset-0 bg-black opacity-40" />
      <div className="flex items-center justify-center min-h-screen px-4">
        <DialogPanel className="relative bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <DialogTitle className="text-2xl font-bold text-gray-800 mb-6">
            {isLogin ? 'Login' : 'Sign Up'}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              required
            />
            {!isLogin && (
              <>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                  required
                >
                  <option value="">Select Wilaya</option>
                  <option value="Algiers">Algiers</option>
                  <option value="Oran">Oran</option>
                </select>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                  required
                />
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                  required
                />
              </>
            )}
            {error && <p className="text-error-red text-center">{error}</p>}
            <button type="submit" className="btn-primary w-full"> {isLogin ? 'Login' : 'Sign Up'}</button>
          </form>
          <p className="mt-4 text-center text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary-green hover:underline">
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </DialogPanel>
      </div>
    </Dialog>
  );
}