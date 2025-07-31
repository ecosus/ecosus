const Consultation = require("../models/Consultation");
const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const { sendEmail, emailTemplates } = require("../utils/sendEmail");

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Private/Admin
exports.getConsultations = asyncHandler(async (req, res, next) => {
  // Build query object
  const query = {};

  // Handle status filter
  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  // Handle service filter
  if (req.query.service && req.query.service !== "all") {
    query.service = req.query.service;
  }

  // Handle search
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    query.$or = [
      { "user.name": searchRegex },
      { description: searchRegex },
      { service: searchRegex },
      { projectType: searchRegex },
      { location: searchRegex },
    ];
  }

  // Get total count
  const total = await Consultation.countDocuments(query);

  // Fetch ALL records without any pagination
  const consultations = await Consultation.find(query)
    .select(
      "user service projectType description status preferredDate createdAt location isUrgent"
    )
    .populate("user", "name email phone")
    .sort(req.query.sort || "-createdAt");

  res.status(200).json({
    success: true,
    count: consultations.length,
    total,
    data: consultations,
  });
});

// Optional: Add a dedicated stats endpoint for better performance
exports.getConsultationStats = asyncHandler(async (req, res, next) => {
  // Use aggregation pipeline for efficient counting
  const stats = await Consultation.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
        urgent: {
          $sum: { $cond: ["$isUrgent", 1, 0] },
        },
      },
    },
  ]);

  // Get recent consultations (last 5)
  const recent = await Consultation.find()
    .select("user service projectType status createdAt")
    .populate("user", "name")
    .sort("-createdAt")
    .limit(5);

  const result =
    stats.length > 0
      ? stats[0]
      : {
          total: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
          urgent: 0,
        };

  res.status(200).json({
    success: true,
    stats: {
      ...result,
      _id: undefined, // Remove the _id field
    },
    recent,
  });
});

// @desc    Get single consultation
// @route   GET /api/consultations/:id
// @access  Private
exports.getConsultation = asyncHandler(async (req, res, next) => {
  // Check if the id is a valid MongoDB ObjectId
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new ErrorResponse("Invalid consultation ID format", 400));
  }

  const consultation = await Consultation.findById(req.params.id).populate(
    "user",
    "name email phone"
  );

  if (!consultation) {
    return next(new ErrorResponse("Consultation not found", 404));
  }

  // Make sure user is consultation owner or admin
  if (
    consultation.user._id.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse("Not authorized to access this consultation", 401)
    );
  }

  res.status(200).json({
    success: true,
    data: consultation,
  });
});

