// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import AdminHomepage from './pages/AdminHomepage';
import UserHomepage from "./pages/UserHomepage";
import ExploreFoodsPage from "./pages/ExploreFoodPage";
import NutritionAnalyzerPage from "./pages/NutritionAnalyzerPage";
import RecipesPage from "./pages/RecipesPage";
import CommunityPage from "./pages/Community";
import UserProfilePage from "./pages/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/loginregister" replace />} />
        <Route path="/loginregister" element={<LoginRegisterPage />} />

        {/* Public Pages */}
        <Route path="/home" element={<UserHomepage />} />
        <Route path="/foods" element={<ExploreFoodsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/community" element={<CommunityPage />} />

        {/* Nutrition Analyzer is PUBLIC (page visible to guests),
            the page itself will disable upload/analyze for guests. */}
        <Route path="/analyzer" element={<NutritionAnalyzerPage />} />

        {/* Protected Pages - profile and admin remain protected */}
        <Route
          path="/profile"
          element={
              <UserProfilePage />
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHomepage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
