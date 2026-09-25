import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, homeFor } from './context/AuthContext';
import { StudentLayout } from './components/layout/StudentLayout';
import { LandingPage } from './pages/LandingPage';
import { StudentLogin } from './pages/StudentLogin';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProjectOverview } from './pages/ProjectOverview';
import { MentorChat } from './pages/MentorChat';
import { KnowledgeAndRequirements } from './pages/KnowledgeAndRequirements';
import { StudentProfile } from './pages/StudentProfile';

// Mentor Experience Dashboard
import MentorLayout from './pages/mentor/MentorLayout';
import MentorDashboard from './pages/mentor/MentorDashboard';
import Escalations from './pages/mentor/Escalations';
import EscalationDetails from './pages/mentor/EscalationDetails';
import Students from './pages/mentor/Students';
import StudentDetails from './pages/mentor/StudentDetails';
import Requirements from './pages/mentor/Requirements';
import RunTrails from './pages/mentor/RunTrails';

// Route guard: signed in, and in the right role for this part of the app
const ProtectedRoute = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homeFor(user)} replace />;
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

          {/* Student Experience Portal */}
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="project" element={<ProjectOverview />} />
            <Route path="mentor" element={<MentorChat />} />
            <Route path="knowledge" element={<KnowledgeAndRequirements />} />
            <Route path="requirements" element={<Navigate to="/student/knowledge" replace />} />
            <Route path="guidance" element={<Navigate to="/student/mentor" replace />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          {/* Mentor desk: dashboard, escalations and students, all on live data */}
          <Route
            path="/mentor"
            element={
              <ProtectedRoute roles={['mentor', 'admin']}>
                <MentorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/mentor/dashboard" replace />} />
            <Route path="desk" element={<Navigate to="/mentor/escalations" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="escalations" element={<Escalations />} />
            <Route path="escalations/:id" element={<EscalationDetails />} />
            <Route path="requirements" element={<Requirements />} />
            <Route path="runs" element={<RunTrails />} />
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
