const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");

// Create a new enrollment
router.post("/", enrollmentController.createEnrollment);

// Get all enrollments
router.get("/", enrollmentController.getEnrollments);

// Get enrollment by ID
router.get("/:id", enrollmentController.getEnrollmentById);

// Update enrollment
router.put("/:id", enrollmentController.updateEnrollment);

// Delete enrollment
router.delete("/:id", enrollmentController.deleteEnrollment);

module.exports = router;
