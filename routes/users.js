const express = require("express");
const {
  getUsers,
  deleteUsers,
  blockUser,
  unblockUser,
  getBlockHistory,
  updateUserLevel,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);
// Restrict to admin role
router.use(authorize("admin"));

router.route("/").get(getUsers).delete(deleteUsers);

// Block/Unblock routes
router.post("/:id/block", blockUser);
router.post("/:id/unblock", authorize("admin"), unblockUser);
router.put("/:id/level", authorize("admin"), updateUserLevel);
router.get("/:id/block-history", authorize("admin"), getBlockHistory);

module.exports = router;
