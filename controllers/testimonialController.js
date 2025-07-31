const Testimonial = require("../models/Testimonial");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
exports.getTestimonials = asyncHandler(async (req, res, next) => {
  const testimonials = await Testimonial.getAllTestimonials();

  res.status(200).json({
    success: true,
    count: testimonials.length,
    data: testimonials,
  });
});

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
// @access  Public
exports.getTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id).populate(
    "user",
    "name avatar"
  );

  if (!testimonial) {
    return next(new ErrorResponse("Testimonial not found", 404));
  }

  res.status(200).json({
    success: true,
    data: testimonial,
  });
});

// @desc    Create new testimonial
// @route   POST /api/testimonials
// @access  Private
exports.createTestimonial = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const testimonial = await Testimonial.create(req.body);

  res.status(201).json({
    success: true,
    data: testimonial,
  });
});

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private
exports.updateTestimonial = asyncHandler(async (req, res, next) => {
  let testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    return next(new ErrorResponse("Testimonial not found", 404));
  }

  // Make sure user is testimonial owner
  if (
    testimonial.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse("Not authorized to update this testimonial", 401)
    );
  }

  testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: testimonial,
  });
});

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private
exports.deleteTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    return next(new ErrorResponse("Testimonial not found", 404));
  }

  // Make sure user is testimonial owner or admin
  if (
    testimonial.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse("Not authorized to delete this testimonial", 401)
    );
  }

  await testimonial.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get featured testimonials
// @route   GET /api/testimonials/featured
// @access  Public
exports.getFeaturedTestimonials = asyncHandler(async (req, res, next) => {
  const testimonials = await Testimonial.getFeaturedTestimonials(
    req.query.limit
  );

  res.status(200).json({
    success: true,
    count: testimonials.length,
    data: testimonials,
  });
});

// @desc    Get project testimonials
// @route   GET /api/testimonials/project/:projectId
// @access  Public
exports.getProjectTestimonials = asyncHandler(async (req, res, next) => {
  const testimonials = await Testimonial.getProjectTestimonials(
    req.params.projectId
  );

  res.status(200).json({
    success: true,
    count: testimonials.length,
    data: testimonials,
  });
});

// @desc    Approve testimonial
// @route   PATCH /api/testimonials/:id/approve
// @access  Private/Admin
exports.approveTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    return next(new ErrorResponse("Testimonial not found", 404));
  }

  testimonial.isApproved = true;
  await testimonial.save();

  res.status(200).json({
    success: true,
    data: testimonial,
  });
});

// @desc    Feature testimonial
// @route   PATCH /api/testimonials/:id/feature
// @access  Private/Admin
exports.featureTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    return next(new ErrorResponse("Testimonial not found", 404));
  }

  if (!testimonial.isApproved) {
    return next(
      new ErrorResponse("Cannot feature unapproved testimonial", 400)
    );
  }

  testimonial.isFeatured = !testimonial.isFeatured;
  await testimonial.save();

  res.status(200).json({
    success: true,
    data: testimonial,
  });
});
