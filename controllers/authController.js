const User = require("../models/User");
const { validationResult } = require("express-validator");
const {
  generateToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const { sendEmail, emailTemplates } = require("../utils/sendEmail");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user (password will be hashed automatically by pre-save middleware)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      avatar: "public/images/default.png",
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user and explicitly select password and block-related fields
    const user = await User.findOne({ email }).select(
      "+password +isBlocked +blockExpiresAt +blockReason"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      const blockInfo = {
        reason: user.blockReason || "No reason provided",
        expiresAt: user.blockExpiresAt
          ? new Date(user.blockExpiresAt).toISOString()
          : "permanent",
      };

      return res.status(403).json({
        success: false,
        message: "Account is blocked",
        blockInfo,
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.refreshToken = null;
    await user.save();

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "blockHistory.blockedBy",
      "name email"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        blockHistory: user.blockHistory,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    };

    // Handle avatar upload
    if (req.file) {
      const avatar = req.file;

      // Create the avatar path for database storage - ensure consistent format
      fieldsToUpdate.avatar = `uploads/${avatar.filename}`;

      // Get current user to check for old avatar
      const currentUser = await User.findById(req.user.id);

      // Delete old avatar if it exists and is not the default
      if (
        currentUser &&
        currentUser.avatar &&
        currentUser.avatar !== "public/images/default.png" &&
        currentUser.avatar !== "/public/images/default.png" &&
        !currentUser.avatar.includes("default")
      ) {
        // Handle both absolute and relative paths
        let oldAvatarPath;
        if (currentUser.avatar.startsWith("uploads/")) {
          oldAvatarPath = path.join(__dirname, "..", currentUser.avatar);
        } else {
          oldAvatarPath = currentUser.avatar;
        }

        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
          } catch (deleteError) {
            console.error("❌ Error deleting old avatar:", deleteError);
          }
        } else {
        }
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const responseData = {
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error("❌ Update details error:", error);
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Set new password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Generate new tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      token,
      refreshToken,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email address",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "There is no user with that email",
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.passwordReset(resetUrl),
      });

      res.json({
        success: true,
        message: "Password reset email sent",
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);

      // Reset the fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide new password",
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password (will be hashed by pre-save middleware)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      token,
      refreshToken,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    next(error);
  }
};


