import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import UserHomepage from "./pages/UserHomepage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default page */}
        <Route path="/" element={<LoginRegisterPage />} />

        {/* Homepage with dummy props (later from MySQL/API) */}
        <Route
          path="/home"
          element={
            <UserHomepage
              recentFoods={[
                { name: "Umai", category: "Seafood", image: "https://placehold.co/80" },
                { name: "Midin Belacan", category: "Vegetables", image: "https://placehold.co/80" },
                { name: "Kasam Babi", category: "Fermented", image: "https://placehold.co/80" },
              ]}
              stats={{
                dishes: 127,
                recipes: 89,
                members: 1234,
              }}
            />
          }
        />

        {/* Future routes (placeholders) */}
        <Route path="/foods" element={<h2>Explore Foods Page</h2>} />
        <Route path="/analyzer" element={<h2>Nutrition Analyzer Page</h2>} />
        <Route path="/recipes" element={<h2>Recipes Page</h2>} />
        <Route path="/community" element={<h2>Community Page</h2>} />
        <Route path="/profile" element={<h2>User Profile Page</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
