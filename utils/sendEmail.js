const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
};

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: "Welcome to Our Construction Company",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome ${name}!</h2>
        <p>Thank you for registering with our construction company. We're excited to have you on board!</p>
        <p>You can now access your account and explore our services.</p>
        <p>Best regards,<br>The Construction Company Team</p>
      </div>
    `,
  }),
  

  consultationConfirmation: (name, consultationDetails) => ({
    subject: "Consultation Request Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hello ${name},</h2>
        <p>Thank you for your consultation request. We have received your details:</p>
        <ul>
          <li><strong>Service:</strong> ${consultationDetails.service}</li>
          <li><strong>Preferred Date:</strong> ${consultationDetails.preferredDate}</li>
          <li><strong>Description:</strong> ${consultationDetails.description}</li>
        </ul>
        <p>Our team will review your request and get back to you shortly.</p>
        <p>Best regards,<br>The Construction Company Team</p>
      </div>
    `,
  }),

  passwordReset: (resetLink) => ({
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Password Reset</h2>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #e74c3c;">${resetLink}</p>
        
        <p>If you didn't request this, please ignore this email.</p>
        
        <p>Best regards,<br>The Construction Company Team</p>
      </div>
    `,
  }),

  consultationStatusUpdate: (name, consultationDetails) => ({
    subject: "Consultation Status Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Consultation Status Update</h2>
        <p>Hello ${name},</p>
        <p>Your consultation request has been updated:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 10px;"><strong>Service:</strong> ${consultationDetails.service}</li>
            <li style="margin-bottom: 10px;"><strong>Project Type:</strong> ${consultationDetails.projectType}</li>
            <li style="margin-bottom: 10px;"><strong>New Status:</strong> <span style="color: #3498db; font-weight: bold;">${consultationDetails.status}</span></li>
          </ul>
        </div>
        <p>You can view the full details of your consultation by logging into your account.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Construction Company Team</p>
      </div>
    `,
    text: `
Hello ${name},

Your consultation request has been updated:

Service: ${consultationDetails.service}
Project Type: ${consultationDetails.projectType}
New Status: ${consultationDetails.status}

You can view the full details of your consultation by logging into your account.

If you have any questions, please don't hesitate to contact us.

Best regards,
The Construction Company Team
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
