import { Settings } from '../models/Settings.js';

// @desc    Get pricing settings
// @route   GET /api/settings/pricing
// @access  Public
export const getPricing = async (req, res) => {
  try {
    let pricing = await Settings.findOne({ key: 'pricing' });
    if (!pricing) {
      pricing = await Settings.create({
        key: 'pricing',
        breakfastOnly: 800,
        lunchOnly: 1200,
        dinnerOnly: 1200,
        breakfastLunch: 1850,
        breakfastDinner: 1850,
        lunchDinner: 2200,
        allMeals: 2800
      });
    }
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update pricing settings
// @route   PUT /api/settings/pricing
// @access  Private/Admin
export const updatePricing = async (req, res) => {
  const { 
    breakfastOnly, 
    lunchOnly, 
    dinnerOnly, 
    breakfastLunch, 
    breakfastDinner, 
    lunchDinner, 
    allMeals 
  } = req.body;

  try {
    let pricing = await Settings.findOne({ key: 'pricing' });
    if (!pricing) {
      pricing = new Settings({ key: 'pricing' });
    }

    if (breakfastOnly !== undefined) pricing.breakfastOnly = Number(breakfastOnly);
    if (lunchOnly !== undefined) pricing.lunchOnly = Number(lunchOnly);
    if (dinnerOnly !== undefined) pricing.dinnerOnly = Number(dinnerOnly);
    if (breakfastLunch !== undefined) pricing.breakfastLunch = Number(breakfastLunch);
    if (breakfastDinner !== undefined) pricing.breakfastDinner = Number(breakfastDinner);
    if (lunchDinner !== undefined) pricing.lunchDinner = Number(lunchDinner);
    if (allMeals !== undefined) pricing.allMeals = Number(allMeals);

    await pricing.save();
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
