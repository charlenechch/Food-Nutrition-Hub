import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
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
  
  //====================
  // CSRF
  //====================
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);


  // 1. Get initial data from navigation state (if available)
  const stateData = location.state || {};

  // 2. State for form and UI
  const [form, setForm] = useState({
    title: "",
    culturalOrigin: "",
    content: "",
    recipe: "",
    image: ""
  });
  
  // 3. New State variables for data fetching
  const [adminFeedback, setAdminFeedback] = useState(stateData.adminFeedback || "");
  const [fieldsWithIssues, setFieldsWithIssues] = useState(stateData.fieldsWithIssues || []);
  const [isLoading, setIsLoading] = useState(!stateData.contribution); // Load if no state data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [infoDlg, setInfoDlg] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
  });

  const openInfo = ({ title, message, icon, primaryText = "OK" }) =>
    setInfoDlg({ open: true, title, message, icon, primaryText });

  const closeInfo = () => setInfoDlg((d) => ({ ...d, open: false }));

  // 4. Effect: Initialize form (Handle both Navigation State AND API Fetch)
  useEffect(() => {
    if (stateData.contribution) {
      console.log("📝 Initializing form with navigation state:", stateData.contribution);
      setForm({
        title: stateData.contribution.title || "",
        culturalOrigin: stateData.contribution.culturalOrigin || "",
        content: stateData.contribution.content || "",
        recipe: stateData.contribution.recipe || "",
        image: stateData.contribution.image || ""
      });
      setIsLoading(false);
    } 
    else {
      console.log("🌍 No state found. Fetching from API for ID:", id);
      const fetchPost = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/communityPost/${id}`, {
            credentials: "include", 
          });
          
          if (!res.ok) throw new Error("Failed to load post data.");
          
          const result = await res.json();
          if (!result.success || !result.data) throw new Error("Post not found.");

          const data = result.data;
          console.log("✅ Fetched API Data:", data);

          setForm({
            title: data.foodName || "",
            culturalOrigin: data.culturalOrigin || "",
            content: data.culturalStory || "",
            recipe: data.recipe || "",
            image: Array.isArray(data.images) ? data.images[0] : (data.images || "")
          });

          if (data.admin_feedback || data.adminFeedback) {
             setAdminFeedback(data.admin_feedback || data.adminFeedback);
          }

        } catch (err) {
          console.error("❌ Error loading post:", err);
          setError("Could not load community post. It may have been deleted.");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPost();
    }
  }, [id, stateData.contribution]);

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      openInfo({
        title: "Invalid image file type",
        message: "Please select a valid image file (JPEG, PNG, GIF, WebP)",
        icon: <AlertTriangle />,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      openInfo({
        title: "Invalid image size",
        message: "Image size should be less than 5MB",
        icon: <AlertTriangle />,
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitRevision = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const revisedData = {
        title: form.title.trim(),
        culturalOrigin: form.culturalOrigin,
        content: form.content.trim(),
        recipe: form.recipe,
        status: "Pending",
        image: form.image
      };

      const res = await fetch(`${API_BASE_URL}/api/communityPost/revise/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
         },
        credentials: "include",
        body: JSON.stringify(revisedData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update community post: ${errorText}`);
      }

      const result = await res.json();
      
      if (result.success) {
        setSuccess("Community post revised successfully! It has been resubmitted for admin review.");
        openInfo({
           title: "Post Revised Successfully!",
           message: "Your community contribution has been resubmitted and is awaiting admin review.",
           icon: <CheckCircle2 />,
         });
        setTimeout(() => {
          // 🛠️ FIX: Navigate explicitly to contributions tab
          navigate("/profile?tab=status"); 
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

  const needsFix = new Set(fieldsWithIssues || []);

  if (isLoading) {
    return (
      <div className="revise-recipe-page">
        <Header />
        <div className="upp-page">
          <div className="upp-wrap" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>Loading Contribution...</h2>
            <p>Please wait while we fetch your data.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="revise-recipe-page">
        <Header />
        <div className="upp-page">
          <div className="upp-wrap">
            <div className="rcp-error">
              <h2>Error</h2>
              <p>{error}</p>
              {/* 🛠️ FIX: Navigate explicitly to contributions tab */}
              <button 
                className="lrp-btn lrp-btn-primary"
                onClick={() => navigate("/profile?tab=status")}
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
          {/* 🛠️ FIX: Navigate explicitly to contributions tab */}
          <button
            className="lrp-btn lrp-btn-outline rcp-back"
            onClick={() => navigate("/profile?tab=status")}
          >
            ← Back to Contributions
          </button>

          <div className="rcp-wrap">
            <h2 className="rp-title">Revise Community Contribution</h2>
            <p className="upp-muted" style={{ marginBottom: 16 }}>
              Fix the highlighted fields and resubmit.
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
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word" }}>
                  {adminFeedback}
                </div>
                {fieldsWithIssues.length > 0 && (
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
            {error && <div className="rcp-error-message">{error}</div>}
            {success && <div className="rcp-success-message">{success}</div>}

            <form className="rp-form" onSubmit={submitRevision}>
              {/* Food Name + Cultural Origin */}
              <div className="rp-grid-2">
                <div className={`rp-field ${needsFix.has("title") ? "needs-fix" : ""}`}>
                  <label>Food Name *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onChangeForm}
                    placeholder="e.g., Manok Pansoh"
                    required
                  />
                </div>

                <div className={`rp-field ${needsFix.has("culturalOrigin") ? "needs-fix" : ""}`}>
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
              <div className={`rp-field ${needsFix.has("content") ? "needs-fix" : ""}`}>
                <label>Cultural Story *</label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={onChangeForm}
                  placeholder="Tell us the story behind this dish..."
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
              <div className={`rp-field ${needsFix.has("image") ? "needs-fix" : ""}`}>
                <label>Upload Photo *</label>
                <div
                  className="upload-box"
                  onClick={() => document.getElementById("ccp-file-input").click()}
                  role="button"
                  tabIndex={0}
                >
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="preview-img" />
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
                />
                <div className="upp-muted" style={{ marginTop: "4px", fontSize: "0.875rem" }}>
                  {selectedFile ? `New file: ${selectedFile.name}` : "Current image will be kept if no new file selected"}
                </div>
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
                
                {/* 🛠️ FIX: Navigate explicitly to contributions tab */}
                <button
                  className="rp-btn rp-btn-muted"
                  type="button"
                  onClick={() => navigate("/profile?tab=status")}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal
        open={infoDlg.open}
        title={infoDlg.title}
        icon={infoDlg.icon}
        primaryText={infoDlg.primaryText}
        onPrimary={closeInfo}
        onClose={closeInfo}
      >
        {infoDlg.message}
      </Modal>

      <Footer />
    </div>
  );
}