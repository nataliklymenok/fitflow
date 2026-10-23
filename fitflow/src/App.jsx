import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import RequirePlan from './components/RequirePlan.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import SessionPage from './pages/SessionPage.jsx'
import TodayPage from './pages/TodayPage.jsx'
import TrainerPage from './pages/TrainerPage.jsx'
import TrainersPage from './pages/TrainersPage.jsx'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/trainers" element={<TrainersPage />} />
        <Route path="/trainers/:id" element={<TrainerPage />} />
        <Route
          path="/today"
          element={
            <RequirePlan>
              <TodayPage />
            </RequirePlan>
          }
        />
        <Route
          path="/calendar"
          element={
            <RequirePlan>
              <CalendarPage />
            </RequirePlan>
          }
        />
        <Route
          path="/session/:id"
          element={
            <RequirePlan>
              <SessionPage />
            </RequirePlan>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
