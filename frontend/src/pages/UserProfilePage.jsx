import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/UserProfilePage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Bell, ExternalLink, Eye, Globe, Shield } from "lucide-react";

// Mock users
const MOCK_USERS = {
  john: {
    username: "john",
    role: "user", // 'admin' | 'user'
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    location: "Kuching, Sarawak",
    bio: "Passionate about preserving Sarawak's culinary heritage",
    stats: { recipes: 5, foods: 12, likes: 48 },
    savedFoods: [
        {
            id: 1,
            name: "Manok Pansoh",
            origin: "Iban",
            image: "https://images.unsplash.com/photo-1643185720431-9c050eebbc9a",
            savedDate: "2 days ago",
        },
        {
            id: 2,
            name: "Umai",
            origin: "Melanau",
            image: "https://images.unsplash.com/photo-1612755657417-9c6885e5ece9",
            savedDate: "5 days ago",
        },
        {
            id: 3,
            name: "Kasam Babi",
            origin: "Dayak",
            image: "https://images.unsplash.com/photo-1658218615053-955e8af55947",
            savedDate: "1 week ago",
        },
        {
            id: 4,
            name: "Midin Belacan",
            origin: "Native",
            image: "https://images.unsplash.com/photo-1741004580357-15d116ef4ba3",
            savedDate: "9 days ago",
        },
        {
            id: 5,
            name: "Linut",
            origin: "Bidayuh",
            image: "https://images.unsplash.com/photo-1708597523963-40b30f846281",
            savedDate: "2 weeks ago",
        },
        {
            id: 6,
            name: "Bubur Pedas",
            origin: "Dayak",
            image: "https://munchmalaysia.com/wp-content/uploads/2023/11/sarawak-spicy-porridge.jpg",
            savedDate: "2 weeks ago",
        },
        {
            id: 7,
            name: "Ayam Pansuh",
            origin: "Dayak",
            image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
            savedDate: "3 weeks ago",
        },
        {
            id: 8,
            name: "Kek Lapis Sarawak",
            origin: "Chinese-Malay",
            image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
            savedDate: "3 weeks ago",
        },
        {
            id: 9,
            name: "Laksa Sarawak",
            origin: "Chinese-Malay",
            image: "https://asianinspirations.com.au/wp-content/uploads/2018/08/R01024_Sarawak-Laksa-940x627.jpg",
            savedDate: "1 month ago",
        },
        {
            id: 10,
            name: "Terung Dayak Soup",
            origin: "Dayak",
            image: "https://www.periuk.my/static/54323c3fc953cc12ea8264c2fd746856/f6085/PRec-Terung-Dayak-with-Mackerel.jpg",
            savedDate: "1 month ago",
        },
    ],
    pending: [
      {
        id: 101,
        type: "Recipe",
        title: "Laksa Sarawak Traditional Recipe",
        submittedDate: "2024-01-15",
        status: "under_review",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      },
      {
        id: 102,
        type: "Food",
        title: "Kolo Mee Documentation",
        submittedDate: "2024-01-10",
        status: "awaiting_approval",
        image: "https://www.curiouscuisiniere.com/wp-content/uploads/2018/09/kolomee5.1.jpg.webp",
      },
      {
      id: 103,
      type: "Recipe", // <-- use "Recipe" so your ReviseContributionPage shows the recipe form
      title: "My Grandmother's Kuih Chap",
      submittedDate: "2024-01-05",
      status: "needs_revision",
      image: "https://mypenang.gov.my/uploads/page/51/images/Penang_FoodLifestyle_FB_KueyChiap.jpg",

      // Reviewer context
      feedback: "Please add clearer measurements and the source/credit for photos.",
      fieldsWithIssues: ["ingredients", "images", "instructions"],

      // This is what your Revise page should parse to prefill the form:
      payload: {
          // top fields
          name: "My Grandmother's Kuih Chap",
          origin: "Chinese-Malay",
          difficulty: "Medium",         // "Easy" | "Medium" | "Hard"
          prepTime: 30,                 // minutes
          cookTime: 120,                // minutes

          // food type (+ Other support)
          foodType: "Noodles",          // one of your options
          otherFoodEnabled: false,
          otherFoodText: "",

          // main description + image(s)
          description:
          "A comforting noodle dish with rich herbal broth, pork offal, and flat rice noodles. This version comes from my grandmother’s weekend hawker stall.",
          // keep both for your parser: first image and preview
          images: [
          "https://mypenang.gov.my/uploads/page/51/images/Penang_FoodLifestyle_FB_KueyChiap.jpg"
          ],
          imageData:
          "https://mypenang.gov.my/uploads/page/51/images/Penang_FoodLifestyle_FB_KueyChiap.jpg",

          // servings
          servings: 4,
  
          // form uses big textareas; keep \n lines
          ingredients:
          [
              "500 g pork belly, sliced",
              "300 g pork offal (optional), cleaned",
              "2 L pork/chicken stock",
              "4 cloves garlic, minced",
              "2 star anise",
              "1 cinnamon stick (5 cm)",
              "2 tbsp dark soy sauce",
              "2 tbsp light soy sauce",
              "1 tsp white pepper",
              "1 tbsp rock sugar",
              "Salt to taste",
              "400 g flat rice noodles (kuih chap sheets), cut into rectangles",
              "2 hard-boiled eggs, halved",
              "Fresh coriander & fried shallots, for garnish"
          ].join("\n"),

          instructions:
          [
              "Blanch pork belly and offal briefly; rinse to remove impurities.",
              "In a pot, sauté garlic until fragrant. Add star anise and cinnamon.",
              "Pour in stock; add dark soy, light soy, pepper, and rock sugar. Simmer 10 min.",
              "Add pork belly (and offal if using). Simmer gently 60–90 min until tender.",
              "Season with salt to taste.",
              "Blanch noodle sheets; cut into rectangles and portion into bowls.",
              "Ladle broth with meats over noodles. Top with egg halves, coriander, and fried shallots."
            ].join("\n"),
 
          // dietary tags (+ Other support)
          dietaryTags: ["dairy-free"],
          otherDietEnabled: false,
          otherDietText: "",
  
          // extras
          funFact:
          "In Hokkien, 'kuih chap' refers to the flat noodle sheets—each bowl looks different because the sheets are hand-cut.",
          chefTips:
          "Simmer gently (don’t boil) to keep the broth clear. If using offal, soak in salted water with ginger before blanching to reduce odor."
      }
    },
    ],
    prefs: {
      dietary: [],         // 'none' | 'vegetarian' | 'vegan' | 'halal'
      allergies: [],// 'noAllergies' | 'nutsAllergy' | 'seafoodAllergy' | 'spicyRestriction'
      emailNotifications: true,
      pushNotifications: true,
      profileVisibility: true,
      language: "en",
    },
  },
  admin: {
    username: "admin",
    role: "admin",
    firstName: "Aisha",
    lastName: "Rahman",
    email: "admin@example.com",
    location: "Miri, Sarawak",
    bio: "Admin & curator",
    stats: { recipes: 18, foods: 42, likes: 310 },
    savedFoods: [],
    pending: [],
    prefs: {
      dietary: [],
      allergies: [],
      emailNotifications: true,
      pushNotifications: true,
      profileVisibility: true,
      language: "en",
    },
  },
};

