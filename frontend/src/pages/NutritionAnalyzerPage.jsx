// import React, { useEffect, useMemo, useState } from "react";
// import "../css/NutritionAnalyzer.css";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
// import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
// import { IoCameraOutline } from "react-icons/io5";
// import { LuSparkles } from "react-icons/lu";
// import { useAuth } from "../context/AuthContext";
// import LoginPromptModal from "../components/LoginPromptModal";

// const API_URL = import.meta.env.VITE_API_URL;

// /* ----------------------------------------------------------
//    MAIN COMPONENT
// ---------------------------------------------------------- */
// export default function NutritionAnalyzerPage() {
//   const { user } = useAuth();
//   const isGuest = !user || user?.role === "guest";

//   const [foodName, setFoodName] = useState("");
//   const [ingredients, setIngredients] = useState("");
//   const [selectedFile, setSelectedFile] = useState(null);

//   const [loading, setLoading] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState("");
//   const [showModal, setShowModal] = useState(false);

//   /* ----------------------------------------------------------
//       LOGIN BLOCK
//   ---------------------------------------------------------- */
//   const requireLogin = () => {
//     if (isGuest) {
//       setShowModal(true);
//       return true;
//     }
//     return false;
//   };

//   /* ----------------------------------------------------------
//       CSRF TOKEN
//   ---------------------------------------------------------- */
//   const [csrfToken, setCsrfToken] = useState("");

//   useEffect(() => {
//     const fetchCsrfToken = async () => {
//       try {
//         const r = await fetch(`${API_URL}/api/csrf-token`, {
//           credentials: "include",
//         });
//         const data = await r.json();
//         setCsrfToken(data.csrfToken);
//       } catch (err) {
//         console.error("CSRF fetch failed", err);
//       }
//     };
//     fetchCsrfToken();
//   }, []);

//   /* ----------------------------------------------------------
//       LOOKUP SUGGESTIONS (DB fuzzy)
//   ---------------------------------------------------------- */
//   const debounced = useMemo(() => foodName.trim(), [foodName]);

//   useEffect(() => {
//     if (!debounced) {
//       setSuggestions([]);
//       return;
//     }

//     const timeout = setTimeout(async () => {
//       try {
//         const r = await fetch(
//           `${API_URL}/api/ai/lookup?name=${encodeURIComponent(debounced)}`,
//           { credentials: "include" }
//         );
//         const data = await r.json();

//         if (data.found) {
//           setSuggestions([]);
//         } else {
//           setSuggestions(data.suggestions || []);
//         }
//       } catch {
//         setSuggestions([]);
//       }
//     }, 300);

//     return () => clearTimeout(timeout);
//   }, [debounced]);

//   /* ----------------------------------------------------------
//       SHAPE DB RESULT
//   ---------------------------------------------------------- */
//   function shapeResultFromDB(row) {
//     return {
//       source: "db",
//       food_name: row.name,
//       nutrition: {
//         Energy_kcal: row.Energy_kcal,
//         Protein_g: row.Protein_g,
//         Fat_g: row.Fat_g,
//         Carbohydrates_g: row.Carbohydrates_g,
//         Fiber_g: row.Fiber_g,
//         VitaminC_mg: row.VitaminC_mg,
//       },
//       tips: row.healthTips ? [row.healthTips] : [],
//       alternatives: row.alternative
//         ? row.alternative.split(",").map((x) => x.trim())
//         : [],
//       altDescription: row.altDescription || "",
//       meta: {
//         origin: row.origin,
//         category: row.category,
//         foodType: row.foodType,
//         difficulty: row.difficulty,
//         image: row.image,
//         description: row.description,
//       },
//     };
//   }

//   /* ----------------------------------------------------------
//       CALL BACKEND GPT IMAGE ROUTE
//   ---------------------------------------------------------- */
//   const analyzeWithGPT = async (file) => {
//     const toBase64 = (file) =>
//       new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(reader.result.split(",")[1]);
//         reader.onerror = reject;
//         reader.readAsDataURL(file);
//       });

//     const base64 = await toBase64(file);

