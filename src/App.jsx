import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import RequireSubscription from './components/RequireSubscription';
import { LanguageProvider } from './context/LanguageContext';
import { LandingContentProvider } from './context/LandingContentContext';
import { ToastProvider } from './components/Toast';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import VsBirdeye from './pages/VsBirdeye';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const GoogleOAuthReturn = lazy(() => import('./pages/GoogleOAuthReturn'));
const BillingSuccess = lazy(() => import('./pages/BillingSuccess'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PublicFeedback = lazy(() => import('./pages/PublicFeedback'));
const PublicLeadForm = lazy(() => import('./pages/PublicLeadForm'));

const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReviewFunnel = lazy(() => import('./pages/configurations/ReviewFunnel'));
const LeadCapture = lazy(() => import('./pages/configurations/LeadCapture'));
const LeadFollowUp = lazy(() => import('./pages/configurations/LeadFollowUp'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Leads = lazy(() => import('./pages/Leads'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Settings = lazy(() => import('./pages/Settings'));
const Feedback = lazy(() => import('./pages/Feedback'));
const EmployeeWizard = lazy(() => import('./pages/EmployeeWizard'));
const EmployeeGallery = lazy(() => import('./pages/EmployeeGallery'));
const EmployeeGalleryDemo = lazy(() => import('./pages/EmployeeGalleryDemo'));
const TranslationEditor = lazy(() => import('./pages/TranslationEditor'));
const AdminErrors = lazy(() => import('./pages/AdminErrors'));
const Optimization = lazy(() => import('./pages/Optimization'));
const ContentReviews = lazy(() => import('./pages/ContentReviews'));
const ReviewBooster = lazy(() => import('./pages/ReviewBooster'));

const VALID_WIZARD_GOALS = new Set(['review', 'capture', 'followup']);

function RouteFallback() {
    return (
        <div
            style={{
                minHeight: '40vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            aria-busy="true"
        />
    );
}

function CreateAutomationRedirect() {
    const [searchParams] = useSearchParams();
    const goal = searchParams.get('goal');
    if (goal && VALID_WIZARD_GOALS.has(goal)) {
        return <Navigate to={`/dashboard/employee/${goal}`} replace />;
    }
    return <Navigate to="/dashboard/employee-gallery" replace />;
}

function App() {
    return (
        <Router>
            <LanguageProvider>
                <LandingContentProvider>
                    <ToastProvider>
                        <ScrollToTop />
                        <Suspense fallback={<RouteFallback />}>
                            <Routes>
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/es" element={<LandingPage />} />
                                <Route path="/oauth/google-return" element={<GoogleOAuthReturn />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/terms" element={<TermsOfService />} />
                                <Route path="/vs-birdeye" element={<VsBirdeye />} />
                                <Route path="/blog" element={<Blog />} />
                                <Route path="/blog/:slug" element={<BlogPost />} />
                                <Route path="/r/:automation_id" element={<PublicFeedback />} />
                                <Route path="/f/:automation_id" element={<PublicFeedback />} />
                                <Route path="/l/:automation_id" element={<PublicLeadForm />} />

                                <Route element={<ProtectedRoute />}>
                                    <Route path="/billing/success" element={<BillingSuccess />} />
                                    <Route path="/checkout/:planKey" element={<Checkout />} />
                                    <Route element={<RequireSubscription />}>
                                        <Route path="/dashboard/welcome" element={<Navigate to="/dashboard" replace />} />
                                        <Route path="/translations" element={<Navigate to="/dashboard/translations-editor" replace />} />
                                        <Route path="/dashboard" element={<DashboardLayout />}>
                                            <Route index element={<Dashboard />} />
                                            <Route path="employee" element={<Navigate to="/dashboard/employee-gallery" replace />} />
                                            <Route path="employee/:jobId" element={<EmployeeWizard />} />
                                            <Route path="automations" element={<Navigate to="/dashboard/employee-gallery" replace />} />
                                            <Route path="employee-gallery" element={<EmployeeGallery />} />
                                            <Route path="employee-gallery-demo" element={<EmployeeGalleryDemo />} />
                                            <Route path="translations-editor" element={<TranslationEditor />} />
                                            <Route path="create-automation" element={<CreateAutomationRedirect />} />
                                            <Route path="config/review-funnel" element={<ReviewFunnel />} />
                                            <Route path="config/lead-capture" element={<LeadCapture />} />
                                            <Route path="config/lead-followup" element={<LeadFollowUp />} />
                                            <Route path="integrations" element={<Integrations />} />
                                            <Route path="leads" element={<Leads />} />
                                            <Route path="admin/errors" element={<AdminErrors />} />
                                            <Route path="optimization" element={<Optimization />} />
                                            <Route path="content-reviews" element={<ContentReviews />} />
                                            <Route path="review-booster" element={<ReviewBooster />} />
                                            <Route path="feedback" element={<Feedback />} />
                                            <Route path="marketplace" element={<Marketplace />} />
                                            <Route path="settings" element={<Settings />} />
                                            <Route path="profile" element={<Settings />} />
                                        </Route>
                                    </Route>
                                </Route>

                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </ToastProvider>
                </LandingContentProvider>
            </LanguageProvider>
        </Router>
    );
}

export default App;
