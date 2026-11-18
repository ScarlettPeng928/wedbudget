import { Navigate, Route, Routes } from 'react-router';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage';
import VendorsPage from './pages/VendorsPage';
import SavedPage from './pages/SavedPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plan" element={<PlanPage />} />
      {/* The plan used to live here; old links still arrive. */}
      <Route path="/plan/results" element={<Navigate to="/plan" replace />} />
      <Route path="/vendors/:category" element={<VendorsPage />} />
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/shortlist" element={<Navigate to="/saved" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
