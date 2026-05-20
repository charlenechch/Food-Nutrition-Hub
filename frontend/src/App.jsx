/* src/App.jsx */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import axios from "axios";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

// // === User & Public Pages ===
import LoginRegisterPage from "./pages/LoginRegisterPage";
import UserHomepage from "./pages/UserHomepage";
import ExploreFoodsPage from "./pages/ExploreFoodPage";
import NutritionAnalyzerPage from "./pages/NutritionAnalyzerPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import CommunityPage from "./pages/CommunityPage";
import CommunityPost from "./pages/CommunityPostPage";
import UserProfilePage from "./pages/UserProfilePage";
import Analytics from "./pages/Analytics";
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ConsentModal from './components/ConsentModal';
import LevelUpModal from './components/LevelUpModal';
import ContributorBadgeModal from './components/ContributorBadgeModal';
import FoodMap from "./pages/FoodMap";
import XpLogs from "./pages/XpLogsPage";
import Leaderboard from "./pages/Leaderboard";
import DailyQuizPage from './pages/DailyQuizPage';

import HomePageV6 from "./pages/Homepage";

// // === Admin Pages ===
import AdminHomepage from "./pages/AdminHomepage";
import AdminActivityLog from "./pages/AdminActivityLog";
import EditFoodPage from "./pages/EditFoodPage";
import AddFoodPage from "./pages/AddFoodPage";
import AddRecipe from "./pages/AddRecipePage";
import EditRecipePage from "./pages/EditRecipePage";
import ReviewContentPage from "./pages/ReviewContentPage";
import ReviseRecipePage from "./pages/ReviseRecipePage";
import ReviseCommunityPostPage from "./pages/ReviseCommunityPostPage";
import AdminCommunityPostDatabase from "./pages/AdminCommunityPostDatabase";
import EditCommunityPostPage from "./pages/EditCommunityPostPage";
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import LinkFoodPage from "./pages/LinkFoodPage";

// // === Auth & Verification ===
import AuthActionRouter from "./pages/AuthActionRouter";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgetPassword from "./pages/ForgotPasswordPage";
import ResetPassword from "./pages/ResetPasswordPage";
import OTPVerification from "./pages/OTPVerificationPage";

// // === Food Detail & Discussion ===
import FoodDetail from "./pages/FoodDetailPage";
import FoodDiscussion from "./pages/FoodDiscussionPage";

// // === Shared Components ===
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Global Fetch Interceptor
function FetchInterceptorSetup() {
  const { user, forceLogout } = useAuth();

  useEffect(() => {
    // Save the original browser fetch function
    const originalFetch = window.fetch;

    // Overwrite it with our own wrapper
    window.fetch = async (...args) => {
      // Perform the actual request
      const response = await originalFetch(...args);

      // Check if the session is dead/suspended (Status 401)
      if (response.status === 401) {
        // Only kick them out if they claim to be a logged-in member/admin.
        // Ignore "guests" because they are allowed to be unauthenticated.
        if (user && user.role !== "guest") {
          console.log("⛔ Global Fetch Interceptor: 401 detected. Forcing logout...");
          forceLogout();
        }
      }

      // Return the response so the rest of the app works normally
      return response;
    };

    // Cleanup: Restore original fetch if this component unmounts
    return () => {
      window.fetch = originalFetch;
    };
  }, [user, forceLogout]); // Re-run if user or logout function changes

  return null; // This component renders nothing visually
}

function AxiosInterceptorSetup() {
  const { forceLogout } = useAuth();

  useEffect(() => {
    // Configure axios defaults
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    axios.defaults.withCredentials = true;

    // Add response interceptor
    const interceptor = axios.interceptors.response.use(
      (response) => {
        // If response is successful, return it as-is
        return response;
      },
      (error) => {
        // If 401 Unauthorized, the session is invalid (user suspended or logged out)
        if (error.response?.status === 401) {
          console.log("🔒 Session invalid or user suspended - Logging out via forceLogout");
          forceLogout();
        }
        
        // Pass the error forward so individual components can handle it if needed
        return Promise.reject(error);
      }
    );

    // Cleanup: remove interceptor when component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [forceLogout]);

  return null;
}

function SessionChecker() {
  const { checkSession, user } = useAuth();
  const location = useLocation();

  // Route Change Check (Safe)
  useEffect(() => {
    checkSession();
  }, [location.pathname]);

  // Active Polling
  useEffect(() => {
    // Stop if a guest or not logged in. 
    // Guests don't need to be polled (don't want to kick them out).
    if (!user || user.role === "guest") return;

    // Run checkSession every 60 seconds
    const interval = setInterval(() => {
      checkSession(); 
    }, 60000);

    // Cleanup the timer when component unmounts or user logs out
    return () => clearInterval(interval);
  }, [user?.role]); // Only restart the timer if the user's role changes

  return null;
}

// -------------------------------
//  Helper Route Wrappers
// -------------------------------

function FoodDiscussionRoute() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const id = params.get("id");
  const fromState = state?.food;
  const fromQuery = null;

  const food = fromState || fromQuery;

  if (!food && !id) return <Navigate to="/foods" replace />;

  if (!food && id) {
    return <FoodDiscussion foodId={id} onBack={() => navigate(`/fooddetail?id=${id}`)} />;
  }

  return <FoodDiscussion food={food} onBack={() => navigate(`/fooddetail?id=${food.id}`)} />;
}

// The LIVE Database-Driven Level Up Overlay
function LevelUpOverlays() {
  const { user, setBypassSessionCheck } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if the user's actual level is greater than their acknowledged level in the DB
    if (user && user.role !== "guest" && user.level) {
      const acknowledged = user.acknowledged_level || 1;
      
      if (user.level > acknowledged) {
        setShowModal(true); 
      }
    }
  }, [user]);

  if (!user || user.role === "guest") return null;

  const handleDismiss = async () => {
    setShowModal(false); 
    
    try {
      // 1. Ask the server for the CSRF VIP Pass
      const csrfRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/csrf-token`, { 
        credentials: "include" 
      });
      const csrfData = await csrfRes.json();
      const token = csrfData.csrfToken;

      // 2. Fire the PUT request WITH the VIP Pass in the headers!
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/userProfile/acknowledge-level`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": token // 🔑 The magic key that stops the 403 error!
        },
        credentials: "include",
        body: JSON.stringify({ newLevel: user.level })
      });
      
      if (setBypassSessionCheck) setBypassSessionCheck(true);
    } catch (err) {
      console.error("Failed to acknowledge level up", err);
    }
  };

  return (
    <LevelUpModal 
      totalXp={user.total_xp || 0} 
      highestLevelAchieved={user.level || 1} 
      hasUnseenLevelUp={showModal} 
      onDismiss={handleDismiss}
    />
  );
}