// @desc    Create new consultation
// @route   POST /api/consultations
// @access  Private
exports.createConsultation = asyncHandler(async (req, res, next) => {
  // Use authenticated user's information
  const consultationData = {
    ...req.body,
    user: req.user.id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone || req.body.phone, // Use user's phone if available, otherwise use provided phone
  };

  const consultation = await Consultation.create(consultationData);

  try {
    // Send confirmation email to user
    const confirmationTemplate = emailTemplates.consultationConfirmation(
      req.user.name,
      {
        service: consultation.service,
        preferredDate: consultation.preferredDate,
        description: consultation.description,
      }
    );

    await sendEmail({
      to: req.user.email, // Make sure to use 'to' instead of 'email'
      subject: confirmationTemplate.subject,
      html: confirmationTemplate.html,
    });

    // Send notification email to admin
    const admins = await User.find({ role: "admin" });
    if (admins && admins.length > 0) {
      const adminEmails = admins.map((admin) => admin.email).join(", ");

      // Create admin notification email
      const adminNotificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">New Consultation Request</h2>
          <p>A new consultation request has been received:</p>
          <ul>
            <li><strong>User:</strong> ${req.user.name}</li>
            <li><strong>Email:</strong> ${req.user.email}</li>
            <li><strong>Service:</strong> ${consultation.service}</li>
            <li><strong>Project Type:</strong> ${consultation.projectType}</li>
            <li><strong>Description:</strong> ${consultation.description}</li>
          </ul>
          <p>Please review and process this request.</p>
        </div>
      `;

      await sendEmail({
        to: adminEmails, // Make sure to use 'to' instead of 'email'
        subject: "New Consultation Request",
        html: adminNotificationHtml,
      });
    }
  } catch (emailError) {
    console.error("Failed to send consultation emails:", emailError);
    // Don't fail the consultation creation if email fails
  }

  res.status(201).json({
    success: true,
    data: consultation,
  });
});

// @desc    Update consultation
// @route   PUT /api/consultations/:id
// @access  Private
exports.updateConsultation = asyncHandler(async (req, res, next) => {
  let consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse("Consultation not found", 404));
  }

  // Make sure user is consultation owner or admin
  if (
    consultation.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse("Not authorized to update this consultation", 401)
    );
  }

  // Only allow updates if consultation is pending (for regular users)
  if (
    consultation.user.toString() === req.user.id &&
    consultation.status !== "pending"
  ) {
    return next(
      new ErrorResponse(
        "Cannot update consultation after it has been processed",
        400
      )
    );
  }

  consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: consultation,
  });
});

// @desc    Delete consultation
// @route   DELETE /api/consultations/:id
// @access  Private
exports.deleteConsultation = asyncHandler(async (req, res, next) => {
  const consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse("Consultation not found", 404));
  }

  // Make sure user is consultation owner or admin
  if (
    consultation.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse("Not authorized to delete this consultation", 401)
    );
  }

  // Only allow deletion if consultation is pending (for regular users)
  if (
    consultation.user.toString() === req.user.id &&
    consultation.status !== "pending"
  ) {
    return next(
      new ErrorResponse(
        "Cannot delete consultation after it has been processed",
        400
      )
    );
  }

  await Consultation.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get user consultations
// @route   GET /api/consultations/my-consultations
// @access  Private
exports.getUserConsultations = asyncHandler(async (req, res, next) => {
  const consultations = await Consultation.getUserConsultations(req.user.id);

  res.status(200).json({
    success: true,
    count: consultations.length,
    data: consultations,
  });
});

// @desc    Get pending consultations
// @route   GET /api/consultations/pending
// @access  Private/Admin
exports.getPendingConsultations = asyncHandler(async (req, res, next) => {
  const consultations = await Consultation.find({ status: "pending" })
    .populate("user", "name email phone")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: consultations.length,
    data: consultations,
  });
});

// @desc    Get urgent consultations
// @route   GET /api/consultations/urgent
// @access  Private/Admin
exports.getUrgentConsultations = asyncHandler(async (req, res, next) => {
  const consultations = await Consultation.find(
    { isUrgent: true } || { status: "urgent" }
  )
    .populate("user", "name email phone")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: consultations.length,
    data: consultations,
  });
});

// @desc    Update consultation status
// @route   PATCH /api/consultations/:id/status
// @access  Private/Admin
exports.updateConsultationStatus = asyncHandler(async (req, res, next) => {
  const { status, reason } = req.body;

  const consultation = await Consultation.findById(req.params.id)
    .populate("user", "name email")
    .populate("statusHistory.changedBy", "name");

  if (!consultation) {
    return next(new ErrorResponse("Consultation not found", 404));
  }

  try {
    const { oldStatus, newStatus } = await consultation.updateStatus(
      status,
      req.user.id,
      reason
    );

    // Send status update email to user
    const statusUpdateTemplate = emailTemplates.consultationStatusUpdate(
      consultation.user.name,
      {
        service: consultation.service,
        projectType: consultation.projectType,
        oldStatus,
        newStatus,
        reason,
      }
    );

    await sendEmail({
      to: consultation.user.email,
      subject: `Consultation Status Updated to ${newStatus}`,
      html: statusUpdateTemplate.html,
    });

    res.status(200).json({
      success: true,
      data: consultation,
      statusChange: {
        oldStatus,
        newStatus,
        changedBy: req.user.name,
        reason,
        changedAt: new Date(),
      },
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Get consultation status history
// @route   GET /api/consultations/:id/status-history
// @access  Private/Admin
exports.getStatusHistory = asyncHandler(async (req, res, next) => {
  const consultation = await Consultation.findById(req.params.id)
    .populate("statusHistory.changedBy", "name")
    .select("statusHistory");

  if (!consultation) {
    return next(new ErrorResponse("Consultation not found", 404));
  }

  res.status(200).json({
    success: true,
    data: consultation.statusHistory,
  });
});

// @desc    Mark consultation as urgent
// @route   PATCH /api/consultations/:id/urgent
// @access  Private/Admin
exports.markAsUrgent = asyncHandler(async (req, res, next) => {
  const consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse("Consultation not found", 404));
  }

  consultation.isUrgent = true;
  await consultation.save();

  res.status(200).json({
    success: true,
    data: consultation,
  });
});

// @desc    Mark consultation as resolved
// @route   PATCH /api/consultations/:id/resolve
// @access  Private/Admin
exports.markAsResolved = asyncHandler(async (req, res, next) => {
  const consultation = await Consultation.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!consultation) {
    return next(new ErrorResponse("Consultation not found", 404));
  }

  consultation.status = "completed";
  consultation.followUpDate = req.body.followUpDate;
  await consultation.save();

  // Send completion email to user
  await sendEmail({
    email: consultation.user.email,
    subject: "Consultation Completed",
    template: emailTemplates.consultationCompleted,
    data: {
      name: consultation.user.name,
      service: consultation.service,
      projectType: consultation.projectType,
      followUpDate: consultation.followUpDate,
    },
  });

  res.status(200).json({
    success: true,
    data: consultation,
  });
});
