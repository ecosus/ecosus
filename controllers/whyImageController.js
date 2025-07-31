const WhyImage = require("../models/whyImage");

// Get all whyImage
exports.getWhyImage = async (req, res) => {
  try {
    const whyImage = await WhyImage.find();
    res.json({ success: true, data: whyImage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new whyImage
exports.createWhyImage = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }
    const whyImage = await WhyImage.create(req.body);
    res.status(201).json({ success: true, data: whyImage });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update a whyImage
exports.updateWhyImage = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }
    const whyImage = await WhyImage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!whyImage)
      return res
        .status(404)
        .json({ success: false, message: "whyImage not found" });
    res.json({ success: true, data: whyImage });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a whyImage
exports.deleteWhyImage = async (req, res) => {
  try {
    const whyImage = await WhyImage.findByIdAndDelete(req.params.id);
    if (!whyImage)
      return res
        .status(404)
        .json({ success: false, message: "whyImage not found" });
    res.json({ success: true, message: "whyImage deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