function ContributorBadgeOverlays() {
  const { user } = useAuth();
  const [unseenBadges, setUnseenBadges] = useState([]);
  const [currentBadge, setCurrentBadge] = useState(null);

  useEffect(() => {
    if (!user || user.role === "guest") return;

    const fetchUnseenBadges = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/userProfile/unseen-badges`, {
          credentials: "include"
        });
        const data = await res.json();
        if (data.success && data.badges.length > 0) {
          setUnseenBadges(data.badges);
          setCurrentBadge(data.badges[0]);
        }
      } catch (err) {
        console.error("Failed to fetch unseen badges", err);
      }
    };

    fetchUnseenBadges();
  }, [user]);

  if (!user || user.role === "guest") return null;

  const handleDismiss = async (badge) => {
    try {
      const csrfRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/csrf-token`, {
        credentials: "include"
      });
      const csrfData = await csrfRes.json();

      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/userProfile/mark-badge-seen`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfData.csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ badgeId: badge.id })
      });

      // Show next unseen badge if any
      const remaining = unseenBadges.filter(b => b.id !== badge.id);
      setUnseenBadges(remaining);
      setCurrentBadge(remaining.length > 0 ? remaining[0] : null);

    } catch (err) {
      console.error("Failed to mark badge as seen", err);
      setCurrentBadge(null);
    }
  };

  return (
    <ContributorBadgeModal
      badge={currentBadge}
      onDismiss={handleDismiss}
    />
  );
}

// -------------------------------
//  Main App Component
// -------------------------------

function AppRoutes() {
  return (
    <Router>
      <FetchInterceptorSetup />
      <AxiosInterceptorSetup />
      <SessionChecker />
      <ScrollToTop />
      <ConsentModal />
      <LevelUpOverlays />
      <ContributorBadgeOverlays />
      <Routes>
        {/* === Default Landing (GUEST FIRST) === */}
          <Route path="/" element={<UserHomepage />} />
          <Route path="/home" element={<UserHomepage />} />
          <Route path="/home-v6" element={<HomePageV6 />} />

        {/* === Auth Routes === */}
          <Route path="/loginregister" element={<LoginRegisterPage />} />
          <Route path="/auth/action" element={<AuthActionRouter />} />
          <Route path="/verifyemail" element={<EmailVerificationPage />} />
          <Route path="/forgotpassword" element={<ForgetPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/otpverification" element={<OTPVerification />} />

        {/* === Public / User Pages === */}
          <Route path="/foods" element={<ExploreFoodsPage />} />
          <Route path="/fooddetail/:id" element={<FoodDetail />} />
          <Route path="/fooddiscussion/:foodId" element={<FoodDiscussionRoute />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:id" element={<CommunityPost />} />
          <Route path="/privacypolicy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsAndConditionsPage />} />
          <Route path="/map" element={<FoodMap />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/daily-quiz" element={<DailyQuizPage />} />

        {/* === Gated Tools (Protected) === */}
        <Route
          path="/analyzer"
          element={
            <ProtectedRoute allowedRoles={["member", "admin"]}>
              <NutritionAnalyzerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["member", "admin"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route path="/revise/:id" element={<ReviseRecipePage />} />
        <Route path="/revisecommunitypostpage/:id" element={<ReviseCommunityPostPage />} />

        {/* === Member Pages === */}
        <Route path="/profile/:userProfileID" element={<UserProfilePage />} />
        <Route path="/xplogs" element={<XpLogs />} />

        {/* === Admin Pages === */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHomepage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activityLog"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminActivityLog />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/addfood" element={<AddFoodPage />} />
          <Route path="/admin/linkfood" element={<LinkFoodPage />} />
          <Route path="/admin/addrecipe" element={<AddRecipe />} />
          <Route path="/admin/editfood/:id" element={<EditFoodPage />} />
          <Route path="/admin/edit/recipe/:id" element={<EditRecipePage />} />
          <Route path="/admin/reviewcontent/:id" element={<ReviewContentPage />} />

        {/* Community Review Routes */}
        <Route
            path="/admin/edit/community/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditCommunityPostPage />
              </ProtectedRoute>
            }
          />

        {/* Protected Profile (member + admin only) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["member", "admin"]}>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

        {/* === Catch-all Fallback === */}
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;