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
  const { checkSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check session whenever route changes
    checkSession();
  }, [location.pathname, checkSession]);

  return null;
}

// -------------------------------
//  Helper Route Wrappers
// -------------------------------

function FoodDetailRoute() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const fromState = state?.food;
  const id = params.get("id");
  const fromQuery = null; // no local dataset, use backend fetch

  const food = fromState || fromQuery;

  if (!food && !id) return <Navigate to="/foods" replace />;

  if (!food && id) {
    return <FoodDetail foodId={id} />;
  }

  return (
    <FoodDetail
      food={food}
      onBack={() => navigate("/foods")}
      onViewDiscussion={() =>
        navigate(`/fooddiscussion?id=${food.id}`, { state: { food } })
      }
    />
  );
}

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
      <AxiosInterceptorSetup />
      <SessionChecker />
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

        {/* ✅ Community Review Routes */}
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
        
        {/* --- THIS IS THE FIX --- */}
        {/* This single dynamic route now handles recipes, community posts, and anything else */}
        <Route
          path="/admin/review/:type/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReviewContentPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ Protected Profile (member + admin only) */}
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