const DIETARY_OPTIONS = ["vegetarian","vegan","halal","gluten-free","dairy-free","low-fat","high-protein","spicy"];
const ALLERGY_OPTIONS = ["tree-nuts","peanuts","seafood","shellfish","egg","soy","sesame","wheat","no-spicy"];

// toggle a value inside an array
const toggleInArray = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

// if your backend/user data still returns strings, normalize to arrays:
const normalizePrefs = (p = {}) => ({
  ...p,
  dietary: Array.isArray(p.dietary) ? p.dietary : (p.dietary ? [p.dietary] : []),
  allergies: Array.isArray(p.allergies) ? p.allergies : (p.allergies ? [p.allergies] : []),
});

// localStorage helpers
const LS_KEY = "users_v11";
function loadUsers() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : MOCK_USERS;
  } catch {
    return MOCK_USERS;
  }
}
function saveUsers(obj) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

export default function UserProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();

  const users = useMemo(loadUsers, []);
  const user = users[username.toLowerCase()];
  const [bio, setBio] = useState("Passionate about preserving Sarawak's culinary heritage");


  // Pagination for Saved Foods
  const PER_PAGE = 9;
  const [savedPage, setSavedPage] = useState(1);

  const savedFoodsArr = user.savedFoods || [];
  const totalSavedPages = Math.max(1, Math.ceil(user.savedFoods.length / PER_PAGE));
  const startSaved = (savedPage - 1) * PER_PAGE;
  const currentSaved = savedFoodsArr.slice(startSaved, startSaved + PER_PAGE);

  useEffect(() => {
    if (savedPage > totalSavedPages) setSavedPage(totalSavedPages);
  }, [savedPage, totalSavedPages]);

  useEffect(() => {
    setPrefs(prev => {
      const next = normalizePrefs(user.prefs);
      // only update if something actually changed to avoid loops
      const same =
        Array.isArray(prev.dietary) && Array.isArray(prev.allergies) &&
        prev.dietary.length === next.dietary.length &&
        prev.allergies.length === next.allergies.length &&
        prev.dietary.every(v => next.dietary.includes(v)) &&
        prev.allergies.every(v => next.allergies.includes(v));
      return same ? prev : next;
    });
  }, [user.prefs]);

  // Basic 404-like fallback
  if (!user) {
    return (
      <div className="upp-wrap">
        <button className="lrp-btn lrp-btn-outline" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="upp-404-h2">User not found</h2>
        <p>Try /profile/john or /profile/admin to test.</p>
      </div>
    );
  }

  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    location: user.location,
    bio: user.bio,
  });
  const [prefs, setPrefs] = useState(() => normalizePrefs(user.prefs));

  const updateUser = (patch) => {
    const next = { ...users, [user.username]: { ...user, ...patch } };
    saveUsers(next);
  };

  const savePersonal = () => {
    updateUser({ ...user, ...form });
    alert("Saved!");
  };

  const savePrefs = () => {
    updateUser({ ...user, prefs: { ...prefs } });
    alert("Preferences saved!");
  };

  const fmtStatus = (s) =>
    s === "under_review"
      ? "Under Review"
      : s === "awaiting_approval"
      ? "Awaiting Approval"
      : s === "needs_revision"
      ? "Needs Revision"
      : s;

  return (
    <div className="user-profile-page">
        <Header />
        <div className="upp-page">
        {/* Header */}
        <div className="upp-header">
            <div className="upp-avatar" aria-hidden="true">👤</div>
            <h1 className="upp-title">My Profile</h1>
            <p className="upp-sub">
            {user.firstName} {user.lastName} • Sarawak Food Enthusiast
            </p>
        </div>

        {/* Tabs */}
        <div className="upp-tabs lrp-tabs">
            {[
            ["info", "Personal Information"],
            ["saved", "Saved Foods"],
            ["pending", "Pending Contributions"],
            ["prefs", "Preferences"],
            ["settings", "Settings"],
            ].map(([val, label]) => (
            <button
                key={val}
                className={`upp-tab lrp-tab ${tab === val ? "is-active" : ""}`}
                onClick={() => setTab(val)}
                type="button"
                role="tab"
                aria-selected={tab === val}
            >
                {label}
            </button>
            ))}
        </div>

        <div className="upp-tab-content">
            {/* Content */}
            {tab === "info" && (
                <div className="upp-grid">
                    <div className="upp-main">
                        <div className="upp-card">
                            <h3 className="upp-card-title">Personal Information</h3>
                            <div className="upp-form-grid">
                                <label>
                                    <span>First Name</span>
                                    <input
                                    value={form.firstName}
                                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                                    />
                                </label>
                                <label>
                                    <span>Last Name</span>
                                    <input
                                    value={form.lastName}
                                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                                    />
                                </label>
                            </div>
                            <div className="upp-input">
                                <label className="upp-block">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                />
                                </label>
                                <label className="upp-block">
                                <span>Location</span>
                                <input
                                    value={form.location}
                                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                                />
                                </label>
                                <label className="upp-block">
                                    <label htmlFor="bio">Bio</label>
                                    <textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        maxLength={200}
                                        className="upp-textarea"
                                        placeholder="Tell us about yourself…"
                                    />
                                    <div className="upp-help">{bio.length}/200</div>
                                </label>
                            </div>
                            <button className="lrp-btn lrp-btn-primary" onClick={savePersonal}>
                            Save Changes
                            </button>
                        </div>
                    </div>
                    <aside className="upp-sticky">
                        <div className="upp-card">
                            <h3 className="upp-card-title">My Contributions</h3>
                            <div className="upp-stat">
                                <div className="upp-stat-val">{user.stats.recipes}</div>
                                <div className="upp-muted">recipes shared</div>
                            </div>
                            <div className="upp-stat">
                                <div className="upp-stat-val">{user.stats.foods}</div>
                                <div className="upp-muted">foods documented</div>
                            </div>
                            <div className="upp-stat">
                                <div className="upp-stat-val">{user.stats.likes}</div>
                                <div className="upp-muted">likes received</div>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {tab === "saved" && (
            <>
                {user.savedFoods?.length ? (
                <>
                    <div className="upp-card-grid">
                    {currentSaved.map((f) => (
                        <div
                        key={f.id}
                        className="upp-food-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/fooddetail?id=${f.id}`, { state: { food: f } })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") navigate(`/fooddetail?id=${f.id}`, { state: { food: f } });
                        }}
                        >
                        <div className="upp-food-media">
                            <img src={f.image} alt={f.name} />
                        </div>
                        <div className="upp-food-body">
                            <h4 className="upp-food-title">{f.name}</h4>
                            <div className="upp-food-row">
                            <span className="upp-badge">{f.origin}</span>
                            <span className="upp-muted">{f.savedDate}</span>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>

                    {/* Pagination */}
                    {totalSavedPages > 1 && (
                    <div className="efp-pagination">
                        <button
                        className="efp-btn"
                        disabled={savedPage === 1}
                        onClick={() => setSavedPage((p) => Math.max(1, p - 1))}
                        >
                        ‹ Prev
                        </button>

                        {Array.from({ length: totalSavedPages }, (_, i) => (
                        <button
                            key={i}
                            className={`efp-btn ${savedPage === i + 1 ? "is-active" : ""}`}
                            onClick={() => setSavedPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                        ))}

                        <button
                        className="efp-btn"
                        disabled={savedPage === totalSavedPages}
                        onClick={() => setSavedPage((p) => Math.min(totalSavedPages, p + 1))}
                        >
                        Next ›
                        </button>
                    </div>
                    )}
                </>
                ) : (
                <div className="upp-center">
                    <p className="upp-muted">No saved foods yet</p>
                    <p className="upp-muted">Explore foods to start saving your favorites</p>
                </div>
                )}
            </>
            )}


            {tab === "pending" && (
                <>
                {user.pending.length ? (
                    <div className="upp-stack">
                    {user.pending.map((c) => (
                        <div className="upp-row-card" key={c.id}>
                        <div className="upp-row-thumb">
                            <img src={c.image} alt={c.title} />
                        </div>
                        <div className="upp-row-body">
                            <div className="upp-row-top">
                            <h4 className="upp-food-title upp-row-title">{c.title}</h4>
                            <span
                                className={`upp-chip ${
                                c.status === "under_review"
                                    ? "chip-yellow"
                                    : c.status === "awaiting_approval"
                                    ? "chip-blue"
                                    : "chip-red"
                                }`}
                            >
                                {fmtStatus(c.status)}
                            </span>
                            </div>
                            <div className="upp-row-meta">
                                <div className="upp-muted">
                                    {c.type} • Submitted on {new Date(c.submittedDate).toLocaleDateString()}
                                </div>
                                {c.status === "needs_revision" && (
                                    <button
                                    className="lrp-btn lrp-btn-outline upp-revise-btn"
                                    onClick={() =>
                                        navigate(`/revise/${c.id}`, {
                                            state: {
                                            owner: user.username,
                                            id: c.id,
                                            snapshot: JSON.parse(JSON.stringify(c)), // deep clone
                                            },
                                        })
                                        }
                                    type="button"
                                    >
                                    Revise
                                    </button>
                                )}
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="upp-center">
                    <p className="upp-muted">No pending contributions</p>
                    </div>
                )}
                </>
            )}

            {tab === "prefs" && (
              <div className="upp-stack">
                {/* Dietary (multiple) */}
                <div className="upp-card">
                  <h3 className="upp-card-title">Dietary Preferences</h3>
                  <div className="upp-choice-grid">
                    {DIETARY_OPTIONS.map(id => (
                      <label
                        key={id}
                        className={`upp-choice ${prefs.dietary.includes(id) ? "is-on" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={prefs.dietary.includes(id)}
                          onChange={() =>
                            setPrefs(p => ({ ...p, dietary: toggleInArray(p.dietary, id) }))
                          }
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </label>
                    ))}
                  </div>
                  {prefs.dietary.length === 0 && (
                    <div className="upp-muted" style={{ marginTop: 8 }}>
                      No dietary preferences selected
                    </div>
                  )}
                </div>

                {/* Allergies (multiple) */}
                <div className="upp-card">
                  <h3 className="upp-card-title">Allergies / Restrictions</h3>
                  <div className="upp-choice-grid">
                    {ALLERGY_OPTIONS.map(id => (
                      <label
                        key={id}
                        className={`upp-choice ${prefs.allergies.includes(id) ? "is-on" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={prefs.allergies.includes(id)}
                          onChange={() =>
                            setPrefs(p => ({ ...p, allergies: toggleInArray(p.allergies, id) }))
                          }
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </label>
                    ))}
                  </div>
                  {prefs.allergies.length === 0 && (
                    <div className="upp-muted" style={{ marginTop: 8 }}>
                      No allergies selected
                    </div>
                  )}
                </div>

                <button className="lrp-btn lrp-btn-primary" onClick={savePrefs}>
                  Save Preferences
                </button>
              </div>
            )}

            {tab === "settings" && (
                <div className="upp-stack">
                <div className="upp-card">
                    <h3 className="upp-card-title"><Bell size={18} color={"#6a4a2f"}/> Notifications</h3>
                    <div className="upp-row between">
                    <div>
                        <div className="upp-strong">Email Notifications</div>
                        <div className="upp-muted">Receive updates about new recipes and foods</div>
                    </div>
                    <label className="upp-switch">
                        <input
                        type="checkbox"
                        checked={prefs.emailNotifications}
                        onChange={(e) => setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))}
                        />
                        <span />
                    </label>
                    </div>
                    <hr className="upp-sep" />
                    <div className="upp-row between">
                    <div>
                        <div className="upp-strong">Push Notifications</div>
                        <div className="upp-muted">Get notified about community activities</div>
                    </div>
                    <label className="upp-switch">
                        <input
                        type="checkbox"
                        checked={prefs.pushNotifications}
                        onChange={(e) => setPrefs((p) => ({ ...p, pushNotifications: e.target.checked }))}
                        />
                        <span />
                    </label>
                    </div>
                </div>

                <div className="upp-card">
                    <h3 className="upp-card-title"><Globe size={18} color={"#6a4a2f"}/> Language</h3>
                    <div className="upp-row between">
                    <div>
                        <div className="upp-strong">Language</div>
                        <div className="upp-muted">Choose your preferred language</div>
                    </div>
                    <button
                        className="lrp-btn lrp-btn-outline upp-btn"
                        onClick={() => setPrefs((p) => ({ ...p, language: p.language === "en" ? "ms" : "en" }))}
                    >
                        {prefs.language === "en" ? "Bahasa Malaysia" : "English"}
                    </button>
                    </div>
                </div>

                <div className="upp-card">
                    <h3 className="upp-card-title"><Eye size={18} color={"#6a4a2f"}/> Privacy</h3>
                    <div className="upp-row between">
                    <div>
                        <div className="upp-strong">Profile Visibility</div>
                        <div className="upp-muted">Allow others to see your profile</div>
                    </div>
                    <label className="upp-switch">
                        <input
                        type="checkbox"
                        checked={prefs.profileVisibility}
                        onChange={(e) => setPrefs((p) => ({ ...p, profileVisibility: e.target.checked }))}
                        />
                        <span />
                    </label>
                    </div>
                    <hr className="upp-sep" />
                    <div className="upp-row between">
                    <div>
                        <div className="upp-strong">Data Export</div>
                        <div className="upp-muted">Download your saved data</div>
                    </div>
                    <button className="lrp-btn lrp-btn-outline upp-btn" onClick={() => alert("Exported!")}>
                        Export Data
                    </button>
                    </div>
                </div>

                {user.role === "admin" && (
                    <div className="upp-card">
                    <h3 className="upp-card-title"><Shield size={18} color={"#6a4a2f"}/> Admin Access</h3>
                    <div className="upp-row between">
                        <div>
                        <div className="upp-strong">Admin Panel</div>
                        <div className="upp-muted">Access administrative features and management tools</div>
                        </div>
                        <button className="lrp-btn lrp-btn-outline upp-btn" onClick={() => navigate("/admin")}>
                        <ExternalLink size={15} /> Open Admin Dashboard
                        </button>
                    </div>
                    </div>
                )}
                </div>
            )}
        </div>
        </div>
      <Footer />
    </div>
  );
}
