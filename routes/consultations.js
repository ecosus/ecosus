const express = require("express");
const {
  getConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getUserConsultations,
  updateConsultationStatus,
  getStatusHistory,
} = require("../controllers/consultationController");
const { protect, authorize } = require("../middleware/auth");
const { consultationValidation } = require("../middleware/validation");

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.get("/my-consultations", getUserConsultations);
router.post("/", consultationValidation.create, createConsultation);

// Admin specific routes (must come before parameterized routes)
router.get("/", authorize("admin"), getConsultations);

// Admin management routes (must come before parameterized routes)
router.patch(
  "/:id/status",
  authorize("admin"),
  consultationValidation.status,
  updateConsultationStatus
);


// Status management routes
router.get("/:id/status-history", authorize("admin"), getStatusHistory);

// Shared routes (accessible to both users and admins)
router.get("/:id", getConsultation);
router.put("/:id", consultationValidation.update, updateConsultation);
router.delete("/:id", deleteConsultation);

module.exports = router;
