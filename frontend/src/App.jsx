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
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

// === User & Public Pages ===
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

// === Admin Pages ===
import AdminHomepage from "./pages/AdminHomepage";
import EditFoodPage from "./pages/EditFoodPage";
import AddFoodPage from "./pages/AddFoodPage";
import AddRecipe from "./pages/AddRecipePage";
import EditRecipePage from "./pages/EditRecipePage";
import ReviewContentPage from "./pages/ReviewContentPage";
import ReviseRecipePage from "./pages/ReviseRecipePage";
import ReviseCommunityPostPage from "./pages/ReviseCommunityPostPage";
import AdminCommunityPostDatabase from "./pages/AdminCommunityPostDatabase";
import EditCommunityPostPage from "./pages/EditCommunityPostPage";
import SystemAlertsPage from "./pages/SystemAlertPage";

// === Auth & Verification ===
import AuthActionRouter from "./pages/AuthActionRouter";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgetPassword from "./pages/ForgotPasswordPage";
import ResetPassword from "./pages/ResetPasswordPage";
import OTPVerification from "./pages/OTPVerificationPage";

// === Food Detail & Discussion ===
import FoodDetail from "./pages/FoodDetailPage";
import FoodDiscussion from "./pages/FoodDiscussionPage";

// === Shared Components ===
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
      console.log("💓 Checking session status...");
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
      <Routes>
        {/* === Default & Auth Routes === */}
        <Route path="/" element={<Navigate to="/loginregister" replace />} />
        <Route path="/loginregister" element={<LoginRegisterPage />} />
        <Route path="/auth/action" element={<AuthActionRouter />} />
        <Route path="/verifyemail" element={<EmailVerificationPage />} />
        <Route path="/forgotpassword" element={<ForgetPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/otpverification" element={<OTPVerification />} />

        {/* === Public / User Pages === */}
        <Route path="/home" element={<UserHomepage />} />
        <Route path="/foods" element={<ExploreFoodsPage />} />
        <Route path="/fooddetail/:id" element={<FoodDetail />} />
        <Route path="/fooddiscussion/:foodId" element={<FoodDiscussionRoute />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/:id" element={<CommunityPost />} />
        <Route path="/analyzer" element={<NutritionAnalyzerPage />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* === Member Pages === */}
        <Route path="/profile/:userProfileID" element={<UserProfilePage />} />
        <Route path="/revise/:id" element={<ReviseRecipePage />} />
        <Route path="/revisecommunitypostpage/:id" element={<ReviseCommunityPostPage />} />

        {/* === Admin Pages === */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHomepage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/addfood" element={<AddFoodPage />} />
        <Route path="/admin/addrecipe" element={<AddRecipe />} />
        <Route path="/admin/editfood/:id" element={<EditFoodPage />} />
        <Route path="/admin/edit/recipe/:id" element={<EditRecipePage />} />
        <Route path="/admin/reviewcontent/:id" element={<ReviewContentPage />} />
        <Route path="/admin/systemalerts" element={<SystemAlertsPage />} />

        {/* Community Review Routes */}
        <Route
            path="/admin/edit/community/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditCommunityPostPage />
              </ProtectedRoute>
            }
          />
        <Route
          path="/admin/review/:type/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReviewContentPage />
            </ProtectedRoute>
          }
        />
        
        {/* This single dynamic route now handles recipes, community posts, and anything else */}
        <Route
          path="/admin/review/:type/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReviewContentPage />
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
        <Route path="*" element={<Navigate to="/loginregister" replace />} />
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