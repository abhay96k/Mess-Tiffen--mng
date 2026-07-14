import { useState, useEffect } from 'react';
import { 
  Bell, LogOut, Calendar, 
  CreditCard, Send, Star, ChevronDown, ChevronUp, 
  ShieldAlert, Sparkles, Check, CheckCircle,
  Home, Utensils, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { attendanceAPI, menuAPI, feedbackAPI, studentAPI, authAPI, announcementAPI, settingsAPI } from '../services/api';

interface StudentDashboardProps {
  userName: string;
  userId: string;
  onLogout: () => void;
}

interface MealState {
  breakfast: boolean;
  breakfastPendingSkip?: boolean;
  lunch: boolean;
  lunchPendingSkip?: boolean;
  dinner: boolean;
  dinnerPendingSkip?: boolean;
}

export function StudentDashboard({ userName, userId, onLogout }: StudentDashboardProps) {
  // Navigation & UI states
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'attendance' | 'billing' | 'profile'>('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);
  const [loading, setLoading] = useState(true);

  // Core Data States
  const [meals, setMeals] = useState<MealState>({
    breakfast: true,
    breakfastPendingSkip: false,
    lunch: false,
    lunchPendingSkip: false,
    dinner: true,
    dinnerPendingSkip: false
  });
  const [weeklyMenu, setWeeklyMenu] = useState<any[]>([]);
  const [confirmMealSkip, setConfirmMealSkip] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [billAmount, setBillAmount] = useState(2400);
  const [billStatus, setBillStatus] = useState('pending');
  const [planName, setPlanName] = useState('2-Meal Standard');
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('304');
  const [accountStatus, setAccountStatus] = useState('active');
  const [profileImage, setProfileImage] = useState('');

  const [pricingSettings, setPricingSettings] = useState({
    breakfastOnly: 800,
    lunchOnly: 1200,
    dinnerOnly: 1200,
    breakfastLunch: 1850,
    breakfastDinner: 1850,
    lunchDinner: 2200,
    allMeals: 2800
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await authAPI.updateProfile({ profileImage: base64String });
        if (res.success) {
          setProfileImage(res.profileImage);
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Accordion state for Weekly Menu
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  // Billing states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Fetch all user information from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch user billing and plan details
      const profile = await authAPI.getMe();
      if (profile.success) {
        setBillAmount(profile.billAmount);
        setBillStatus(profile.billStatus);
        setPlanName(profile.plan);
        setUserEmail(profile.email || '');
        setRoomNumber(profile.room || '304');
        setAccountStatus(profile.status || 'active');
        setProfileImage(profile.profileImage || '');
        setNotifications(profile.notifications || []);
        const hasUnread = (profile.notifications || []).some((n: any) => !n.read);
        setHasNotification(hasUnread);
      }

      // 2. Fetch today's meal attendance
      const attendance = await attendanceAPI.getToday();
      if (attendance.success && attendance.data) {
        setMeals({
          breakfast: attendance.data.breakfast,
          breakfastPendingSkip: attendance.data.breakfastPendingSkip || false,
          lunch: attendance.data.lunch,
          lunchPendingSkip: attendance.data.lunchPendingSkip || false,
          dinner: attendance.data.dinner,
          dinnerPendingSkip: attendance.data.dinnerPendingSkip || false
        });
      }

      // 3. Fetch weekly menu
      const menu = await menuAPI.getMenu();
      if (menu.success) {
        setWeeklyMenu(menu.data);
      }

      // 4. Fetch announcements
      const notes = await announcementAPI.getAnnouncements();
      if (notes.success && notes.data.length > 0) {
        setAnnouncements(notes.data);
      }

      // 5. Fetch attendance history
      const historyRes = await attendanceAPI.getHistory();
      if (historyRes.success) {
        setAttendanceHistory(historyRes.data);
      }

      // 6. Fetch pricing settings
      const pricingRes = await settingsAPI.getPricing().catch(() => null);
      if (pricingRes && pricingRes.success) {
        setPricingSettings(pricingRes.data);
      }

    } catch (error) {
      console.error('Error loading student dashboard details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-poll every 8 seconds to sync attendance overrides from Admin portal
    const timer = setInterval(() => {
      fetchData();
    }, 8000);

    return () => clearInterval(timer);
  }, [activeTab]);

  const isMealSkipCutoffExceeded = (meal: 'breakfast' | 'lunch' | 'dinner'): boolean => {
    const now = new Date();
    const hour = now.getHours();

    if (meal === 'breakfast') return hour >= 7;
    if (meal === 'lunch') return hour >= 11;
    if (meal === 'dinner') return hour >= 18;
    return false;
  };

  const handleClearNotifications = async () => {
    try {
      await authAPI.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setHasNotification(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleRequestSkipMeal = async (meal: 'breakfast' | 'lunch' | 'dinner') => {
    try {
      // Optimistic UI update
      setMeals(prev => ({
        ...prev,
        [`${meal}PendingSkip`]: true
      }));
      
      const res = await attendanceAPI.requestSkip(meal);
      if (res.success && res.data) {
        setMeals({
          breakfast: res.data.breakfast,
          breakfastPendingSkip: res.data.breakfastPendingSkip || false,
          lunch: res.data.lunch,
          lunchPendingSkip: res.data.lunchPendingSkip || false,
          dinner: res.data.dinner,
          dinnerPendingSkip: res.data.dinnerPendingSkip || false
        });
      }
    } catch (error) {
      console.error('Error requesting meal skip:', error);
      // Revert on error
      setMeals(prev => ({
        ...prev,
        [`${meal}PendingSkip`]: false
      }));
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const res = await studentAPI.payBill(userId);
      if (res.success) {
        setPaymentSuccess(true);
        setBillAmount(0);
        setBillStatus('paid');
      }
    } catch (error) {
      console.error('Error processing checkout pay request:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await feedbackAPI.submitFeedback({
        rating: feedbackRating,
        comments: feedbackText
      });
      if (res.success) {
        setFeedbackSubmitted(true);
        setTimeout(() => {
          setFeedbackSubmitted(false);
          setFeedbackText('');
          setFeedbackRating(5);
        }, 2500);
      }
    } catch (error) {
      console.error('Error submitting feedback review comments:', error);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-neutral-400 font-semibold tracking-wider">Syncing Dashboard...</span>
        </div>
      </div>
    );
  }

  // Get active day menu
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const mappedDayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = mappedDayOrder[todayIndex];
  const todayMenu = weeklyMenu.find(m => m.day === todayDayName) || {
    breakfast: 'Idli Sambar',
    lunch: 'Roti, Veg Curry, Rice, Dal',
    dinner: 'Roti, Dal Tadka, Rice'
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 relative overflow-hidden select-none">
      
      {/* 1. Header Bar */}
      <div className="bg-primary text-white pt-4 pb-6 px-5 rounded-b-[32px] shadow-lg shrink-0 z-30">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 text-left focus:outline-none hover:opacity-95 transition-all select-none group"
            title="View Profile"
          >
            {/* Avatar badge with photo */}
            <div className="w-11 h-11 bg-white/20 rounded-full border border-white/30 flex items-center justify-center font-bold text-sm text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.split(' ').map(n => n[0]).join('').toUpperCase()
              )}
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase flex items-center gap-1">Good Morning 👤</p>
              <h3 className="text-base font-bold text-white leading-tight underline decoration-white/20 group-hover:decoration-white transition-all">{userName}</h3>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setHasNotification(false); }}
              className="relative p-2 bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-all focus:outline-none"
            >
              <Bell className="w-4 h-4 text-white" />
              {hasNotification && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>
            {/* Logout button */}
            <button 
              onClick={onLogout}
              className="p-2 bg-white/10 rounded-full border border-white/20 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-all focus:outline-none"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        
        {/* Room & Subscription Info */}
        <div className="mt-4 flex items-center justify-between text-xs bg-white/10 rounded-xl px-3 py-2 border border-white/15">
          <span className="font-semibold text-white/90">📍 Room 304 (Student)</span>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Active Plan
          </span>
        </div>
      </div>

      {/* 2. Notification Overlay Box */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 z-45"
          >
            <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-2">
              <h4 className="font-bold text-neutral-800 text-xs">Notifications</h4>
              <button 
                onClick={handleClearNotifications} 
                className="text-[10px] text-primary hover:text-primary-dark font-extrabold cursor-pointer focus:outline-none"
              >
                Mark Read
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif: any) => (
                  <div key={notif.id} className={`text-xs p-2.5 rounded-xl border flex gap-2 transition-all ${
                    notif.read 
                      ? 'bg-neutral-50/50 border-neutral-100 text-neutral-400 font-semibold' 
                      : 'bg-emerald-50/30 border-emerald-100 text-neutral-800 font-bold shadow-3xs'
                  }`}>
                    <span className="text-sm">🔔</span>
                    <div className="flex-1">
                      <p className={`text-[11px] leading-tight ${notif.read ? 'text-neutral-500 font-normal' : 'text-neutral-800 font-semibold'}`}>{notif.text}</p>
                      <p className="text-neutral-450 text-[8px] mt-0.5 font-medium">
                        {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-450 font-bold text-[10px] space-y-1">
                  <p className="text-lg">📭</p>
                  <p>No new notifications today</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* 3. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">

        {/* Announcements Notice Alert bar */}
        {announcements.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-250 rounded-2xl p-3 flex gap-2 items-center text-[11px] font-semibold text-yellow-800 shadow-3xs shrink-0 select-none">
            <span className="text-sm shrink-0">📢</span>
            <div className="overflow-hidden relative w-full h-4">
              <div className="absolute w-full animate-pulse whitespace-nowrap overflow-hidden text-ellipsis">
                {announcements[0]}
              </div>
            </div>
          </div>
        )}

        {/* Tab View Contents */}
        {activeTab === 'home' && (
          <>
            {/* Active Tiffin Plan Card (Glassmorphic) */}
            <div className="relative rounded-3xl p-5 overflow-hidden text-white shadow-md bg-gradient-to-br from-primary to-primary-dark select-none">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase w-fit tracking-wider">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300" /> Subscription Active
                  </div>
                  <h4 className="text-xl font-bold mt-2">{planName}</h4>
                  <p className="text-xs text-white/80 mt-0.5">Packaged Tiffin Catering Plan</p>
                </div>
                <span className="text-3xl leading-none">🍱</span>
              </div>

              <div className="mt-6 flex items-end justify-between relative z-10 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">Invoice Status</p>
                  <p className="text-xs font-bold mt-0.5">{billStatus === 'paid' ? 'Paid' : 'Unpaid Balance'}</p>
                </div>
                <button 
                  onClick={() => setActiveTab('billing')}
                  className="bg-white hover:bg-neutral-100 text-primary px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all focus:outline-none"
                >
                  Renew Plan
                </button>
              </div>
            </div>

            {/* Today's Food Preview */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                <h4 className="font-bold text-neutral-800 text-sm">Today's Menu ({todayDayName})</h4>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="text-xs font-extrabold text-primary hover:underline"
                >
                  View Week
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-50/50">
                  <span className="font-bold text-neutral-600 w-20">Breakfast</span>
                  <span className="text-neutral-550 flex-1 text-right">{todayMenu.breakfast}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50/50">
                  <span className="font-bold text-neutral-600 w-20">Lunch</span>
                  <span className="text-neutral-550 flex-1 text-right">{todayMenu.lunch}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-bold text-neutral-600 w-20">Dinner</span>
                  <span className="text-neutral-550 flex-1 text-right">{todayMenu.dinner}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Dedicated Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-neutral-800 px-1">Meal Attendance Tracker</h3>

            {/* Meal Attendance Checklist */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                <h4 className="font-bold text-neutral-800 text-sm">Today's Attendance Checklist</h4>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Breakfast */}
                <button
                  disabled={!meals.breakfast || meals.breakfastPendingSkip || isMealSkipCutoffExceeded('breakfast')}
                  onClick={() => setConfirmMealSkip('breakfast')}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                    !meals.breakfast
                      ? 'bg-red-50/50 border-red-100 text-red-500 font-semibold cursor-not-allowed'
                      : meals.breakfastPendingSkip
                        ? 'bg-amber-50/50 border-amber-200 text-amber-600 font-semibold cursor-not-allowed'
                        : isMealSkipCutoffExceeded('breakfast')
                          ? 'bg-neutral-50/70 border-neutral-200 text-neutral-550 font-semibold cursor-not-allowed'
                          : 'bg-emerald-50/45 border-emerald-200 text-emerald-800 font-bold hover:scale-[1.02] cursor-pointer'
                  }`}
                  title={
                    !meals.breakfast
                      ? 'Skip Request Approved'
                      : meals.breakfastPendingSkip
                        ? 'Skip Request Pending Approval'
                        : isMealSkipCutoffExceeded('breakfast')
                          ? 'Cut-off time (7:00 AM) has passed'
                          : 'Click to Apply for Absent'
                  }
                >
                  {/* Top-Right Indicator Mark */}
                  <div className="absolute top-1.5 right-1.5">
                    {!meals.breakfast ? (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">✗</span>
                    ) : meals.breakfastPendingSkip ? (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-extrabold shadow-sm animate-pulse">⏳</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">✓</span>
                    )}
                  </div>

                  <span className="text-xl">🍳</span>
                  <span className="text-xs mt-1 text-[11px] font-bold">Breakfast</span>
                  <span className="text-[8px] text-neutral-500 font-semibold mt-0.5">8:00 AM - 10:00 AM</span>
                  {isMealSkipCutoffExceeded('breakfast') ? (
                    <span className="text-[8px] text-red-500 font-bold mb-1">🔴 Skip Closed (7:00 AM)</span>
                  ) : (
                    <span className="text-[8px] text-emerald-600 font-bold mb-1">🟢 Skip Closes: 7:00 AM</span>
                  )}
                  {!meals.breakfast ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">❌ Absent</span>
                  ) : meals.breakfastPendingSkip ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold animate-pulse">⏳ Pending</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">✔️ Present</span>
                  )}
                </button>

                {/* Lunch */}
                <button
                  disabled={!meals.lunch || meals.lunchPendingSkip || isMealSkipCutoffExceeded('lunch')}
                  onClick={() => setConfirmMealSkip('lunch')}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                    !meals.lunch
                      ? 'bg-red-50/50 border-red-100 text-red-500 font-semibold cursor-not-allowed'
                      : meals.lunchPendingSkip
                        ? 'bg-amber-50/50 border-amber-200 text-amber-600 font-semibold cursor-not-allowed'
                        : isMealSkipCutoffExceeded('lunch')
                          ? 'bg-neutral-50/70 border-neutral-200 text-neutral-550 font-semibold cursor-not-allowed'
                          : 'bg-emerald-50/45 border-emerald-200 text-emerald-800 font-bold hover:scale-[1.02] cursor-pointer'
                  }`}
                  title={
                    !meals.lunch
                      ? 'Skip Request Approved'
                      : meals.lunchPendingSkip
                        ? 'Skip Request Pending Approval'
                        : isMealSkipCutoffExceeded('lunch')
                          ? 'Cut-off time (11:00 AM) has passed'
                          : 'Click to Apply for Absent'
                  }
                >
                  {/* Top-Right Indicator Mark */}
                  <div className="absolute top-1.5 right-1.5">
                    {!meals.lunch ? (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">✗</span>
                    ) : meals.lunchPendingSkip ? (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-extrabold shadow-sm animate-pulse">⏳</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">✓</span>
                    )}
                  </div>

                  <span className="text-xl">🍲</span>
                  <span className="text-xs mt-1 text-[11px] font-bold">Lunch</span>
                  <span className="text-[8px] text-neutral-500 font-semibold mt-0.5">1:00 PM - 3:00 PM</span>
                  {isMealSkipCutoffExceeded('lunch') ? (
                    <span className="text-[8px] text-red-500 font-bold mb-1">🔴 Skip Closed (11:00 AM)</span>
                  ) : (
                    <span className="text-[8px] text-emerald-600 font-bold mb-1">🟢 Skip Closes: 11:00 AM</span>
                  )}
                  {!meals.lunch ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">❌ Absent</span>
                  ) : meals.lunchPendingSkip ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold animate-pulse">⏳ Pending</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">✔️ Present</span>
                  )}
                </button>

                {/* Dinner */}
                <button
                  disabled={!meals.dinner || meals.dinnerPendingSkip || isMealSkipCutoffExceeded('dinner')}
                  onClick={() => setConfirmMealSkip('dinner')}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                    !meals.dinner
                      ? 'bg-red-50/50 border-red-100 text-red-500 font-semibold cursor-not-allowed'
                      : meals.dinnerPendingSkip
                        ? 'bg-amber-50/50 border-amber-200 text-amber-600 font-semibold cursor-not-allowed'
                        : isMealSkipCutoffExceeded('dinner')
                          ? 'bg-neutral-50/70 border-neutral-200 text-neutral-550 font-semibold cursor-not-allowed'
                          : 'bg-emerald-50/45 border-emerald-200 text-emerald-800 font-bold hover:scale-[1.02] cursor-pointer'
                  }`}
                  title={
                    !meals.dinner
                      ? 'Skip Request Approved'
                      : meals.dinnerPendingSkip
                        ? 'Skip Request Pending Approval'
                        : isMealSkipCutoffExceeded('dinner')
                          ? 'Cut-off time (6:00 PM) has passed'
                          : 'Click to Apply for Absent'
                  }
                >
                  {/* Top-Right Indicator Mark */}
                  <div className="absolute top-1.5 right-1.5">
                    {!meals.dinner ? (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">✗</span>
                    ) : meals.dinnerPendingSkip ? (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-extrabold shadow-sm animate-pulse">⏳</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">✓</span>
                    )}
                  </div>

                  <span className="text-xl">🍽️</span>
                  <span className="text-xs mt-1 text-[11px] font-bold">Dinner</span>
                  <span className="text-[8px] text-neutral-500 font-semibold mt-0.5">8:00 PM - 10:00 PM</span>
                  {isMealSkipCutoffExceeded('dinner') ? (
                    <span className="text-[8px] text-red-500 font-bold mb-1">🔴 Skip Closed (6:00 PM)</span>
                  ) : (
                    <span className="text-[8px] text-emerald-600 font-bold mb-1">🟢 Skip Closes: 6:00 PM</span>
                  )}
                  {!meals.dinner ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">❌ Absent</span>
                  ) : meals.dinnerPendingSkip ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold animate-pulse">⏳ Pending</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">✔️ Present</span>
                  )}
                </button>
              </div>
              <p className="text-[9px] text-neutral-400 text-center font-medium italic mt-1">
                *Attendance changes save instantly to the live database.
              </p>
            </div>

            {/* Attendance History Section */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                <h4 className="font-bold text-neutral-800 text-sm">Attendance History</h4>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase">Past 30 Days</span>
              </div>

              <div className="divide-y divide-neutral-50 max-h-60 overflow-y-auto no-scrollbar">
                {attendanceHistory.length > 0 ? (
                  attendanceHistory.map((record) => (
                    <div key={record._id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                      <div className="space-y-0.5 text-left">
                        <p className="text-neutral-800 font-bold">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[9px] text-neutral-400 font-medium">Daily Log Status</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-right">
                        {/* Breakfast Indicator */}
                        <span 
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            record.breakfast 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                          title="Breakfast"
                        >
                          🍳 {record.breakfast ? '✓' : '✗'}
                        </span>
                        {/* Lunch Indicator */}
                        <span 
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            record.lunch 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                          title="Lunch"
                        >
                          🍲 {record.lunch ? '✓' : '✗'}
                        </span>
                        {/* Dinner Indicator */}
                        <span 
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            record.dinner 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                          title="Dinner"
                        >
                          🍽️ {record.dinner ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-neutral-400 font-bold text-[10px] space-y-1">
                    <p className="text-lg">📭</p>
                    <p>No historical logs found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmMealSkip && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl border border-neutral-100 text-xs"
              >
                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-amber-500 mx-auto text-lg shadow-sm">
                  ⚠️
                </div>
                <div>
                  <h4 className="font-extrabold text-neutral-800 text-base capitalize">
                    Request Skip: {confirmMealSkip}
                  </h4>
                  <p className="text-neutral-500 leading-relaxed mt-1 font-semibold">
                    Are you sure you want to cancel today's {confirmMealSkip}? Once approved by the mess admin, you will be marked absent for this meal.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmMealSkip(null)}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-xl transition-all cursor-pointer focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRequestSkipMeal(confirmMealSkip);
                      setConfirmMealSkip(null);
                    }}
                    className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all cursor-pointer shadow-sm focus:outline-none"
                  >
                    Confirm Skip
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Weekly Menu View */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-neutral-800 px-1">Weekly Food Menu</h3>
            <div className="space-y-2">
              {weeklyMenu.map((item, index) => {
                const isExpanded = expandedDay === index;
                return (
                  <div key={item.day} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-3xs">
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : index)}
                      className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> {item.day}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 text-xs border-t border-neutral-50 space-y-2 bg-neutral-50/50">
                        <div className="grid grid-cols-3 gap-2 py-1">
                          <span className="font-bold text-neutral-500">🍳 Breakfast</span>
                          <span className="col-span-2 text-neutral-600 text-right">{item.breakfast}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-50">
                          <span className="font-bold text-neutral-500">🍲 Lunch</span>
                          <span className="col-span-2 text-neutral-600 text-right">{item.lunch}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-50">
                          <span className="font-bold text-neutral-500">🍽️ Dinner</span>
                          <span className="col-span-2 text-neutral-600 text-right">{item.dinner}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Billing & Payments View */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs text-neutral-400 font-semibold uppercase">Pending Monthly Bill</p>
              <h2 className="text-3xl font-extrabold text-neutral-800 mt-1">₹{billAmount}</h2>
              <p className="text-[10px] text-neutral-400 mt-1">Billing Period: July 1 - July 30, 2026</p>
              
              {billAmount > 0 ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="mt-5 w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-sm shadow-primary/20 transition-all"
                >
                  Pay Bill Now
                </button>
              ) : (
                <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl font-bold">
                  <CheckCircle className="w-4 h-4 fill-current text-white" /> All Bills Settled
                </div>
              )}
            </div>

            {/* Billing Transaction History */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm space-y-3">
              <h4 className="font-bold text-neutral-800 text-xs border-b border-neutral-50 pb-2">Invoice Transaction History</h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <div>
                    <p className="font-bold text-neutral-700">Current July 2026 Cycle</p>
                    <p className="text-[9px] text-neutral-400">Due by July 20, 2026</p>
                  </div>
                  <span className={`font-extrabold ${billStatus === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    ₹{billStatus === 'paid' ? '0 (Paid)' : `${billAmount} (Pending)`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-t border-neutral-50 pt-2">
                  <div>
                    <p className="font-bold text-neutral-700">June 2026 Subscription</p>
                    <p className="text-[9px] text-neutral-400">Settled on June 28, 2026</p>
                  </div>
                  <span className="text-emerald-600 font-extrabold">₹2,400 (Paid)</span>
                </div>
              </div>
            </div>

            {/* Standard Pricing Rates Guide */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm space-y-3">
              <h4 className="font-bold text-neutral-800 text-xs border-b border-neutral-50 pb-2">Standard Meal Plan Rates (₹/Month)</h4>
              
              <div className="grid grid-cols-2 gap-2.5 text-[10px] font-semibold">
                <div className="bg-neutral-50 border border-neutral-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-neutral-500 font-bold">Only Breakfast</span>
                  <span className="font-extrabold text-neutral-800">₹{pricingSettings.breakfastOnly}</span>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-neutral-500 font-bold">Only Lunch</span>
                  <span className="font-extrabold text-neutral-800">₹{pricingSettings.lunchOnly}</span>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-neutral-500 font-bold">Only Dinner</span>
                  <span className="font-extrabold text-neutral-800">₹{pricingSettings.dinnerOnly}</span>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-neutral-500 font-bold">Breakfast + Lunch</span>
                  <span className="font-extrabold text-neutral-800">₹{pricingSettings.breakfastLunch}</span>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-neutral-500 font-bold">Breakfast + Dinner</span>
                  <span className="font-extrabold text-neutral-800">₹{pricingSettings.breakfastDinner}</span>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-neutral-500 font-bold">Lunch + Dinner</span>
                  <span className="font-extrabold text-neutral-800">₹{pricingSettings.lunchDinner}</span>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-2.5 rounded-xl col-span-2 flex justify-between items-center">
                  <span className="text-neutral-500 font-bold">All Three Meals</span>
                  <span className="font-extrabold text-neutral-800">₹{pricingSettings.allMeals}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile & Feedback Dashboard Section */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Profile Information Card */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm space-y-5">
              <div className="flex flex-col items-center justify-center text-center space-y-2 py-2 border-b border-neutral-50 pb-4">
                {/* Uploadable Avatar */}
                <div className="relative cursor-pointer">
                  <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 rounded-full flex items-center justify-center font-extrabold text-2xl text-primary shadow-md overflow-hidden relative">
                    {profileImage ? (
                      <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      userName.split(' ').map(n => n[0]).join('').toUpperCase()
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-md transition-all active:scale-90 animate-pulse" title="Upload Photo">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h4 className="font-extrabold text-neutral-800 text-base">{userName}</h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {accountStatus === 'active' ? '✔️ Active' : '❌ Inactive'} Student
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-neutral-100/50 pb-2">
                  <span className="font-bold text-neutral-450">Email Address</span>
                  <span className="font-bold text-neutral-700">{userEmail || `${userName.toLowerCase().replace(/\s+/g, '')}@mess.com`}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-neutral-100/50 pb-2">
                  <span className="font-bold text-neutral-450">Room Number</span>
                  <span className="font-bold text-neutral-700">Room {roomNumber}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-neutral-100/50 pb-2">
                  <span className="font-bold text-neutral-450">Subscription Plan</span>
                  <span className="font-bold text-neutral-700">{planName}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 pb-0">
                  <span className="font-bold text-neutral-450">Billing Cycle</span>
                  <span className="font-bold text-neutral-700">Monthly Pre-paid</span>
                </div>
              </div>
            </div>

            {/* Daily Feedback Form */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm">
              <h3 className="text-base font-bold text-neutral-800 mb-2">Provide Daily Feedback</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Your feedback is written directly to the database and shared with the kitchen manager.
              </p>

              <AnimatePresence mode="wait">
                {!feedbackSubmitted ? (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center justify-center p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">Meal Rating</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                star <= feedbackRating 
                                  ? 'text-amber-400 fill-current' 
                                  : 'text-neutral-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-neutral-600 mt-2">
                        {feedbackRating === 5 && "⭐ Excellent - Chef did great!"}
                        {feedbackRating === 4 && "⭐ Very Good - Delicious!"}
                        {feedbackRating === 3 && "⭐ Good - Decent meal."}
                        {feedbackRating === 2 && "⭐ Average - Needs improvement."}
                        {feedbackRating === 1 && "⭐ Poor - Not satisfied."}
                      </span>
                    </div>

                    {/* Feedback Text Area */}
                    <div>
                      <label className="text-xs text-neutral-500 font-bold mb-1.5 block">Review Comments</label>
                      <textarea
                        rows={4}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        required
                        placeholder="Write your review here. E.g. Spices were perfect, bread was warm..."
                        className="w-full bg-neutral-50 border border-neutral-250 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-neutral-800 font-medium"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-sm shadow-primary/20 hover:bg-primary-dark flex items-center justify-center gap-2 transition-all focus:outline-none text-xs"
                    >
                      <Send className="w-4 h-4" /> Submit Feedback
                    </button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-3">
                      <Check className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-neutral-800 text-sm">Feedback Shared!</h4>
                    <p className="text-xs text-neutral-400 mt-1">Thank you for making our mess better.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

      </div>

      {/* 4. Checkout Payment Modal overlay */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50">
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="bg-white rounded-t-[36px] w-full p-6 space-y-4 max-h-[85%] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-800 text-base">Checkout Portal</h3>
                <button 
                  onClick={() => { setShowPaymentModal(false); setPaymentSuccess(false); }}
                  className="text-xs font-extrabold text-neutral-400 hover:text-neutral-600"
                >
                  Cancel
                </button>
              </div>

              {!paymentSuccess ? (
                <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
                  {/* Amount Block */}
                  <div className="bg-neutral-50 rounded-2xl p-4 flex justify-between items-center border border-neutral-100">
                    <div>
                      <p className="font-bold text-neutral-500">Subtotal Amount</p>
                      <p className="text-[10px] text-neutral-400">Includes monthly service charge</p>
                    </div>
                    <span className="text-2xl font-extrabold text-neutral-800">₹{billAmount}</span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <p className="font-bold text-neutral-600">Select Mode of Payment</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`py-3.5 border rounded-2xl flex flex-col items-center justify-center font-bold transition-all ${
                          paymentMethod === 'upi'
                            ? 'bg-primary-light/50 border-primary text-primary-dark'
                            : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="text-lg">📲</span>
                        <span className="text-[10px] mt-1">UPI QR Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-3.5 border rounded-2xl flex flex-col items-center justify-center font-bold transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-primary-light/50 border-primary text-primary-dark'
                            : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="text-lg">💳</span>
                        <span className="text-[10px] mt-1">Credit / Debit Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Contextual form fields */}
                  {paymentMethod === 'upi' ? (
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                      <p className="font-bold text-neutral-700">Scan QR Code to Pay</p>
                      {/* Simulating a QR Code block */}
                      <div className="w-32 h-32 bg-white border-4 border-neutral-300 rounded-lg flex items-center justify-center p-2">
                        <svg className="w-full h-full text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="2" y="2" width="6" height="6" />
                          <rect x="16" y="2" width="6" height="6" />
                          <rect x="2" y="16" width="6" height="6" />
                          <path d="M16 16h2v2h-2zm2 2h2v2h-2zm-2 2h2v-2h-2zm-4-4h2v2h-2zm0-4h2v2h-2zm4 0h2v2h-2zm-8 0h2v2H8zm0-4h2v2H8zm4 0h2v2h-2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-neutral-450 italic">VPA: messtiffin@okaxis</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase mb-1 block">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Abhay Chavan"
                          className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase mb-1 block">Card Number</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4321 8765 2341 0987"
                          className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase mb-1 block">Expiry Date</label>
                          <input
                            type="text"
                            required
                            placeholder="08/29"
                            className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase mb-1 block">CVV</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            placeholder="***"
                            className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit pay */}
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50 focus:outline-none"
                  >
                    {paymentLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" /> Secure Payment (₹{billAmount})
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-md">
                    <CheckCircle className="w-10 h-10 fill-current text-white" />
                  </div>
                  <h4 className="font-extrabold text-neutral-800 text-lg">Transaction Success!</h4>
                  <p className="text-xs text-neutral-400 max-w-[240px]">
                    Thank you. Your bill has been settled and database record updated.
                  </p>
                  <button
                    onClick={() => { setShowPaymentModal(false); setPaymentSuccess(false); }}
                    className="mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-sm hover:bg-primary-dark transition-all"
                  >
                    Close Window
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Mobile Tab Bottom Navigation Bar */}
      <div className="bg-white rounded-t-[32px] border-t border-neutral-150/70 pt-3 pb-6 px-4 flex justify-between shrink-0 z-30 select-none shadow-[0_-8px_20px_rgba(0,0,0,0.03)]">
        
        {/* Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none gap-1 ${
            activeTab === 'home' ? 'text-primary font-medium' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Home className="w-5 h-5" fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={2} />
          <span className="text-[11px] tracking-wide">Home</span>
        </button>

        {/* Menu Tab */}
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none gap-1 ${
            activeTab === 'menu' ? 'text-primary font-medium' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Utensils className="w-5 h-5" strokeWidth={2} />
          <span className="text-[11px] tracking-wide">Menu</span>
        </button>

        {/* Attendance Tab */}
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none gap-1 ${
            activeTab === 'attendance' ? 'text-primary font-medium' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Calendar className="w-5 h-5" strokeWidth={2} />
          <span className="text-[11px] tracking-wide">Attendance</span>
        </button>

        {/* Payments Tab */}
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none gap-1 ${
            activeTab === 'billing' ? 'text-primary font-medium' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <CreditCard className="w-5 h-5" strokeWidth={2} />
          <span className="text-[11px] tracking-wide">Payments</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none gap-1 ${
            activeTab === 'profile' ? 'text-primary font-medium' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <User className="w-5 h-5" strokeWidth={2} />
          <span className="text-[11px] tracking-wide">Profile</span>
        </button>

      </div>

    </div>
  );
}
