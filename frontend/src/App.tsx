import { useState, useEffect } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { SplashScreen } from './components/SplashScreen';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { authAPI } from './services/api';

type ScreenState = 'splash' | 'login' | 'student-dashboard' | 'admin-dashboard';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');
  const [user, setUser] = useState({ id: '', name: '', role: '', email: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage to restore session
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.success) {
            setUser({
              id: res._id,
              name: res.name,
              role: res.role,
              email: res.email
            });
            setScreen(res.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
          } else {
            localStorage.removeItem('token');
            setScreen('login');
          }
        } catch (error) {
          console.error('Session restoration failed:', error);
          localStorage.removeItem('token');
          setScreen('login');
        }
      } else {
        // No token, show splash then login
        setScreen('splash');
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const handleSplashComplete = () => {
    setScreen('login');
  };

  const handleLoginSuccess = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    setUser({
      id: userData._id,
      name: userData.name,
      role: userData.role,
      email: userData.email
    });
    setScreen(userData.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser({ id: '', name: '', role: '', email: '' });
    setScreen('login');
  };

  if (loading) {
    return (
      <PhoneFrame>
        <div className="absolute inset-0 bg-primary flex items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      {screen === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {screen === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}
      {screen === 'student-dashboard' && (
        <StudentDashboard userName={user.name} userId={user.id} onLogout={handleLogout} />
      )}
      {screen === 'admin-dashboard' && (
        <AdminDashboard userName={user.name} onLogout={handleLogout} />
      )}
    </PhoneFrame>
  );
}
