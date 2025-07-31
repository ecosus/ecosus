const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Please add testimonial content"],
      minlength: [10, "Content must be at least 10 characters long"],
      maxlength: [500, "Content cannot be more than 500 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get all testimonials
testimonialSchema.statics.getAllTestimonials = async function () {
  return await this.find()
    .populate("user", "name avatar")
    .select("user content rating createdAt")
    .sort("-createdAt");
};

module.exports = mongoose.model("Testimonial", testimonialSchema);
