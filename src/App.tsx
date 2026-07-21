import { Routes, Route } from 'react-router-dom';
import CreatePollPage from './pages/CreatePollPage';
import PollCreatedPage from './pages/PollCreatedPage';
import VotePage from './pages/VotePage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreatePollPage />} />
      <Route path="/created" element={<PollCreatedPage />} />
      <Route path="/poll/:id" element={<VotePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
