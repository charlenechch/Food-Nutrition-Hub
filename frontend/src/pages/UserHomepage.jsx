import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserHomepage.css"; // keep styling consistent
import Header from "../components/Header";
import Footer from "../components/Footer";


export default function UserHomepage({ recentFoods = [], stats = {} }) {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <Header />

      {/* Hero Section */}
      <header className="hero">
        <h1>Welcome to SarawakEats</h1>
        <p>Discover and preserve Sarawak's rich culinary heritage</p>
      </header>

      {/* Feature Cards */}
      <section className="features">
        <div className="feature-card">
        <div className="feature-icon">🔍</div>
        <h3>Explore Foods</h3>
        <p>Discover traditional Sarawakian dishes and their stories</p>
        <button className="feature-btn">Explore Now</button>
      </div>

      <div className="feature-card">
        <div className="feature-icon">🧠</div>
        <h3>Nutrition Analyzer</h3>
        <p>Get AI-powered nutrition analysis and healthy alternatives</p>
        <button className="feature-btn">Start Analysis</button>
      </div>

      <div className="feature-card">
        <div className="feature-icon">👤</div>
        <h3>My Profile</h3>
        <p>Manage your preferences and saved foods</p>
        <button className="feature-btn">View Profile</button>
      </div>
      </section>

      {/* Featured + Recently Added */}
      <section className="content-section">
        <div className="featured">
          <img src="https://placehold.co/600x300" alt="Featured Food" />
          <h4>Featured This Week</h4>
          <p><b>Manok Pansoh</b> – Traditional Iban chicken cooked in bamboo with aromatic herbs</p>
          <button>Learn More</button>
        </div>

        <div className="recent-foods">
          <h4>Recently Added Foods</h4>
          <ul>
            {recentFoods.map((food, i) => (
              <li key={i} onClick={() => navigate(`/foods/${food.name}`)}>
                <img src={food.image} alt={food.name} />
                <div>
                  <p>{food.name}</p>
                  <span>{food.category}</span>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate("/foods")}>Explore Now</button>
        </div>
      </section>

      {/* Community Stats */}
      <section className="stats">
        <div>
          <h2>{stats.dishes || 0}</h2>
          <p>Traditional Dishes</p>
        </div>
        <div>
          <h2>{stats.recipes || 0}</h2>
          <p>Community Recipes</p>
        </div>
        <div>
          <h2>{stats.members || 0}</h2>
          <p>Active Members</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