//     const r = await fetch(`${API_URL}/api/ai/gpt/nutrition`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({ imageBase64: base64 }),
//     });

//     const json = await r.json();
//     if (!json.ok) throw new Error(json.error || "GPT failed");

//     return json; // ← backend returns { ok, source, data }
//   };

//   /* ----------------------------------------------------------
//       SUGGESTION CLICK
//   ---------------------------------------------------------- */
//   const handleSuggestionClick = async (name) => {
//     setFoodName(name);
//     setSelectedFile(null);
//     setError("");
//     setLoading(true);

//     try {
//       const r = await fetch(
//         `${API_URL}/api/ai/lookup?name=${encodeURIComponent(name)}`,
//         { credentials: "include" }
//       );
//       const data = await r.json();

//       if (data.found && data.item) {
//         setResult(shapeResultFromDB(data.item));
//       }
//     } catch {
//       setError("Failed to fetch item.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ----------------------------------------------------------
//       FILE HANDLING
//   ---------------------------------------------------------- */
//   const handleFileChange = (e) => {
//     if (requireLogin()) return;
//     const f = e.target.files?.[0];
//     if (f) {
//       setSelectedFile(f);
//       setResult(null);
//     }
//   };

//   const handleRemoveFile = () => {
//     setSelectedFile(null);
//     setResult(null);
//   };

//   /* ----------------------------------------------------------
//       MAIN ANALYZE ACTION (IMAGE → GPT or TEXT → DB/GPT)
//   ---------------------------------------------------------- */
//   const handleAnalyze = async (e) => {
//     e.preventDefault();
//     if (requireLogin()) return;

//     setError("");
//     setResult(null);
//     setLoading(true);

//     try {
//       /* --------------------------------------------------
//           1) IMAGE MODE
//       -------------------------------------------------- */
//       if (selectedFile) {
//         const resp = await analyzeWithGPT(selectedFile);
//         const src = resp.source; // "database" | "gpt_fallback"
//         const d = resp.data;

//         if (src === "database") {
//           setResult(shapeResultFromDB(d));
//           return;
//         }

//         if (src === "gpt_fallback") {
//           setResult({
//             source: "gpt",
//             food_name: d.food,
//             nutrition: d.nutrition,
//             tips: d.health_notes ? [d.health_notes] : [],
//             alternatives: d.alternatives || [],
//             altDescription: d.assumptions || "",
//             meta: d.meta || { imageUsed: true },
//           });
//           return;
//         }

//         setError("AI could not analyze the image.");
//         return;
//       }

//       /* --------------------------------------------------
//           2) TEXT MODE
//       -------------------------------------------------- */
//       const r = await fetch(`${API_URL}/api/ai/analyze`, {
//         method: "POST",
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//           "X-CSRF-Token": csrfToken,
//         },
//         body: JSON.stringify({ food_name: foodName, ingredients }),
//       });

//       const txt = await r.json();

//       // DB
//       if (txt.found && txt.item) {
//         setResult(shapeResultFromDB(txt.item));
//         return;
//       }

//       // GPT fallback
//       if (txt.ok && txt.data) {
//         const d = txt.data;
//         setResult({
//           source: "gpt",
//           food_name: d.food,
//           nutrition: d.nutrition,
//           tips: d.health_notes ? [d.health_notes] : [],
//           alternatives: d.alternatives || [],
//           altDescription: d.assumptions || "",
//         });
//         return;
//       }

//       setError("Could not analyze this food.");
//     } catch (err) {
//       console.error(err);
//       setError("Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ----------------------------------------------------------
//       UI RENDER
//   ---------------------------------------------------------- */
//   return (
//     <div className="nutrition-page">
//       <Header />

//       <h1 className="page-title">AI Nutrition Analyzer</h1>
//       <p className="page-subtitle">Get instant nutrition analysis and healthier alternatives</p>

//       <div className="analyzer-container">
//         {/* LEFT PANEL */}
//         <div className="left-column">
//           <form className="food-form" onSubmit={handleAnalyze}>

