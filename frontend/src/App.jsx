import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage from './components/AuthPage';
import Calendar from './components/Calendar';

function AppContent() {
  const { user, loading, login, register } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={login} onRegister={register} />;
  }

  return <Calendar />;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
