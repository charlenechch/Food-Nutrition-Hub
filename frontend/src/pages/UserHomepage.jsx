import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserHomepage.css"; // keep styling consistent
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaAnglesDown } from "react-icons/fa6";


export default function UserHomepage({ recentFoods = [], stats = {} }) {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <Header />

      {/* Hero Section */}
      <header className="hero">
        <h1>Welcome to SarawakEats</h1>
        <p>Discover and preserve Sarawak's rich culinary heritage</p>

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

        {/* Scroll Button */}
        <div
        className="scroll-down"
        onClick={() => {
            document
              .getElementById("about-section")
              .scrollIntoView({ behavior: "smooth" })
          }
        }
      >
        <FaAnglesDown />
      </div>
      </header>

     {/* Next Section */}
      {/* <section id="about-section" className="about-section">
        <h2 className="about-title">🌏 Our Purpose</h2>
        <div className="about-container"> */}
          {/* Left side - text */}
          {/* <div className="about-text">
            <p>
              SarawakEats was created to preserve and celebrate Sarawak’s
              rich culinary heritage. Many traditional dishes are passed down
              only through word of mouth, and risk being forgotten in the modern era.
            </p>
            <p>
              Our goal is to digitize and share these recipes, cultural stories,
              and nutritional insights so that future generations can learn,
              appreciate, and sustain this heritage.
            </p>
            <p>
              By combining tradition with technology, we provide both locals
              and the global community a way to explore, analyze, and connect
              with Sarawak’s unique food culture.
            </p>
            <button className="about-btn">Learn More</button>
          </div> */}

          {/* Right side - image */}
          {/* <div className="about-image">
            <img src="../assets/homepage.jpg" alt="Sarawak Culture" />
          </div>
        </div>
      </section> */}

        

      {/* <Footer /> */}
    </div>
  );
}