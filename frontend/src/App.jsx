import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentLayout } from './components/layout/StudentLayout';
import { LandingPage } from './pages/LandingPage';
import { StudentLogin } from './pages/StudentLogin';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProjectOverview } from './pages/ProjectOverview';
import { MentorChat } from './pages/MentorChat';
import { GuidanceResponse } from './pages/GuidanceResponse';
import { KnowledgeAndRequirements } from './pages/KnowledgeAndRequirements';
import { StudentProfile } from './pages/StudentProfile';

// Mentor Experience Dashboard
import MentorLayout from './pages/mentor/MentorLayout';
import MentorDashboard from './pages/mentor/MentorDashboard';
import Escalations from './pages/mentor/Escalations';
import EscalationDetails from './pages/mentor/EscalationDetails';
import Students from './pages/mentor/Students';
import StudentDetails from './pages/mentor/StudentDetails';

// Protected Route Guard for Student Experience
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing & Auth Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<StudentLogin />} />

          {/* Student Experience Portal (Frontend 1) */}
          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="project" element={<ProjectOverview />} />
            <Route path="mentor" element={<MentorChat />} />
            <Route path="guidance" element={<GuidanceResponse />} />
            <Route path="requirements" element={<KnowledgeAndRequirements />} />
            <Route path="knowledge" element={<Navigate to="/student/requirements" replace />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          {/* Mentor Experience Dashboard (Frontend 2) */}
          <Route path="/mentor" element={<MentorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="escalations" element={<Escalations />} />
            <Route path="escalations/:id" element={<EscalationDetails />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentDetails />} />
          </Route>

          {/* Safe Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

