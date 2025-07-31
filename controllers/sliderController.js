const Slider = require("../models/Slider");

// Get all sliders
exports.getSliders = async (req, res) => {
  try {
    const sliders = await Slider.find({ lang: req.query.lang || "ar" }).sort({
      order: 1,
    });
    res.json({ success: true, data: sliders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new slider
exports.createSlider = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }
    const slider = await Slider.create(req.body);
    res.status(201).json({ success: true, data: slider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update a slider
exports.updateSlider = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }
    const slider = await Slider.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!slider)
      return res
        .status(404)
        .json({ success: false, message: "Slider not found" });
    res.json({ success: true, data: slider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a slider
exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findByIdAndDelete(req.params.id);
    if (!slider)
      return res
        .status(404)
        .json({ success: false, message: "Slider not found" });
    res.json({ success: true, message: "Slider deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
