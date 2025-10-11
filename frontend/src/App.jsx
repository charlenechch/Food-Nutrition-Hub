import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import AdminHomepage from "./pages/AdminHomepage";
import UserHomepage from "./pages/UserHomepage";
import ExploreFoodsPage from "./pages/ExploreFoodPage";
import NutritionAnalyzerPage from "./pages/NutritionAnalyzerPage";
import RecipesPage from "./pages/RecipesPage";
import CommunityPage from "./pages/Community";
import UserProfilePage from "./pages/UserProfile";
import ForgetPassword from "./pages/ForgotPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/loginregister" replace />} />
        <Route path="/loginregister" element={<LoginRegisterPage />} />

        {/* Public Pages */}
        <Route path="/forgotpassword" element={<ForgetPassword />} />
        <Route path="/home" element={<UserHomepage />} />
        <Route path="/foods" element={<ExploreFoodsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/community" element={<CommunityPage />} />

        {/* Nutrition Analyzer is public but guest has limited actions */}
        <Route path="/analyzer" element={<NutritionAnalyzerPage />} />

        {/* Protected Pages */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["member", "admin"]}>
              <UserProfilePage />
            </ProtectedRoute>
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
