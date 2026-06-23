import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage from './components/AuthPage';
import Calendar from './components/Calendar';

function AppContent() {
  const { user, loading, login, register } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={login} onRegister={register} />;
  }

  return (
    <SocketProvider>
      <Calendar />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
