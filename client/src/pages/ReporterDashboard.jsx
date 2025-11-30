import { useEffect, useState, lazy, Suspense, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import Modal from "../components/Modal.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
const LazyNewsForm = lazy(() => import("../components/NewsForm.jsx"));
import { useToast } from "../contexts/ToastContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "../components/Pagination.jsx";
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
  Menu,
  User,
} from "lucide-react";
import { formatDate } from "../utils/formatDate.js";
import { useConfirm } from "../contexts/ConfirmContext.jsx";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authFetch, user, logout, promptLogout, refreshUser } =
    useAuth() || {};
  const { showToast } = useToast();
  const promptConfirm = useConfirm();
  const [showProfile, setShowProfile] = useState(false);
  // keyboard shortcut: press 'm' to toggle mobile menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "m" || e.key === "M") setSidebarOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    const onToggle = () => setSidebarOpen((v) => !v);
    window.addEventListener("toggleSidebar", onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("toggleSidebar", onToggle);
    };
  }, []);
  const [news, setNews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  // request sequencing to avoid race conditions from overlapping loads
  const requestSeqRef = useRef(0);
  const [totalAll, setTotalAll] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const navigate = useNavigate();

  const load = async (opts = {}) => {
    if (!authFetch) return;
    setLoading(true);
    const mySeq = ++requestSeqRef.current;
    try {
      const q = new URLSearchParams();
      const requestedPage = String(opts.page || page || 1);
      const requestedLimit = String(opts.limit || perPage || 10);
      const requestedFilter = String(opts.filter || filter || "all");
      q.set("page", requestedPage);
      q.set("limit", requestedLimit);
      q.set("filter", requestedFilter);
      const qStr = q.toString();
      // store last query string so we can ignore unrelated responses
      requestSeqRef.current_query = qStr;
      const resp = await authFetch(`/api/news/mine?${qStr}`);
      // ignore stale responses (sequence mismatch)
      if (mySeq !== requestSeqRef.current) {
        return;
      }
      // ignore responses that don't match the last requested query string
      if (requestSeqRef.current_query && requestSeqRef.current_query !== qStr) {
        return;
      }
      if (!resp || !Array.isArray(resp.items)) {
        console.error("Unexpected /api/news/mine response:", resp);
        const msg = resp?.message || String(resp || "");
        showToast({
          type: "error",
          message: msg || "Failed to load your news",
        });
        if (/not authorized|token invalid|unauthorized/i.test(msg)) {
          logout && logout();
        }
        setNews([]);
        setTotal(0);
        return;
      }
      // Ensure items are shown newest-first (by published/created/updated date)
      const getTime = (it) => {
        if (!it) return 0;
        return (
          Date.parse(it.publishedAt) ||
          Date.parse(it.createdAt) ||
          Date.parse(it.updatedAt) ||
          0
        );
      };
      setNews(
        (resp.items || []).slice().sort((a, b) => getTime(b) - getTime(a))
      );
      setTotal(Number(resp.total) || 0);
      // sync page/perPage from server response
      if (resp.page) setPage(Number(resp.page));
      // Do NOT honour server-supplied `limit` here — keep `perPage` under
      // local client control to avoid stray responses (e.g. summary calls)
      // from changing the user's selected page size.
    } catch (err) {
      console.error("Failed to load news", err);
      showToast({ type: "error", message: "Failed to load your news" });
    } finally {
      setLoading(false);
    }
  };

  // logout confirmation handled centrally via AuthContext.promptLogout()

  // load categories/districts once when user becomes available
  useEffect(() => {
    if (!user) return;
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // load paginated news whenever user, page, perPage or filter changes
  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, perPage, filter]);

  // Explicit handlers to ensure load() is called immediately when user actions
  const handleFilterChange = (f) => {
    setFilter(f);
    setPage(1);
    // call load explicitly to avoid relying solely on effect timing
    load({ page: 1, limit: perPage, filter: f });
  };

  const handlePageChange = (p) => {
    setPage(p);
    load({ page: p, limit: perPage });
  };

  const handlePerPageChange = (lim) => {
    setPerPage(lim);
    setPage(1);
    load({ page: 1, limit: lim });
  };

  // fetch summary counts (total, pending, approved)
  useEffect(() => {
    if (!user || !authFetch) return;
    (async () => {
      try {
        const [allResp, pendingResp, approvedResp] = await Promise.all([
          authFetch(`/api/news/mine?page=1&limit=1&filter=all`),
          authFetch(`/api/news/mine?page=1&limit=1&filter=pending`),
          authFetch(`/api/news/mine?page=1&limit=1&filter=approved`),
        ]);
        setTotalAll(Number(allResp?.total) || 0);
        setPendingCount(Number(pendingResp?.total) || 0);
        setApprovedCount(Number(approvedResp?.total) || 0);
      } catch (err) {
        console.warn("Failed to load news summary counts", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // called after the form saves a news item
  const onSaved = () => {
    showToast({ type: "success", message: "News saved" });
    setEditing(null);
    load();
  };

  // remove or request deletion for a news item
  const remove = async (id, isApproved) => {
    if (isApproved) {
      const ok = await promptConfirm({
        title: "Request deletion",
        message:
          "This article is APPROVED. Request deletion (owner will review)?",
      });
      if (!ok) return;
      try {
        const resp = await authFetch(`/api/news/${id}/request-delete`, {
          method: "POST",
        });
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

    const ok = await promptConfirm({
      title: "Delete news",
      message: "Delete this news item (currently pending/draft)?",
    });
    if (!ok) return;
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

  // use server-provided counts for summary; `news` already reflects current filter/page
  const displayedNews = news || [];

  // server-side pagination in use; `displayedNews` contains current page items

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
            label: "Create News",
            onClick: () => setEditing({}),
            icon: <Plus className="h-4 w-4" />,
            active: editing !== null,
          },
          {
            key: "logout",
            label: "Logout",
            onClick: () => {
              try {
                if (promptLogout) promptLogout();
                else if (logout) logout();
              } catch (e) {
                console.warn("Logout failed", e);
              }
            },
            icon: <LogOut className="h-4 w-4" />,
            isBottom: true,
          },
        ]}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile hamburger removed — header button controls the sidebar now */}

      <main className="flex-1 p-8">
        {/* Main Header */}
        <div className="mb-6 border-b border-gray-200 pb-3 flex items-center justify-between flex-wrap">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-800 truncate">
              Welcome, {user.name || "Reporter"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await refreshUser?.();
                } catch {
                  /* ignore */
                }
                setShowProfile(true);
              }}
              aria-label="Open profile"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition flex-shrink-0"
            >
              <User className="h-5 w-5 text-gray-700" />
              <span className="hidden sm:inline text-sm text-gray-700">
                Profile
              </span>
            </button>
          </div>
        </div>

        {/* Profile is available via the Profile button (modal). */}

        {/* Summary cards */}
        {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <DashboardCard
              title="Total Submitted"
              value={totalAll}
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
              value={approvedCount}
              icon={CheckCircle}
              colorClass="text-green-600"
              bgColor="bg-white"
            />
          </div>
        )}
        {/* Profile Modal */}
        {showProfile && (
          <Modal
            title="Your Profile"
            onClose={() => setShowProfile(false)}
            actions={
              <>
                <button
                  onClick={() => setShowProfile(false)}
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </>
            }
          >
            <div className="space-y-3">
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-semibold text-gray-900">
                {user.name || "-"}
              </div>

              <div className="text-sm text-gray-500">Email</div>
              <div className="text-sm text-gray-700 break-words">
                {user.email || "-"}
              </div>

              <div className="text-sm text-gray-500">Reporter ID</div>
              <div className="text-sm font-mono text-gray-700 break-words">
                {user.reporterId || "—"}
              </div>
            </div>
          </Modal>
        )}

        {/* Editor or List View Toggle */}
        {!editing && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div className="w-full sm:w-auto min-w-0">
              <h2 className="text-2xl font-semibold text-gray-700">
                {editing ? "Create/Edit Article" : "Your Articles"}
              </h2>
              <div className="mt-2 sm:mt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange("all")}
                  className={`px-3 py-1 rounded ${
                    filter === "all"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({totalAll})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("pending")}
                  className={`px-3 py-1 rounded ${
                    filter === "pending"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("approved")}
                  className={`px-3 py-1 rounded ${
                    filter === "approved"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Approved ({approvedCount})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate("/news")}
                className="px-3 py-2 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 text-gray-800 transition"
              >
                <Home className="h-4 w-4 inline mr-1" /> View Public Site
              </button>
            </div>
          </div>
        )}

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
              {/* Global ConfirmDialog handled by AuthContext.promptLogout() */}
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
              {loading ? (
                <p className="text-center text-gray-500 py-4">Loading…</p>
              ) : totalAll === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  You have not submitted any articles yet. Click 'create news'
                  to begin.
                </p>
              ) : (
                displayedNews.map((n) => {
                  const isApproved =
                    n.status === "approved" && n.approved !== false;
                  return (
                    <motion.div
                      key={n._id}
                      className="p-3 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate(`/news/${n._id}`)}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 line-clamp-2">
                            {n.title}
                          </div>
                          <div className="text-sm text-gray-600 break-words">
                            {n.category} — {formatDate(n.createdAt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                          <StatusPill status={n.status} approved={n.approved} />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(n);
                            }}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition text-sm font-medium whitespace-nowrap"
                            title="Edit Article"
                          >
                            Edit
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(n._id, isApproved);
                            }}
                            title={
                              isApproved
                                ? "Delete Approved Article"
                                : "Delete Draft"
                            }
                            className={`px-3 py-1 rounded-md text-sm font-medium transition shadow-sm whitespace-nowrap ${
                              !isApproved
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white"
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {total > 0 && (
                <div className="mt-4 flex justify-end">
                  <Pagination
                    page={page}
                    perPage={perPage}
                    total={total}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                  />
                </div>
              )}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
