import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import UserHomepage from "./pages/UserHomepage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default page */}
        <Route path="/loginregister" element={<LoginRegisterPage />} />

        {/* Future routes (placeholders) */}
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
