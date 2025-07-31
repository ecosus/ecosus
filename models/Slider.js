const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String, required: true },
  lang: { type: String, enum: ["ar", "en"], default: "ar" },
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model("Slider", sliderSchema);
