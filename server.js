const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Tikidan SaaS Backend API' });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Roles routes
app.use('/api/roles', require('./routes/roles'));

// Clients routes with cascade deletion
app.use('/api/clients', require('./routes/clients'));

// Projects routes
app.use('/api/projects', require('./routes/projects'));

// Meetings routes
app.use('/api/meetings', require('./routes/meetings'));

// Reports routes
app.use('/api/reports', require('./routes/reports'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
