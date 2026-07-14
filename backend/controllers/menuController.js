import { Menu } from '../models/Menu.js';

// Seed menu data structure
const initialMenu = [
  { day: "Monday", breakfast: "Idli, Sambar & Coconut Chutney", lunch: "Mix Veg Curry, Dal Tadka, Roti, Rice", dinner: "Aloo Gobhi, Chana Dal, Roti, Rice" },
  { day: "Tuesday", breakfast: "Aloo Paratha with Curd & Pickle", lunch: "Paneer Bhurji, Yellow Dal, Paratha, Rice", dinner: "Veg Kofta, Masoor Dal, Roti, Rice" },
  { day: "Wednesday", breakfast: "Poha with Sev & Tea", lunch: "Rajma Masala, Steamed Rice, Roti, Salad", dinner: "Kadhai Veg, Moong Dal, Roti, Rice" },
  { day: "Thursday", breakfast: "Bread Butter Toast & Omelette/Sprouts", lunch: "Chole Bhature, Boondi Raita, Onion salad", dinner: "Bhindi Fry, Dal Fry, Roti, Rice" },
  { day: "Friday", breakfast: "Uttapam with Tomato Chutney", lunch: "Veg Jalfrezi, Kadhi Pakora, Roti, Rice", dinner: "Egg Curry / Paneer Butter Masala, Roti, Rice" },
  { day: "Saturday", breakfast: "Methi Thepla with Ginger Tea", lunch: "Aloo Gajar Matar, Dal Makhani, Roti, Jeera Rice", dinner: "Sev Tamatar Sabji, Tuvar Dal, Roti, Rice" },
  { day: "Sunday", breakfast: "Puri Bhaji & Halwa", lunch: "Veg Biryani, Veg Raita, Salad, Papad", dinner: "Paneer Makhani, Butter Naan, Jeera Rice, Kheer" }
];

// @desc    Get weekly menu
// @route   GET /api/menu
// @access  Public
export const getMenu = async (req, res) => {
  try {
    let menu = await Menu.find({});
    
    // Auto-seed if menu is empty
    if (menu.length === 0) {
      await Menu.insertMany(initialMenu);
      menu = await Menu.find({});
    }

    // Sort to ensure Monday -> Sunday ordering
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    menu.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    res.json({ success: true, count: menu.length, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update menu for a day
// @route   PUT /api/menu/:dayIndex
// @access  Private/Admin
export const updateMenu = async (req, res) => {
  const { day, breakfast, lunch, dinner } = req.body;
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  try {
    const dayName = dayOrder[parseInt(req.params.dayIndex)];
    if (!dayName) {
      return res.status(400).json({ success: false, message: 'Invalid day index reference' });
    }

    let menuItem = await Menu.findOne({ day: dayName });
    
    if (!menuItem) {
      menuItem = new Menu({ day: dayName });
    }

    menuItem.breakfast = breakfast !== undefined ? breakfast : menuItem.breakfast;
    menuItem.lunch = lunch !== undefined ? lunch : menuItem.lunch;
    menuItem.dinner = dinner !== undefined ? dinner : menuItem.dinner;

    await menuItem.save();

    res.json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
