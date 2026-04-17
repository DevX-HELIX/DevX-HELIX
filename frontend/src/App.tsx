import { Routes, Route, Navigate } from "react-router-dom"
import DashboardLayout from "./components/layout/DashboardLayout"
import Dashboard from "./pages/Dashboard"
import Policies from "./pages/Policies"
import Audit from "./pages/Audit"
import RunDetail from "./pages/RunDetail"

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="policies" element={<Policies />} />
        <Route path="audit" element={<Audit />} />
        <Route path="run/:id" element={<RunDetail />} />
      </Route>
    </Routes>
  )
}

export default App
