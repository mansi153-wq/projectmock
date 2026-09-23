import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CreateExam from './pages/CreateExam';
import GenerateQuestions from './pages/GenerateQuestions';
import MyExams from './pages/admin/MyExams';
import LiveLeaderboard from './pages/admin/LiveLeaderboard';
import ExamLeaderboard from './pages/admin/ExamLeaderboard';
import ExamStudents from './pages/admin/ExamStudents';
import StudentReport from './pages/admin/StudentReport';
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableExams from './pages/student/AvailableExams';
import JoinExam from './pages/student/JoinExam';
import WaitingRoom from './pages/student/WaitingRoom';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import LeaderboardPage from './pages/student/LeaderboardPage';
import MyResults from './pages/student/MyResults';
import MyReports from './pages/student/MyReports';
import Profile from './pages/student/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/my-exams" element={
          <ProtectedRoute allowedRole="admin"><MyExams /></ProtectedRoute>
        } />
        <Route path="/admin/create-exam" element={
          <ProtectedRoute allowedRole="admin"><CreateExam /></ProtectedRoute>
        } />
        <Route path="/admin/live-leaderboard" element={
          <ProtectedRoute allowedRole="admin"><LiveLeaderboard /></ProtectedRoute>
        } />
        <Route path="/admin/exam/:examId/generate" element={
          <ProtectedRoute allowedRole="admin"><GenerateQuestions /></ProtectedRoute>
        } />
        <Route path="/admin/exam/:examId/leaderboard" element={
          <ProtectedRoute allowedRole="admin"><ExamLeaderboard /></ProtectedRoute>
        } />
        <Route path="/admin/exam/:examId/students" element={
          <ProtectedRoute allowedRole="admin"><ExamStudents /></ProtectedRoute>
        } />
        <Route path="/admin/report/:attemptId" element={
          <ProtectedRoute allowedRole="admin"><StudentReport /></ProtectedRoute>
        } />

        {/* Student */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/student/exams" element={
          <ProtectedRoute allowedRole="student"><AvailableExams /></ProtectedRoute>
        } />
        <Route path="/student/join" element={
          <ProtectedRoute allowedRole="student"><JoinExam /></ProtectedRoute>
        } />
        <Route path="/student/waiting/:attemptId" element={
          <ProtectedRoute allowedRole="student"><WaitingRoom /></ProtectedRoute>
        } />
        <Route path="/student/exam/:attemptId" element={
          <ProtectedRoute allowedRole="student"><ExamPage /></ProtectedRoute>
        } />
        <Route path="/student/result/:attemptId" element={
          <ProtectedRoute allowedRole="student"><ResultPage /></ProtectedRoute>
        } />
        <Route path="/student/leaderboard/:attemptId" element={
          <ProtectedRoute allowedRole="student"><LeaderboardPage /></ProtectedRoute>
        } />
        <Route path="/student/results" element={
          <ProtectedRoute allowedRole="student"><MyResults /></ProtectedRoute>
        } />
        <Route path="/student/reports" element={
          <ProtectedRoute allowedRole="student"><MyReports /></ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRole="student"><Profile /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
