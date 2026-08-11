const express = require('express');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const examRoutes = require('./routes/exam.routes');
const generateRoutes = require('./routes/generate.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI Mock Test backend is running');
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exams', generateRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});