import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import UserHomepage from "./pages/UserHomepage";
import ExploreFoodsPage from "./pages/ExploreFoodPage";
import NutritionAnalyzerPage from "./pages/NutritionAnalyzerPage";
import RecipesPage from "./pages/RecipesPage";
import CommunityPage from "./pages/Community";
import UserProfilePage from "./pages/UserProfile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root path to loginregister */}
        <Route path="/" element={<Navigate to="/loginregister" replace />} />
        <Route path="/loginregister" element={<LoginRegisterPage />} />

        {/* Other pages */}
        <Route path="/home" element={<UserHomepage />} />
        <Route path="/foods" element={<ExploreFoodsPage />} />
        <Route path="/analyzer" element={<NutritionAnalyzerPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;

