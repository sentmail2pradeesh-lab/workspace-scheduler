import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm mb-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Conference Room Booking</h1>
        <p className="text-sm text-gray-500 mt-1">Shared workspace scheduler</p>
      </div>

      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                mode === tab
                  ? 'text-gray-900 border-b-2 border-gray-900 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm onLogin={onLogin} />
          ) : (
            <RegisterForm onRegister={onRegister} />
          )}
        </div>
      </div>
    </div>
  );
}
