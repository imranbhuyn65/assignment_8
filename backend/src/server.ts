import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import academicRoutes from './routes/academic';
import extrasRoutes from './routes/extras';

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', university: 'Daffodil International University (DIU)' });
});

app.use('/api/auth', authRoutes);
app.use('/api', academicRoutes);
app.use('/api', extrasRoutes);

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI || undefined; // empty = embedded database

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`[Express] DIU Backend API running on http://localhost:${PORT}`);
  });
});
