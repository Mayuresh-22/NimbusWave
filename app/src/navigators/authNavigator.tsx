import { BrowserRouter, Routes, Route } from "react-router";
import App from "../App";
import OnboardPage from "../pages/OnboardPage";
import HomePage from "../pages/HomePage";


export default function AuthNavigator() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<App />}>
          <Route path="" element={<HomePage />} />
          <Route path="/onboard" element={<OnboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}