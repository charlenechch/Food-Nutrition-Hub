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

  const [form, setForm] = useState({
    title: "",
    culturalOrigin: "",
    content: "",
    recipe: "",
    image: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize form with real contribution data
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
      setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitRevision = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      console.log("📤 Submitting community post revision for ID:", id);
      console.log("📤 Form data:", form);

      // Build revised payload
      const revisedData = {
        title: form.title.trim(),
        culturalOrigin: form.culturalOrigin,
        content: form.content.trim(),
        recipe: form.recipe,
        status: "Pending" // ✅ Reset status to Pending for re-review
      };

      console.log("📤 Sending to API:", revisedData);

      const res = await fetch(`${API_BASE_URL}/api/reviseCommunityPost/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: "include",
        body: JSON.stringify(revisedData),
      });

      console.log("📥 Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to update community post (${res.status})`);
      }

      const result = await res.json();
      console.log('✅ Update successful:', result);
      
      if (result.success) {
        setSuccess("Community post revised successfully! It has been resubmitted for admin review.");
        setTimeout(() => {
          navigate("/profile"); // Go back to profile page
        }, 2000);
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (err) {
      console.error("❌ Error submitting revision:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
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
              Fix the highlighted fields and resubmit. Your original submission
              date:{" "}
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
                    needsFix.has("title") || needsFix.has("foodName") ? "needs-fix" : ""
                  }`}
                >
                  <label>Food Name *</label>
                  <input
                    name="title"
                    value={form.title}
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
                    name="culturalOrigin"
                    value={form.culturalOrigin}
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
                  name="content"
                  value={form.content}
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
                  {form.image ? (
                    <img
                      src={form.image}
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
                  required={!form.image}
                />
              </div>

              {/* Actions */}
              <div className="rp-actions">
                <button 
                  className="rp-btn rp-submit" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Revision"}
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
                  disabled={isSubmitting}
                >
                  Reset
                </button>
                <button
                  className="rp-btn rp-btn-muted"
                  type="button"
                  onClick={() => navigate("/profile")}
                  disabled={isSubmitting}
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