//             <div className="food-input-card">
//               <h3 className="section-title"><LuSparkles /> Enter Food Information</h3>

//               <label>Food Name</label>
//               <input
//                 type="text"
//                 placeholder="e.g., Laksa, Manok Pansoh…"
//                 value={foodName}
//                 onChange={(e) => setFoodName(e.target.value)}
//               />

//               <label>Ingredients</label>
//               <textarea
//                 placeholder="Ingredients (optional)…"
//                 value={ingredients}
//                 onChange={(e) => setIngredients(e.target.value)}
//               />
//             </div>

//             {/* IMAGE UPLOAD */}
//             <div className="upload-card">
//               <h3 className="section-title"><IoCameraOutline /> Or Upload Food Photo</h3>

//               <div className="upload-box-wrapper">
//                 <div
//                   className="upload-box"
//                   onClick={() => document.getElementById("fileInput").click()}
//                 >
//                   <FaCamera size={28} />
//                   <p>{selectedFile ? selectedFile.name : "Click to upload image"}</p>

//                   <input
//                     id="fileInput"
//                     type="file"
//                     accept="image/*"
//                     style={{ display: "none" }}
//                     onChange={handleFileChange}
//                   />
//                 </div>

//                 {selectedFile && (
//                   <button type="button" className="file-remove-btn" onClick={handleRemoveFile}>
//                     ✕
//                   </button>
//                 )}
//               </div>
//             </div>

//             <button type="submit" className="analyze-btn" disabled={loading}>
//               <FaWandMagicSparkles /> {loading ? "Analyzing…" : "Analyze Nutrition"}
//             </button>
//           </form>
//         </div>

//         {/* RIGHT PANEL: RESULTS */}
//         <div className={`result-card ${result ? "has-result" : "empty"}`}>
//           {suggestions.length > 0 && (
//             <>
//               <p>Did you mean:</p>
//               <div className="suggestion-chips">
//                 {suggestions.map((s) => (
//                   <button key={s} onClick={() => handleSuggestionClick(s)}>{s}</button>
//                 ))}
//               </div>
//             </>
//           )}

//           {error && <div className="error-text">{error}</div>}

//           {!result && !error && !loading && <p>Enter a food name or upload an image.</p>}

//           {result && (
//             <div className="nap-results">
//               <h2 className="analysis-title">{result.food_name}</h2>

//               {/* Nutrition */}
//               {result.nutrition && (
//                 <div className="nutrition-section">
//                   <h3 className="section-header">Nutrition (per portion)</h3>

//                   <div className="nutrition-grid">
//                     {[
//                       ["Calories", result.nutrition.Energy_kcal, "kcal"],
//                       ["Protein", result.nutrition.Protein_g, "g"],
//                       ["Fat", result.nutrition.Fat_g, "g"],
//                       ["Carbs", result.nutrition.Carbohydrates_g, "g"],
//                       ["Fiber", result.nutrition.Fiber_g, "g"],
//                       ["Vitamin C", result.nutrition.VitaminC_mg, "mg"],
//                     ].map(([label, val, unit], i) => (
//                       <div className="nutri-card" key={i}>
//                         <span className="nutri-value">
//                           {val ?? "—"} {val != null ? unit : ""}
//                         </span>
//                         <span className="nutri-label">{label}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Alternatives */}
//               {!!result.alternatives?.length && (
//                 <div className="alternatives-section">
//                   <h3 className="section-header">Healthier Alternatives</h3>
//                   {result.alternatives.map((alt, i) => (
//                     <div className="alternative-card" key={i}>
//                       <div className="alt-main">{alt}</div>
//                       {result.altDescription && (
//                         <div className="alt-desc">{result.altDescription}</div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Health Tips */}
//               {!!result.tips?.length && (
//                 <div className="tips-section">
//                   <h3 className="section-header">Health Tips</h3>
//                   {result.tips.map((t, i) => (
//                     <div className="tip-card tip-info" key={i}>
//                       {t}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       <Footer />

//       <LoginPromptModal show={showModal} onClose={() => setShowModal(false)} />
//     </div>
//   );
// }
