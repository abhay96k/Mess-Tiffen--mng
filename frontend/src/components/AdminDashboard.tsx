import { useState, useEffect, useRef } from 'react';
import { 
  Users, CheckCircle2, Calendar, DollarSign, Megaphone,
  Plus, Trash, LogOut, Edit2, Save, 
  TrendingUp, Check, X, Star,
  Utensils, User, MoreVertical, LayoutGrid, Camera, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { studentAPI, menuAPI, feedbackAPI, attendanceAPI, authAPI, announcementAPI, settingsAPI } from '../services/api';

interface AdminDashboardProps {
  userName: string;
  onLogout: () => void;
}

interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  room: string;
  plan: string;
  status: 'active' | 'inactive';
  billAmount: number;
  billStatus: 'paid' | 'pending';
}

interface FeedbackRecord {
  id: string;
  studentName: string;
  rating: number;
  comments: string;
  date: string;
}

export function AdminDashboard({ userName, onLogout }: AdminDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'stats' | 'menu' | 'students' | 'attendance' | 'profile'>('stats');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dashboard indicators
  const [loading, setLoading] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [activePlans, setActivePlans] = useState(0);
  const [revenue, setRevenue] = useState(86400);

  // Profile modal states
  const [adminName, setAdminName] = useState(userName);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

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
            console.error('Error uploading admin profile image:', error);
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
        name: adminName,
        email: adminEmail,
        phone: adminPhone
      });
      if (res.success) {
        setEditSuccessMsg('Admin profile details updated!');
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

  // Student directory states
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', room: '', plan: '', status: 'active' as 'active' | 'inactive', billAmount: 2400, billStatus: 'pending' as 'paid' | 'pending' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', room: '', plan: '1st Breakfast', status: 'active' as 'active' | 'inactive', billAmount: 2400 });

  // Menu editor states
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [menuForm, setMenuForm] = useState({ breakfast: '', lunch: '', dinner: '' });
  const [weeklyMenu, setWeeklyMenu] = useState<any[]>([]);

  // Feedbacks reviews
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [adminConfirmSkip, setAdminConfirmSkip] = useState<{ 
    userId: string; 
    studentName: string; 
    meal: 'breakfast' | 'lunch' | 'dinner'; 
    currentStatus: string;
    isPendingSkip?: boolean;
  } | null>(null);

  // Announcements broadcasting states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);



  // Daily attendance log state
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  // Pricing configurations states
  const [pricingSettings, setPricingSettings] = useState({
    breakfastOnly: 800,
    lunchOnly: 1200,
    dinnerOnly: 1200,
    breakfastLunch: 1850,
    breakfastDinner: 1850,
    lunchDinner: 2200,
    allMeals: 2800
  });
  const [editingPricing, setEditingPricing] = useState(false);
  const [pricingForm, setPricingForm] = useState({ ...pricingSettings });

  const handleSavePricing = async () => {
    try {
      const res = await settingsAPI.updatePricing(pricingForm);
      if (res.success) {
        setPricingSettings(res.data);
        setEditingPricing(false);
      }
    } catch (error) {
      console.error('Error saving pricing details:', error);
    }
  };

  const calculatePriceFromPlan = (planString: string) => {
    const plans = planString ? planString.split(', ') : [];
    const hasBreakfast = plans.includes('1st Breakfast');
    const hasLunch = plans.includes('2nd Lunch');
    const hasDinner = plans.includes('3rd Dinner');

    if (hasBreakfast && hasLunch && hasDinner) return pricingSettings.allMeals;
    if (hasBreakfast && hasLunch) return pricingSettings.breakfastLunch;
    if (hasBreakfast && hasDinner) return pricingSettings.breakfastDinner;
    if (hasLunch && hasDinner) return pricingSettings.lunchDinner;
    if (hasBreakfast) return pricingSettings.breakfastOnly;
    if (hasLunch) return pricingSettings.lunchOnly;
    if (hasDinner) return pricingSettings.dinnerOnly;
    return 0;
  };

  const fetchAdminData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      const [
        studentRes,
        menuRes,
        feedbackRes,
        attendanceRes,
        profileRes,
        pricingRes
      ] = await Promise.allSettled([
        studentAPI.getStudents(),
        menuAPI.getMenu(),
        feedbackAPI.getFeedbacks(),
        attendanceAPI.getSummary(),
        authAPI.getMe(),
        settingsAPI.getPricing()
      ]);

      if (studentRes.status === 'fulfilled' && studentRes.value?.success) {
        const data = studentRes.value.data;
        setStudents(data);
        setStudentsCount(studentRes.value.count);
        
        const activeCount = data.filter((s: any) => s.status === 'active').length;
        setActivePlans(activeCount);

        const paidCount = data.filter((s: any) => s.billStatus === 'paid').length;
        setRevenue(paidCount * 2400);
      }

      if (menuRes.status === 'fulfilled' && menuRes.value?.success) {
        setWeeklyMenu(menuRes.value.data);
      }

      if (feedbackRes.status === 'fulfilled' && feedbackRes.value?.success) {
        setFeedbacks(feedbackRes.value.data);
      }

      if (attendanceRes.status === 'fulfilled' && attendanceRes.value?.success) {
        setAttendanceLogs(attendanceRes.value.data);
      }

      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        const profile = profileRes.value;
        setAdminEmail(profile.email || '');
        setProfileImage(profile.profileImage || '');
      }

      if (pricingRes.status === 'fulfilled' && pricingRes.value?.success) {
        setPricingSettings(pricingRes.value.data);
        setPricingForm(pricingRes.value.data);
      }

    } catch (error) {
      console.error('Error loading admin portal details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(true);

    const timer = setInterval(() => {
      fetchAdminData(false);
    }, 8000);

    return () => clearInterval(timer);
  }, [activeTab]); // Refetch when tabs switch to pull fresh records

  const handleEditStudent = (student: StudentRecord) => {
    setEditingStudentId(student._id);
    setEditForm({
      name: student.name,
      room: student.room,
      plan: student.plan,
      status: student.status,
      billAmount: student.billAmount,
      billStatus: student.billStatus
    });
  };

  const handleSaveStudent = async (id: string) => {
    try {
      const res = await studentAPI.updateStudent(id, editForm);
      if (res.success) {
        setEditingStudentId(null);
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error saving edited student details:', error);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await studentAPI.addStudent(newStudentForm);
      if (res.success) {
        setNewStudentForm({ name: '', room: '', plan: '1st Breakfast', status: 'active', billAmount: 2400 });
        setShowAddForm(false);
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error adding new student registration:', error);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      try {
        const res = await studentAPI.deleteStudent(id);
        if (res.success) {
          fetchAdminData();
        }
      } catch (error) {
        console.error('Error removing student:', error);
      }
    }
  };

  const handleEditMenu = (dayIndex: number) => {
    setEditingDayIndex(dayIndex);
    setMenuForm({
      breakfast: weeklyMenu[dayIndex].breakfast,
      lunch: weeklyMenu[dayIndex].lunch,
      dinner: weeklyMenu[dayIndex].dinner
    });
  };

  const handleSaveMenu = async (dayIndex: number) => {
    try {
      const res = await menuAPI.updateMenu(dayIndex, menuForm);
      if (res.success) {
        setEditingDayIndex(null);
        // Refresh local weekly menu list
        const updated = [...weeklyMenu];
        updated[dayIndex] = res.data;
        setWeeklyMenu(updated);
      }
    } catch (error) {
      console.error('Error updating daily menu options:', error);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await announcementAPI.publishAnnouncement({ text: announcementText });
      if (res.success) {
        setBroadcastMessage("Announcements broadcasted to all students!");
        setAnnouncementText('');
        setTimeout(() => {
          setBroadcastMessage(null);
          setShowAnnouncementModal(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error publishing alert message:', error);
    }
  };

  const handleToggleAttendance = async (userId: string, meal: 'breakfast' | 'lunch' | 'dinner', currentStatus: string) => {
    try {
      const nextStatus = currentStatus !== 'Present';
      
      // Optimistic local state update
      setAttendanceLogs(prev => prev.map(log => {
        if (log.userId === userId) {
          return {
            ...log,
            [meal]: nextStatus ? 'Present' : 'Absent'
          };
        }
        return log;
      }));

      // Send to Backend
      await attendanceAPI.updateAttendance({ userId, meal, status: nextStatus });
    } catch (error) {
      console.error('Error toggling student attendance:', error);
      // Fetch fresh stats to rollback state on backend errors
      const attendanceRes = await attendanceAPI.getSummary();
      if (attendanceRes.success) {
        setAttendanceLogs(attendanceRes.data);
      }
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-neutral-400 font-semibold tracking-wider">Syncing Operations Center...</span>
        </div>
      </div>
    );
  }

  // Attendance metrics summary calculation
  const totalAttendedToday = attendanceLogs.filter(l => l.breakfast === 'Present' || l.lunch === 'Present' || l.dinner === 'Present').length;
  const attendanceRate = studentsCount > 0 ? Math.round((totalAttendedToday / studentsCount) * 100) : 0;

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 relative overflow-hidden select-none">
      
      {/* Real World Executive Header Bar */}
      <div className="bg-white text-slate-900 pt-4 pb-4 px-5 rounded-b-[28px] shrink-0 z-30 border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            {/* Admin Avatar Button - Opens ONLY Profile Photo Modal */}
            <button
              onClick={() => setShowPhotoModal(true)}
              className="w-11 h-11 bg-slate-100 rounded-full border-2 border-emerald-500/40 flex items-center justify-center font-black text-sm text-slate-700 shadow-xs hover:scale-105 transition-transform overflow-hidden p-0.5 cursor-pointer focus:outline-none shrink-0"
              title="View & Update Profile Photo"
            >
              {profileImage ? (
                <img src={profileImage} alt={userName} className="w-full h-full object-cover rounded-full" />
              ) : (
                userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'
              )}
            </button>

            {/* Admin Name & Text - Navigates to Profile Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex flex-col text-left focus:outline-none hover:opacity-85 transition-opacity cursor-pointer"
              title="View Profile Details"
            >
              <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Portal Administrator</p>
              <h3 className="text-base font-black text-slate-900 leading-tight">{userName}</h3>
            </button>
          </div>

          <div className="relative">
            {/* Three Dot Options Menu Button */}
            <button 
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
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
                    <span>Admin Profile</span>
                  </button>

                  <button
                    onClick={() => { setShowEditProfileModal(true); setShowOptionsMenu(false); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 font-bold text-xs flex items-center gap-2.5 transition-all text-left text-slate-800 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-emerald-600" />
                    <span>Edit Profile Details</span>
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

        {/* Dashboard Quick Subtitle Bar */}
        <div className="mt-3.5 flex items-center justify-between text-xs bg-slate-50 rounded-2xl px-4 py-2 border border-slate-200/80 shadow-2xs">
          <span className="font-extrabold text-slate-700">💻 Mess Operations Center</span>
          <span className="flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span> Live Monitoring
          </span>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        
        {/* TAB 1: metrics/stats */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-neutral-100 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mb-2">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-405 font-semibold uppercase">Total Students</p>
                  <p className="text-2xl font-extrabold text-neutral-800">{studentsCount}</p>
                </div>
              </div>
              <div className="bg-white border border-neutral-100 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-405 font-semibold uppercase">Active Plans</p>
                  <p className="text-2xl font-extrabold text-neutral-800">{activePlans}</p>
                </div>
              </div>
              <div className="bg-white border border-neutral-100 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-405 font-semibold uppercase">Revenue</p>
                  <p className="text-xl font-extrabold text-neutral-800">₹{revenue.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white border border-neutral-100 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-405 font-semibold uppercase">Active Rate</p>
                  <p className="text-2xl font-extrabold text-neutral-800">{attendanceRate}%</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm space-y-2">
              <h4 className="font-bold text-neutral-800 text-xs pb-1 border-b border-neutral-50">Quick Actions Shortcut</h4>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="py-2.5 bg-neutral-105 rounded-xl font-bold hover:bg-neutral-200 text-neutral-700 text-center text-[10px] whitespace-nowrap"
                >
                  🍱 Edit Menu
                </button>
                <button 
                  onClick={() => setActiveTab('students')}
                  className="py-2.5 bg-neutral-105 rounded-xl font-bold hover:bg-neutral-200 text-neutral-700 text-center text-[10px] whitespace-nowrap"
                >
                  👥 Add Student
                </button>
                <button 
                  onClick={() => setShowAnnouncementModal(true)}
                  className="py-2.5 bg-neutral-105 rounded-xl font-bold hover:bg-neutral-200 text-neutral-700 text-center text-[10px] whitespace-nowrap"
                >
                  📣 Announcement
                </button>
              </div>
            </div>

            {/* Today's Meal Counts summary */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm space-y-3">
              <h4 className="font-bold text-neutral-800 text-xs pb-1 border-b border-neutral-50">Today's Headcount Summary</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-semibold">🍳 Breakfast (Served)</span>
                  <span className="font-bold text-neutral-800">
                    {attendanceLogs.filter(l => l.breakfast === 'Present').length} Students present
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-y border-neutral-50">
                  <span className="text-neutral-500 font-semibold">🍲 Lunch (Expected)</span>
                  <span className="font-bold text-neutral-800">
                    {attendanceLogs.filter(l => l.lunch === 'Present').length} Students present
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-semibold">🍽️ Dinner (Expected)</span>
                  <span className="font-bold text-neutral-800">
                    {attendanceLogs.filter(l => l.dinner === 'Present').length} Students present
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: menu editor */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-neutral-800 px-1">Daily Menu Manager</h3>
            <div className="space-y-3">
              {weeklyMenu.map((item, index) => {
                const isEditing = editingDayIndex === index;
                return (
                  <div key={item.day} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-3xs space-y-2">
                    <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                      <span className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" /> {item.day}
                      </span>
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveMenu(index)}
                          className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-xl flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save Changes
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditMenu(index)}
                          className="text-[10px] text-primary font-extrabold hover:underline flex items-center gap-0.5"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-3 pt-1 text-xs">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block mb-1">🍳 Breakfast Option</label>
                          <input
                            type="text"
                            value={menuForm.breakfast}
                            onChange={(e) => setMenuForm({ ...menuForm, breakfast: e.target.value })}
                            className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block mb-1">🍲 Lunch Option</label>
                          <input
                            type="text"
                            value={menuForm.lunch}
                            onChange={(e) => setMenuForm({ ...menuForm, lunch: e.target.value })}
                            className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block mb-1">🍽️ Dinner Option</label>
                          <input
                            type="text"
                            value={menuForm.dinner}
                            onChange={(e) => setMenuForm({ ...menuForm, dinner: e.target.value })}
                            className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-start gap-1">
                          <span className="font-bold text-neutral-500 shrink-0 w-16">Breakfast:</span>
                          <span className="text-neutral-600">{item.breakfast}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="font-bold text-neutral-500 shrink-0 w-16">Lunch:</span>
                          <span className="text-neutral-600">{item.lunch}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="font-bold text-neutral-500 shrink-0 w-16">Dinner:</span>
                          <span className="text-neutral-600">{item.dinner}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: students manager */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-neutral-800">Student & Plans Directory</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-[10px] bg-primary hover:bg-primary-dark text-white font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 focus:outline-none"
              >
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} Student
              </button>
            </div>

            {/* Add Student Card Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddStudent}
                  className="bg-white border border-neutral-100 p-4 rounded-2xl shadow-sm space-y-3 text-xs overflow-hidden"
                >
                  <h4 className="font-bold text-neutral-800">Register New Student</h4>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={newStudentForm.name}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                      placeholder="E.g. Vikram Chavan"
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block mb-1">Room No.</label>
                      <input
                        type="text"
                        required
                        value={newStudentForm.room}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, room: e.target.value })}
                        placeholder="E.g. 306"
                        className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block mb-1">Subscription Plans</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {['1st Breakfast', '2nd Lunch', '3rd Dinner'].map((planOption) => {
                          const currentPlans = newStudentForm.plan ? newStudentForm.plan.split(', ') : [];
                          const isActive = currentPlans.includes(planOption);
                          return (
                            <button
                              key={planOption}
                              type="button"
                              onClick={() => {
                                let updated: string[];
                                if (isActive) {
                                  updated = currentPlans.filter(p => p !== planOption);
                                } else {
                                  updated = [...currentPlans, planOption];
                                }
                                // Keep order: Breakfast, Lunch, Dinner
                                const ordered: string[] = [];
                                if (updated.includes('1st Breakfast')) ordered.push('1st Breakfast');
                                if (updated.includes('2nd Lunch')) ordered.push('2nd Lunch');
                                if (updated.includes('3rd Dinner')) ordered.push('3rd Dinner');

                                const newPrice = calculatePriceFromPlan(ordered.join(', '));
                                setNewStudentForm({ 
                                  ...newStudentForm, 
                                  plan: ordered.join(', ') || '1st Breakfast',
                                  billAmount: newPrice !== 0 ? newPrice : newStudentForm.billAmount
                                });
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-primary-light text-primary border-primary shadow-xs' 
                                  : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {isActive ? '✓ ' : '+ '} {planOption.replace(/^\d+\w+\s/, '')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block mb-1">Bill Amount (₹)</label>
                      <input
                        type="number"
                        required
                        value={newStudentForm.billAmount}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, billAmount: Number(e.target.value) })}
                        placeholder="E.g. 2400"
                        className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block mb-1">Plan Status</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewStudentForm({ ...newStudentForm, status: 'active' })}
                          className={`flex-1 py-2 border rounded-xl font-bold transition-all ${
                            newStudentForm.status === 'active' 
                              ? 'bg-primary-light/50 border-primary text-primary-dark' 
                              : 'border-neutral-200 text-neutral-500'
                          }`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewStudentForm({ ...newStudentForm, status: 'inactive' })}
                          className={`flex-1 py-2 border rounded-xl font-bold transition-all ${
                            newStudentForm.status === 'inactive' 
                              ? 'bg-red-50 border-red-200 text-red-700' 
                              : 'border-neutral-200 text-neutral-500'
                          }`}
                        >
                          Inactive
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-2 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" /> Save Registration
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Students List */}
            <div className="space-y-2">
              {students.map((student) => {
                const isEditing = editingStudentId === student._id;
                return (
                  <div key={student._id} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-3xs text-xs space-y-2">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">Student Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">Room</label>
                            <input
                              type="text"
                              value={editForm.room}
                              onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">Subscription Plans</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {['1st Breakfast', '2nd Lunch', '3rd Dinner'].map((planOption) => {
                                const currentPlans = editForm.plan ? editForm.plan.split(', ') : [];
                                const isActive = currentPlans.includes(planOption);
                                return (
                                  <button
                                    key={planOption}
                                    type="button"
                                    onClick={() => {
                                      let updated: string[];
                                      if (isActive) {
                                        updated = currentPlans.filter(p => p !== planOption);
                                      } else {
                                        updated = [...currentPlans, planOption];
                                      }
                                      const ordered: string[] = [];
                                      if (updated.includes('1st Breakfast')) ordered.push('1st Breakfast');
                                      if (updated.includes('2nd Lunch')) ordered.push('2nd Lunch');
                                      if (updated.includes('3rd Dinner')) ordered.push('3rd Dinner');

                                      const newPrice = calculatePriceFromPlan(ordered.join(', '));
                                      setEditForm({ 
                                        ...editForm, 
                                        plan: ordered.join(', ') || '1st Breakfast',
                                        billAmount: newPrice !== 0 ? newPrice : editForm.billAmount
                                      });
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                                      isActive 
                                        ? 'bg-primary-light text-primary border-primary shadow-3xs' 
                                        : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                                    }`}
                                  >
                                    {isActive ? '✓ ' : '+ '} {planOption.replace(/^\d+\w+\s/, '')}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                          <div>
                            <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">Bill Amount (₹)</label>
                            <input
                              type="number"
                              value={editForm.billAmount}
                              onChange={(e) => setEditForm({ ...editForm, billAmount: Number(e.target.value) })}
                              className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">Bill Status</label>
                            <select
                              value={editForm.billStatus}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'paid' | 'pending';
                                setEditForm({ 
                                  ...editForm, 
                                  billStatus: newStatus,
                                  billAmount: newStatus === 'paid' ? 0 : editForm.billAmount
                                });
                              }}
                              className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-bold text-neutral-600"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">Plan Status</label>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}
                              className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-bold text-neutral-600"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveStudent(student._id)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 shadow-3xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudentId(null)}
                            className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-neutral-800 text-sm">{student.name}</span>
                            <span className="text-[9px] text-neutral-450 font-bold">Room {student.room}</span>
                          </div>
                          <p className="text-neutral-500 font-medium mt-1">Plan: {student.plan}</p>
                          <div className="flex gap-1.5 mt-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              student.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {student.status === 'active' ? '✔️ Active' : '❌ Inactive'}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              student.billStatus === 'paid' ? 'bg-primary-light text-primary border border-primary/20' : 'bg-orange-50 text-orange-700 border border-orange-100'
                            }`}>
                              Bill: {student.billStatus === 'paid' ? '✔️ Paid' : '❌ Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors focus:outline-none"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student._id)}
                            className="p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors focus:outline-none"
                            title="Remove Student"
                          >
                            <Trash className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: attendance tracker */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-neutral-800">Daily Attendance Log</h3>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-neutral-50 px-4 py-3 font-bold text-neutral-500 border-b border-neutral-150">
                <span>Student</span>
                <span className="text-center">BFast</span>
                <span className="text-center">Lunch</span>
                <span className="text-center">Dinner</span>
              </div>
              <div className="divide-y divide-neutral-50">
                {attendanceLogs.map((log) => (
                  <div key={log.name} className="grid grid-cols-4 px-4 py-3 items-center">
                    <div>
                      <p className="font-bold text-neutral-800">{log.name}</p>
                      <p className="text-[9px] text-neutral-400 font-semibold">Room {log.room}</p>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setAdminConfirmSkip({ 
                            userId: log.userId, 
                            studentName: log.name, 
                            meal: 'breakfast', 
                            currentStatus: log.breakfast,
                            isPendingSkip: !!log.breakfastPendingSkip
                          });
                        }}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none ${
                          log.breakfastPendingSkip
                            ? 'bg-amber-500 text-white border border-amber-600 animate-pulse'
                            : log.breakfast === 'Present' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                        title={log.breakfastPendingSkip ? 'Click to Confirm Skip Request' : 'Click to toggle breakfast attendance'}
                      >
                        {log.breakfastPendingSkip ? '⚠️ Request' : log.breakfast === 'Present' ? '✔️ Present' : '❌ Absent'}
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setAdminConfirmSkip({ 
                            userId: log.userId, 
                            studentName: log.name, 
                            meal: 'lunch', 
                            currentStatus: log.lunch,
                            isPendingSkip: !!log.lunchPendingSkip
                          });
                        }}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none ${
                          log.lunchPendingSkip
                            ? 'bg-amber-500 text-white border border-amber-600 animate-pulse'
                            : log.lunch === 'Present' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                        title={log.lunchPendingSkip ? 'Click to Confirm Skip Request' : 'Click to toggle lunch attendance'}
                      >
                        {log.lunchPendingSkip ? '⚠️ Request' : log.lunch === 'Present' ? '✔️ Present' : '❌ Absent'}
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setAdminConfirmSkip({ 
                            userId: log.userId, 
                            studentName: log.name, 
                            meal: 'dinner', 
                            currentStatus: log.dinner,
                            isPendingSkip: !!log.dinnerPendingSkip
                          });
                        }}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none ${
                          log.dinnerPendingSkip
                            ? 'bg-amber-500 text-white border border-amber-600 animate-pulse'
                            : log.dinner === 'Present' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                        title={log.dinnerPendingSkip ? 'Click to Confirm Skip Request' : 'Click to toggle dinner attendance'}
                      >
                        {log.dinnerPendingSkip ? '⚠️ Request' : log.dinner === 'Present' ? '✔️ Present' : '❌ Absent'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Profile & Reviews Section */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Executive Admin Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-2 border-b border-slate-100 pb-5">
                {/* Uploadable Admin Avatar */}
                <label className="relative cursor-pointer group block" title="Tap to upload profile picture">
                  <div className="w-24 h-24 bg-emerald-50 border-2 border-emerald-500/30 rounded-full flex items-center justify-center font-black text-2xl text-emerald-700 shadow-md overflow-hidden relative group-hover:border-emerald-500 transition-all">
                    {isUploadingImage ? (
                      <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    ) : profileImage ? (
                      <img src={profileImage} alt={adminName} className="w-full h-full object-cover" />
                    ) : (
                      (adminName || 'Admin').split(' ').map(n => n ? n[0] : '').join('').toUpperCase()
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-md transition-all active:scale-95 group-hover:scale-110">
                    <Camera className="w-4 h-4" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">{adminName || userName}</h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-2xs mt-1 inline-block">
                    👑 System Administrator
                  </span>
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
                  <span className="font-black text-slate-900">{adminEmail || `${(adminName || userName).toLowerCase().replace(/\s+/g, '')}@mess.com`}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Mobile Number</span>
                  <span className="font-black text-slate-900">{adminPhone || 'Not Added'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Security Access</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Full Operator Permission</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Operational Scope</span>
                  <span className="font-black text-slate-900">Menu, Broadcaster, Billing, Student Audit</span>
                </div>
              </div>
            </div>

            {/* Standard Pricing Rates Settings */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-neutral-50 pb-2">
                <h3 className="text-base font-bold text-neutral-800">Meal Plan Pricing Rates (₹)</h3>
                {!editingPricing ? (
                  <button 
                    onClick={() => { setPricingForm({ ...pricingSettings }); setEditingPricing(true); }}
                    className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-dark transition-all cursor-pointer shadow-3xs"
                  >
                    Edit Pricing
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setEditingPricing(false)}
                      className="px-2.5 py-1 bg-neutral-105 text-neutral-600 text-[10px] font-bold rounded-lg hover:bg-neutral-200 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSavePricing}
                      className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all cursor-pointer shadow-3xs"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {!editingPricing ? (
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-neutral-500 font-bold">Only Breakfast</span>
                    <span className="font-extrabold text-neutral-800">₹{pricingSettings.breakfastOnly}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-neutral-500 font-bold">Only Lunch</span>
                    <span className="font-extrabold text-neutral-800">₹{pricingSettings.lunchOnly}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-neutral-500 font-bold">Only Dinner</span>
                    <span className="font-extrabold text-neutral-800">₹{pricingSettings.dinnerOnly}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-neutral-500 font-bold">Breakfast + Lunch</span>
                    <span className="font-extrabold text-neutral-800">₹{pricingSettings.breakfastLunch}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-neutral-500 font-bold">Breakfast + Dinner</span>
                    <span className="font-extrabold text-neutral-800">₹{pricingSettings.breakfastDinner}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-neutral-500 font-bold">Lunch + Dinner</span>
                    <span className="font-extrabold text-neutral-800">₹{pricingSettings.lunchDinner}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl col-span-2 flex justify-between items-center">
                    <span className="text-neutral-500 font-bold">All Three Meals</span>
                    <span className="font-extrabold text-neutral-800">₹{pricingSettings.allMeals}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Only Breakfast (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.breakfastOnly}
                      onChange={(e) => setPricingForm({ ...pricingForm, breakfastOnly: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Only Lunch (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.lunchOnly}
                      onChange={(e) => setPricingForm({ ...pricingForm, lunchOnly: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Only Dinner (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.dinnerOnly}
                      onChange={(e) => setPricingForm({ ...pricingForm, dinnerOnly: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Breakfast + Lunch (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.breakfastLunch}
                      onChange={(e) => setPricingForm({ ...pricingForm, breakfastLunch: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Breakfast + Dinner (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.breakfastDinner}
                      onChange={(e) => setPricingForm({ ...pricingForm, breakfastDinner: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Lunch + Dinner (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.lunchDinner}
                      onChange={(e) => setPricingForm({ ...pricingForm, lunchDinner: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">All Three Meals (Breakfast + Lunch + Dinner) (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.allMeals}
                      onChange={(e) => setPricingForm({ ...pricingForm, allMeals: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Student Reviews List Card */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-neutral-800 border-b border-neutral-50 pb-2">Student Reviews & Ratings</h3>
              
              <div className="space-y-3">
                {feedbacks.map((review) => (
                  <div key={review.id} className="bg-neutral-50 rounded-2xl border border-neutral-150 p-4 shadow-3xs text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <div>
                        <p className="font-bold text-neutral-800">{review.studentName}</p>
                        <p className="text-[9px] text-neutral-450 font-semibold">{review.date}</p>
                      </div>
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= review.rating 
                                ? 'text-amber-400 fill-current' 
                                : 'text-neutral-250'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-neutral-600 font-medium italic leading-relaxed">
                      "{review.comments}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Edit Admin Profile Details Modal */}
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
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Administrator Profile</h3>
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
                  <CheckCircle2 className="w-4 h-4" /> {editSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
                
                {/* Name */}
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Full Admin Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="E.g. Admin Manager"
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
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@mess.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Mobile / Contact Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="E.g. +91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

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
                        <span>Save Admin Profile</span>
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
        
        {/* 1. Overview / Home Tab */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center flex-1 py-1 focus:outline-none gap-1 cursor-pointer transition-colors ${
            activeTab === 'stats' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutGrid className="w-5 h-5" strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Overview</span>
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

        {/* 3. Center Elevated Floating Action Button (Students Manager) */}
        <div className="flex-1 flex justify-center -mt-7 z-20">
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => setActiveTab('students')}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_rgba(5,150,105,0.45)] border-[4px] border-white transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 ring-4 ring-emerald-500/20'
                : 'bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
            }`}
            title="Manage Students"
          >
            <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* 4. Attendance Logs Tab */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center justify-center flex-1 py-1 focus:outline-none gap-1 cursor-pointer transition-colors ${
            activeTab === 'attendance' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5" strokeWidth={activeTab === 'attendance' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Attendance</span>
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

      {/* Full-Screen Profile Photo Viewer & Camera Update Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-6 z-50 select-none">
            
            {/* Modal Top Header */}
            <div className="w-full flex items-center justify-between text-white pt-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-sm tracking-wide">Admin Profile Photo</span>
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
                      {userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
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
                <p className="text-xs text-slate-400 font-semibold">Portal Administrator</p>
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

      {/* Announcement Modal Popup overlay */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50">
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              className="bg-white rounded-t-[36px] w-full p-6 space-y-4 max-h-[80%] overflow-y-auto no-scrollbar relative z-50 text-xs"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-800 text-base">Broadcast Announcement</h3>
                <button 
                  onClick={() => setShowAnnouncementModal(false)}
                  className="text-xs font-extrabold text-neutral-455 hover:text-neutral-600"
                >
                  Cancel
                </button>
              </div>

              <p className="text-neutral-400 leading-relaxed font-semibold">
                Compose messages to broadcast to the sliding alert bar on student dashboard screens.
              </p>

              {broadcastMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> {broadcastMessage}
                </div>
              )}

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="text-[10px] text-neutral-450 font-bold block mb-1.5 uppercase tracking-wider">Notification Banner Text</label>
                  <textarea
                    rows={4}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    required
                    placeholder="E.g. Sunday special dinner: Shahi Paneer, Roti & Kheer is scheduled at 8:30 PM..."
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-neutral-800 font-medium"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark flex items-center justify-center gap-2 transition-all shadow-sm focus:outline-none"
                >
                  <Megaphone className="w-4 h-4" /> Broadcast Announcement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Confirm Skip / Override Modal */}
      <AnimatePresence>
        {adminConfirmSkip && (
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
                <h4 className="font-extrabold text-neutral-800 text-base">
                  {adminConfirmSkip.isPendingSkip ? 'Confirm Skip Request' : 'Confirm Attendance Change'}
                </h4>
                <p className="text-neutral-550 leading-relaxed mt-1 font-semibold">
                  {adminConfirmSkip.isPendingSkip ? (
                    <>Are you sure you want to approve the skip request for student <strong>{adminConfirmSkip.studentName}</strong>'s <strong>{adminConfirmSkip.meal}</strong> today? This will mark them absent.</>
                  ) : (
                    <>Are you sure you want to change student <strong>{adminConfirmSkip.studentName}</strong>'s <strong>{adminConfirmSkip.meal}</strong> attendance today from <strong>{adminConfirmSkip.currentStatus}</strong> to <strong>{adminConfirmSkip.currentStatus === 'Present' ? 'Absent' : 'Present'}</strong>?</>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminConfirmSkip(null)}
                  className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-250 text-neutral-600 font-bold rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleAttendance(adminConfirmSkip.userId, adminConfirmSkip.meal, adminConfirmSkip.currentStatus);
                    setAdminConfirmSkip(null);
                  }}
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all cursor-pointer shadow-sm focus:outline-none"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
