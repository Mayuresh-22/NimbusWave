import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "../pages/HomePage"
import App from "../App"
import ChatPage from "../pages/ChatPage"


export default function AppNavigator() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<App />}>
          <Route path="" element={<HomePage />} />
          <Route path="/deploy/:projectId?" element={<ChatPage />} />
          <Route path="/about" element={<h1>About</h1>} />
          <Route path="/pricing" element={<h1>Pricing</h1>} />
          <Route path="/docs" element={<h1>Docs</h1>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}