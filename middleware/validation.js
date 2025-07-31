const { validationResult, check } = require("express-validator");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
const authValidation = {
  register: [
    check("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    check("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email"),
    check("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number"),
    validate,
  ],
  login: [
    check("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email"),
    check("password").trim().notEmpty().withMessage("Password is required"),
    validate,
  ],
};

// Blog validation rules
const blogValidation = {
  create: [
    check("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters"),
    check("content")
      .trim()
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters long"),
    check("category").trim().notEmpty().withMessage("Category is required"),
    validate,
  ],
};

// Consultation validation rules
const consultationValidation = {
  create: [
    check("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 50 })
      .withMessage("Description must be at least 50 characters long"),
    validate,
  ],
  update: [
    check("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 50 })
      .withMessage("Description must be at least 50 characters long"),
    validate,
  ],
  status: [
    check("status")
      .trim()
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["pending", "completed", "confirmed", "cancelled"])
      .withMessage(
        "Status must be one of: pending, completed, confirmed, cancelled"
      ),
    validate,
  ],
};

// Testimonial validation rules
const testimonialValidation = {
  create: [
    check("content")
      .trim()
      .notEmpty()
      .withMessage("Testimonial content is required")
      .isLength({ min: 10, max: 500 })
      .withMessage("Testimonial must be between 10 and 500 characters"),
    check("project").optional().isMongoId().withMessage("Invalid project ID"),
    validate,
  ],
};

module.exports = {
  validate,
  authValidation,
  blogValidation,
  consultationValidation,
  testimonialValidation,
};
