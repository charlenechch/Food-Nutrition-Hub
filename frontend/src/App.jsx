import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import LoginRegisterPage from "./pages/LoginRegisterPage";
import AdminHomepage from "./pages/AdminHomepage";
import UserHomepage from "./pages/UserHomepage";
import ExploreFoodsPage from "./pages/ExploreFoodPage";
import NutritionAnalyzerPage from "./pages/NutritionAnalyzerPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import CommunityPage from "./pages/CommunityPage";
import AuthActionRouter from './pages/AuthActionRouter';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgetPassword from "./pages/ForgotPasswordPage";
import ResetPassword from "./pages/ResetPasswordPage";
import OTPVerification from "./pages/OTPVerificationPage";
import FoodDetail from "./pages/FoodDetailPage";
import FoodDiscussion from "./pages/FoodDiscussionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CommunityPost from "./pages/CommunityPostPage";
import UserProfilePage from "./pages/UserProfilePage";
import ReviseRecipePage from "./pages/ReviseRecipePage";
import EditFoodPage from "./pages/EditFoodPage";
import Analytics from "./pages/Analytics";
import ReviseCommunityPostPage from "./pages/ReviseCommunityPostPage";
import AddFoodPage from "./pages/AddFoodPage";
import AddRecipe from "./pages/AddRecipePage";
import EditRecipePage from "./pages/EditRecipePage";
import ReviewContentPage from "./pages/ReviewContentPage"; 

// ✅ Handles Food Detail with state OR URL params
function FoodDetailRoute() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const fromState = state?.food;
  const id = params.get("id");
  const fromQuery = id ? sarawakFoods.find(f => String(f.id) === String(id)) : null;

  const food = fromState || fromQuery;
  if (!food) return <Navigate to="/foods" replace />;

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

// ✅ Handles Food Discussion routing safely
function FoodDiscussionRoute() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const id = params.get("id");
  const fromState = state?.food;
  const fromQuery = id ? sarawakFoods.find(f => String(f.id) === String(id)) : null;

  const food = fromState || fromQuery;
  if (!food) return <Navigate to="/foods" replace />;

  return <FoodDiscussion food={food} onBack={() => navigate(`/fooddetail?id=${food.id}`)} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/loginregister" replace />} />
        <Route path="/loginregister" element={<LoginRegisterPage />} />

        {/* Public Pages */}
        <Route path="/auth/action" element={<AuthActionRouter />} />
        <Route path="/verifyemail" element={<EmailVerificationPage />} />
        <Route path="/forgotpassword" element={<ForgetPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/otpverification" element={<OTPVerification />} />
        <Route path="/home" element={<UserHomepage />} />
        <Route path="/foods" element={<ExploreFoodsPage />} />
        <Route path="/fooddetail/:id" element={<FoodDetail />} />
        <Route path="/fooddiscussion/:foodId" element={<FoodDiscussionRoute />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/:id" element={<CommunityPost />} />
        <Route path="/profile/:userProfileID" element={<UserProfilePage />} />
        <Route path="/revise/:id" element={<ReviseRecipePage />} />
        <Route path="/revisecommunitypostpage" element={<ReviseCommunityPostPage />} />
        {/* <Route path="/admin" element={<AdminHomepage />} /> */}
        <Route path="/admin/editfood/:id" element={<EditFoodPage />} />
        <Route path="/admin/addfood" element={<AddFoodPage />} /> 
        <Route path="/admin/addrecipe" element={<AddRecipe />} />
        <Route path="/admin/edit/recipe/:id" element={<EditRecipePage />} />
        <Route path="/admin/reviewcontent/:id" element={<ReviewContentPage />} />


        {/* ✅ PROTECTED ADMIN PAGE */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHomepage />
            </ProtectedRoute>
          }
        />

        {/* Nutrition Analyzer is public but guest has limited actions */}
        <Route path="/analyzer" element={<NutritionAnalyzerPage />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* ✅ Protected Profile (member + admin only) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["member", "admin"]}>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
