// src/pages/ReviseCommunityPostPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state passed from UserProfilePage
  const { contribution, adminFeedback, fieldsWithIssues } = location.state || {};

  const [form, setForm] = useState({
    foodName: "",
    origin: "",
    culturalStory: "",
    recipe: "",
    imageData: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize form with contribution data
  useEffect(() => {
    if (contribution) {
      console.log("📝 Initializing form with contribution:", contribution);
      setForm({
        foodName: contribution.title || "",
        origin: contribution.culturalOrigin || "",
        culturalStory: contribution.content || "",
        recipe: contribution.recipe || "",
        imageData: contribution.image || "" // Use existing image if available
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
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      setForm((prev) => ({ ...prev, imageData: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitRevision = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("📤 Submitting revision for post:", id);
      console.log("📤 Form data:", form);

      const res = await fetch(`${API_BASE_URL}/api/reviseCommunityPost/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.foodName.trim(),
          culturalOrigin: form.origin,
          content: form.culturalStory.trim(),
          recipe: form.recipe,
          status: "pending" // Reset to pending for admin review
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update community post");
      }

      const result = await res.json();
      
      if (result.success) {
        setSuccess("Revision submitted successfully! It will be reviewed again.");
        setTimeout(() => {
          navigate("/profile"); // Go back to profile page
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Error submitting revision:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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
            onClick={() => navigate("/profile")}
          >
            ← Back to Profile
          </button>

          <div className="rcp-wrap">
            <h2 className="rp-title">Revise Community Contribution</h2>
            <p className="upp-muted" style={{ marginBottom: 16 }}>
              Fix the highlighted fields and resubmit. Original submission date:{" "}
              {contribution.submittedDate ? new Date(contribution.submittedDate).toLocaleDateString("en-GB") : "Unknown"}
            </p>

            {/* Admin Feedback */}
            {adminFeedback && (
              <div
                className="upp-card"
                style={{ borderColor: "#ffd6d6", background: "#fff8f8" }}
              >
                <div className="upp-strong" style={{ marginBottom: 6 }}>
                  Admin Feedback
                </div>
                <div>{adminFeedback}</div>
                {fieldsWithIssues && fieldsWithIssues.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <div className="upp-strong">Areas needing improvement:</div>
                    <ul>
                      {fieldsWithIssues.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="rcp-error-message">
                {error}
              </div>
            )}
            {success && (
              <div className="rcp-success-message">
                {success}
              </div>
            )}

            <form className="rp-form" onSubmit={submitRevision}>
              {/* Food Name + Cultural Origin */}
              <div className="rp-grid-2">
                <div
                  className={`rp-field ${
                    needsFix.has("foodName") || needsFix.has("title") ? "needs-fix" : ""
                  }`}
                >
                  <label>Food Name *</label>
                  <input
                    name="foodName"
                    value={form.foodName}
                    onChange={onChangeForm}
                    placeholder="e.g., Manok Pansoh"
                    required
                  />
                </div>

                <div
                  className={`rp-field ${
                    needsFix.has("origin") || needsFix.has("culturalOrigin") ? "needs-fix" : ""
                  }`}
                >
                  <label>Cultural Origin *</label>
                  <select
                    name="origin"
                    value={form.origin}
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
                  needsFix.has("culturalStory") || needsFix.has("content") ? "needs-fix" : ""
                }`}
              >
                <label>Cultural Story *</label>
                <textarea
                  name="culturalStory"
                  value={form.culturalStory}
                  onChange={onChangeForm}
                  placeholder="Tell us the story behind this dish—when is it served, how is it meaningful to your community, etc."
                  required
                  rows={6}
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
                  rows={4}
                />
              </div>

              {/* Current Image Preview */}
              {contribution.image && (
                <div className="rp-field">
                  <label>Current Image</label>
                  <div style={{ marginTop: "8px" }}>
                    <img 
                      src={contribution.image} 
                      alt="Current" 
                      style={{ 
                        maxWidth: "200px", 
                        maxHeight: "200px", 
                        borderRadius: "8px" 
                      }} 
                    />
                    <p className="upp-muted" style={{ marginTop: "4px" }}>
                      Note: To change the image, please contact admin as image updates require special handling.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="rp-actions">
                <button 
                  className="rp-btn rp-submit" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Revision"}
                </button>
                <button
                  className="rp-btn rp-btn-muted"
                  type="button"
                  onClick={() => navigate("/profile")}
                  disabled={isLoading}
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