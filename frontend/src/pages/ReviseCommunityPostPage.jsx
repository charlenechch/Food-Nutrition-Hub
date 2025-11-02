// src/pages/ReviseCommunityPostPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORIGIN_OPTIONS = [
  "Iban",
  "Melanau",
  "Bidayuh",
  "Dayak",
  "Malay",
  "Chinese",
  "Indigenous",
  "Multi-ethnic",
];

export default function ReviseCommunityPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get real data from navigation state
  const { contribution, adminFeedback, fieldsWithIssues } = location.state || {};

  // Use real field names that match your backend
  const [form, setForm] = useState({
    title: "", // Changed from foodName to title
    culturalOrigin: "", // Changed from origin to culturalOrigin
    content: "", // Changed from culturalStory to content
    recipe: "",
    image: "" // Changed from imageData to image
  });

  // Initialize form with real contribution data using correct field names
  useEffect(() => {
    if (contribution) {
      console.log("📝 Initializing form with real contribution:", contribution);
      setForm({
        title: contribution.title || "",
        culturalOrigin: contribution.culturalOrigin || "",
        content: contribution.content || "",
        recipe: contribution.recipe || "",
        image: contribution.image || ""
      });
    }
  }, [contribution]);

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((prev) => ({ ...prev, image: reader.result })); // Changed to image
    reader.readAsDataURL(file);
  };

  const submitRevision = async (e) => {
    e.preventDefault();

    // Build revised payload with correct field names
    const revisedPayload = {
      title: form.title.trim(),
      culturalOrigin: form.culturalOrigin,
      content: form.content.trim(),
      recipe: form.recipe,
      status: "pending" // Reset to pending for review
    };

    console.log("REVISED COMMUNITY POST ▶", {
      id: id,
      revisedPayload
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/reviseCommunityPost/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(revisedPayload),
      });

      if (!res.ok) {
        throw new Error("Failed to update community post");
      }

      const result = await res.json();
      
      if (result.success) {
        alert("Revision submitted! We'll review it shortly.");
        navigate(-1);
      }
    } catch (err) {
      console.error("❌ Error submitting revision:", err);
      alert("Failed to submit revision. Please try again.");
    }
  };

  // Check which fields need fixing
  const needsFix = new Set(fieldsWithIssues || []);

  if (!contribution) {
    return (
      <div className="revise-recipe-page">
        <Header />
        <div className="upp-page">
          <div className="upp-wrap">
            <div className="rcp-error">
              <h2>Error</h2>
              <p>No community post data found for revision.</p>
              <button 
                className="lrp-btn lrp-btn-primary"
                onClick={() => navigate("/profile")}
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="revise-recipe-page">
      <Header />

      <div className="upp-page">
        <div className="upp-wrap">
          <button
            className="lrp-btn lrp-btn-outline rcp-back"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="rcp-wrap">
            <h2 className="rp-title">Revise Community Contribution</h2>
            <p className="upp-muted" style={{ marginBottom: 16 }}>
              Fix the highlighted fields and resubmit. Your original submission
              date:{" "}
              {contribution.submittedDate ? new Date(contribution.submittedDate).toLocaleDateString("en-GB") : "Unknown"}
            </p>

            {adminFeedback ? (
              <div
                className="upp-card"
                style={{ borderColor: "#ffd6d6", background: "#fff8f8" }}
              >
                <div className="upp-strong" style={{ marginBottom: 6 }}>
                  Reviewer Feedback
                </div>
                <div>{adminFeedback}</div>
              </div>
            ) : null}

            <form className="rp-form" onSubmit={submitRevision}>
              {/* Food Name + Cultural Origin */}
              <div className="rp-grid-2">
                <div
                  className={`rp-field ${
                    needsFix.has("title") || needsFix.has("foodName") ? "needs-fix" : ""
                  }`}
                >
                  <label>Food Name *</label>
                  <input
                    name="title" // Changed to title
                    value={form.title} // Changed to title
                    onChange={onChangeForm}
                    placeholder="e.g., Manok Pansoh"
                    required
                  />
                </div>

                <div
                  className={`rp-field ${
                    needsFix.has("culturalOrigin") || needsFix.has("origin") ? "needs-fix" : ""
                  }`}
                >
                  <label>Cultural Origin *</label>
                  <select
                    name="culturalOrigin" // Changed to culturalOrigin
                    value={form.culturalOrigin} // Changed to culturalOrigin
                    onChange={onChangeForm}
                    required
                  >
                    <option value="">Select Origin</option>
                    {ORIGIN_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cultural Story */}
              <div
                className={`rp-field ${
                  needsFix.has("content") || needsFix.has("culturalStory") ? "needs-fix" : ""
                }`}
              >
                <label>Cultural Story *</label>
                <textarea
                  name="content" // Changed to content
                  value={form.content} // Changed to content
                  onChange={onChangeForm}
                  placeholder="Tell us the story behind this dish—when is it served, how is it meaningful to your community, etc."
                  required
                />
              </div>

              {/* Recipe (Optional) */}
              <div className="rp-field">
                <label>Recipe (Optional)</label>
                <textarea
                  name="recipe"
                  value={form.recipe}
                  onChange={onChangeForm}
                  placeholder="Share the recipe if you'd like (optional)"
                />
              </div>

              {/* Upload Photo */}
              <div
                className={`rp-field ${
                  needsFix.has("image") || needsFix.has("imageData") ? "needs-fix" : ""
                }`}
              >
                <label>Upload Photo *</label>
                <div
                  className="upload-box"
                  onClick={() =>
                    document.getElementById("ccp-file-input").click()
                  }
                  role="button"
                  tabIndex={0}
                >
                  {form.image ? ( // Changed to image
                    <img
                      src={form.image} // Changed to image
                      alt="Preview"
                      className="preview-img"
                    />
                  ) : (
                    <div className="upload-placeholder">
                      <FaCamera className="camera-icon" />
                      <p>Click to upload</p>
                    </div>
                  )}
                </div>
                <input
                  id="ccp-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                  required={!form.image} // Changed to image
                />
              </div>

              {/* Actions */}
              <div className="rp-actions">
                <button className="rp-btn rp-submit" type="submit">
                  Submit Revision
                </button>
                <button
                  className="rp-btn rp-btn-muted"
                  type="button"
                  onClick={() => setForm({
                    title: contribution.title || "",
                    culturalOrigin: contribution.culturalOrigin || "",
                    content: contribution.content || "",
                    recipe: contribution.recipe || "",
                    image: contribution.image || ""
                  })}
                >
                  Reset
                </button>
                <button
                  className="rp-btn rp-btn-muted"
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}