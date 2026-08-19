import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Mail, Home, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambient Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      
      {/* Centered Minimal Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-7 shadow-2xl border border-white/20">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center p-2 mb-3 shadow-inner border border-emerald-100/60">
              <img src={tiffinLogo} alt="Mess Logo" className="w-full h-full object-contain drop-shadow-xs" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {isSignUp ? 'Sign up to manage your meals' : 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Role Switcher (Student / Admin) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => { setRole('student'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                role === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                role === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin</span>
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-2xl text-xs font-medium text-red-600 text-center"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 pl-10 pr-4 py-3 text-xs font-medium rounded-2xl outline-none transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or Username"
                className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 pl-10 pr-4 py-3 text-xs font-medium rounded-2xl outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 pl-10 pr-10 py-3 text-xs font-medium rounded-2xl outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isSignUp && role === 'student' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Room No."
                    className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 pl-10 pr-3 py-3 text-xs font-medium rounded-2xl outline-none transition-all"
                  />
                </div>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 px-3 py-3 text-xs font-medium rounded-2xl outline-none transition-all"
                >
                  <option value="1-Meal Basic">1-Meal Basic</option>
                  <option value="2-Meal Standard">2-Meal Standard</option>
                  <option value="3-Meal Premium">3-Meal Premium</option>
                </select>
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between px-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500 hover:text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your Mess Admin to reset password.'); }} className="text-emerald-600 font-semibold hover:underline">
                  Forgot?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : `Sign In as ${role === 'admin' ? 'Admin' : 'Student'}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Bottom Toggle between Sign In / Sign Up */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
              className="text-emerald-600 font-bold hover:underline ml-1 cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
