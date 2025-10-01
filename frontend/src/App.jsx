import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import UserHomepage from "./pages/UserHomepage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default page */}
        <Route path="/" element={<LoginRegisterPage />} />

        {/* Future routes (placeholders) */}
        <Route path="/foods" element={<h2>ExploreFoodsPage</h2>} />
        <Route path="/analyzer" element={<h2>NutritionAnalyzerPage</h2>} />
        <Route path="/recipes" element={<h2>RecipesPage</h2>} />
        <Route path="/community" element={<h2>CommunityPage</h2>} />
        <Route path="/profile" element={<h2>User Profile Page</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
