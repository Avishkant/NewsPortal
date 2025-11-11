import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
const LazyNewsForm = lazy(() => import("../components/NewsForm.jsx"));
import { useToast } from "../contexts/ToastContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  LogOut,
  Trash2,
  Edit,
  Home,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// --- Custom Components ---

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  colorClass = "text-gray-600",
  bgColor = "bg-white",
}) => (
  <motion.div
    className={`p-5 ${bgColor} border border-gray-200 rounded-xl shadow-md flex items-center justify-between transition duration-300`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className={`text-4xl font-extrabold mt-1 ${colorClass}`}>
        {value}
      </div>
    </div>
    <Icon className={`h-10 w-10 ${colorClass} opacity-50`} />
  </motion.div>
);

const StatusPill = ({ status, approved }) => {
  const statusText =
    status === "pending" || approved === false ? "PENDING" : "APPROVED";
  const className =
    statusText === "APPROVED"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";
  const Icon = statusText === "APPROVED" ? CheckCircle : Clock;

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${className}`}
    >
      <Icon className="h-3 w-3" />
      {statusText}
    </span>
  );
};

export default function ReporterDashboard() {
  const { authFetch, user, logout } = useAuth() || {};
  const { showToast } = useToast();
  const [news, setNews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const mine = await authFetch("/api/news/mine");
      if (!Array.isArray(mine)) {
        console.error("Unexpected /api/news/mine response:", mine);
        const msg = mine?.message || String(mine || "");
        showToast({
          type: "error",
          message: msg || "Failed to load your news",
        });
        if (/not authorized|token invalid|unauthorized/i.test(msg)) {
          logout && logout();
        }
        setNews([]);
        return;
      }
      setNews(mine);
    } catch (err) {
      console.error("Failed to load news", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      await Promise.all([
        load(),
        (async () => {
          try {
            const cats = await authFetch("/api/categories");
            setCategories(Array.isArray(cats) ? cats : []);
          } catch (err) {
            console.warn(
              "ReporterDashboard: failed to load categories",
              err?.message || err
            );
          }
          try {
            const d = await authFetch("/api/districts");
            setDistricts(Array.isArray(d) ? d : []);
          } catch (err) {
            console.warn(
              "ReporterDashboard: failed to load districts",
              err?.message || err
            );
          }
        })(),
      ]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSaved = () => {
    showToast({ type: "success", message: "News saved" });
    setEditing(null);
    load();
  };

  const remove = async (id, isApproved) => {
    if (isApproved) {
      if (
        !confirm(
          "This article is APPROVED. Request deletion (owner will review)?"
        )
      )
        return;
      try {
        const resp = await authFetch(`/api/news/${id}/request-delete`, {
          method: "POST",
        });
        // server returns { message: 'Deletion requested; owner will review' }
        showToast({
          type: "success",
          message: resp?.message || "Deletion requested",
        });
        load();
      } catch (err) {
        console.error("Failed to request deletion", err);
        showToast({ type: "error", message: "Failed to request deletion" });
      }
      return;
    }

    if (!confirm("Delete this news item (currently pending/draft)?")) return;
    try {
      await authFetch(`/api/news/${id}`, { method: "DELETE" });
      showToast({ type: "success", message: "News deleted" });
      load();
    } catch (err) {
      console.error("Failed to delete news", err);
      showToast({ type: "error", message: "Failed to delete news" });
    }
  };

  if (!user || user.role !== "reporter") {
    return (
      <div className="p-4 bg-gray-50 text-red-600">
        Access denied. Reporter only.
      </div>
    );
  }

  const pendingCount = (news || []).filter(
    (n) => n.status === "pending" || n.approved === false
  ).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar
        items={[
          {
            key: "my",
            label: "My Articles",
            onClick: () => setEditing(null),
            active: editing === null,
            icon: <FileText className="h-4 w-4" />,
          },
          {
            key: "create",
            label: "Create New",
            onClick: () => setEditing({}),
            icon: <Plus className="h-4 w-4" />,
            active: editing !== null,
          },
          {
            key: "logout",
            label: "Logout",
            onClick: () => logout && logout(),
            icon: <LogOut className="h-4 w-4" />,
            isBottom: true,
          },
        ]}
      />

      <main className="flex-1 p-8">
        {/* Main Header */}
        <div className="mb-6 border-b border-gray-200 pb-3">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user.name || "Reporter"}
          </h1>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Total Submitted"
            value={news?.length || 0}
            icon={FileText}
            colorClass="text-gray-800"
            bgColor="bg-white"
          />
          <DashboardCard
            title="Pending Approval"
            value={pendingCount}
            icon={Clock}
            colorClass="text-yellow-600"
            bgColor="bg-white"
          />
          <DashboardCard
            title="Approved Articles"
            value={news.length - pendingCount}
            icon={CheckCircle}
            colorClass="text-green-600"
            bgColor="bg-white"
          />
        </div>

        {/* Editor or List View Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            {editing ? "Create/Edit Article" : "Your Articles"}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/news")}
              className="px-3 py-2 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 text-gray-800 transition"
            >
              <Home className="h-4 w-4 inline mr-1" /> View Public Site
            </button>
          </div>
        </div>

        {/* --- Form/Editor Area --- */}
        <AnimatePresence mode="wait">
          {editing && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="p-4 text-gray-500">Loading editor…</div>
                  }
                >
                  <LazyNewsForm
                    initial={editing}
                    onSaved={onSaved}
                    onCancel={() => setEditing(null)}
                    categories={categories}
                    districts={districts}
                  />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Articles List --- */}
        {!editing && (
          <motion.section
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white shadow-lg rounded-xl p-6 border border-gray-200"
          >
            <div className="space-y-3 divide-y divide-gray-100">
              {news.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  You have not submitted any articles yet. Click 'Create News'
                  to begin.
                </p>
              ) : (
                news.map((n) => {
                  const isApproved =
                    n.status === "approved" && n.approved !== false;
                  return (
                    <motion.div
                      key={n._id}
                      className="p-3 hover:bg-gray-50 rounded-lg transition"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {n.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {n.category} —{" "}
                            {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <StatusPill status={n.status} approved={n.approved} />

                          <button
                            onClick={() => setEditing(n)}
                            className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-yellow-500 hover:text-white transition shadow-sm"
                            title="Edit Article"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(n._id, isApproved)}
                            title={
                              isApproved
                                ? "Delete Approved Article"
                                : "Delete Draft"
                            }
                            className={`p-2 rounded-full transition shadow-sm ${
                              !isApproved
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white"
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
