import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import storesRouter from './routes/stores.js';
import ownerRouter from './routes/owner.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());

app.use(express.json());


app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stores', storesRouter);
app.use('/api/owner', ownerRouter);


app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Store Rating API Server is running.' });
});

app.listen(PORT, '::', () => {
  console.log(`Store Rating API Server is listening on port ${PORT}`);
});
