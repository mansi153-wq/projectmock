import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* placeholders — real pages come in Phase 5 and Phase 9 */}
        <Route path="/admin/dashboard" element={<h2>Admin Dashboard (coming in Phase 5)</h2>} />
        <Route path="/student/dashboard" element={<h2>Student Dashboard (coming in Phase 9)</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
