import { Routes, Route } from "react-router-dom"
import GlobalLayout from "./components/layout/GlobalLayout"
import Landing from "./pages/Landing"
import Dashboard from "./pages/Dashboard"
import Validate from "./pages/Validate"
import Policies from "./pages/Policies"
import Audit from "./pages/Audit"
import RunDetail from "./pages/RunDetail"
import CurrentRun from "./pages/CurrentRun"

function App() {
  return (
    <Routes>
      <Route path="/" element={<GlobalLayout />}>
        <Route index element={<Landing />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="current-run" element={<CurrentRun />} />
        <Route path="validate"  element={<Validate />} />
        <Route path="policies"  element={<Policies />} />
        <Route path="audit"     element={<Audit />} />
        <Route path="run/:id"   element={<RunDetail />} />
      </Route>
    </Routes>
  )
}

export default App
