import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Calendar, DollarSign, Megaphone, 
  Plus, Trash, LogOut, Edit2, Save, 
  TrendingUp, Check, X, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { studentAPI, menuAPI, feedbackAPI, announcementAPI, attendanceAPI } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'stats' | 'menu' | 'students' | 'attendance' | 'announcements' | 'feedback'>('stats');
  
  // Dashboard indicators
  const [loading, setLoading] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [activePlans, setActivePlans] = useState(0);
  const [revenue, setRevenue] = useState(86400);

  // Student directory states
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', room: '', plan: '', status: 'active' as 'active' | 'inactive' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', room: '', plan: '2-Meal Standard', status: 'active' as 'active' | 'inactive' });

  // Menu editor states
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [menuForm, setMenuForm] = useState({ breakfast: '', lunch: '', dinner: '' });
  const [weeklyMenu, setWeeklyMenu] = useState<any[]>([]);

  // Feedbacks reviews
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);

  // Announcements broadcasting states
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  // Daily attendance log state
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Students
      const studentRes = await studentAPI.getStudents();
      if (studentRes.success) {
        setStudents(studentRes.data);
        setStudentsCount(studentRes.count);
        
        // Count active
        const activeCount = studentRes.data.filter((s: any) => s.status === 'active').length;
        setActivePlans(activeCount);

        // Sum collected revenue (assuming paid students paid 2400)
        const paidCount = studentRes.data.filter((s: any) => s.billStatus === 'paid').length;
        setRevenue(paidCount * 2400);
      }

      // 2. Fetch Weekly Menu
      const menuRes = await menuAPI.getMenu();
      if (menuRes.success) {
        setWeeklyMenu(menuRes.data);
      }

      // 3. Fetch Feedbacks
      const feedbackRes = await feedbackAPI.getFeedbacks();
      if (feedbackRes.success) {
        setFeedbacks(feedbackRes.data);
      }

      // 4. Fetch Attendance Summary
      const attendanceRes = await attendanceAPI.getSummary();
      if (attendanceRes.success) {
        setAttendanceLogs(attendanceRes.data);
      }

    } catch (error) {
      console.error('Error loading admin portal details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]); // Refetch when tabs switch to pull fresh records

  const handleEditStudent = (student: StudentRecord) => {
    setEditingStudentId(student._id);
    setEditForm({
      name: student.name,
      room: student.room,
      plan: student.plan,
      status: student.status
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
        setNewStudentForm({ name: '', room: '', plan: '2-Meal Standard', status: 'active' });
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
        }, 3000);
      }
    } catch (error) {
      console.error('Error publishing alert message:', error);
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
      
      {/* Header Bar */}
      <div className="bg-primary text-white pt-4 pb-6 px-5 rounded-b-[32px] shadow-lg shrink-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-full border border-white/30 flex items-center justify-center font-bold text-sm text-white shadow-xs">
              AD
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">Portal Admin</p>
              <h3 className="text-base font-bold text-white leading-tight">{userName}</h3>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 bg-white/10 rounded-full border border-white/20 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-all focus:outline-none"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Dashboard Quick Subtitle Bar */}
        <div className="mt-4 flex items-center justify-between text-xs bg-white/10 rounded-xl px-3 py-2 border border-white/15">
          <span className="font-semibold text-white/90">💻 Mess Operations Center</span>
          <span className="flex items-center gap-1 text-[10px] bg-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white">
            Live Monitoring
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
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="py-2.5 bg-neutral-105 rounded-xl font-bold hover:bg-neutral-200 text-neutral-700 text-center"
                >
                  📝 Edit Food Menu
                </button>
                <button 
                  onClick={() => setActiveTab('students')}
                  className="py-2.5 bg-neutral-105 rounded-xl font-bold hover:bg-neutral-200 text-neutral-700 text-center"
                >
                  ➕ Add New Student
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
                      <label className="text-[10px] text-neutral-400 font-bold block mb-1">Plan Duration</label>
                      <select
                        value={newStudentForm.plan}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, plan: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 font-bold text-neutral-600"
                      >
                        <option value="1-Meal Basic">1-Meal Basic</option>
                        <option value="2-Meal Standard">2-Meal Standard</option>
                        <option value="3-Meal Premium">3-Meal Premium</option>
                      </select>
                    </div>
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
                            <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">Subscription Plan</label>
                            <select
                              value={editForm.plan}
                              onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-250 rounded-xl p-2 font-bold text-neutral-600"
                            >
                              <option value="1-Meal Basic">1-Meal Basic</option>
                              <option value="2-Meal Standard">2-Meal Standard</option>
                              <option value="3-Meal Premium">3-Meal Premium</option>
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
                              {student.status}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              student.billStatus === 'paid' ? 'bg-primary-light text-primary border border-primary/20' : 'bg-orange-50 text-orange-700 border border-orange-100'
                            }`}>
                              Bill: {student.billStatus}
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
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        log.breakfast === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
                      }`}>{log.breakfast}</span>
                    </div>
                    <div className="text-center">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        log.lunch === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
                      }`}>{log.lunch}</span>
                    </div>
                    <div className="text-center">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        log.dinner === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
                      }`}>{log.dinner}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: announcements publisher */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-neutral-800 px-1">Broadcast Portal</h3>
            
            <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm space-y-4 text-xs">
              <p className="text-neutral-400 leading-relaxed font-semibold">
                Compose messages to broadcast to the sliding alert bar on student dashboard screens.
              </p>

              {broadcastMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> {broadcastMessage}
                </div>
              )}

              <form onSubmit={handleBroadcast} className="space-y-3">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1.5">Notification Banner Text</label>
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
            </div>
          </div>
        )}

        {/* TAB 6: feedback reviews */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-neutral-800 px-1">Student Reviews & Ratings</h3>
            
            <div className="space-y-3">
              {feedbacks.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-3xs text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                    <div>
                      <p className="font-bold text-neutral-800">{review.studentName}</p>
                      <p className="text-[9px] text-neutral-400 font-semibold">{review.date}</p>
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
                  <p className="text-neutral-650 font-medium italic leading-relaxed">
                    "{review.comments}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Admin Tab Bottom Navigation Bar */}
      <div className="bg-white border-t border-neutral-200 py-2.5 px-4 flex justify-between shrink-0 z-30 select-none shadow-md">
        
        {/* Stats Tab */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'stats' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">📊</span>
          <span className="text-[10px] mt-0.5">Overview</span>
        </button>

        {/* Menu Tab */}
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'menu' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">🍱</span>
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>

        {/* Students Tab */}
        <button
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'students' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">👥</span>
          <span className="text-[10px] mt-0.5">Students</span>
        </button>

        {/* Attendance Tab */}
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'attendance' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">📅</span>
          <span className="text-[10px] mt-0.5">Attendance</span>
        </button>

        {/* Announcements Tab */}
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex flex-col items-center justify-center flex-1 transition-all focus:outline-none ${
            activeTab === 'announcements' ? 'text-primary font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <span className="text-lg">📣</span>
          <span className="text-[10px] mt-0.5">Broadcast</span>
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
