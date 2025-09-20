const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Takkeh Backend API',
    version: '0.1.0',
    description: 'Backend Node.js/Express API for Takkeh - a multi-user platform supporting customers, vendors, and drivers with comprehensive authentication, OTP verification, and progressive verification system.',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Takkeh Support',
      email: 'support@takkeh.com',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' ? 'https://api.takkeh.com' : `http://localhost:${process.env.PORT || 3000}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB ObjectId',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com',
          },
          phone: {
            type: 'string',
            description: 'User phone number',
            example: '1234567890',
          },
          emailVerified: {
            type: 'boolean',
            description: 'Whether email is verified',
            example: true,
          },
          phoneVerified: {
            type: 'boolean',
            description: 'Whether phone is verified',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Customer: {
        allOf: [
          {
            $ref: '#/components/schemas/User',
          },
          {
            type: 'object',
            properties: {
              userType: {
                type: 'string',
                enum: ['customer'],
                description: 'User type',
                example: 'customer',
              },
            },
          },
        ],
      },
      Vendor: {
        allOf: [
          {
            $ref: '#/components/schemas/User',
          },
          {
            type: 'object',
            properties: {
              userType: {
                type: 'string',
                enum: ['vendor'],
                description: 'User type',
                example: 'vendor',
              },
              confirmedAccount: {
                type: 'boolean',
                description: 'Whether account is confirmed by admin',
                example: false,
              },
            },
          },
        ],
      },
      Driver: {
        allOf: [
          {
            $ref: '#/components/schemas/User',
          },
          {
            type: 'object',
            properties: {
              userType: {
                type: 'string',
                enum: ['driver'],
                description: 'User type',
                example: 'driver',
              },
              confirmedAccount: {
                type: 'boolean',
                description: 'Whether account is confirmed by admin',
                example: false,
              },
            },
          },
        ],
      },
      SignupRequest: {
        type: 'object',
        required: ['name', 'email', 'phone', 'password'],
        properties: {
          name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com',
          },
          phone: {
            type: 'string',
            description: 'User phone number',
            example: '1234567890',
          },
          password: {
            type: 'string',
            description: 'User password (minimum 8 characters)',
            example: 'StrongP@ssw0rd',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address (either email or phone required)',
            example: 'john@example.com',
          },
          phone: {
            type: 'string',
            description: 'User phone number (either email or phone required)',
            example: '1234567890',
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'StrongP@ssw0rd',
          },
        },
      },
      VerifyRequest: {
        type: 'object',
        required: ['code'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address (for email verification)',
            example: 'john@example.com',
          },
          phone: {
            type: 'string',
            description: 'Phone number (for phone verification)',
            example: '1234567890',
          },
          code: {
            type: 'string',
            description: '6-digit OTP code',
            example: '123456',
          },
        },
      },
      ResendRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address (for email OTP)',
            example: 'john@example.com',
          },
          phone: {
            type: 'string',
            description: 'Phone number (for phone OTP)',
            example: '1234567890',
          },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['userId', 'refreshToken'],
        properties: {
          userId: {
            type: 'string',
            description: 'User MongoDB ObjectId',
            example: '507f1f77bcf86cd799439011',
          },
          refreshToken: {
            type: 'string',
            description: 'Valid refresh token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      LogoutRequest: {
        type: 'object',
        required: ['userId', 'refreshToken'],
        properties: {
          userId: {
            type: 'string',
            description: 'User MongoDB ObjectId',
            example: '507f1f77bcf86cd799439011',
          },
          refreshToken: {
            type: 'string',
            description: 'Valid refresh token to invalidate',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            oneOf: [
              { $ref: '#/components/schemas/Customer' },
              { $ref: '#/components/schemas/Vendor' },
              { $ref: '#/components/schemas/Driver' },
            ],
          },
          accessToken: {
            type: 'string',
            description: 'JWT access token (15min TTL)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'Refresh token (30 days TTL)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          fullyVerified: {
            type: 'boolean',
            description: 'Whether both email and phone are verified',
            example: true,
          },
          limited: {
            type: 'boolean',
            description: 'True if vendor/driver account not yet confirmed',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Contextual status message',
            example: 'Login successful',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Operation completed successfully',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Validation failed',
          },
          error: {
            type: 'string',
            description: 'Error details',
            example: 'Invalid email format',
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Service status',
            example: 'OK',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Current timestamp',
          },
          uptime: {
            type: 'number',
            description: 'Service uptime in seconds',
            example: 3600,
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Auth - Customer',
      description: 'Authentication endpoints for customers',
    },
    {
      name: 'Auth - Vendor',
      description: 'Authentication endpoints for vendors',
    },
    {
      name: 'Auth - Driver',
      description: 'Authentication endpoints for drivers',
    },
    {
      name: 'Secure',
      description: 'Protected endpoints requiring authentication and verification',
    },
  ],
};

// Options for the swagger specification
const options = {
  swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './server.js',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi,
};