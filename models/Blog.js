const mongoose = require("mongoose");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, "Please add content"],
      minlength: [50, "Content must be at least 50 characters long"],
    },
    excerpt: {
      type: String,
      maxlength: [200, "Excerpt cannot be more than 200 characters"],
    },
    coverImage: {
      type: String,
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
      enum: [
        "construction",
        "architecture",
        "interior-design",
        "renovation",
        "sustainability",
        "industry-news",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    readTime: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    feedback: [
      {
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Comment cannot be more than 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create blog slug from the title
blogSchema.pre("save", function (next) {
  // Always generate slug from title
  if (this.title && (this.isNew || this.isModified("title"))) {
    // Generate a unique slug by adding timestamp if needed
    const baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    // Add timestamp to ensure uniqueness
    this.slug = `${baseSlug}-${Date.now()}`;
  }

  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 150) + "...";
  }

  // Calculate read time (assuming average reading speed of 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }

  // Set publishedAt date when publishing
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Calculate average rating
  this.calculateAverageRating();

  next();
});

// Delete blog image when blog is deleted
blogSchema.pre("remove", async function (next) {
  try {
    if (this.coverImage && this.coverImage.filename) {
      const uploadDir = path.join(__dirname, "../uploads/blogs");
      const filePath = path.join(uploadDir, this.coverImage.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add text index for search
blogSchema.index({
  title: "text",
  content: "text",
  excerpt: "text",
  tags: "text",
});

// Static method to get blogs by category
blogSchema.statics.getBlogsByCategory = async function (category) {
  return await this.find({ category, isPublished: true })
    .select(
      "title slug excerpt category coverImage isPublished author publishedAt readTime views tags"
    )
    .populate("author", "name avatar")
    .sort("-publishedAt");
};

// Static method to get popular blogs
blogSchema.statics.getPopularBlogs = async function (limit = 5) {
  return await this.find({ isPublished: true })
    .select(
      "title slug excerpt category coverImage isPublished author publishedAt readTime views tags"
    )
    .populate("author", "name avatar")
    .sort("-views")
    .limit(limit);
};

// Static method to search blogs
blogSchema.statics.searchBlogs = async function (query) {
  return await this.find(
    { $text: { $search: query }, isPublished: true },
    { score: { $meta: "textScore" } }
  )
    .select(
      "title slug excerpt category coverImage isPublished author publishedAt readTime views tags"
    )
    .populate("author", "name avatar")
    .sort({ score: { $meta: "textScore" } })
    .limit(10);
};

// Virtual for related blogs
blogSchema.virtual("relatedBlogs", {
  ref: "Blog",
  localField: "category",
  foreignField: "category",
  justOne: false,
  options: { limit: 3 },
});

// Add method to calculate average rating
blogSchema.methods.calculateAverageRating = function () {
  if (this.feedback.length === 0) {
    this.averageRating = 0;
    return;
  }
  const sum = this.feedback.reduce((acc, item) => acc + item.rating, 0);
  this.averageRating = (sum / this.feedback.length).toFixed(1);
};

module.exports = mongoose.model("Blog", blogSchema);
