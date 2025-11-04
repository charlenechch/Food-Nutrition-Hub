// src/pages/ReviseCommunityPostPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera } from "react-icons/fa";

// --- Hardcoded review item (mock) ---
const REVIEW_ITEM = {
  id: "CP-101",
  submittedDate: "2024-01-10T08:00:00Z",
  // Fields the reviewer flagged; use keys that match the form's state
  fieldsWithIssues: ["culturalStory", "imageData"],
  feedback:
    "Thanks for your contribution! Please add more context in Cultural Story and upload a clearer photo.",
  // Original payload as submitted by the user
  payload: {
    foodName: "Manok Pansoh",
    origin: "Iban",
    culturalStory:
      "A traditional Dayak dish cooked in bamboo and enjoyed during gatherings.",
    recipe: "",
    imageData: "", // no image yet
  },
};

// You can expand this list if your dropdown supports more origins
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
  const navigate = useNavigate();

  const item = useMemo(() => REVIEW_ITEM, []);
  const needsFix = useMemo(() => new Set(item.fieldsWithIssues || []), [item]);

  // Initial form data based on the original payload
  const [initial] = useState(() => {
    const p = item.payload || {};
    return {
      foodName: p.foodName || "",
      origin: p.origin || "",
      culturalStory: p.culturalStory || "",
      recipe: p.recipe || "",
      imageData: p.imageData || "",
    };
  });

  const [form, setForm] = useState(initial);

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((prev) => ({ ...prev, imageData: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitRevision = (e) => {
    e.preventDefault();

    // Build revised payload in the same shape (mocked)
    const revisedPayload = {
      ...item.payload,
      foodName: form.foodName.trim(),
      origin: form.origin,
      culturalStory: form.culturalStory.trim(),
      recipe: form.recipe,
      imageData: form.imageData,
    };

    // In a real app, you’d POST/PATCH this to your backend.
    // Here we just show a confirmation and go back.
    console.log("REVISED COMMUNITY POST ▶", {
      id: item.id,
      revisedPayload,
      previousPayload: item.payload,
    });

    alert("Revision submitted! We’ll review it shortly.");
    navigate(-1);
  };

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
              {new Date(item.submittedDate).toLocaleDateString("en-GB")}
            </p>

            {item.feedback ? (
              <div
                className="upp-card"
                style={{ borderColor: "#ffd6d6", background: "#fff8f8" }}
              >
                <div className="upp-strong" style={{ marginBottom: 6 }}>
                  Reviewer Feedback
                </div>
                <div>{item.feedback}</div>
              </div>
            ) : null}

            <form className="rp-form" onSubmit={submitRevision}>
              {/* Food Name + Cultural Origin */}
              <div className="rp-grid-2">
                <div
                  className={`rp-field ${
                    needsFix.has("foodName") ? "needs-fix" : ""
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
                    needsFix.has("origin") ? "needs-fix" : ""
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
                  needsFix.has("culturalStory") ? "needs-fix" : ""
                }`}
              >
                <label>Cultural Story *</label>
                <textarea
                  name="culturalStory"
                  value={form.culturalStory}
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
                  placeholder="Share the recipe if you’d like (optional)"
                />
              </div>

              {/* Upload Photo */}
              <div
                className={`rp-field ${
                  needsFix.has("imageData") ? "needs-fix" : ""
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
                  {form.imageData ? (
                    <img
                      src={form.imageData}
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
                  required={!form.imageData}
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
                  onClick={() => setForm(initial)}
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
