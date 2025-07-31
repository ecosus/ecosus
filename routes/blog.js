const express = require("express");
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getPopularBlogs,
  getBlogsByCategory,
  searchBlogs,
  getAllBlogs,
  addFeedback,
  getFeedback,
  deleteFeedback,
} = require("../controllers/blogController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { blogValidation } = require("../middleware/validation");

const router = express.Router();

// Public routes
router.get("/", getBlogs);
router.get("/popular", getPopularBlogs);
router.get("/category/:category", getBlogsByCategory);
router.get("/search", searchBlogs);

// Feedback routes (public, now using optionalProtect)
router.post("/:id/feedback", addFeedback);
router.get("/:id/feedback", getFeedback);

// Admin feedback routes
router.delete(
  "/:id/feedback/:feedbackId",
  protect,
  authorize("admin"),
  deleteFeedback
);

// Get single blog (general :id route)
router.get("/:id", getBlog);

// Protected routes
router.use(protect);

// Admin routes
router.use(authorize("admin"));
router.get("/admin/all", getAllBlogs);
router.post(
  "/",
  upload.single("coverImage"),
  blogValidation.create,
  createBlog
);
router.put(
  "/:id",
  upload.single("coverImage"),
  blogValidation.create,
  updateBlog
);
router.delete("/:id", deleteBlog);

module.exports = router;
