require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Config / DB
const { connectDB } = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount routes
app.use('/', routes);

// Fallback 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
