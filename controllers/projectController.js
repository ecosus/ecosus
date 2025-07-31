const Project = require("../models/Project");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
exports.getProjects = asyncHandler(async (req, res, next) => {
  const projects = await Project.find().sort("-createdAt");
  res
    .status(200)
    .json({ success: true, count: projects.length, data: projects });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({ slug: req.params.projectSlug });
  if (!project) {
    return next(new ErrorResponse("Project not found", 404));
  }
  res.status(200).json({ success: true, data: project });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = asyncHandler(async (req, res, next) => {
  // req.files is an array of images
  const images = req.files
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];
  if (images.length === 0) {
    return next(new ErrorResponse("At least one image is required", 400));
  }
  const project = await Project.create({ images, slug: req.body.slug });
  res.status(201).json({ success: true, data: project });
});

// @desc    Update project (replace images)
// @route   PUT /api/projects/:id
// @access  Private/Admin
exports.updateProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({ slug: req.params.projectSlug });
  if (!project) {
    return next(new ErrorResponse("Project not found", 404));
  }
  // Replace images if new ones are uploaded
  let images = project.images;
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => `/uploads/${file.filename}`);
  }
  project.images = images;
  project.slug = req.body.slug;
  await project.save();
  res.status(200).json({ success: true, data: project });
});

// @desc    Delete project
// @route   DELETE /api/projects/:projectSlug
// @access  Private/Admin
exports.deleteProject = asyncHandler(async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.projectSlug });
    if (!project) {
      return next(new ErrorResponse("Project not found", 404));
    }
    const deleted = await Project.findOneAndDelete({
      slug: req.params.projectSlug,
    });
    res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    console.error("Error deleting project:", err);
    return next(new ErrorResponse("Server error: " + err.message, 500));
  }
});
