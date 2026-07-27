import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Mail, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { authAPI } from '../services/api';
import tiffinLogo from '../assets/tiffin_logo_3d.png';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [room, setRoom] = useState('');
  const [plan, setPlan] = useState('2-Meal Standard');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    let formattedEmail = email.trim();
    if (!formattedEmail.includes('@')) {
      formattedEmail = `${formattedEmail.toLowerCase()}@mess.com`;
    }

    try {
      if (isSignUp) {
        const res = await authAPI.register({
          name: name.trim(),
          email: formattedEmail,
          password,
          role,
          room: role === 'student' ? room : '',
          plan: role === 'student' ? plan : 'Admin'
        });

        if (res.success) {
          onLoginSuccess(res, res.token);
        } else {
          setErrorMsg(res.message || 'Registration failed');
        }
      } else {
        const res = await authAPI.login({
          email: formattedEmail,
          password,
          role
        });

        if (res.success) {
          onLoginSuccess(res, res.token);
        } else {
          setErrorMsg(res.message || 'Login failed');
        }
      }
    } catch (error: any) {
      console.error('Auth submit error:', error);
      const message = error.response?.data?.message || 'Connection to server failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCredentials = (userType: 'student' | 'admin') => {
    setRole(userType);
    setEmail(userType === 'student' ? 'student@mess.com' : 'admin@mess.com');
    setPassword('password123');
    setIsSignUp(false);
    setErrorMsg(null);
  };

  return (
    <div className="absolute inset-0 bg-[#e6eef8] flex flex-col justify-between overflow-y-auto no-scrollbar pb-6">
      {/* Top Brand Section */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 px-6 text-center select-none shrink-0">
        {/* Neomorphic 3D Logo Container */}
        <div className="w-20 h-20 neu-raised flex items-center justify-center mb-3.5 relative overflow-hidden p-2 select-none">
          <img src={tiffinLogo} alt="Mess Tiffin Logo" className="w-full h-full object-contain rounded-2xl" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-emerald-600 tracking-tight">
          Mess Tiffin
        </h1>
        <p className="text-[9px] tracking-[0.25em] text-emerald-700/80 uppercase font-extrabold mt-0.5">
          Management System
        </p>

        {/* Soft Divider */}
        <div className="flex items-center gap-2.5 my-2 w-20">
          <div className="flex-1 h-0.5 neu-inset rounded-full"></div>
          <span className="text-xs">🍲</span>
          <div className="flex-1 h-0.5 neu-inset rounded-full"></div>
        </div>
      </div>

      {/* Bottom Neomorphic Card */}
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full bg-[#e6eef8] rounded-t-[36px] neu-raised-lg px-6 pt-6 pb-6 flex flex-col gap-4 shrink-0 border-t border-white/80"
      >
        {/* Header inside card */}
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-slate-800">
            {isSignUp ? 'Create Account' : 'Welcome Back!'}
          </h2>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            {isSignUp ? 'Register to start meal plans' : 'Sign in to continue to your portal'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Sign In / Sign Up) */}
        <div className="grid grid-cols-2 gap-2 neu-inset p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            className={`py-2 rounded-xl transition-all ${
              !isSignUp ? 'neu-pill-active font-extrabold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            className={`py-2 rounded-xl transition-all ${
              isSignUp ? 'neu-pill-active font-extrabold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Switcher on Signup */}
        {isSignUp && (
          <div className="neu-inset p-1 rounded-2xl flex gap-1">
            <button
              type="button"
              onClick={() => { setRole('student'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-extrabold transition-all ${
                role === 'student'
                  ? 'neu-button-accent'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student Account
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-extrabold transition-all ${
                role === 'admin'
                  ? 'neu-button-accent'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Administrator
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50/80 border border-rose-200 neu-raised-sm rounded-2xl text-[11px] font-semibold text-rose-700 flex gap-1.5 items-center">
            <span className="text-xs">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Registration Name Field */}
          {isSignUp && (
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-4.5 h-4.5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full neu-input pl-11 pr-4 py-3 text-xs font-semibold"
              />
            </div>
          )}

          {/* Email / Username */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isSignUp ? "Email address" : "Username or Email (student / admin)"}
              className="w-full neu-input pl-11 pr-4 py-3 text-xs font-semibold"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full neu-input pl-11 pr-11 py-3 text-xs font-semibold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Contextual Signup Fields */}
          {isSignUp && role === 'student' && (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Home className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Room No."
                  className="w-full neu-input pl-11 pr-4 py-3 text-xs font-semibold"
                />
              </div>

              <div>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full neu-input px-4 py-3 text-xs font-bold text-slate-700"
                >
                  <option value="1-Meal Basic">1-Meal Basic</option>
                  <option value="2-Meal Standard">2-Meal Standard</option>
                  <option value="3-Meal Premium">3-Meal Premium</option>
                </select>
              </div>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          {!isSignUp && (
            <div className="flex items-center justify-between px-1 pb-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer focus:outline-none group select-none"
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                    rememberMe ? 'neu-pill-active' : 'neu-inset'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] text-slate-600 font-semibold">Remember Me</span>
              </button>
              
              <a href="#forgot" className="text-[11px] text-emerald-700 font-bold hover:underline select-none">
                Forgot Password?
              </a>
            </div>
          )}

          {/* Submit Action Buttons */}
          {isSignUp ? (
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 neu-button-accent text-white font-bold select-none mt-1 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
              <span>{loading ? 'Registering...' : 'Sign Up'}</span>
            </motion.button>
          ) : (
            <div className="flex flex-col gap-2.5 mt-1">
              {/* Login as Student */}
              <motion.button
                type="submit"
                disabled={loading}
                onClick={() => setRole('student')}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 neu-button-accent font-bold select-none flex items-center justify-center gap-2"
              >
                {loading && role === 'student' && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                )}
                <span>Login as Student</span>
              </motion.button>

              {/* Login as Admin */}
              <motion.button
                type="submit"
                disabled={loading}
                onClick={() => setRole('admin')}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 neu-button font-bold text-slate-700 select-none flex items-center justify-center gap-2"
              >
                {loading && role === 'admin' && (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin"></div>
                )}
                <span>Login as Admin</span>
              </motion.button>
            </div>
          )}
        </form>

        {/* Demo Fast Login Panel */}
        <div className="neu-inset p-3 text-[10px] space-y-2">
          <p className="font-bold text-slate-500 text-center">💡 Click below to auto-fill demo credentials:</p>
          <div className="grid grid-cols-2 gap-2 font-bold">
            <button
              type="button"
              onClick={() => handleQuickCredentials('student')}
              className="py-2 neu-button text-emerald-600 text-center font-bold"
            >
              Demo Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickCredentials('admin')}
              className="py-2 neu-button text-emerald-600 text-center font-bold"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Social Options */}
        <div className="grid grid-cols-2 gap-2.5 select-none">
          <button
            type="button"
            onClick={() => handleQuickCredentials('student')}
            className="flex items-center justify-center gap-1.5 py-2.5 neu-button text-[11px] font-bold text-slate-700"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.67 0 3.17.58 4.35 1.7l3.25-3.25C17.65 1.62 14.99 1 12 1 7.37 1 3.4 3.73 1.5 7.69l3.86 3C6.27 7.71 8.92 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.45c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.53z" />
              <path fill="#FBBC05" d="M5.36 14.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.5 7.23C.54 9.12 0 11.23 0 13.5s.54 4.38 1.5 6.27l3.86-3z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.1.74-2.5 1.18-4.3 1.18-3.08 0-5.73-2.67-6.64-5.65L1.5 15.77C3.4 19.73 7.37 23 12 23z" />
            </svg>
            Google
          </button>
          
          <button
            type="button"
            onClick={() => handleQuickCredentials('admin')}
            className="flex items-center justify-center gap-1.5 py-2.5 neu-button text-[11px] font-bold text-slate-700"
          >
            <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 3 .12 0 2.34-.64 3-1.45" />
            </svg>
            Apple
          </button>
        </div>
      </motion.div>
    </div>
  );
}
