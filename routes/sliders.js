const express = require("express");
const {
  getSliders,
  createSlider,
  updateSlider,
  deleteSlider,
} = require("../controllers/sliderController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getSliders);
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createSlider
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  updateSlider
);
router.delete("/:id", protect, authorize("admin"), deleteSlider);

module.exports = router;
