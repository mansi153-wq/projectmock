import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CreateExam from './pages/CreateExam';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-exam"
          element={
            <ProtectedRoute allowedRole="admin">
              <CreateExam />
            </ProtectedRoute>
          }
        />

        {/* placeholder — real page comes in Phase 9 */}
        <Route path="/student/dashboard" element={<h2>Student Dashboard (coming in Phase 9)</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
