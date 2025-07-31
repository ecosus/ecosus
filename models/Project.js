const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    images: [
      {
        type: String, // Path to image file
        required: true,
      },
    ],
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
