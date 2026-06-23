import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="min-h-screen lg:grid lg:grid-cols-2">
        <aside className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-semibold">
                WS
              </div>
              <span className="font-semibold tracking-tight">Workspace Scheduler</span>
            </div>
            <h1 className="text-3xl font-semibold leading-snug max-w-md">
              Real-time conference room booking for shared workspaces
            </h1>
            <p className="text-slate-400 mt-4 max-w-md text-sm leading-relaxed">
              Book premium conference room slots, prevent double bookings, and see live updates
              across your team without refreshing the page.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-400">
            <li>JWT authentication with Standard & Supervisor roles</li>
            <li>Overlap-safe booking engine</li>
            <li>Live schedule sync via WebSockets</li>
          </ul>
        </aside>

        <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex w-10 h-10 rounded-lg bg-slate-900 text-white items-center justify-center font-semibold mb-3">
                WS
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Workspace Scheduler</h1>
              <p className="text-sm text-slate-500 mt-1">Conference room booking</p>
            </div>

            <div className="card shadow-panel overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50/80">
                {['login', 'register'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMode(tab)}
                    className={`flex-1 py-3.5 text-sm font-medium transition ${
                      mode === tab
                        ? 'text-slate-900 bg-white border-b-2 border-slate-900 -mb-px'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'login' ? 'Sign in' : 'Register'}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8">
                {mode === 'login' ? (
                  <LoginForm onLogin={onLogin} />
                ) : (
                  <RegisterForm onRegister={onRegister} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
