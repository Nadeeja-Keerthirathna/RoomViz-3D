import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RoomCreationPage from './pages/RoomCreationPage'
import Layout2DPage from './pages/Layout2DPage'
import View3DPage from './pages/View3DPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/room-creation" element={<RoomCreationPage />} />
      <Route path="/2d-layout" element={<Layout2DPage />} />
      <Route path="/3d-view" element={<View3DPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
