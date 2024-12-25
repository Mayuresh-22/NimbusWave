import { BrowserRouter, Routes, Route } from "react-router";
import App from "../App";
import HomePage from "../pages/HomePage";
import OnboardPage from "../pages/OnboardPage";

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
  );
}
