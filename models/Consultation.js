const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: String,
      required: [true, "Please select a service"],
      enum: [
        "residential",
        "commercial",
        "industrial",
        "renovation",
        "interior-design",
        "project-management",
        "sustainability",
      ],
    },
    projectType: {
      type: String,
      required: [true, "Please specify project type"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add project description"],
      minlength: [50, "Description must be at least 50 characters long"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    location: {
      type: String,
      required: [true, "Please add project location"],
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: [true, "Please select preferred date"],
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "completed", "cancelled"],
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get user consultations
consultationSchema.statics.getUserConsultations = async function (userId) {
  return await this.find({ user: userId })
    .select("service projectType description status preferredDate createdAt")
    .sort("-createdAt");
};

// Static method to get pending consultations
consultationSchema.statics.getPendingConsultations = async function () {
  return await this.find({ status: "pending" })
    .select(
      "user service projectType description status preferredDate createdAt"
    )
    .populate("user", "name email phone")
    .sort("-createdAt");
};

// Static method to get urgent consultations
consultationSchema.statics.getUrgentConsultations = async function () {
  return await this.find({ isUrgent: true, status: "pending" })
    .select(
      "user service projectType description status preferredDate createdAt"
    )
    .populate("user", "name email phone")
    .sort("-createdAt");
};

// Add method to validate status transitions
consultationSchema.methods.canChangeStatus = function (newStatus) {
  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: ["cancelled"], // Can only cancel a completed consultation
    cancelled: [], // No transitions allowed from cancelled
  };

  return validTransitions[this.status]?.includes(newStatus) || false;
};

// Add method to update status with history
consultationSchema.methods.updateStatus = async function (
  newStatus,
  userId,
  reason = ""
) {
  if (!this.canChangeStatus(newStatus)) {
    throw new Error(
      `Invalid status transition from ${this.status} to ${newStatus}`
    );
  }

  const oldStatus = this.status;
  this.status = newStatus;

  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    reason,
    changedAt: new Date(),
  });

  await this.save();
  return { oldStatus, newStatus };
};

module.exports = mongoose.model("Consultation", consultationSchema);
