const Course = require("../models/Course");
const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Search courses
// @route   GET /api/courses/search
// @access  Public
exports.searchCourses = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return next(new ErrorResponse("Please provide a search query", 400));
  }

  // Create a regex pattern that matches partial words
  const searchRegex = new RegExp(q.split("").join(".*"), "i");

  const courses = await Course.find({
    $or: [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { shortDescription: { $regex: searchRegex } },
      { requirements: { $regex: searchRegex } },
      { objectives: { $regex: searchRegex } },
    ],
  })
    .populate("instructor", "name email avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = asyncHandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    const courses = await Course.find(query)
      .populate("instructor", "name email avatar")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: courses,
    });
  } catch (error) {
    console.error("Get all courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate(
    "instructor",
    "name email avatar"
  );

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = asyncHandler(async (req, res, next) => {
  try {
 

    // Parse instructor data
    let instructorData = {};
    if (req.body.instructor) {
      try {
        instructorData = JSON.parse(req.body.instructor);
      } catch (e) {
        instructorData = req.body.instructor;
      }
    }

    // Set instructor with default values
    req.body.instructor = {
      name: instructorData.name || req.user.name,
      email: instructorData.email || req.user.email,
      dis: instructorData.dis || req.user.dis,
    };

    // Handle uploaded instructor avatar
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      req.body.avatar = req.files.avatar[0].filename;
    } else if (req.body.avatar === "null" || req.body.avatar === "") {
      req.body.avatar = null;
    }

    // Handle video
    if (req.files && req.files.video && req.files.video[0]) {
      req.body.video = req.files.video[0].filename;
    } else if (req.body.video === "null" || req.body.video === "") {
      req.body.video = null;
    }

    // Handle photo
    if (req.files && req.files.photo && req.files.photo[0]) {
      req.body.photo = req.files.photo[0].filename;
    } else if (req.body.photo === "null" || req.body.photo === "") {
      req.body.photo = null;
    }

    // Parse other fields
    const parseJsonField = (field) => {
      if (typeof req.body[field] === "string") {
        try {
          return JSON.parse(req.body[field]);
        } catch (e) {
          return [];
        }
      }
      return req.body[field] || [];
    };

    req.body.requirements = parseJsonField("requirements");
    req.body.objectives = parseJsonField("objectives");
    req.body.modules = parseJsonField("modules");

    // Convert booleans
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // Convert duration
    if (req.body.duration && typeof req.body.duration === "string") {
      req.body.duration = parseInt(req.body.duration);
    }

    // Convert module durations
    if (req.body.modules && Array.isArray(req.body.modules)) {
      req.body.modules = req.body.modules.map((module) => ({
        ...module,
        duration: module.duration ? parseInt(module.duration) : undefined,
      }));
    }
 

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Backend: Error creating course:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        path: err.path,
        message: err.message,
        value: err.value,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: error.message,
        errors: errors,
      });
    }

    res.status(400).json({
      success: false,
      error: error.message,
      message: "Failed to create course",
    });
  }
});
// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }


  // Helper to parse JSON string fields
  const parseJsonField = (field) => {
    if (typeof req.body[field] === "string") {
      try {
        return JSON.parse(req.body[field]);
      } catch (e) {
        console.error(`Error parsing ${field}:`, e);
        return [];
      }
    }
    return req.body[field] || [];
  };

  // Create a new body object to avoid modifying req.body directly
  const updatedFields = { ...req.body };

  // Parse arrays
  updatedFields.requirements = parseJsonField("requirements");
  updatedFields.objectives = parseJsonField("objectives");
  updatedFields.modules = parseJsonField("modules");

  // Handle video and photo if uploaded
  if (req.files && req.files.video && req.files.video[0]) {
    updatedFields.video = req.files.video[0].filename;
  } else if (req.body.hasOwnProperty("video")) {
    const videoValue = req.body.video;
    if (videoValue === "" || videoValue === "null" || videoValue === null) {
      updatedFields.video = null;
    } else if (typeof videoValue === "string" && videoValue.trim() !== "") {
      updatedFields.video = videoValue.trim();
    } else if (typeof videoValue === "object") {
      delete updatedFields.video;
    } else {
      delete updatedFields.video;
    }
  } else {
    delete updatedFields.video;
  }
  if (req.files && req.files.photo && req.files.photo[0]) {
    updatedFields.photo = req.files.photo[0].filename;
  } else if (req.body.hasOwnProperty("photo")) {
    const photoValue = req.body.photo;
    if (photoValue === "" || photoValue === "null" || photoValue === null) {
      updatedFields.photo = null;
    } else if (typeof photoValue === "string" && photoValue.trim() !== "") {
      updatedFields.photo = photoValue.trim();
    } else if (typeof photoValue === "object") {
      delete updatedFields.photo;
    } else {
      delete updatedFields.photo;
    }
  } else {
    delete updatedFields.photo;
  }

  // Convert string booleans to actual booleans
  if (updatedFields.isActive === "true") updatedFields.isActive = true;
  if (updatedFields.isActive === "false") updatedFields.isActive = false;
  if (updatedFields.isPublished === "true") updatedFields.isPublished = true;
  if (updatedFields.isPublished === "false") updatedFields.isPublished = false;

  if (updatedFields.duration && typeof updatedFields.duration === "string") {
    updatedFields.duration = parseInt(updatedFields.duration);
  }

  // Convert module durations to numbers
  if (updatedFields.modules && Array.isArray(updatedFields.modules)) {
    updatedFields.modules = updatedFields.modules.map((module) => ({
      ...module,
      duration: module.duration ? parseInt(module.duration) : undefined,
    }));
  }

  course = await Course.findByIdAndUpdate(req.params.id, updatedFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is course instructor or admin
  if (course.instructor.email !== req.user.email && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this course`,
        401
      )
    );
  }

  await Course.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Add feedback to a course
// @route   POST /api/courses/:id/feedback
// @access  Private
exports.addFeedback = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required" });
    }

    // Add new feedback
    course.feedback.push({
      rating,
      comment,
    });

    // Calculate new average rating
    course.calculateAverageRating();

    await course.save();

    res.status(201).json({
      success: true,
      data: course.feedback[course.feedback.length - 1],
    });
  } catch (error) {
    res.status(500).json({ error: "Error adding feedback" });
  }
};

// @desc    Get feedback for a course
// @route   GET /api/courses/:id/feedback
// @access  Private
exports.getFeedback = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select(
      "feedback averageRating"
    );

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({
      success: true,
      data: course.feedback,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching feedback" });
  }
};

// @desc    Delete feedback from a course
// @route   DELETE /api/courses/:id/feedback/:feedbackId
// @access  Private/Admin
exports.deleteFeedback = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse("Course not found", 404));
  }

  // Find the feedback index
  const feedbackIndex = course.feedback.findIndex(
    (f) => f._id.toString() === req.params.feedbackId
  );

  if (feedbackIndex === -1) {
    return next(new ErrorResponse("Feedback not found", 404));
  }

  // Remove the feedback
  course.feedback.splice(feedbackIndex, 1);

  // Recalculate average rating
  course.calculateAverageRating();

  await course.save();

  res.status(200).json({
    success: true,
    data: {},
    message: "Feedback deleted successfully",
  });
});
