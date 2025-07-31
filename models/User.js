const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]*$/, "Please add a valid phone number"],
    },
    avatar: {
      type: String,
      default: "public/images/default.png",
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: String,
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockExpiresAt: {
      type: Date,
      default: null,
    },
    blockReason: {
      type: String,
      trim: true,
    },
    blockHistory: [
      {
        blockedAt: {
          type: Date,
          default: Date.now,
        },
        blockedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: String,
        expiresAt: Date,
        unblockedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate refresh token
userSchema.methods.getRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch;
  } catch (error) {
    console.error("Error in matchPassword:", error);
    return false;
  }
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Virtual populate
userSchema.virtual("consultations", {
  ref: "Consultation",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

userSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "enrolledUsers",
  justOne: false,
});

// Add method to check if user is blocked
userSchema.methods.isCurrentlyBlocked = function () {
  if (!this.isBlocked) return false;
  if (!this.blockExpiresAt) return true; // Permanent block
  return this.blockExpiresAt > Date.now();
};

// Add method to block user
userSchema.methods.blockUser = async function (
  blockedBy,
  reason,
  durationInHours = null
) {
  this.isBlocked = true;
  this.blockReason = reason;
  this.blockExpiresAt = durationInHours
    ? new Date(Date.now() + durationInHours * 60 * 60 * 1000)
    : null;

  this.blockHistory.push({
    blockedBy,
    reason,
    expiresAt: this.blockExpiresAt,
  });

  await this.save();
};

// Add method to unblock user
userSchema.methods.unblockUser = async function () {
  this.isBlocked = false;
  this.blockReason = null;

  // Update the last block history entry
  if (this.blockHistory.length > 0) {
    const lastBlock = this.blockHistory[this.blockHistory.length - 1];
    lastBlock.unblockedAt = new Date();
  }

  await this.save();
};

module.exports = mongoose.model("User", userSchema);
