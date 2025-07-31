const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${extension}`;
    cb(null, filename);
  },
});

// Define file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, GIF images and MP4, WebM, OGG, MOV, AVI, MKV videos are allowed."
      )
    );
  }
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

module.exports = upload;
