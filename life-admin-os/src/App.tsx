import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { DocumentProvider } from './context/DocumentContext';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Vault } from './pages/Vault';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { TestLogin } from './pages/TestLogin';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <DocumentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/test" element={<TestLogin />} />
              <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="bottom-right" toastOptions={{
              style: {
                background: '#1E293B',
                color: '#fff',
                borderRadius: '4px',
                fontFamily: 'Inter, sans-serif'
              }
            }}/>
          </BrowserRouter>
        </DocumentProvider>
      </TaskProvider>
    </AuthProvider>
  );
}