import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import { ROLES } from './constants/roles';
import PageTransition from './components/ux/PageTransition';
import OnboardingModal from './components/ux/OnboardingModal';
import { AuthProvider } from './features/auth/AuthContext';
import { PreferencesProvider } from './features/preferences/PreferencesContext';
import AdminContentPreview from './pages/AdminContentPreview';
import AdminCreatorManagement from './pages/AdminCreatorManagement';
import AdminReviewQueue from './pages/AdminReviewQueue';
import CourseBuilder from './pages/CourseBuilder';
import CreatorCourses from './pages/CreatorCourses';
import CreatorDashboard from './pages/CreatorDashboard';
import Dashboard from './pages/Dashboard';
import LessonEditor from './pages/LessonEditor';
import Login from './pages/Login';
import MyLearningProgress from './pages/MyLearningProgress';
import Register from './pages/Register';
import RoadmapDetail from './pages/RoadmapDetail';
import RoadmapNodeDetail from './pages/RoadmapNodeDetail';
import RoadmapsList from './pages/RoadmapsList';
import SubmitForReview from './pages/SubmitForReview';
import TopicDetail from './pages/TopicDetail';
import TopicBlockEditor from './pages/TopicBlockEditor';
import TopicsList from './pages/TopicsList';
import Unauthorized from './pages/Unauthorized';
import FlashcardReview from './pages/FlashcardReview';
import LearningRoom from './pages/LearningRoom';
import ProfileDashboard from './pages/ProfileDashboard';

function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <OnboardingModal />
        <PageTransition>
          <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/roadmaps" element={<RoadmapsList />} />
          <Route path="/roadmaps/:roadmapId" element={<RoadmapDetail />} />
          <Route
            path="/roadmaps/:roadmapId/nodes/:nodeId"
            element={<RoadmapNodeDetail />}
          />
          <Route path="/my-progress" element={<MyLearningProgress />} />
          <Route path="/topics" element={<TopicsList />} />
          <Route path="/topics/:topicId" element={<TopicDetail />} />
          <Route path="/flashcards/review" element={<FlashcardReview />} />
          <Route path="/learn" element={<LearningRoom />} />
          <Route path="/profile" element={<ProfileDashboard />} />
          <Route
            element={
              <RoleBasedRoute allowedRoles={[ROLES.ADMIN, ROLES.CREATOR]} />
            }
          >
            <Route path="/creator" element={<CreatorDashboard />} />
            <Route path="/creator/courses" element={<CreatorCourses />} />
            <Route path="/creator/courses/new" element={<CourseBuilder />} />
            <Route
              path="/creator/courses/:courseId/builder"
              element={<CourseBuilder />}
            />
            <Route
              path="/creator/lessons/:lessonId"
              element={<LessonEditor />}
            />
            <Route path="/creator/topics/new" element={<TopicBlockEditor />} />
            <Route
              path="/creator/submit-review"
              element={<SubmitForReview />}
            />
          </Route>
          <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin/review" element={<AdminReviewQueue />} />
            <Route
              path="/admin/review/:contentType/:contentId"
              element={<AdminContentPreview />}
            />
            <Route
              path="/admin/creators"
              element={<AdminCreatorManagement />}
            />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </AuthProvider>
    </PreferencesProvider>
  );
}

export default App;
