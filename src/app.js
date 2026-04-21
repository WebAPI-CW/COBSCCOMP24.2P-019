import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import provinceRoutes from './routes/provinceRoutes.js';
import districtRoutes from './routes/districtRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { APIError } from './utils/apiError.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security and middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Reads from env or allows all
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Request logging (dev environment)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: '429',
    message: 'Too Many Requests',
    description: 'You have exceeded the request limit. Please try again later.',
    moreInfo: ''
  }
});
app.use('/api/', limiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/provinces', provinceRoutes);
app.use('/api/v1/districts', districtRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/locations', locationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TukPatrol API is running' });
});

// Catch-all route for unhandled 404s
app.use((req, res, next) => {
  next(new APIError(404, 'Not Found', `Cannot find ${req.originalUrl} on this server`));
});

app.use(errorHandler);

export default app;