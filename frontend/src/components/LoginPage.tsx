import { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-0 sm:p-4 font-sans text-slate-900 select-none">
      
      {/* Frame Container matching reference layout */}
      <div className="w-full max-w-sm sm:max-w-md h-screen sm:h-[760px] bg-gradient-to-b from-emerald-600 via-emerald-800 to-slate-950 sm:rounded-[40px] shadow-2xl flex flex-col justify-between overflow-hidden relative border border-emerald-500/20">
        
        {/* Top Header Area matching reference image */}
        <div className="pt-8 px-6 pb-6 text-white flex flex-col justify-between shrink-0 relative z-10">
          
          {/* Top Bar with Logo & Role Quick Toggles */}
          <div className="flex items-center justify-between text-xs text-white/80 font-medium mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center p-1 border border-white/20">
                <img src={tiffinLogo} alt="MessTiffin" className="w-full h-full object-contain filter brightness-0 invert" />
              </div>
              <span className="font-bold tracking-tight text-white">MessTiffin</span>
            </div>
            
            {/* Role Pill Switcher */}
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md p-1 rounded-full border border-white/15">
              <button
                type="button"
                onClick={() => handleQuickFill('student')}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all ${
                  role === 'student' ? 'bg-emerald-400 text-slate-950 shadow-xs' : 'text-white/70 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all ${
                  role === 'admin' ? 'bg-emerald-400 text-slate-950 shadow-xs' : 'text-white/70 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Heading Text matching reference image typography */}
          <motion.div
            key={isSignUp ? 'signup-head' : 'signin-head'}
            initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              {isSignUp ? (
                <>Create Your<br />Account</>
              ) : (
                <>Hello<br />Sign in!</>
              )}
            </h1>
          </motion.div>
        </div>

        {/* Bottom White Curved Card Sheet matching reference image */}
        <motion.div
          layout
          className="w-full bg-white rounded-t-[36px] px-6 pt-7 pb-8 flex flex-col justify-between grow shadow-2xl border-t border-white/40 overflow-y-auto no-scrollbar relative z-20"
        >
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Alert */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-600 text-center"
                >
                  ⚠️ {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Field (Sign Up) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800">Full Name</label>
                <div className="relative border-b border-slate-300 focus-within:border-emerald-600 pb-1 transition-all flex items-center justify-between">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 py-1"
                  />
                  {name.trim() && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
              </div>
            )}

            {/* Email / Username Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-800">
                {isSignUp ? 'Phone or Email' : 'Email or Username'}
              </label>
              <div className="relative border-b border-slate-300 focus-within:border-emerald-600 pb-1 transition-all flex items-center justify-between">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'student' ? 'student@mess.com' : 'admin@mess.com'}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 py-1"
                />
                {email.trim() && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-800">Password</label>
              <div className="relative border-b border-slate-300 focus-within:border-emerald-600 pb-1 transition-all flex items-center justify-between">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 py-1 pr-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Student Specific Signup Fields (Room & Plan) */}
            {isSignUp && role === 'student' && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-800">Room No.</label>
                  <div className="border-b border-slate-300 focus-within:border-emerald-600 pb-1 transition-all">
                    <input
                      type="text"
                      required
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. 304"
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 py-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-800">Meal Plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-300 focus:border-emerald-600 text-xs font-bold text-slate-900 outline-none py-1.5 cursor-pointer"
                  >
                    <option value="1-Meal Basic">1-Meal Basic</option>
                    <option value="2-Meal Standard">2-Meal Standard</option>
                    <option value="3-Meal Premium">3-Meal Premium</option>
                  </select>
                </div>
              </div>
            )}

            {/* Forgot Password Right Aligned (Sign In mode) */}
            {!isSignUp && (
              <div className="flex justify-end pt-1">
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert('Please contact your Mess Manager to reset your password.'); }}
                  className="text-xs text-slate-600 font-bold hover:text-emerald-700 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Main Action Button matching reference image gradient pill button */}
            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-800 to-slate-950 hover:from-emerald-700 hover:to-slate-900 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isSignUp ? 'SIGN UP' : 'SIGN IN'}</span>
                )}
              </button>

              {/* Text placed directly below the SIGN IN / SIGN UP button box */}
              <div className="flex items-center justify-end text-xs font-semibold text-slate-500 pt-1">
                <span>{isSignUp ? 'Already have account?' : "Don't have account?"}</span>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
                  className="ml-1.5 font-extrabold text-slate-900 hover:text-emerald-600 hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Sign In' : 'Sign up'}
                </button>
              </div>
            </div>
          </form>

        </motion.div>
      </div>
    </div>
  );
}
