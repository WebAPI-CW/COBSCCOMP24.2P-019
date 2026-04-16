import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import provinceRoutes from './routes/provinceRoutes.js';
import districtRoutes from './routes/districtRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/provinces', provinceRoutes);
app.use('/api/v1/districts', districtRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/locations', locationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TukPatrol API is running' });
});

export default app;