const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const upload = require("../middleware/upload");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/", projectController.getProjects);
router.get("/:projectSlug", projectController.getProject);

// Admin routes
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("images", 10), // up to 10 images
  projectController.createProject
);
router.put(
  "/:projectSlug",
  protect,
  authorize("admin"),
  upload.array("images", 10),
  projectController.updateProject
);
router.delete(
  "/:projectSlug",
  protect,
  authorize("admin"),
  projectController.deleteProject
);

module.exports = router;
