const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public routes
router.get("/search", courseController.searchCourses);
router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourse);

// Feedback routes (public, but optionalProtect middleware runs if token present)
router.post("/:id/feedback", courseController.addFeedback);
router.get("/:id/feedback", courseController.getFeedback);

// Admin feedback routes
router.delete(
  "/:id/feedback/:feedbackId",
  protect,
  authorize("admin"),
  courseController.deleteFeedback
);

// Protected routes
router.use(protect);

// Admin routes
router.post(
  "/",
  authorize("admin"),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "avatar", maxCount: 1 }, 
  ]),
  courseController.createCourse
);
router.put(
  "/:id",
  authorize("admin"),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]),
  courseController.updateCourse
);
router.delete("/:id", authorize("admin"), courseController.deleteCourse);

module.exports = router;
