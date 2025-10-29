import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes } from "react-icons/fa";

const ReviewContentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); 

  // ✅ Dummy placeholder data for now
  const dummyData = {
    1: {
        name: "Manok Pansoh",
        submitter: "Joanna Lee",
        email: "joanna.lee@sarawakeats.com",
        date: "2025-10-20",
        status: "Pending",
        origin: "Iban, Sarawak",
        culturalStory:
        "Manok Pansoh is a traditional Iban dish where chicken is cooked in bamboo with herbs and tapioca leaves. It’s often served during Gawai Dayak celebrations as a symbol of unity and gratitude.",
        recipe:
        "1. Marinate chicken with lemongrass, ginger, and salt. 2. Stuff into bamboo with tapioca leaves and seal. 3. Grill over open fire until bamboo slightly chars.",
        photo:
        "https://www.maggi.my/sites/default/files/styles/home_stage_1500_700/public/srh_recipes/73a79a77db7d6363d1b8c69c81eb2ed6.jpg?h=311c8a01&itok=SdfCij1m",
    },
    2: {
        name: "Laksa Sarawak",
        submitter: "Brian Tan",
        email: "brian.tan@sarawakeats.com",
        date: "2025-10-22",
        status: "Under Review",
        origin: "Kuching, Sarawak",
        culturalStory:
        "Laksa Sarawak is one of Sarawak’s most famous dishes, combining rice vermicelli, prawns, and chicken in a creamy, spicy broth made from laksa paste and coconut milk. It reflects the fusion of Malay, Chinese, and indigenous influences.",
        recipe:
        "1. Prepare laksa paste by frying chili, shallots, garlic, and spices. 2. Add coconut milk and simmer with stock. 3. Serve with noodles, prawns, chicken, and sambal belacan.",
        photo:
        "https://upload.wikimedia.org/wikipedia/commons/1/1d/Sarawak_Laksa.jpg",
    },
    3: {
        name: "Kuih Lapis Sarawak",
        submitter: "Lucy Goh",
        email: "lucy.goh@sarawakeats.com",
        date: "2025-10-23",
        status: "Pending",
        origin: "Kuching, Sarawak",
        culturalStory:
        "Kuih Lapis Sarawak, or Sarawak Layer Cake, is an iconic dessert known for its colorful layers and intricate patterns. It symbolizes celebration and creativity, commonly served during Hari Raya and Gawai festivals.",
        recipe:
        "1. Mix butter, condensed milk, and eggs. 2. Divide batter into colored portions. 3. Bake layer by layer until all colors are stacked.",
        photo:
        "https://upload.wikimedia.org/wikipedia/commons/b/b9/Sarawak_layer_cake.jpg",
    },
    4: {
        name: "Midin Belacan",
        submitter: "Alyssa Young",
        email: "alyssa.young@sarawakeats.com",
        date: "2025-10-25",
        status: "Rejected",
        origin: "Kuching, Sarawak",
        culturalStory:
        "Midin, a wild jungle fern native to Borneo, is stir-fried with shrimp paste (belacan) for a distinctive umami flavor. It’s a beloved local favorite, often featured in both home-cooked meals and restaurants.",
        // recipe is optional
        photo:
        "https://upload.wikimedia.org/wikipedia/commons/0/0d/Midin_Belacan_Sarawak.jpg",
    },
    };


  const submission = dummyData[id];

  if (!submission) {
    return <p className="text-center mt-20">Content not found.</p>;
  }

  return (
    <div className="review-content-page">
        <Header />

      <h2>Review Submission</h2>

      <div className="admin-review-content-header">
              <button className="admin-content-edit-back-btn" onClick={() => navigate("/admin")}>
                <span className="content-edit-btn"><FaArrowLeft /></span> Back to Moderation
              </button>
              <div className="review-title">
                <h2>Review Submission</h2>
                <p>{submission.name}</p>
              </div>
              <div className="content-edit-review-actions">
                <button
                  className="content-edit-approve-btn"
                  onClick={() => {
                    setModalType("approve");
                    setShowModal(true);
                  }}
                >
                  <span className="content-edit-btn"><FaCheck /></span> Approve
                </button>
                <button
                  className="content-edit-reject-btn"
                    onClick={() => {
                     setModalType("reject");
                     setShowModal(true);
                   }}
                >
                  <span className="content-edit-btn"><FaTimes /></span> Reject
                </button>
              </div>
        </div>

            {/* === Content === */}
        <div className="review-container">
            <div className="review-layout">
                {/* Left Panel */}
                <div className="review-left-sidebar">
                    <h3><FaFileAlt /> Submission Details</h3>
                    <div className="review-info">
                        <div className="info-label">
                            <FaUser className="left-sidebar-icon" />
                            <span> Submitted by</span>
                        </div>
                        <strong>{submission.submitter}</strong>
                        <p className="email">{submission.email}</p>
                    </div>

                    <div className="review-info">
                        <p><FaCalendarAlt /> Submission Date</p>
                        <strong>{submission.date}</strong>
                    </div>

                    <div className="review-info">
                        <p>Status</p>
                        <span className="status-tag">{submission.status}</span>
                    </div>
                </div>

                {/* Right Content */}
                <div className="review-main">
                    {/* === Uploaded Image === */}
                    <div className="review-section uploaded-image-card">
                        <h3><FaFileAlt /> Uploaded Image</h3>
                        <div className="uploaded-img-box">
                            <img
                            src={submission.photo || "https://via.placeholder.com/400x250?text=No+Image+Available"}
                            alt={submission.name}
                            className="uploaded-img"
                            />
                        </div>
                    </div>

                    {/* === Basic Info === */}
                    <div className="rcp-review-section rcp-info-grid">
                        <h3>Basic Information</h3>
                        <div className="rcp-info-grid">
                            <div className="rcp-info-item">
                                <h4>Food Name</h4>
                                <p>{submission.name}</p>
                            </div>
                            <div className="rcp-info-item">
                                <h4>Origin</h4>
                                <p>{submission.origin}</p>
                            </div>
                            <div className="rcp-info-item">
                                <h4>Cultural Story</h4>
                                <p>{submission.culturalStory}</p>
                            </div>
                            <div className="rcp-info-item">
                                <h4>Recipe (Optional)</h4>
                                <p>{submission.recipe}</p>
                            </div>
                        </div>
                    </div>

                    {/* === Admin Feedback === */}
                    <div className="rcp-review-section rcp-basic-info-grid">
                    <h3>Admin Feedback</h3>
                    <div className="rcp-edit-info-grid">
                        <div className="rcp-edit-info-item full-width">
                        <textarea
                            className="admin-feedback-input"
                            placeholder="Enter feedback for the submitter..."
                            rows="4"
                        ></textarea>
                        </div>
                    </div>
                    </div>

                </div>
            </div>
          </div>

          {showModal && (
                    <div className="confirm-overlay">
                      <div className="confirm-modal">
                        <h3>Warning</h3>
                        <p>
                          Are you sure you want to{" "}
                          <strong>{modalType === "approve" ? "approve" : "reject"}</strong> this recipe submission?
                          <br />This action cannot be undone.
                        </p>
                        <div className="confirm-buttons">
                          <button
                            className="cancel-btn"
                            onClick={() => setShowModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className={modalType === "approve" ? "approve-btn" : "delete-btn"}
                            onClick={() => {
                              const feedback = document.querySelector(".admin-feedback-input")?.value.trim() || "No feedback provided.";
                              setShowModal(false);
                              alert(
                                `${modalType === "approve" ? "✅ Approved" : "❌ Rejected"}\n\nAdmin Feedback:\n${feedback}`
                              );
                              navigate("/admin");
                            }}
                          >
                            {modalType === "approve" ? "Approve" : "Reject"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
        <Footer />
    </div>
  );
};

export default ReviewContentPage;
