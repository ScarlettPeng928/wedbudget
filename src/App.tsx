import { Route, Routes } from 'react-router';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage';
import ResultsPage from './pages/ResultsPage';
import VendorsPage from './pages/VendorsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/plan/results" element={<ResultsPage />} />
      <Route path="/vendors/:category" element={<VendorsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
