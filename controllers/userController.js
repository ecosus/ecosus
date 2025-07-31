const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select("-password");

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Delete all users
// @route   DELETE /api/users
// @access  Private/Admin
exports.deleteUsers = asyncHandler(async (req, res, next) => {
  // Prevent deleting the last admin user
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount <= 1) {
    return next(
      new ErrorResponse(
        "Cannot delete all users as it would remove the last admin",
        400
      )
    );
  }

  await User.deleteMany({});

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private/Admin
exports.blockUser = asyncHandler(async (req, res, next) => {
  const { reason, durationInHours } = req.body;

  if (!reason) {
    return next(new ErrorResponse("Please provide a reason for blocking", 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Prevent blocking admin users
  if (user.role === "admin") {
    return next(new ErrorResponse("Cannot block admin users", 403));
  }

  // Prevent blocking if user is already blocked
  if (user.isCurrentlyBlocked()) {
    return next(new ErrorResponse("User is already blocked", 400));
  }

  await user.blockUser(req.user.id, reason, durationInHours);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
        blockExpiresAt: user.blockExpiresAt,
        blockReason: user.blockReason,
      },
    },
  });
});

// @desc    Unblock a user
// @route   POST /api/users/:id/unblock
// @access  Private/Admin
exports.unblockUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Check if user is actually blocked
  if (!user.isCurrentlyBlocked()) {
    return next(new ErrorResponse("User is not blocked", 400));
  }

  await user.unblockUser();

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    },
  });
});

// @desc    Get user block history
// @route   GET /api/users/:id/block-history
// @access  Private/Admin
exports.getBlockHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select("blockHistory")
    .populate("blockHistory.blockedBy", "name email");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: user.blockHistory,
  });
});

// @desc    Update user level
// @route   PUT /api/users/:id/level
// @access  Private/Admin
exports.updateUserLevel = asyncHandler(async (req, res, next) => {
  const { level } = req.body;

  if (!level) {
    return next(new ErrorResponse("Please provide a level", 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Validate level against enum values
  const allowedLevels = ["beginner", "intermediate", "advanced"];
  if (!allowedLevels.includes(level)) {
    return next(new ErrorResponse("Invalid level provided", 400));
  }

  user.level = level;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      level: user.level,
    },
  });
});
