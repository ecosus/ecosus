const mongoose = require("mongoose");

const whyImage = new mongoose.Schema({
  image: { type: String, required: true },
});

module.exports = mongoose.model("whyImage", whyImage);
