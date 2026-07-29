import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Mail, Home, ArrowRight, ShieldCheck, Utensils } from 'lucide-react';
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

  return (
    <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-start overflow-y-auto no-scrollbar p-4 text-slate-900">
      
      {/* Top Header Section */}
      <div className="w-full flex flex-col items-center pt-5 pb-3 px-4 text-center select-none shrink-0 relative">
        
        {/* Real World Brand Badge */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold px-3.5 py-1 rounded-full mb-2.5 flex items-center gap-1.5 shadow-xs">
          <Utensils className="w-3.5 h-3.5 text-emerald-600" />
          <span>Smart Meal Management</span>
        </div>

        {/* Hero App Logo Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mb-2 border border-slate-200 p-2 shadow-sm">
          <img src={tiffinLogo} alt="Mess Tiffin Logo" className="w-full h-full object-contain" />
        </div>

        {/* App Title */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Mess Tiffin Portal
        </h1>
      </div>

      {/* Real World Auth Card Container - Pulled right under header */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full bg-white rounded-[32px] px-6 pt-5 pb-6 flex flex-col gap-3.5 shrink-0 shadow-xl border border-slate-200 mt-2 mb-4"
      >
        {/* Header inside card */}
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isSignUp ? 'Register for your mess subscription' : 'Sign in to access your meal dashboard'}
          </p>
        </div>

        {/* Segmented Auth Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            className={`py-2.5 rounded-xl transition-all ${
              !isSignUp ? 'bg-white text-slate-900 font-black shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            className={`py-2.5 rounded-xl transition-all ${
              isSignUp ? 'bg-white text-slate-900 font-black shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Switcher on Signup */}
        {isSignUp && (
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setRole('student'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-[11px] font-extrabold transition-all ${
                role === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Account
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-[11px] font-extrabold transition-all ${
                role === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Administrator
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex gap-2 items-center">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
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
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-slate-900 pl-11 pr-4 py-3.5 text-xs font-semibold rounded-2xl transition-all"
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
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-slate-900 pl-11 pr-4 py-3.5 text-xs font-semibold rounded-2xl transition-all"
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
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-slate-900 pl-11 pr-11 py-3.5 text-xs font-semibold rounded-2xl transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Contextual Signup Fields */}
          {isSignUp && role === 'student' && (
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-slate-900 pl-11 pr-4 py-3.5 text-xs font-semibold rounded-2xl transition-all"
                />
              </div>

              <div>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-slate-900 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all"
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
                  className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all ${
                    rememberMe ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-slate-100'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-slate-600 font-semibold">Remember Me</span>
              </button>
              
              <a href="#forgot" className="text-xs text-emerald-700 font-extrabold hover:underline select-none">
                Forgot Password?
              </a>
            </div>
          )}

          {/* Primary Action Buttons */}
          {isSignUp ? (
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold select-none mt-1 flex items-center justify-center gap-2 text-sm tracking-wide shadow-md transition-all duration-200 rounded-full cursor-pointer group"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
              <span>{loading ? 'Registering...' : 'Get started'}</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
            </motion.button>
          ) : (
            <div className="flex flex-col gap-2.5 mt-1">
              {/* Login as Student */}
              <motion.button
                type="submit"
                disabled={loading}
                onClick={() => setRole('student')}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold select-none flex items-center justify-center gap-2 text-sm tracking-wide shadow-md transition-all duration-200 rounded-full cursor-pointer group"
              >
                {loading && role === 'student' && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                )}
                <span>Get started (Student)</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
              </motion.button>

              {/* Login as Admin */}
              <motion.button
                type="submit"
                disabled={loading}
                onClick={() => setRole('admin')}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-slate-100 hover:bg-emerald-600 border border-slate-200 hover:border-emerald-600 text-slate-800 hover:text-white font-extrabold rounded-full transition-all duration-200 select-none flex items-center justify-center gap-2 text-xs cursor-pointer group"
              >
                {loading && role === 'admin' && (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></div>
                )}
                <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
                <span>Login as Administrator</span>
              </motion.button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
