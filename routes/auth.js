const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { authValidation } = require("../middleware/validation");

const router = express.Router();

// Public routes
router.post("/register", authValidation.register, register);
router.post("/login", authValidation.login, login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

// Protected routes
router.use(protect); // Apply protect middleware to all routes below
router.post("/logout", logout);
router.get("/me", getMe);
router.put("/updatedetails", protect, upload.single("avatar"), updateDetails);
router.put("/updatepassword", updatePassword);

module.exports = router;
