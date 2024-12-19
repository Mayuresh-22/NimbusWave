import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "../pages/HomePage"
import OnboardPage from "../pages/OnboardPage"


export default function AppNavigator() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboard" element={<OnboardPage />} />
        <Route path="/about" element={<h1>About</h1>} />
      </Routes>
    </BrowserRouter>
  )
}