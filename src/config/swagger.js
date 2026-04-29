import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TukPatrol API',
      version: '1.0.0',
      description: 'Real-Time Three-Wheeler Tracking and Movement Logging System for Sri Lanka Law Enforcement.\n\n**Timestamps:** All `createdAt`, `updatedAt`, and `timestamp` fields in responses are in **UTC** (ISO 8601). Sri Lanka Standard Time is UTC+05:30. When supplying `from`/`to` query parameters, naive datetimes (no offset) are automatically interpreted as SLT (UTC+05:30).'
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
            _id:       { type: 'string' },
            name:      { type: 'string', example: 'Western' },
            code:      { type: 'string', example: 'WP' },
            createdAt: { type: 'string', format: 'date-time', description: 'UTC timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'UTC timestamp' }
          }
        },
        District: {
          type: 'object',
          properties: {
            _id:       { type: 'string' },
            name:      { type: 'string', example: 'Colombo' },
            code:      { type: 'string', example: 'COL' },
            province:  { $ref: '#/components/schemas/Province' },
            createdAt: { type: 'string', format: 'date-time', description: 'UTC timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'UTC timestamp' }
          }
        },
        PoliceStation: {
          type: 'object',
          properties: {
            _id:           { type: 'string' },
            name:          { type: 'string', example: 'Colombo Fort Police Station' },
            code:          { type: 'string', example: 'CF' },
            district:      { $ref: '#/components/schemas/District' },
            province:      { $ref: '#/components/schemas/Province' },
            address:       { type: 'string' },
            contactNumber: { type: 'string' },
            createdAt:     { type: 'string', format: 'date-time', description: 'UTC timestamp' },
            updatedAt:     { type: 'string', format: 'date-time', description: 'UTC timestamp' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id:      { type: 'string' },
            name:     { type: 'string', example: 'HQ Administrator' },
            email:    { type: 'string', example: 'admin@slpolice.lk' },
            role:     { type: 'string', enum: ['HQ_ADMIN', 'PROVINCIAL', 'STATION', 'DEVICE'] },
            registrationNumber: { type: 'string', example: 'WP-0001', description: 'Linked tuk-tuk registration number (DEVICE role only)' },
            isActive: { type: 'boolean', example: true },
            province: { $ref: '#/components/schemas/Province' },
            district: { $ref: '#/components/schemas/District' },
            station:  { $ref: '#/components/schemas/PoliceStation' },
            createdAt: { type: 'string', format: 'date-time', description: 'UTC timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'UTC timestamp' }
          }
        },
        TukTuk: {
          type: 'object',
          properties: {
            _id:                { type: 'string' },
            registrationNumber: { type: 'string', example: 'WP-0001' },
            deviceId:           { type: 'string', example: 'DEV-0001' },
            driverName:         { type: 'string', example: 'Kamal Perera' },
            driverNIC:          { type: 'string', example: '198512340001V' },
            driverContact:      { type: 'string', example: '0771234567' },
            province:           { $ref: '#/components/schemas/Province' },
            district:           { $ref: '#/components/schemas/District' },
            station:            { $ref: '#/components/schemas/PoliceStation' },
            isActive:           { type: 'boolean', example: true },
            createdAt:          { type: 'string', format: 'date-time', description: 'UTC timestamp' },
            updatedAt:          { type: 'string', format: 'date-time', description: 'UTC timestamp' }
          }
        },
        LocationPing: {
          type: 'object',
          properties: {
            _id:             { type: 'string' },
            tukTuk:          { type: 'string' },
            latitude:        { type: 'number', example: 6.9271 },
            longitude:       { type: 'number', example: 79.8612 },
            speed:           { type: 'number', example: 35.5 },
            heading:         { type: 'number', example: 180 },
            batteryLevel:    { type: 'number', example: 72, description: 'Device battery level (0–100%)' },
            signalStrength:  { type: 'string', enum: ['strong', 'moderate', 'weak'], example: 'strong', description: 'GPS/cellular signal quality' },
            isEngineOn:      { type: 'boolean', example: true, description: 'Whether the engine is running at ping time' },
            passengerCount:  { type: 'integer', example: 2, description: 'Estimated number of passengers' },
            timestamp:       { type: 'string', format: 'date-time', description: 'UTC timestamp of when the ping was recorded' },
            createdAt:       { type: 'string', format: 'date-time', description: 'UTC timestamp' },
            updatedAt:       { type: 'string', format: 'date-time', description: 'UTC timestamp' }
          }
        },
        Error: {
          type: 'object',
          required: ['code', 'message', 'description', 'moreInfo'],
          properties: {
            code:        { type: 'string', example: '401' },
            message:     { type: 'string', example: 'Unauthorized' },
            description: { type: 'string', example: 'Not authorized, no token' },
            moreInfo:    { type: 'string', example: '' }
          }
        }
      },
      // ── Reusable response definitions ──────────────────────────────────────
      // Reference in route files as: $ref: '#/components/responses/Unauthorized'
      responses: {
        BadRequest: {
          description: '400 Bad Request — invalid input or missing required field',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        Unauthorized: {
          description: '401 Unauthorized — authentication token missing or invalid',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        Forbidden: {
          description: '403 Forbidden — authenticated but lacks permission for this action',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        NotFound: {
          description: '404 Not Found — requested resource does not exist',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        Conflict: {
          description: '409 Conflict — duplicate entry or resource already exists',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        UnprocessableEntity: {
          description: '422 Unprocessable Entity — well-formed request but failed semantic validation',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        InternalServerError: {
          description: '500 Internal Server Error — unexpected failure on the server',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    tags: [
      { name: 'Auth',      description: 'Authentication — login, register (HQ_ADMIN only), and current user profile' },
      { name: 'Users',     description: 'User account management — list, view, update, deactivate (HQ_ADMIN only)' },
      { name: 'Provinces', description: 'Province administration — read (all roles), write (HQ_ADMIN only)' },
      { name: 'Districts', description: 'District administration — read (all roles), write (HQ_ADMIN only)' },
      { name: 'Police Stations',  description: 'Police station administration — read (all roles), write (HQ_ADMIN only)' },
      { name: 'TukTuks',   description: 'TukTuk registration and fleet management — POST/PUT (HQ_ADMIN, PROVINCIAL), DELETE/activate/deactivate (HQ_ADMIN only)' },
      { name: 'Location',  description: 'Real-time tracking, investigative logging and anomaly detection — ping (DEVICE only), history/anomalies (HQ_ADMIN, PROVINCIAL, STATION)' }
    ],
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);