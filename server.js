require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Config / DB
const { connectDB } = require('./config/db');
const { swaggerSpec, swaggerUi } = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info hgroup.main h2 { color: #3b4151 }
  `,
  customSiteTitle: 'Takkeh API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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
