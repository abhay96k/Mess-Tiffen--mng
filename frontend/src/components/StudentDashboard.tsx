import { useState, useEffect } from 'react';
import { 
  Bell, LogOut, CheckCircle2, Circle, Calendar, 
  CreditCard, Send, Star, ChevronDown, ChevronUp, 
  ShieldAlert, Sparkles, Check, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { attendanceAPI, menuAPI, feedbackAPI, announcementAPI, studentAPI, authAPI } from '../services/api';

interface StudentDashboardProps {
  userName: string;
  userId: string;
  onLogout: () => void;
}

interface MealState {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export function StudentDashboard({ userName, userId, onLogout }: StudentDashboardProps) {
  // Navigation & UI states
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'billing' | 'feedback'>('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);
  const [loading, setLoading] = useState(true);

  // Core Data States
  const [meals, setMeals] = useState<MealState>({ breakfast: true, lunch: false, dinner: true });
  const [weeklyMenu, setWeeklyMenu] = useState<any[]>([]);
  const [billAmount, setBillAmount] = useState(2400);
  const [billStatus, setBillStatus] = useState('pending');
  const [planName, setPlanName] = useState('2-Meal Standard');
  const [announcements, setAnnouncements] = useState<string[]>(["📢 Welcome to Mess Tiffin Management System!"]);

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
      }

      // 2. Fetch today's meal attendance
      const attendance = await attendanceAPI.getToday();
      if (attendance.success && attendance.data) {
        setMeals({
          breakfast: attendance.data.breakfast,
          lunch: attendance.data.lunch,
          dinner: attendance.data.dinner
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

    } catch (error) {
      console.error('Error loading student dashboard details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleMeal = async (meal: keyof MealState) => {
    try {
      // Optimitistic UI update
      setMeals(prev => ({ ...prev, [meal]: !prev[meal] }));
      
      // Save in backend
      const res = await attendanceAPI.toggleMeal(meal);
      if (res.success && res.data) {
        setMeals({
          breakfast: res.data.breakfast,
          lunch: res.data.lunch,
          dinner: res.data.dinner
        });
      }
    } catch (error) {
      console.error('Error toggling attendance marker:', error);
      // Revert if error
      setMeals(prev => ({ ...prev, [meal]: !prev[meal] }));
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
          <div className="flex items-center gap-3">
            {/* Avatar badge with initials */}
            <div className="w-11 h-11 bg-white/20 rounded-full border border-white/30 flex items-center justify-center font-bold text-sm text-white shadow-xs">
              {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">Good Morning</p>
              <h3 className="text-base font-bold text-white leading-tight">{userName}</h3>
            </div>
          </div>
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
            className="absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 z-40"
          >
            <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-2">
              <h4 className="font-bold text-neutral-800 text-xs">Notifications</h4>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="text-[10px] text-neutral-400 hover:text-neutral-600 font-bold"
              >
                Clear
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
              <div className="text-xs p-2.5 rounded-xl bg-primary-light/50 border border-primary-light flex gap-2">
                <span className="text-base">🎉</span>
                <div>
                  <p className="font-bold text-primary-dark">Server Sync Active</p>
                  <p className="text-neutral-500 text-[10px] mt-0.5">Your student profile is now linked to a live MongoDB backend API.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        
        {/* Announcements Notice Alert bar */}
        <div className="bg-yellow-50 border border-yellow-250 rounded-2xl p-3 flex gap-2 items-center text-[11px] font-semibold text-yellow-800 shadow-3xs shrink-0 select-none">
          <span className="text-sm shrink-0">📢</span>
          <div className="overflow-hidden relative w-full h-4">
            <div className="absolute w-full animate-pulse whitespace-nowrap overflow-hidden text-ellipsis">
              {announcements[0]}
            </div>
          </div>
        </div>

        {/* Tab View Contents */}
        {activeTab === 'home' && (
          <>
            {/* Meal Attendance Checklist */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                <h4 className="font-bold text-neutral-800 text-sm">Today's Attendance</h4>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Breakfast */}
                <button
                  onClick={() => handleToggleMeal('breakfast')}
                  className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                    meals.breakfast 
                      ? 'bg-primary-light/45 border-primary text-primary-dark font-bold'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-400 font-semibold'
                  }`}
                >
                  <span className="text-xl">🍳</span>
                  <span className="text-xs mt-1 text-[11px]">Breakfast</span>
                  <span className="text-[9px] text-neutral-400 font-medium my-1">8AM - 10AM</span>
                  {meals.breakfast ? (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-current text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300" />
                  )}
                </button>

                {/* Lunch */}
                <button
                  onClick={() => handleToggleMeal('lunch')}
                  className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                    meals.lunch 
                      ? 'bg-primary-light/45 border-primary text-primary-dark font-bold'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-400 font-semibold'
                  }`}
                >
                  <span className="text-xl">🍲</span>
                  <span className="text-xs mt-1 text-[11px]">Lunch</span>
                  <span className="text-[9px] text-neutral-400 font-medium my-1">1PM - 3PM</span>
                  {meals.lunch ? (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-current text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300" />
                  )}
                </button>

                {/* Dinner */}
                <button
                  onClick={() => handleToggleMeal('dinner')}
                  className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                    meals.dinner 
                      ? 'bg-primary-light/45 border-primary text-primary-dark font-bold'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-400 font-semibold'
                  }`}
                >
                  <span className="text-xl">🍽️</span>
                  <span className="text-xs mt-1 text-[11px]">Dinner</span>
                  <span className="text-[9px] text-neutral-400 font-medium my-1">8PM - 10PM</span>
                  {meals.dinner ? (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-current text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300" />
                  )}
                </button>
              </div>
              <p className="text-[9px] text-neutral-400 text-center font-medium italic mt-1">
                *Attendance changes save instantly to the live database.
              </p>
            </div>

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
          </div>
        )}

        {/* Feedback Section */}
        {activeTab === 'feedback' && (
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
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-sm shadow-primary/20 hover:bg-primary-dark flex items-center justify-center gap-2 transition-all focus:outline-none"
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
                          placeholder="Alex Johnson"
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
      <div className="bg-white border-t border-neutral-200 py-2.5 px-4 flex justify-between shrink-0 z-30 select-none shadow-md">
        
        {/* Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'home' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Menu Tab */}
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'menu' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">📋</span>
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>

        {/* Billing Tab */}
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'billing' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">💳</span>
          <span className="text-[10px] mt-0.5">Billing</span>
        </button>

        {/* Feedback Tab */}
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'feedback' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">💬</span>
          <span className="text-[10px] mt-0.5">Feedback</span>
        </button>

      </div>

    </div>
  );
}
