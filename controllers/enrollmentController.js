const Enrollment = require("../models/Enrollment");

// Create a new enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const enrollment = new Enrollment(req.body);
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all enrollments
exports.getEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("course")
      .populate("user");
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get enrollment by ID
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("course")
      .populate("user");
    if (!enrollment)
      return res.status(404).json({ error: "Enrollment not found" });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update enrollment
exports.updateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!enrollment)
      return res.status(404).json({ error: "Enrollment not found" });
    res.json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete enrollment
exports.deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment)
      return res.status(404).json({ error: "Enrollment not found" });
    res.json({ message: "Enrollment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
