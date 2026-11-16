import { useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { SplashScreen } from './components/SplashScreen';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';

type ScreenState = 'splash' | 'login' | 'student-dashboard' | 'admin-dashboard';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');
  const [user, setUser] = useState({ id: '', name: '', role: '', email: '' });

  // Transition straight to Login Page when the intro video completes
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
