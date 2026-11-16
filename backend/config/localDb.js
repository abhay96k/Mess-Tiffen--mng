import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultInitialData = {
  users: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "System Administrator",
      email: "admin@mess.com",
      // Bcrypt hash for 'password123'
      password: "$2a$10$IfQ7ZrgFbotJb7bIlvAi8.Wx9VoVMEaX/C17GZrGJ6ce7R5h6vR6m",
      role: "admin",
      room: "",
      plan: "Admin",
      status: "active",
      bill_amount: 0,
      bill_status: "paid",
      profile_image: "",
      college_name: "",
      pg_name: "",
      phone: "9876543210",
      dietary_preference: "Veg",
      notifications: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Abhay Chavan",
      email: "student@mess.com",
      password: "$2a$10$IfQ7ZrgFbotJb7bIlvAi8.Wx9VoVMEaX/C17GZrGJ6ce7R5h6vR6m",
      role: "student",
      room: "304",
      plan: "2-Meal Standard",
      status: "active",
      bill_amount: 2400,
      bill_status: "pending",
      profile_image: "",
      college_name: "COEP Tech University",
      pg_name: "Green View PG",
      phone: "9876543211",
      dietary_preference: "Veg",
      notifications: [
        {
          id: "notif-welcome-1",
          text: "Welcome to Mess Tiffin! You are currently on the 2-Meal Standard plan.",
          createdAt: new Date().toISOString(),
          read: false
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  menu: [
    { id: "menu-1", day: "Monday", breakfast: "Idli, Sambar & Coconut Chutney", lunch: "Mix Veg Curry, Dal Tadka, Roti, Rice", dinner: "Aloo Gobhi, Chana Dal, Roti, Rice", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "menu-2", day: "Tuesday", breakfast: "Aloo Paratha with Curd & Pickle", lunch: "Paneer Bhurji, Yellow Dal, Paratha, Rice", dinner: "Veg Kofta, Masoor Dal, Roti, Rice", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "menu-3", day: "Wednesday", breakfast: "Poha with Sev & Tea", lunch: "Rajma Masala, Steamed Rice, Roti, Salad", dinner: "Kadhai Veg, Moong Dal, Roti, Rice", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "menu-4", day: "Thursday", breakfast: "Bread Butter Toast & Omelette/Sprouts", lunch: "Chole Bhature, Boondi Raita, Onion salad", dinner: "Bhindi Fry, Dal Fry, Roti, Rice", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "menu-5", day: "Friday", breakfast: "Uttapam with Tomato Chutney", lunch: "Veg Jalfrezi, Kadhi Pakora, Roti, Rice", dinner: "Egg Curry / Paneer Butter Masala, Roti, Rice", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "menu-6", day: "Saturday", breakfast: "Methi Thepla with Ginger Tea", lunch: "Aloo Gajar Matar, Dal Makhani, Roti, Jeera Rice", dinner: "Sev Tamatar Sabji, Tuvar Dal, Roti, Rice", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "menu-7", day: "Sunday", breakfast: "Puri Bhaji & Halwa", lunch: "Veg Biryani, Veg Raita, Salad, Papad", dinner: "Paneer Makhani, Butter Naan, Jeera Rice, Kheer", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  attendance: [
    {
      id: "att-today-1",
      user_id: "22222222-2222-2222-2222-222222222222",
      date: new Date().toISOString().split('T')[0],
      breakfast: true,
      breakfast_pending_skip: false,
      lunch: false,
      lunch_pending_skip: false,
      dinner: true,
      dinner_pending_skip: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  feedbacks: [
    {
      id: "feed-1",
      student_id: "22222222-2222-2222-2222-222222222222",
      student_name: "Abhay Chavan",
      rating: 5,
      comments: "Great food quality and clean mess facility. Prompt service!",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  announcements: [
    {
      id: "ann-1",
      text: "Welcome to Mess Tiffin! Sunday special feast will include Veg Biryani & Paneer Makhani.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  settings: [
    {
      id: "sett-1",
      key: "pricing",
      breakfast_only: 800,
      lunch_only: 1200,
      dinner_only: 1200,
      breakfast_lunch: 1850,
      breakfast_dinner: 1850,
      lunch_dinner: 2200,
      all_meals: 2800,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  holidays: []
};

// Load or initialize DB state
let dbData = null;

const loadDB = () => {
  if (dbData) return dbData;
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbData = JSON.parse(content);
      // Ensure all standard tables exist
      for (const [key, val] of Object.entries(defaultInitialData)) {
        if (!Array.isArray(dbData[key])) {
          dbData[key] = [...val];
        }
      }
    } else {
      dbData = JSON.parse(JSON.stringify(defaultInitialData));
      saveDB();
    }
  } catch (err) {
    console.error('Error reading local DB, resetting to defaults:', err.message);
    dbData = JSON.parse(JSON.stringify(defaultInitialData));
    saveDB();
  }
  return dbData;
};

const saveDB = () => {
  try {
    if (!dbData) return;
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist local DB to file:', err.message);
  }
};

// Property getter helper that supports snake_case and camelCase interchangeably
const getProp = (obj, key) => {
  if (!obj || typeof obj !== 'object') return undefined;
  if (obj[key] !== undefined) return obj[key];
  // Convert snake_case to camelCase
  const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  if (obj[camelKey] !== undefined) return obj[camelKey];
  // Convert camelCase to snake_case
  const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  if (obj[snakeKey] !== undefined) return obj[snakeKey];
  return undefined;
};

class LocalQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderFields = [];
    this.limitCount = null;
    this.action = 'select'; // 'select' | 'insert' | 'update' | 'delete' | 'upsert'
    this.payload = null;
    this.upsertOptions = {};
    this.selectFields = '*';
    this.selectOptions = {};
    this.isSingle = false;
    this.isMaybeSingle = false;
  }

  select(fields = '*', options = {}) {
    this.selectFields = fields;
    this.selectOptions = options;
    return this;
  }

  eq(field, value) {
    this.filters.push({ field, value });
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.orderFields.push({ field, ascending });
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(items) {
    this.action = 'insert';
    this.payload = Array.isArray(items) ? items : [items];
    return this;
  }

  update(payload) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  upsert(items, options = {}) {
    this.action = 'upsert';
    this.payload = Array.isArray(items) ? items : [items];
    this.upsertOptions = options;
    return this;
  }

  async execute() {
    const db = loadDB();
    if (!Array.isArray(db[this.table])) {
      db[this.table] = [];
    }
    const tableData = db[this.table];

    // Helper to test if item matches all .eq() filters
    const matchesFilters = (item) => {
      return this.filters.every(({ field, value }) => {
        const val = getProp(item, field);
        if (typeof val === 'string' && typeof value === 'string') {
          return val.toLowerCase() === value.toLowerCase();
        }
        return val == value;
      });
    };

    let resultData = null;
    let resultCount = null;

    if (this.action === 'insert') {
      const inserted = this.payload.map(item => {
        const row = {
          ...item,
          id: item.id || item._id || crypto.randomUUID(),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        tableData.push(row);
        return row;
      });
      saveDB();
      resultData = inserted;
    } else if (this.action === 'upsert') {
      const conflictKeys = (this.upsertOptions.onConflict || 'id')
        .split(',')
        .map(k => k.trim());

      const upserted = this.payload.map(item => {
        const existingIndex = tableData.findIndex(row => {
          return conflictKeys.every(k => {
            const rowVal = getProp(row, k);
            const itemVal = getProp(item, k);
            return rowVal !== undefined && itemVal !== undefined && rowVal == itemVal;
          });
        });

        if (existingIndex >= 0) {
          const updated = {
            ...tableData[existingIndex],
            ...item,
            updated_at: new Date().toISOString()
          };
          tableData[existingIndex] = updated;
          return updated;
        } else {
          const row = {
            ...item,
            id: item.id || item._id || crypto.randomUUID(),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          tableData.push(row);
          return row;
        }
      });
      saveDB();
      resultData = upserted;
    } else if (this.action === 'update') {
      const updated = [];
      tableData.forEach(row => {
        if (matchesFilters(row)) {
          Object.assign(row, this.payload, { updated_at: new Date().toISOString() });
          updated.push(row);
        }
      });
      saveDB();
      resultData = updated;
    } else if (this.action === 'delete') {
      const initialLen = tableData.length;
      db[this.table] = tableData.filter(row => !matchesFilters(row));
      if (db[this.table].length !== initialLen) {
        saveDB();
      }
      return { data: null, error: null };
    } else {
      // 'select'
      let matching = tableData.filter(matchesFilters);
      resultCount = matching.length;

      // Ordering
      for (const { field, ascending } of this.orderFields) {
        matching.sort((a, b) => {
          const va = getProp(a, field) || '';
          const vb = getProp(b, field) || '';
          if (va < vb) return ascending ? -1 : 1;
          if (va > vb) return ascending ? 1 : -1;
          return 0;
        });
      }

      // Limit
      if (this.limitCount !== null) {
        matching = matching.slice(0, this.limitCount);
      }

      resultData = matching;
    }

    // Format single/maybeSingle responses
    if (this.isSingle) {
      const first = Array.isArray(resultData) ? resultData[0] : resultData;
      if (!first) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: first, error: null };
    }

    if (this.isMaybeSingle) {
      const first = Array.isArray(resultData) ? resultData[0] : resultData;
      return { data: first || null, error: null };
    }

    if (this.selectOptions.head && this.selectOptions.count === 'exact') {
      return { data: null, count: resultCount, error: null };
    }

    return { data: resultData, count: resultCount, error: null };
  }

  // Make query builder awaitable
  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

export const localDB = {
  from(table) {
    return new LocalQueryBuilder(table);
  }
};
