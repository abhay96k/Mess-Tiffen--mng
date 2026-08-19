import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Mail, Home, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
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

  // Quick fill helper for testing demo credentials
  const handleQuickFill = (targetRole: 'student' | 'admin') => {
    setIsSignUp(false);
    setRole(targetRole);
    setEmail(targetRole === 'student' ? 'student@mess.com' : 'admin@mess.com');
    setPassword('password123');
    setErrorMsg(null);
  };

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
    <div className="min-h-screen w-full bg-slate-100/80 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-800">
      
      {/* Main Container */}
      <div className="w-full max-w-md my-auto space-y-4">
        
        {/* Authentic Product Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200/90">
          
          {/* Header & Logo */}
          <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center p-2 shadow-md shrink-0">
              <img src={tiffinLogo} alt="MessTiffin Logo" className="w-full h-full object-contain filter brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>MessTiffin</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 tracking-wider">Portal</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Daily Mess, Menu & Tiffin Management</p>
            </div>
          </div>

          {/* Real Tab Control: Sign In / Sign Up */}
          <div className="flex border-b border-slate-200 mb-6 text-sm font-bold">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
              className={`pb-3 px-1 flex-1 text-center transition-all cursor-pointer relative ${
                !isSignUp ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
              {!isSignUp && (
                <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
              className={`pb-3 px-1 flex-1 text-center transition-all cursor-pointer relative ${
                isSignUp ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              New Account
              {isSignUp && (
                <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Quick Demo Login Shortcut */}
          {!isSignUp && (
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Quick Demo Fill
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Auto fill credentials</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('student')}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 font-bold text-slate-700 text-[11px] transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <User className="w-3 h-3 text-emerald-600" />
                  <span>Student Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 font-bold text-slate-700 text-[11px] transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>
          )}

          {/* Account Role Selector (Student / Admin) */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Role</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'student'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mess Admin</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700"
              >
                ⚠️ {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentic Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name for Signup */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-slate-900 pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isSignUp ? 'Email Address' : 'Email or Username'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'student' ? 'student@mess.com' : 'admin@mess.com'}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-slate-900 pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                {!isSignUp && (
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Contact your Mess Admin to reset password.'); }} className="text-xs text-emerald-600 font-bold hover:underline">
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-slate-900 pl-10 pr-10 py-2.5 text-xs font-semibold rounded-xl outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Room & Plan for Student Signup */}
            {isSignUp && role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room No.</label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. 304"
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 text-slate-900 pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meal Plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 text-slate-900 px-3 py-2.5 text-xs font-bold rounded-xl outline-none transition-all"
                  >
                    <option value="1-Meal Basic">1-Meal Basic</option>
                    <option value="2-Meal Standard">2-Meal Standard</option>
                    <option value="3-Meal Premium">3-Meal Premium</option>
                  </select>
                </div>
              </div>
            )}

            {/* Remember Me */}
            {!isSignUp && (
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-slate-600 font-semibold cursor-pointer select-none">
                  Keep me signed in on this device
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : `Sign In to ${role === 'admin' ? 'Admin Portal' : 'Student Account'}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Real App Footer */}
        <div className="text-center text-[11px] text-slate-400 font-medium space-y-1">
          <p>© 2026 MessTiffin Inc. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
