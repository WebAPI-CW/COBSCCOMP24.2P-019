import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import provinceRoutes from './routes/provinceRoutes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/provinces', provinceRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'TukPatrol API is running' });
});

export default app;