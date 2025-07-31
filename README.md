# Construction Company Backend API

A robust Node.js/Express backend API for a construction and design company website, featuring authentication, content management, and file upload capabilities.

## 🚀 Features

- **RESTful API**: Complete REST API with proper HTTP status codes
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user CRUD operations with admin privileges
- **Content Management**: Blog, courses, consultations, and testimonials management
- **File Upload**: Image upload functionality with Multer
- **Email Services**: Password reset and notification emails
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Jest testing framework with Supertest
- **Logging**: Morgan HTTP request logger

## 🛠️ Tech Stack

- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, express-rate-limit
- **Testing**: Jest, Supertest
- **Development**: Nodemon
- **Environment**: dotenv

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/construction-company
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=30d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FROM_EMAIL=noreply@company.com
   FROM_NAME=Construction Company
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `MONGODB_URI` in your `.env` file

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 📜 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🏗️ Project Structure

```
server/
├── config/              # Configuration files
│   └── database.js      # Database connection
├── controllers/         # Route controllers
│   ├── authController.js
│   ├── blogController.js
│   ├── consultationController.js
│   ├── courseController.js
│   ├── testimonialController.js
│   └── userController.js
├── middleware/          # Custom middleware
│   ├── async.js         # Async error handler
│   ├── auth.js          # Authentication middleware
│   ├── upload.js        # File upload middleware
│   └── validation.js    # Input validation
├── models/              # Mongoose models
│   ├── Blog.js
│   ├── Consultation.js
│   ├── Course.js
│   ├── Testimonial.js
│   └── User.js
├── routes/              # API routes
│   ├── auth.js
│   ├── blog.js
│   ├── consultations.js
│   ├── courses.js
│   ├── testimonials.js
│   └── users.js
├── utils/               # Utility functions
│   ├── errorResponse.js
│   ├── generateToken.js
│   └── sendEmail.js
├── public/              # Static files
├── uploads/             # Uploaded files
└── server.js            # Main server file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgotpassword` - Forgot password
- `PUT /api/auth/resetpassword/:resettoken` - Reset password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Blogs
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create blog (Admin)
- `PUT /api/blogs/:id` - Update blog (Admin)
- `DELETE /api/blogs/:id` - Delete blog (Admin)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

### Consultations
- `GET /api/consultations` - Get consultations (Admin/User)
- `GET /api/consultations/:id` - Get single consultation
- `POST /api/consultations` - Create consultation
- `PUT /api/consultations/:id` - Update consultation
- `DELETE /api/consultations/:id` - Delete consultation

### Testimonials
- `GET /api/testimonials` - Get all testimonials
- `GET /api/testimonials/:id` - Get single testimonial
- `POST /api/testimonials` - Create testimonial
- `PUT /api/testimonials/:id` - Update testimonial
- `DELETE /api/testimonials/:id` - Delete testimonial

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Registration/Login**: Returns a JWT token
2. **Protected Routes**: Require the token in the Authorization header
3. **Token Format**: `Bearer <token>`

## 📁 File Upload

The API supports image uploads using Multer:
- Supported formats: JPG, JPEG, PNG, GIF, WEBP
- Maximum file size: 5MB
- Files are stored in the `uploads/` directory
- File paths are returned in the API response

## 🧪 Testing

Run tests using Jest:
```bash
npm test
```

Test files are located in the same directory as the files they test with `.test.js` extension.

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation with express-validator
- **Password Hashing**: bcryptjs for secure password storage
- **JWT**: Secure token-based authentication

## 📊 Error Handling

The API includes comprehensive error handling:
- Custom error response utility
- Async error wrapper middleware
- Proper HTTP status codes
- Detailed error messages

## 🚀 Deployment

1. **Set production environment variables**
2. **Build the application**
   ```bash
   npm start
   ```

3. **Deploy to your hosting provider** (Heroku, DigitalOcean, AWS, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team. 