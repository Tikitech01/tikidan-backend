# Tikidan SaaS Backend

Backend API for Tikidan SaaS Application with authentication and user management.

## Features

- User Registration
- User Login
- JWT Authentication
- Password Hashing with bcrypt
- CORS enabled
- Environment variables configuration

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Get Current User
- **GET** `/api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

## Tech Stack

- Node.js
- Express.js
- bcryptjs (Password hashing)
- jsonwebtoken (JWT authentication)
- cors (Cross-origin resource sharing)
- dotenv (Environment variables)

## Note

Currently using in-memory storage for users. Replace with a database (MongoDB, PostgreSQL, etc.) for production use.
