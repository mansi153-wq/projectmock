const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const examRoutes = require('./routes/exam.routes');
const generateRoutes = require('./routes/generate.routes');
const studentRoutes = require('./routes/student.routes');
const attemptRoutes = require('./routes/attempt.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

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
app.use('/api/student', studentRoutes);
app.use('/api/attempts', attemptRoutes);

app.use(errorHandler);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Student joins an exam room to receive leaderboard updates
  socket.on('join:exam', (examId) => {
    socket.join(`exam_${examId}`);
    console.log(`Socket ${socket.id} joined exam_${examId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
