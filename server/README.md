# CampusNix Backend API

A comprehensive Node.js + Express.js backend for a CampusNix management system with role-based access control, JWT authentication, and MongoDB integration.

## 🚀 Features

- **Role-based Authentication**: Admin, TPO, Company, and Student roles
- **JWT-based Security**: Secure token-based authentication
- **File Upload**: Resume upload with Multer/Cloudinary support
- **RESTful APIs**: Clean, well-structured API endpoints
- **MongoDB Integration**: Mongoose ODM with optimized queries
- **Input Validation**: Express-validator for request validation
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet, CORS, and other security middleware

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd project/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/campusnix

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Cloudinary Configuration (optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 📁 Project Structure

```
server/
├── controllers/          # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── driveController.js
│   ├── internshipController.js
│   └── adminController.js
├── routes/              # API routes
│   ├── auth.js
│   ├── users.js
│   ├── drives.js
│   ├── internships.js
│   ├── applications.js
│   └── admin.js
├── models/              # Database models
│   ├── User.js
│   ├── Drive.js
│   ├── Internship.js
│   └── Application.js
├── middleware/          # Custom middleware
│   ├── auth.js
│   ├── role.js
│   └── upload.js
├── config/             # Configuration files
│   ├── db.js
│   └── cloudinary.js
├── uploads/            # File uploads (local)
├── server.js           # Main server file
└── package.json
```

## 🔐 Authentication & Authorization

### User Roles

1. **Admin**: Full system access, user management, statistics
2. **TPO**: Post drives/internships, manage applications
3. **Company**: Post drives, view eligible students
4. **Student**: Apply to drives, upload resume, track applications

### JWT Token

- Stored in Authorization header: `Bearer <token>`
- Expires in 7 days (configurable)
- Contains user ID and role information

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "rollNumber": "CS2021001",
  "branch": "Computer Science"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

### User Management

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "1234567890"
}
```

#### Upload Resume (Student only)
```http
POST /api/users/resume
Authorization: Bearer <token>
Content-Type: multipart/form-data

resume: <file>
```

### Drive Management

#### Create Drive (TPO/Company)
```http
POST /api/drives
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Engineer",
  "position": "Full Stack Developer",
  "description": "We are looking for...",
  "ctc": "8-12 LPA",
  "location": "Bangalore",
  "deadline": "2024-03-31",
  "eligibility": {
    "minCGPA": 7.0,
    "allowedBranches": ["CSE", "IT"],
    "maxBacklogs": 0,
    "minYear": 3
  }
}
```

#### Get All Drives
```http
GET /api/drives?page=1&limit=10&status=active
```

#### Apply to Drive (Student)
```http
POST /api/drives/:id/apply
Authorization: Bearer <token>
```

### Internship Management

#### Create Internship (TPO)
```http
POST /api/internships
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Summer Internship",
  "company": "Tech Corp",
  "description": "Internship opportunity...",
  "duration": "3 months",
  "stipend": "25,000/month",
  "location": "Remote",
  "deadline": "2024-02-28",
  "externalLink": "https://apply.techcorp.com",
  "eligibility": "3rd year students"
}
```

### Application Tracking

#### Get My Applications (Student)
```http
GET /api/applications/mine?status=pending
Authorization: Bearer <token>
```

#### Update Application Status (TPO/Company)
```http
PATCH /api/applications/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shortlisted",
  "feedback": "Strong technical skills"
}
```

### Admin Endpoints

#### Get Admin Statistics
```http
GET /api/admin/stats
Authorization: Bearer <token>
```

#### Create TPO Account
```http
POST /api/admin/tpo
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "TPO Name",
  "email": "tpo@college.edu",
  "password": "password123",
  "department": "Computer Science"
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access Control**: Granular permissions
- **Input Validation**: Request data validation
- **Rate Limiting**: Protection against abuse
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Password Hashing**: Bcrypt for password security

## 📊 Database Models

### User Model
- Basic info: name, email, password, role
- Student fields: rollNumber, branch, cgpa, backlogs, skills
- Company fields: companyName, industry, website
- TPO fields: department, experience, qualification
- Admin fields: system-wide access

### Drive Model
- Job details: title, position, description, ctc
- Eligibility: minCGPA, allowedBranches, maxBacklogs
- Applications: student tracking and status
- Timeline: application process tracking

### Internship Model
- Internship details: title, company, duration, stipend
- External links and requirements
- Student interest tracking

### Application Model
- Application tracking with timeline
- Interview scheduling
- Status updates and feedback

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure MongoDB connection
3. Set secure JWT secret
4. Configure Cloudinary (optional)
5. Set up proper CORS origins

## 🧪 Testing

```bash
npm test
```

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository. 