import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { ConfirmProvider } from "./contexts/ConfirmContext.jsx";
import { SiteProvider } from "./contexts/SiteContext.jsx";
import HindiNavbar from "./components/HindiNavbar.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import ReporterDashboard from "./pages/ReporterDashboard.jsx";
import ReporterProfile from "./pages/ReporterProfile.jsx";
import NewsList from "./pages/NewsList.jsx";
import NewsDetail from "./pages/NewsDetail.jsx";
import About from "./pages/About.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import Terms from "./pages/Terms.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./App.css";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <ToastProvider>
            <SiteProvider>
              <ScrollToTop />
              <HindiNavbar />
              {/* Keep the header full-width; center the main content below it */}
              <div className="max-w-7xl mx-auto">
                <main className="p-4">
                  <Routes>
                    <Route path="/" element={<Navigate to="/news" replace />} />
                    <Route
                      path="/news"
                      element={
                        <ErrorBoundary>
                          <NewsList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/news/:id"
                      element={
                        <ErrorBoundary>
                          <NewsDetail />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/login"
                      element={
                        <ErrorBoundary>
                          <Login />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/about"
                      element={
                        <ErrorBoundary>
                          <About />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/privacy"
                      element={
                        <ErrorBoundary>
                          <PrivacyPolicy />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/terms"
                      element={
                        <ErrorBoundary>
                          <Terms />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/signup"
                      element={
                        <ErrorBoundary>
                          <Signup />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/owner"
                      element={
                        <ErrorBoundary>
                          <OwnerDashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/reporter"
                      element={
                        <ErrorBoundary>
                          <ReporterDashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/reporter/:id"
                      element={
                        <ErrorBoundary>
                          <ReporterProfile />
                        </ErrorBoundary>
                      }
                    />
                  </Routes>
                </main>
              </div>
              <Footer />
            </SiteProvider>
          </ToastProvider>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
