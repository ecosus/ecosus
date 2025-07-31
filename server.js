const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

// Import routes
const authRoutes = require("./routes/auth");
const blogRoutes = require("./routes/blog");
const testimonialRoutes = require("./routes/testimonials");
const courseRoutes = require("./routes/courses");
const consultationRoutes = require("./routes/consultations");
const userRoutes = require("./routes/users");
const sliderRoutes = require("./routes/sliders");
const projectRoutes = require("./routes/projects");
const enrollmentRoutes = require("./routes/enrollments");
const whyImageRoutes = require("./routes/whyImage");
const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve public assets
app.use("/public", express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/whyImage", whyImageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      message: messages.join(", "),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: "Duplicate Field",
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid Token",
      message: "Access denied",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Validate required environment variables
const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_SECRET",
  "INITIAL_ADMIN_NAME",
  "INITIAL_ADMIN_EMAIL",
  "INITIAL_ADMIN_PASSWORD",
  "INITIAL_ADMIN_ROLE",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(
    "Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  process.exit(1);
}

// Validate admin credentials format
const validateAdminCredentials = () => {
  const { INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = process.env;

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(INITIAL_ADMIN_EMAIL)) {
    console.error("Invalid INITIAL_ADMIN_EMAIL format");
    process.exit(1);
  }

  // Password validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(INITIAL_ADMIN_PASSWORD)) {
    console.error(
      "INITIAL_ADMIN_PASSWORD must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
    );
    process.exit(1);
  }
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {

    // Validate admin credentials before attempting to create admin
    validateAdminCredentials();

    // Create initial admin user if it doesn't exist
    try {
      const adminExists = await User.findOne({
        $or: [{ email: process.env.INITIAL_ADMIN_EMAIL }, { role: "admin" }],
      });

      if (!adminExists) {
        const adminUser = await User.create({
          name: process.env.INITIAL_ADMIN_NAME,
          email: process.env.INITIAL_ADMIN_EMAIL,
          password: process.env.INITIAL_ADMIN_PASSWORD,
          role: process.env.INITIAL_ADMIN_ROLE,
        });
      } else {
      }
    } catch (error) {
      console.error("Error creating initial admin user:", error);
      // Don't exit the process, just log the error
      // This allows the server to start even if admin creation fails
    }

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err, promise) => {
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      server.close(() => {
      });
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;
