const mongoose = require("mongoose");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      minlength: [50, "Description must be at least 50 characters long"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot be more than 200 characters"],
    },
    video: {
      type: String,
      required: false,
      default: null,
    },
    level: {
      type: String,
      required: [true, "Please add a level"],
      enum: ["beginner", "intermediate", "advanced"],
    },
    duration: {
      type: Number, // in hours
      required: [true, "Please add course duration"],
      min: [1, "Duration must be at least 1 hour"],
    },
    photo: {
      type: String,
      required: false,
      default: null,
    },
    avatar: {
      type: String,
      required: false,
      default: "public/images/defaultCourse.png",
    },
    instructor: {
      name: {
        type: String,
        required: [true, "Please add instructor name"],
        trim: true,
      },
      email: {
        type: String,
        required: false,
        trim: true,
      },
      dis: {
        type: String,
        required: false,
        trim: true,
      },
    },
    modules: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: String,
        duration: Number, // in minutes
        videoUrl: String,
      },
    ],
    enrolledUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        completedModules: [Number],
        certificate: {
          issuedAt: Date,
          url: String,
        },
      },
    ],
    requirements: [String],
    objectives: [String],
    isPublished: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Create course slug from the title
courseSchema.pre("save", function (next) {
  if (!this.isModified("title")) {
    next();
  }
  this.slug = slugify(this.title, { lower: true });

  // Generate short description if not provided
  if (!this.shortDescription) {
    this.shortDescription = this.description.substring(0, 150) + "...";
  }

  // Calculate average rating
  this.calculateAverageRating();

  next();
});

// Delete course video when course is deleted
courseSchema.pre("remove", async function (next) {
  try {
    if (this.video) {
      const uploadDir = path.join(__dirname, "../uploads");
      const filePath = path.join(uploadDir, this.video);
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
courseSchema.index({
  title: "text",
  description: "text",
  shortDescription: "text",
  requirements: "text",
  objectives: "text",
});

// Static method to get courses by category
courseSchema.statics.getCoursesByCategory = async function (category) {
  return await this.find({ category, isPublished: true })
    .select(
      "title slug shortDescription  level duration instructor video photo"
    )
    .populate("instructor", "name avatar")
    .sort("-createdAt");
};

// Static method to get featured courses
courseSchema.statics.getFeaturedCourses = async function (limit = 6) {
  return await this.find({ isPublished: true, isFeatured: true })
    .select(
      "title slug shortDescription  level duration instructor video photo"
    )
    .populate("instructor", "name avatar")
    .limit(limit);
};

// Static method to search courses
courseSchema.statics.searchCourses = async function (query) {
  return await this.find(
    { $text: { $search: query }, isPublished: true },
    { score: { $meta: "textScore" } }
  )
    .select(
      "title slug shortDescription  level duration instructor video photo"
    )
    .populate("instructor", "name avatar")
    .sort({ score: { $meta: "textScore" } })
    .limit(10);
};

// Virtual for related courses
courseSchema.virtual("relatedCourses", {
  ref: "Course",
  localField: "instructor",
  foreignField: "instructor",
  justOne: false,
  options: { limit: 3 },
});

// Add method to calculate average rating
courseSchema.methods.calculateAverageRating = function () {
  if (this.feedback.length === 0) {
    this.averageRating = 0;
    return;
  }
  const sum = this.feedback.reduce((acc, item) => acc + item.rating, 0);
  this.averageRating = (sum / this.feedback.length).toFixed(1);
};

module.exports = mongoose.model("Course", courseSchema);
