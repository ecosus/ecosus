const Blog = require("../models/Blog");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs");

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = asyncHandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isPublished: true };

    // Add category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    const blogs = await Blog.find(query)
      .populate("author", "name avatar")
      .select(
        "title slug excerpt category coverImage author publishedAt readTime views isPublished"
      )
      .sort("-publishedAt")
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: blogs,
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = asyncHandler(async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name email avatar"
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Get blog error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private/Admin
exports.createBlog = asyncHandler(async (req, res, next) => {
  try {
    // Parse the request body and handle special fields
    const blogData = { ...req.body };

    // Parse tags if they're sent as JSON string
    if (blogData.tags && typeof blogData.tags === "string") {
      try {
        blogData.tags = JSON.parse(blogData.tags);
      } catch (error) {
        console.error("Error parsing tags:", error);
        blogData.tags = [];
      }
    }

    // Ensure tags is an array
    if (!Array.isArray(blogData.tags)) {
      blogData.tags = [];
    }

    // Convert string boolean to actual boolean
    if (typeof blogData.isPublished === "string") {
      blogData.isPublished = blogData.isPublished === "true";
    }

    // Add author
    blogData.author = req.user.id;

    // Handle cover image
    if (req.file) {
      blogData.coverImage = `/uploads/${req.file.filename}`;
    }

    // Create blog
    const blog = new Blog(blogData);
    const savedBlog = await blog.save();

    // Populate author info for response
    await savedBlog.populate("author", "name email avatar");

    res.status(201).json({
      success: true,
      data: savedBlog,
    });
  } catch (error) {
    console.error("Create blog error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        path: err.path,
        msg: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: errors,
      });
    }

    // Handle duplicate key error (slug)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Blog with this title already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal Server Error",
    });
  }
});

exports.updateBlog = asyncHandler(async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Parse the request body and handle special fields
    const updateData = { ...req.body };

    // Parse tags if they're sent as JSON string
    if (updateData.tags && typeof updateData.tags === "string") {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (error) {
        console.error("Error parsing tags:", error);
        updateData.tags = [];
      }
    }

    // Ensure tags is an array
    if (!Array.isArray(updateData.tags)) {
      updateData.tags = [];
    }

    // Convert string boolean to actual boolean
    if (typeof updateData.isPublished === "string") {
      updateData.isPublished = updateData.isPublished === "true";
    }

    // Handle cover image
    if (req.file) {
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    // Update the blog
    blog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("author", "name email avatar");

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Update blog error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        path: err.path,
        msg: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal Server Error",
    });
  }
});

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
exports.updateBlog = asyncHandler(async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check if user owns the blog or is admin
    if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this blog",
      });
    }

    // Clean up the request body
    const { coverImage, ...updateData } = req.body;

    // Handle cover image if uploaded
    if (req.file) {
      // Delete old cover image if it exists
      if (blog.coverImage) {
        const oldImagePath = path.join(__dirname, "..", blog.coverImage);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (deleteError) {
            console.error("❌ Error deleting old cover image:", deleteError);
          }
        }
      }
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("author", "name email avatar");

    res.status(200).json({
      success: true,
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Update blog error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        path: err.path,
        msg: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal Server Error",
    });
  }
});

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
exports.deleteBlog = asyncHandler(async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check if user owns the blog or is admin
    if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this blog",
      });
    }

    // The pre('remove') middleware in the schema will handle file deletion
    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal Server Error",
    });
  }
});

// @desc    Get popular blogs
// @route   GET /api/blogs/popular
// @access  Public
exports.getPopularBlogs = asyncHandler(async (req, res, next) => {
  const blogs = await Blog.getPopularBlogs(req.query.limit);

  res.status(200).json({
    success: true,
    count: blogs.length,
    data: blogs,
  });
});

// @desc    Get blogs by category
// @route   GET /api/blogs/category/:category
// @access  Public
exports.getBlogsByCategory = asyncHandler(async (req, res, next) => {
  const blogs = await Blog.getBlogsByCategory(req.params.category);

  res.status(200).json({
    success: true,
    count: blogs.length,
    data: blogs,
  });
});

// @desc    Search blogs
// @route   GET /api/blogs/search
// @access  Public
exports.searchBlogs = asyncHandler(async (req, res, next) => {
  if (!req.query.q) {
    return next(new ErrorResponse("Please provide a search query", 400));
  }

  const blogs = await Blog.searchBlogs(req.query.q);

  res.status(200).json({
    success: true,
    count: blogs.length,
    data: blogs,
  });
});

// @desc    Get all blogs (admin only)
// @route   GET /api/blogs/admin/all
// @access  Private/Admin
exports.getAllBlogs = asyncHandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Add category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    const blogs = await Blog.find(query)
      .populate("author", "name avatar")
      .select(
        "title excerpt category coverImage author publishedAt isPublished"
      )
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: blogs,
    });
  } catch (error) {
    console.error("Get all blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});

// @desc    Add feedback to a blog
// @route   POST /api/blogs/:id/feedback
// @access  Public (previously Private)
exports.addFeedback = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        error: "Blog not found",
        id: req.params.id,
        message: "The blog ID you provided does not exist in the database",
      });
    }

    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({
        error: "Rating and comment are required",
        received: { rating, comment },
      });
    }

    // Removed the check for existing feedback by user, as feedback is now public and can be anonymous.

    // Add new feedback
    blog.feedback.push({
      rating,
      comment,
    });

    // Calculate new average rating
    blog.calculateAverageRating();

    await blog.save();

    const addedFeedback = blog.feedback[blog.feedback.length - 1];

    res.status(201).json({
      success: true,
      data: addedFeedback,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error adding feedback",
      details: error.message,
    });
  }
};

// @desc    Get feedback for a blog
// @route   GET /api/blogs/:id/feedback
// @access  Public (previously Private)
exports.getFeedback = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).select(
      "feedback averageRating"
    );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json({
      success: true,
      data: blog.feedback,
      averageRating: blog.averageRating,
    });
  } catch (error) {
    console.error("Error in getFeedback:", error);
    res.status(500).json({ error: "Error fetching feedback" });
  }
};

// @desc    Delete feedback from a blog
// @route   DELETE /api/blogs/:id/feedback/:feedbackId
// @access  Private/Admin
exports.deleteFeedback = asyncHandler(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new ErrorResponse("Blog not found", 404));
  }

  // Find the feedback index
  const feedbackIndex = blog.feedback.findIndex(
    (f) => f._id.toString() === req.params.feedbackId
  );

  if (feedbackIndex === -1) {
    return next(new ErrorResponse("Feedback not found", 404));
  }

  // Remove the feedback
  blog.feedback.splice(feedbackIndex, 1);

  // Recalculate average rating
  blog.calculateAverageRating();

  await blog.save();

  res.status(200).json({
    success: true,
    data: {},
    message: "Feedback deleted successfully",
  });
});
