const express = require("express");
const {
  getWhyImage,
  createWhyImage,
  updateWhyImage,
  deleteWhyImage,
} = require("../controllers/whyImageController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getWhyImage);
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createWhyImage
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  updateWhyImage
);
router.delete("/:id", protect, authorize("admin"), deleteWhyImage);

module.exports = router;
