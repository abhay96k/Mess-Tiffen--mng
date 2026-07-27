import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Mail, Home, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
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
    <div className="absolute inset-0 bg-executive-mesh flex flex-col justify-between overflow-y-auto no-scrollbar pb-6 text-white">
      {/* Top Brand Section */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 px-6 text-center select-none shrink-0 relative">
        
        {/* Floating Glass Capsules */}
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-xl text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>v2.0 LIVE</span>
        </div>
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-xl text-white">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
          <span>ONLINE</span>
        </div>

        {/* Hero 3D Logo Icon */}
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center mb-4 border border-white/25 p-3 shadow-2xl relative"
        >
          <img src={tiffinLogo} alt="Mess Tiffin Logo" className="w-full h-full object-contain filter drop-shadow-2xl" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Mess Tiffin
        </h1>
        <p className="text-[10px] tracking-[0.28em] text-emerald-400 uppercase font-extrabold mt-1">
          Smart Meal Management
        </p>

        {/* Live Status Pill Capsule */}
        <div className="mt-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-[11px] font-extrabold text-white shadow-lg">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-emerald-200">1000L Daily Fresh Meals</span>
        </div>
      </div>

      {/* Bottom Executive Glassmorphic Card */}
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full bg-executive-card rounded-t-[38px] px-6 pt-6 pb-6 flex flex-col gap-4 shrink-0 shadow-2xl border-t border-white/25"
      >
        {/* Header inside card */}
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-[11px] text-white/60 font-semibold mt-0.5">
            {isSignUp ? 'Register to start your meal subscription' : 'Sign in to manage your daily meals'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/15 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            className={`py-2.5 rounded-xl transition-all ${
              !isSignUp ? 'bg-white text-black font-extrabold shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            className={`py-2.5 rounded-xl transition-all ${
              isSignUp ? 'bg-white text-black font-extrabold shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Switcher on Signup */}
        {isSignUp && (
          <div className="bg-white/10 p-1 rounded-2xl flex gap-1 border border-white/15">
            <button
              type="button"
              onClick={() => { setRole('student'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-extrabold transition-all ${
                role === 'student'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Student Account
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-extrabold transition-all ${
                role === 'admin'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Administrator
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-400/40 backdrop-blur-md rounded-2xl text-[11px] font-semibold text-rose-200 flex gap-1.5 items-center">
            <span className="text-xs">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Registration Name Field */}
          {isSignUp && (
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                <User className="w-4.5 h-4.5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full input-glass pl-11 pr-4 py-3.5 text-xs font-semibold"
              />
            </div>
          )}

          {/* Email / Username */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isSignUp ? "Email address" : "Username or Email (student / admin)"}
              className="w-full input-glass pl-11 pr-4 py-3.5 text-xs font-semibold"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full input-glass pl-11 pr-11 py-3.5 text-xs font-semibold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Contextual Signup Fields */}
          {isSignUp && role === 'student' && (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                  <Home className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Room No."
                  className="w-full input-glass pl-11 pr-4 py-3.5 text-xs font-semibold"
                />
              </div>

              <div>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full input-glass px-4 py-3.5 text-xs font-bold text-white bg-[#14231a]"
                >
                  <option value="1-Meal Basic" className="bg-[#0f1a14] text-white">1-Meal Basic</option>
                  <option value="2-Meal Standard" className="bg-[#0f1a14] text-white">2-Meal Standard</option>
                  <option value="3-Meal Premium" className="bg-[#0f1a14] text-white">3-Meal Premium</option>
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
                    rememberMe ? 'bg-emerald-400 text-black shadow-md' : 'border border-white/30 bg-white/10'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] text-white/70 font-semibold">Remember Me</span>
              </button>
              
              <a href="#forgot" className="text-[11px] text-emerald-300 font-bold hover:underline select-none">
                Forgot Password?
              </a>
            </div>
          )}

          {/* Primary Action Button */}
          {isSignUp ? (
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white/10 hover:bg-emerald-600 border border-white/20 hover:border-emerald-500 text-white font-extrabold select-none mt-1 flex items-center justify-center gap-2 text-sm tracking-wide shadow-md hover:shadow-emerald-600/40 transition-all duration-300 rounded-full cursor-pointer group"
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
                className="w-full py-4 bg-white/10 hover:bg-emerald-600 border border-white/20 hover:border-emerald-500 text-white font-extrabold select-none flex items-center justify-center gap-2 text-sm tracking-wide shadow-md hover:shadow-emerald-600/40 transition-all duration-300 rounded-full cursor-pointer group"
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
                className="w-full py-3.5 bg-white/10 hover:bg-emerald-600 border border-white/20 hover:border-emerald-500 text-white font-extrabold rounded-full transition-all duration-300 select-none flex items-center justify-center gap-2 text-xs shadow-md hover:shadow-emerald-600/40 cursor-pointer group"
              >
                {loading && role === 'admin' && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                )}
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
                <span>Login as Administrator</span>
              </motion.button>
            </div>
          )}
        </form>


      </motion.div>
    </div>
  );
}
