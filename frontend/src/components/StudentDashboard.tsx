import { useState, useEffect, useRef } from 'react';
import { 
  Bell, LogOut, Calendar, 
  CreditCard, Send, Star, ChevronDown, ChevronUp, 
  ShieldAlert, Sparkles, Check, CheckCircle,
  Utensils, User, MapPin, MoreVertical, LayoutGrid, Camera, X,
  Edit2, Phone, GraduationCap, Building, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { attendanceAPI, menuAPI, feedbackAPI, studentAPI, authAPI, settingsAPI } from '../services/api';
import { NearbyMessMap } from './NearbyMessMap';

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
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'attendance' | 'billing' | 'profile' | 'nearby'>('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasNotification, setHasNotification] = useState(true);
  const [loading, setLoading] = useState(true);

  // User Profile states
  const [studentName, setStudentName] = useState(userName);
  const [billAmount, setBillAmount] = useState(2400);
  const [billStatus, setBillStatus] = useState('pending');
  const [planName, setPlanName] = useState('2-Meal Standard');
  const [userEmail, setUserEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('304');
  const [collegeName, setCollegeName] = useState('');
  const [pgName, setPgName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dietaryPref, setDietaryPref] = useState('Veg');
  const [accountStatus, setAccountStatus] = useState('active');
  const [profileImage, setProfileImage] = useState('');

  // Edit Profile Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

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

  const [pricingSettings, setPricingSettings] = useState({
    breakfastOnly: 800,
    lunchOnly: 1200,
    dinnerOnly: 1200,
    breakfastLunch: 1850,
    breakfastDinner: 1850,
    lunchDinner: 2200,
    allMeals: 2800
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        authAPI.updateProfile({ profileImage: compressedBase64 })
          .then((res) => {
            if (res.success && res.profileImage) {
              setProfileImage(res.profileImage);
            }
          })
          .catch((error) => {
            console.error('Error uploading profile picture:', error);
            alert('Failed to upload profile image. Please try another image.');
          })
          .finally(() => {
            setIsUploadingImage(false);
          });
      };
    };

    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileLoading(true);
    setEditSuccessMsg('');
    try {
      const res = await authAPI.updateProfile({
        name: studentName,
        email: userEmail,
        room: roomNumber,
        collegeName,
        pgName,
        phone: phoneNumber,
        dietaryPreference: dietaryPref
      });
      if (res.success) {
        setEditSuccessMsg('Profile details updated successfully!');
        setTimeout(() => {
          setEditSuccessMsg('');
          setShowEditProfileModal(false);
        }, 1200);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditProfileLoading(false);
    }
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

  // Fetch all user information from API in parallel
  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      
      const [
        profileRes,
        attendanceRes,
        menuRes,
        historyRes,
        pricingRes
      ] = await Promise.allSettled([
        authAPI.getMe(),
        attendanceAPI.getToday(),
        menuAPI.getMenu(),
        attendanceAPI.getHistory(),
        settingsAPI.getPricing()
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        const profile = profileRes.value;
        if (profile.name) setStudentName(profile.name);
        setBillAmount(profile.billAmount);
        setBillStatus(profile.billStatus);
        setPlanName(profile.plan);
        setUserEmail(profile.email || '');
        setRoomNumber(profile.room || '304');
        setCollegeName(profile.collegeName || '');
        setPgName(profile.pgName || '');
        setPhoneNumber(profile.phone || '');
        setDietaryPref(profile.dietaryPreference || 'Veg');
        setAccountStatus(profile.status || 'active');
        setProfileImage(profile.profileImage || '');
        setNotifications(profile.notifications || []);
        const hasUnread = (profile.notifications || []).some((n: any) => !n.read);
        setHasNotification(hasUnread);
      }

      if (attendanceRes.status === 'fulfilled' && attendanceRes.value?.success && attendanceRes.value.data) {
        const attendance = attendanceRes.value.data;
        setMeals({
          breakfast: attendance.breakfast,
          breakfastPendingSkip: attendance.breakfastPendingSkip || false,
          lunch: attendance.lunch,
          lunchPendingSkip: attendance.lunchPendingSkip || false,
          dinner: attendance.dinner,
          dinnerPendingSkip: attendance.dinnerPendingSkip || false
        });
      }

      if (menuRes.status === 'fulfilled' && menuRes.value?.success) {
        setWeeklyMenu(menuRes.value.data);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.success) {
        setAttendanceHistory(historyRes.value.data);
      }

      if (pricingRes.status === 'fulfilled' && pricingRes.value?.success) {
        setPricingSettings(pricingRes.value.data);
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
  const todayMenu = (weeklyMenu || []).find(m => m && m.day === todayDayName) || {
    breakfast: 'Idli Sambar',
    lunch: 'Roti, Veg Curry, Rice, Dal',
    dinner: 'Roti, Dal Tadka, Rice'
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 text-slate-900 relative overflow-hidden select-none">
      
      {/* 1. Real World Executive Header Bar */}
      <div className="bg-white text-slate-900 pt-4 pb-4 px-5 rounded-b-[28px] shrink-0 z-30 border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            {/* Avatar badge button - Opens ONLY Profile Photo Modal */}
            <button
              onClick={() => setShowPhotoModal(true)}
              className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-sm text-slate-700 shadow-xs hover:scale-105 transition-transform overflow-hidden p-0.5 border-2 border-emerald-500/40 cursor-pointer focus:outline-none shrink-0"
              title="View & Update Profile Photo"
            >
              {profileImage ? (
                <img src={profileImage} alt={userName} className="w-full h-full object-cover rounded-full" />
              ) : (
                (userName || 'Student').split(' ').map(n => n ? n[0] : '').join('').toUpperCase()
              )}
            </button>

            {/* User Name & Welcome Text - Navigates to Profile Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex flex-col text-left focus:outline-none hover:opacity-85 transition-opacity cursor-pointer"
              title="View Profile Details"
            >
              <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Welcome Back</p>
              <h3 className="text-base font-black text-slate-900 leading-tight">{userName}</h3>
            </button>
          </div>
          
          <div className="flex items-center gap-2 relative">
            {/* Notification Bell with Ringing Animation */}
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={() => { setShowNotifications(!showNotifications); setHasNotification(false); setShowOptionsMenu(false); }}
              className="relative p-2.5 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 rounded-full border border-slate-200/80 transition-all focus:outline-none shadow-2xs cursor-pointer"
              title="Notifications"
            >
              <motion.div
                animate={showNotifications ? { rotate: [0, -28, 28, -18, 18, -8, 8, 0], scale: [1, 1.25, 1] } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
              >
                <Bell className="w-4.5 h-4.5 text-slate-700" />
              </motion.div>
              {hasNotification && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              )}
            </motion.button>

            {/* Three Dot Options Menu Button */}
            <button 
              onClick={() => { setShowOptionsMenu(!showOptionsMenu); setShowNotifications(false); }}
              className="p-2.5 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 rounded-full border border-slate-200/80 transition-all focus:outline-none shadow-2xs cursor-pointer"
              title="Options"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>

            {/* Options Menu Dropdown */}
            <AnimatePresence>
              {showOptionsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-12 w-48 bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-200 p-2 z-50 overflow-hidden space-y-1"
                >
                  <button
                    onClick={() => { setActiveTab('profile'); setShowOptionsMenu(false); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 font-bold text-xs flex items-center gap-2.5 transition-all text-left text-slate-800 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => { setShowEditProfileModal(true); setShowOptionsMenu(false); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 font-bold text-xs flex items-center gap-2.5 transition-all text-left text-slate-800 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-emerald-600" />
                    <span>Edit Profile Details</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('nearby'); setShowOptionsMenu(false); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 font-bold text-xs flex items-center gap-2.5 transition-all text-left text-slate-800 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Nearby Explorer</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={onLogout}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 font-bold text-xs flex items-center gap-2.5 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Logout Account</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Room & Subscription Floating Pill Info */}
        <div className="mt-3.5 flex items-center justify-between text-xs bg-slate-50 rounded-2xl px-4 py-2 border border-slate-200/80 shadow-2xs">
          <span className="font-extrabold text-slate-700">📍 Room {roomNumber} (Student)</span>
          <span className="flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span> {accountStatus} Plan
          </span>
        </div>
      </div>

      {/* 2. Notification Overlay Box */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -15 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="absolute top-20 left-4 right-4 bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 p-4 z-45"
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
              {(notifications || []).length > 0 ? (
                (notifications || []).map((notif: any) => (
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

        {/* Tab View Contents */}
        {activeTab === 'home' && (
          <>
            {/* Active Tiffin Subscription Card (Real-World App Style) */}
            <div className="relative rounded-3xl p-6 overflow-hidden text-white shadow-md bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border border-emerald-500/30 select-none">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 bg-white/20 border border-white/30 px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit tracking-wider text-white shadow-xs">
                    <Sparkles className="w-3 h-3 text-yellow-300" /> Active Subscription
                  </div>
                  <h4 className="text-2xl font-black mt-3 tracking-tight text-white">{planName}</h4>
                  <p className="text-xs text-white/80 font-medium mt-0.5">Daily Packaged Catering</p>
                </div>
                <span className="text-4xl leading-none">🍱</span>
              </div>

              <div className="mt-6 flex items-end justify-between relative z-10 border-t border-white/20 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-extrabold">Bill Status</p>
                  <p className="text-xs font-black mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${billStatus === 'paid' ? 'bg-emerald-300' : 'bg-amber-300'}`}></span>
                    <span>{billStatus === 'paid' ? 'Paid & Active' : 'Payment Due'}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('billing')}
                  className="bg-white hover:bg-slate-100 text-emerald-800 px-4 py-2 rounded-full text-xs font-black shadow-sm transition-all focus:outline-none cursor-pointer"
                >
                  Manage Plan
                </button>
              </div>
            </div>

            {/* Today's Food Preview (Real-World App Card) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <span>🍽️</span> Today's Menu ({todayDayName})
                </h4>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer"
                >
                  Full Week →
                </button>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100/60">
                  <span className="font-bold text-slate-500 w-24">Breakfast</span>
                  <span className="text-slate-900 font-extrabold flex-1 text-right">{todayMenu.breakfast}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100/60">
                  <span className="font-bold text-slate-500 w-24">Lunch</span>
                  <span className="text-slate-900 font-extrabold flex-1 text-right">{todayMenu.lunch}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="font-bold text-slate-500 w-24">Dinner</span>
                  <span className="text-slate-900 font-extrabold flex-1 text-right">{todayMenu.dinner}</span>
                </div>
              </div>
            </div>

            {/* Nearby Mess Quick Explorer Card */}
            <div 
              onClick={() => setActiveTab('nearby')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 hover:border-emerald-500/40 hover:shadow-md transition-all select-none cursor-pointer group flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <MapPin className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-extrabold text-sm text-slate-900 tracking-tight">Nearby Mess Explorer</h5>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shrink-0">
                      Interactive Map
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">Explore 4+ mess facilities & daily thalis near you</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-3.5 py-2 rounded-full border border-emerald-200/80 transition-all shrink-0 flex items-center gap-1 shadow-2xs">
                Open Map →
              </span>
            </div>
          </>
        )}

        {/* Dedicated Nearby Mess Map Tab */}
        {activeTab === 'nearby' && <NearbyMessMap />}

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
                {(attendanceHistory || []).length > 0 ? (
                  (attendanceHistory || []).map((record) => (
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
              {(weeklyMenu || []).map((item, index) => {
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
            {/* Executive Profile Information Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-2 border-b border-slate-100 pb-5">
                {/* Uploadable Avatar */}
                <label className="relative cursor-pointer group block" title="Tap to upload profile picture">
                  <div className="w-24 h-24 bg-emerald-50 border-2 border-emerald-500/30 rounded-full flex items-center justify-center font-black text-2xl text-emerald-700 shadow-md overflow-hidden relative group-hover:border-emerald-500 transition-all">
                    {isUploadingImage ? (
                      <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    ) : profileImage ? (
                      <img src={profileImage} alt={studentName} className="w-full h-full object-cover" />
                    ) : (
                      (studentName || 'Student').split(' ').map(n => n ? n[0] : '').join('').toUpperCase()
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-md transition-all active:scale-95 group-hover:scale-110">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">{studentName || userName}</h4>
                </div>

                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-full text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile Details</span>
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-800 font-semibold">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Email Address</span>
                  <span className="font-black text-slate-900">{userEmail || `${(studentName || userName).toLowerCase().replace(/\s+/g, '')}@mess.com`}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Mobile Number</span>
                  <span className="font-black text-slate-900">{phoneNumber || 'Not Added'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">College / Institute</span>
                  <span className="font-black text-slate-900">{collegeName || 'Not Added'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Room / PG Name</span>
                  <span className="font-black text-slate-900">{pgName ? `${pgName} (Room ${roomNumber})` : `Room ${roomNumber}`}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Dietary Preference</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">🥗 {dietaryPref}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Subscription Plan</span>
                  <span className="font-black text-slate-900">{planName}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Billing Status</span>
                  <span className={`font-black px-2.5 py-0.5 rounded-full border text-[11px] ${
                    billStatus === 'paid' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {billStatus === 'paid' ? '✔️ Paid & Active' : '⌛ Payment Due'}
                  </span>
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

      {/* Full-Screen Profile Photo Viewer & Camera Update Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-6 z-50 select-none">
            
            {/* Modal Top Header */}
            <div className="w-full flex items-center justify-between text-white pt-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-sm tracking-wide">Profile Photo</span>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo View Display Box */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex flex-col items-center justify-center space-y-4 my-auto max-w-sm w-full"
            >
              <div className="relative group">
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-emerald-500/80 shadow-[0_0_50px_rgba(5,150,105,0.4)] bg-slate-900 flex items-center justify-center relative">
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-3 text-emerald-400">
                      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
                      <span className="text-xs font-bold">Uploading new photo...</span>
                    </div>
                  ) : profileImage ? (
                    <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl font-black text-emerald-400">
                      {(userName || 'Student').split(' ').map(n => n ? n[0] : '').join('').toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Camera Button overlay on photo */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full shadow-[0_8px_25px_rgba(16,185,129,0.5)] border-4 border-slate-950 transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center"
                  title="Change Profile Photo"
                >
                  <Camera className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>

              <div className="text-center text-white space-y-1">
                <h3 className="text-xl font-black">{userName}</h3>
                <p className="text-xs text-slate-400 font-semibold">Student Account • Room {roomNumber}</p>
              </div>
            </motion.div>

            {/* Hidden File Input Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Bottom Action bar */}
            <div className="w-full max-w-xs space-y-2 pb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Camera className="w-4.5 h-4.5" />
                <span>Upload / Change Photo</span>
              </button>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Details Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 select-none">
            <motion.div
              initial={{ y: 250, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 250, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-t-[32px] sm:rounded-3xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar relative shadow-2xl border border-slate-200 text-slate-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Student Profile</h3>
                </div>
                <button 
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all focus:outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-bold animate-pulse">
                  <CheckCircle className="w-4 h-4" /> {editSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
                
                {/* Profile Photo Uploader Preview */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-lg">
                      {isUploadingImage ? (
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : profileImage ? (
                        <img src={profileImage} alt={studentName} className="w-full h-full object-cover" />
                      ) : (
                        (studentName || 'Student').split(' ').map(n => n ? n[0] : '').join('').toUpperCase()
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full border-2 border-white shadow-md cursor-pointer"
                      title="Upload New Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Profile Picture</h5>
                    <p className="text-[10px] text-slate-500 font-medium">Click camera icon to upload new photo</p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Full Student Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="E.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Email Address</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="student@mess.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="E.g. +91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* College / University Name */}
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">College / Institute Name</label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="E.g. IIT Bombay / COEP Tech University"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* PG Name & Room Number Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">PG / Hostel Name</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={pgName}
                        onChange={(e) => setPgName(e.target.value)}
                        placeholder="E.g. Sai Royal PG"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Room Number</label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="E.g. 304"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Dietary Preference */}
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Dietary Preference</label>
                  <select
                    value={dietaryPref}
                    onChange={(e) => setDietaryPref(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Pure Veg">🥗 Pure Vegetarian</option>
                    <option value="Non-Veg">🍗 Non-Vegetarian</option>
                    <option value="Jain Food">🌿 Jain Thali</option>
                    <option value="Eggitarian">🍳 Eggitarian</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editProfileLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {editProfileLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-World Reference Navigation Bar with Elevated Center Floating Button */}
      <div className="bg-white border-t border-slate-200/80 pt-2 pb-5 px-3 flex justify-between items-center shrink-0 z-40 select-none shadow-[0_-8px_30px_rgba(0,0,0,0.06)] relative">
        
        {/* 1. Home Tab */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 focus:outline-none gap-1 cursor-pointer transition-colors ${
            activeTab === 'home' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutGrid className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Home</span>
        </motion.button>

        {/* 2. Menu Tab */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center flex-1 py-1 focus:outline-none gap-1 cursor-pointer transition-colors ${
            activeTab === 'menu' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Utensils className="w-5 h-5" strokeWidth={activeTab === 'menu' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Menu</span>
        </motion.button>

        {/* 3. Center Elevated Floating Action Button (Attendance) */}
        <div className="flex-1 flex justify-center -mt-7 z-20">
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => setActiveTab('attendance')}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_rgba(5,150,105,0.45)] border-[4px] border-white transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 ring-4 ring-emerald-500/20'
                : 'bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
            }`}
            title="Attendance Pass"
          >
            <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* 4. Payments Tab */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center justify-center flex-1 py-1 focus:outline-none gap-1 cursor-pointer transition-colors relative ${
            activeTab === 'billing' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <CreditCard className="w-5 h-5" strokeWidth={activeTab === 'billing' ? 2.5 : 2} />
            {billStatus !== 'paid' && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                !
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Payments</span>
        </motion.button>

        {/* 5. Profile Tab */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 focus:outline-none gap-1 cursor-pointer transition-colors ${
            activeTab === 'profile' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-5 h-5" strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Profile</span>
        </motion.button>

      </div>

    </div>
  );
}
