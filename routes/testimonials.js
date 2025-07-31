const express = require("express");
const {
  getTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonialController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getTestimonials);
router.get("/:id", getTestimonial);

// Protected routes
router.use(protect);
router.post("/", createTestimonial);
router.put("/:id", updateTestimonial);
router.delete("/:id", deleteTestimonial);

module.exports = router;
