import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://mess-tiffen-mng-2.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access (JWT expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // If we are logged in, trigger reload to return to login screen
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: any) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  register: async (studentData: any) => {
    const response = await api.post('/api/auth/register', studentData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  updateProfile: async (profileData: { name?: string; profileImage?: string }) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },
  markNotificationsRead: async () => {
    const response = await api.put('/api/auth/notifications/read');
    return response.data;
  }
};

export const studentAPI = {
  getStudents: async () => {
    const response = await api.get('/api/students');
    return response.data;
  },
  addStudent: async (studentData: any) => {
    const response = await api.post('/api/students', studentData);
    return response.data;
  },
  updateStudent: async (id: string, studentData: any) => {
    const response = await api.put(`/api/students/${id}`, studentData);
    return response.data;
  },
  deleteStudent: async (id: string) => {
    const response = await api.delete(`/api/students/${id}`);
    return response.data;
  },
  payBill: async (id: string) => {
    const response = await api.put(`/api/students/${id}/pay`);
    return response.data;
  }
};

export const menuAPI = {
  getMenu: async () => {
    const response = await api.get('/api/menu');
    return response.data;
  },
  updateMenu: async (dayIndex: number, menuData: any) => {
    const response = await api.put(`/api/menu/${dayIndex}`, menuData);
    return response.data;
  }
};

export const attendanceAPI = {
  getToday: async () => {
    const response = await api.get('/api/attendance/today');
    return response.data;
  },
  toggleMeal: async (meal: 'breakfast' | 'lunch' | 'dinner') => {
    const response = await api.post('/api/attendance/toggle', { meal });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/api/attendance/summary');
    return response.data;
  },
  updateAttendance: async (payload: { userId: string; meal: 'breakfast' | 'lunch' | 'dinner'; status: boolean }) => {
    const response = await api.put('/api/attendance/update', payload);
    return response.data;
  },
  requestSkip: async (meal: 'breakfast' | 'lunch' | 'dinner') => {
    const response = await api.post('/api/attendance/request-skip', { meal });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/api/attendance/history');
    return response.data;
  }
};

export const feedbackAPI = {
  submitFeedback: async (feedbackData: { rating: number; comments: string }) => {
    const response = await api.post('/api/feedback', feedbackData);
    return response.data;
  },
  getFeedbacks: async () => {
    const response = await api.get('/api/feedback');
    return response.data;
  }
};

export const announcementAPI = {
  getAnnouncements: async () => {
    const response = await api.get('/api/announcements');
    return response.data;
  },
  publishAnnouncement: async (announcementData: { text: string }) => {
    const response = await api.post('/api/announcements', announcementData);
    return response.data;
  }
};

export const settingsAPI = {
  getPricing: async () => {
    const response = await api.get('/api/settings/pricing');
    return response.data;
  },
  updatePricing: async (pricingData: any) => {
    const response = await api.put('/api/settings/pricing', pricingData);
    return response.data;
  }
};

export default api;
