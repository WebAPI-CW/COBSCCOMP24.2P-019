import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TukPatrol API',
      version: '1.0.0',
      description: 'Real-Time Three-Wheeler Tracking and Movement Logging System for Sri Lanka Law Enforcement'
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://tukpatrol-api.onrender.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production'
          ? 'Production Server'
          : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Province: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Western' },
            code: { type: 'string', example: 'WP' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        District: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Colombo' },
            code: { type: 'string', example: 'COL' },
            province: { $ref: '#/components/schemas/Province' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PoliceStation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Colombo Fort Police Station' },
            code: { type: 'string', example: 'ST001' },
            district: { $ref: '#/components/schemas/District' },
            province: { $ref: '#/components/schemas/Province' },
            address: { type: 'string' },
            contactNumber: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'HQ Administrator' },
            email: { type: 'string', example: 'admin@slpolice.lk' },
            role: {
              type: 'string',
              enum: ['HQ_ADMIN', 'PROVINCIAL', 'STATION', 'DEVICE']
            }
          }
        },
        Vehicle: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            registrationNumber: { type: 'string', example: 'WP-0001' },
            deviceId: { type: 'string', example: 'DEV-0001' },
            driverName: { type: 'string', example: 'Kamal Perera' },
            driverNIC: { type: 'string', example: '198512340001V' },
            driverContact: { type: 'string', example: '0771234567' },
            province: { $ref: '#/components/schemas/Province' },
            district: { $ref: '#/components/schemas/District' },
            station: { $ref: '#/components/schemas/PoliceStation' },
            isActive: { type: 'boolean', example: true }
          }
        },
        LocationPing: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            vehicle: { type: 'string' },
            latitude: { type: 'number', example: 6.9271 },
            longitude: { type: 'number', example: 79.8612 },
            speed: { type: 'number', example: 35.5 },
            heading: { type: 'number', example: 180 },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          required: ['code', 'message', 'description', 'moreInfo'],
          properties: {
            code: { type: 'string', example: '401' },
            message: { type: 'string', example: 'Unauthorized' },
            description: { type: 'string', example: 'Not authorized, no token' },
            moreInfo: { type: 'string', example: '' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);