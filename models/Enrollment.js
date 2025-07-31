const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EnrollmentSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User" }, // optional, for registered users
  startDate: { type: String, required: true },
  courseLanguage: { type: String, required: true },
  package: { type: String, required: true },
  fullNameAr: { type: String, required: true },
  fullNameEn: { type: String, required: true },
  birthDate: { type: Date, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String, required: true },
  city: { type: String, required: true },
  degree: { type: String, required: true },
  major: { type: String, required: true },
  university: { type: String, required: true },
  currentJob: { type: String },
  company: { type: String },
  yearsExperience: { type: String },
  wantScholarship: { type: String, required: true },
  scholarshipReason: { type: String },
  paymentMethod: { type: String, required: true },
  agree: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
