import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import HindiNavbar from "./components/HindiNavbar.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import ReporterDashboard from "./pages/ReporterDashboard.jsx";
import NewsList from "./pages/NewsList.jsx";
import NewsDetail from "./pages/NewsDetail.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
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
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
