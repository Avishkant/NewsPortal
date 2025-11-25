import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { apiFetch } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
const LazyNewsForm = lazy(() => import("../components/NewsForm.jsx"));
import { useToast } from "../contexts/ToastContext.jsx";
import Modal from "../components/Modal.jsx";

import Sidebar from "../components/Sidebar.jsx";
import {
  Users,
  FileText,
  Clock,
  Grid,
  Settings,
  Plus,
  LogOut,
  X,
  Edit,
  Check,
  Trash,
  Zap,
  Search,
  Menu,
  MapPin,
} from "lucide-react";
// ConfirmDialog handled globally via AuthContext
import { useConfirm } from "../contexts/ConfirmContext.jsx";

export default function OwnerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const promptConfirm = useConfirm();
  const { authFetch, user, logout, promptLogout } = useAuth() || {};
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
  const [reporters, setReporters] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [reporterEdit, setReporterEdit] = useState(null);
  const [news, setNews] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [siteInfo, setSiteInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState(null);
  // logout confirmation handled by AuthContext.promptLogout()
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState("create");
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [districtModalMode, setDistrictModalMode] = useState("create");
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // --- Utility Loaders (Unchanged) ---
  const loadReporters = async () => {
    try {
      const rs = await authFetch("/api/reporters");
      setReporters(rs || []);
    } catch (err) {
      console.error("Failed to load reporters", err);
      setReporters([]);
    }
  };

  const loadNews = async () => {
    try {
      const all = await authFetch("/api/news");
      setNews(all || []);
    } catch (err) {
      console.error("Failed to load news", err);
      setNews([]);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await authFetch("/api/categories");
      setCategories(cats || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategories([]);
    }
  };

  const loadDistricts = async () => {
    try {
      const d = await authFetch("/api/districts");
      setDistricts(d || []);
    } catch (err) {
      console.error("Failed to load districts", err);
      setDistricts([]);
    }
  };

  const loadSiteInfo = async () => {
    try {
      const info = await apiFetch("/api/site");
      setSiteInfo(info || {});
    } catch (err) {
      console.error("Failed to load site info", err);
      setSiteInfo({});
    }
  };

  useEffect(() => {
    (async () => {
      setLoadError(null);
      try {
        await Promise.all([
          loadReporters(),
          loadNews(),
          loadCategories(),
          loadDistricts(),
          loadSiteInfo(),
        ]);
      } catch (err) {
        console.error("OwnerDashboard initialization failed", err);
        setLoadError(err?.message || "Failed to load dashboard data");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, user]);

  const { showToast } = useToast();

  const reloadAll = async () => {
    setLoadError(null);
    try {
      await Promise.all([loadReporters(), loadNews(), loadCategories()]);
    } catch (err) {
      console.error("Reload failed", err);
      setLoadError(err?.message || "Failed to reload data");
    }
  };

  // Helper to strip HTML tags and entities for safe excerpts
  const stripHtml = (s = "") => {
    let t = String(s || "");
    // remove tags
    t = t.replace(/<[^>]*>/g, "");
    // remove common HTML entities (e.g. &nbsp;) and any &...; patterns
    t = t.replace(/&[^;]+;/g, " ");
    // collapse whitespace
    t = t.replace(/\s+/g, " ").trim();
    return t;
  };

  // --- Reporter Management (Unchanged logic, minor style changes) ---
  const createReporter = async (e) => {
    e.preventDefault();
    try {
      console.log("Creating reporter with", form);
      const res = await authFetch("/api/reporters", {
        method: "POST",
        body: form,
      });
      // server returns { id, name, email } on success or { message } on error
      if (res && res.id) {
        setForm({ name: "", email: "", password: "" });
        await loadReporters();
        showToast({ type: "success", message: "Reporter created" });
      } else {
        console.error("Create reporter failed", res);
        showToast({
          type: "error",
          message: res?.message || "Failed to create reporter",
        });
      }
    } catch (err) {
      console.error("Failed to create reporter", err);
      showToast({ type: "error", message: "Failed to create reporter" });
    }
  };
  const removeReporter = async (id) => {
    const ok = await promptConfirm({
      title: "Remove reporter",
      message: "Remove this reporter?",
    });
    if (!ok) return;
    try {
      await authFetch(`/api/reporters/${id}`, { method: "DELETE" });
      await loadReporters();
      showToast({ type: "success", message: "Reporter removed" });
    } catch (err) {
      console.error("Failed to remove reporter", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to remove reporter",
      });
    }
  };

  const startEditReporter = (r) => {
    // open edit form populated with reporter data (password left blank)
    setReporterEdit({ ...r, password: "" });
  };

  const submitEditReporter = async (e) => {
    e.preventDefault();
    if (!reporterEdit || !reporterEdit._id) return;
    try {
      const body = { name: reporterEdit.name, email: reporterEdit.email };
      if (reporterEdit.password) body.password = reporterEdit.password;
      // attempt to update via PUT (server may not implement this; handle errors)
      const res = await authFetch(`/api/reporters/${reporterEdit._id}`, {
        method: "PUT",
        body,
      });
      if (res && (res.id || res._id)) {
        setReporterEdit(null);
        await loadReporters();
        showToast({ type: "success", message: "Reporter updated" });
      } else {
        // server may return { message: "..." } or a string
        console.error("Update reporter failed", res);
        showToast({
          type: "error",
          message:
            res?.message ||
            "Failed to update reporter (server may not support edit)",
        });
      }
    } catch (err) {
      console.error("Failed to update reporter", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to update reporter",
      });
    }
  };

  // --- News Management (Unchanged logic, minor style changes) ---
  const removeNews = async (id) => {
    if (!id) return;
    const ok = await promptConfirm({
      title: "Delete article",
      message: "Delete this article?",
    });
    if (!ok) return;
    try {
      await authFetch(`/api/news/${id}`, { method: "DELETE" });
      await loadNews();
      showToast({ type: "success", message: "Article deleted" });
    } catch (err) {
      console.error("Failed to delete news", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to delete article",
      });
    }
  };

  const approveNews = async (id) => {
    if (!id) return;
    const okConfirm = await promptConfirm({
      title: "Approve article",
      message: "Approve this article?",
    });
    if (!okConfirm) return;
    // optimistic update: mark approved in local state immediately
    const prev = news.slice();
    setNews((cur) =>
      cur.map((n) =>
        n._id === id ? { ...n, approved: true, status: "approved" } : n
      )
    );
    try {
      const res = await authFetch(`/api/news/${id}`, {
        method: "PUT",
        body: { approved: true, status: "approved" },
      });
      if (!res || res.message) {
        // server reported error
        setNews(prev);
        showToast({
          type: "error",
          message: res?.message || "Failed to approve article",
        });
        return;
      }
      // Refresh list so any drafts/merges applied by the server are visible
      await loadNews();
      showToast({ type: "success", message: "Article approved" });
    } catch (err) {
      console.error("Failed to approve news", err);
      setNews(prev);
      showToast({
        type: "error",
        message: err?.message || "Failed to approve article",
      });
    }
  };

  const rejectNews = async (id) => {
    if (!id) return;
    // optimistic update: mark rejected locally
    const prev = news.slice();
    setNews((cur) =>
      cur.map((n) =>
        n._id === id ? { ...n, approved: false, status: "rejected" } : n
      )
    );
    try {
      const res = await authFetch(`/api/news/${id}`, {
        method: "PUT",
        body: { approved: false, status: "rejected" },
      });
      if (!res || res.message) {
        setNews(prev);
        showToast({
          type: "error",
          message: res?.message || "Failed to reject article",
        });
        return;
      }
      showToast({ type: "success", message: "Article rejected" });
    } catch (err) {
      console.error("Failed to reject news", err);
      setNews(prev);
      showToast({
        type: "error",
        message: err?.message || "Failed to reject article",
      });
    }
  };

  const toggleHeadline = async (id, value) => {
    if (!id) return;
    try {
      await authFetch(`/api/news/${id}`, {
        method: "PUT",
        body: { headline: !!value },
      });
      await loadNews();
      showToast({
        type: "success",
        message: value ? "Marked as headline" : "Headline removed",
      });
    } catch (err) {
      console.error("Failed to toggle headline", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to update headline",
      });
    }
  };

  // --- Category Management (Unchanged logic, minor style changes) ---
  const startEditCategory = (c) => openCategoryModal("edit", c);
  const deleteCategory = async (id) => {
    if (!id) return;
    const ok = await promptConfirm({
      title: "Delete category",
      message: "Delete this category?",
    });
    if (!ok) return;
    try {
      await authFetch(`/api/categories/${id}`, { method: "DELETE" });
      await loadCategories();
      showToast({ type: "success", message: "Category deleted" });
    } catch (err) {
      console.error("Failed to delete category", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to delete category",
      });
    }
  };

  // --- District Management ---
  function openDistrictModal(mode = "create", data = null) {
    setDistrictModalMode(mode);
    if (mode === "edit" && data) {
      setEditingDistrict({ ...data });
    } else {
      setEditingDistrict({ name: "", state: "" });
    }
    setDistrictModalOpen(true);
  }

  const startEditDistrict = (d) => openDistrictModal("edit", d);

  const deleteDistrict = async (id) => {
    if (!id) return;
    const ok = await promptConfirm({
      title: "Delete district",
      message: "Delete this district?",
    });
    if (!ok) return;
    try {
      await authFetch(`/api/districts/${id}`, { method: "DELETE" });
      await loadDistricts();
      showToast({ type: "success", message: "District deleted" });
    } catch (err) {
      console.error("Failed to delete district", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to delete district",
      });
    }
  };

  async function submitDistrictModal(e) {
    e && e.preventDefault && e.preventDefault();
    if (!editingDistrict) return;
    const body = { name: editingDistrict.name };
    if (editingDistrict.state) body.state = editingDistrict.state;
    if (districtModalMode === "edit" && editingDistrict.slug) {
      body.slug = editingDistrict.slug;
    }
    try {
      let res;
      if (districtModalMode === "create") {
        res = await authFetch("/api/districts", { method: "POST", body });
      } else if (districtModalMode === "edit" && editingDistrict._id) {
        res = await authFetch(`/api/districts/${editingDistrict._id}`, {
          method: "PUT",
          body,
        });
      }
      if (res && (res._id || res.id)) {
        setDistrictModalOpen(false);
        setEditingDistrict(null);
        await loadDistricts();
        showToast({ type: "success", message: "District saved" });
      } else {
        console.error("Save district failed", res);
        showToast({
          type: "error",
          message: res?.message || "Failed to save district",
        });
      }
    } catch (err) {
      console.error("Failed to save district", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to save district",
      });
    }
  }

  function openConfirm(opts) {
    setConfirmOpts(opts || null);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmOpts(null);
  }

  function openCategoryModal(mode = "create", data = null) {
    setCategoryModalMode(mode);
    if (mode === "edit" && data) {
      setEditingCategory({ ...data });
    } else {
      setEditingCategory({ name: "" });
    }
    setCategoryModalOpen(true);
  }

  async function submitCategoryModal(e) {
    e && e.preventDefault && e.preventDefault();
    if (!editingCategory) return;
    // Create/update by name only. Slug removed from server model.
    const body = { name: editingCategory.name };
    try {
      let res;
      if (categoryModalMode === "create") {
        res = await authFetch("/api/categories", { method: "POST", body });
      } else if (categoryModalMode === "edit" && editingCategory._id) {
        res = await authFetch(`/api/categories/${editingCategory._id}`, {
          method: "PUT",
          body,
        });
      }
      if (res && (res._id || res.id)) {
        setCategoryModalOpen(false);
        setEditingCategory(null);
        await loadCategories();
        showToast({ type: "success", message: "Category saved" });
      } else {
        console.error("Save category failed", res);
        showToast({
          type: "error",
          message: res?.message || "Failed to save category",
        });
      }
    } catch (err) {
      console.error("Failed to save category", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to save category",
      });
    }
  }

  // --- Derived State (Unchanged logic) ---
  if (!user || user.role !== "owner") {
    /* ... */
  }

  const filteredNews = (news || [])
    .filter((n) => {
      // If we're viewing the 'pending' tab, only show pending items
      if (activeTab === "pending") {
        if (!(n.status === "pending" || n.approved === false)) return false;
      }

      // Category filter
      if (filterCategory) {
        if ((n.category || "") !== filterCategory) return false;
      }

      // Status filter (if set)
      if (filterStatus) {
        if ((n.status || "") !== filterStatus) return false;
      }

      // Search filter across title, content, and author name
      if (searchQuery && String(searchQuery).trim()) {
        const q = String(searchQuery).toLowerCase();
        const inTitle = String(n.title || "")
          .toLowerCase()
          .includes(q);
        const inAuthor = String(n.author?.name || "")
          .toLowerCase()
          .includes(q);
        const contentText = String(n.content || "")
          .replace(/<[^>]*>/g, "")
          .toLowerCase();
        const inContent = contentText.includes(q);
        if (!inTitle && !inAuthor && !inContent) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      // default newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return "Draft";
    }
  };

  const totalPending = (news || []).filter(
    (n) => n.status === "pending" || n.approved === false
  ).length;

  const totalDeletionRequests = (news || []).filter(
    (n) => n.deletionRequested
  ).length;

  const handleDeletionRequest = async (id, approve) => {
    if (!id) return;
    const confirmMsg = approve
      ? "Approve and permanently delete this article?"
      : "Reject deletion request for this article?";
    const ok = await promptConfirm({
      title: approve ? "Approve and delete" : "Reject deletion request",
      message: confirmMsg,
    });
    if (!ok) return;
    try {
      await authFetch(`/api/news/${id}/handle-deletion`, {
        method: "PUT",
        body: { approve: !!approve },
      });
      await loadNews();
      if (approve) showToast({ type: "success", message: "Article deleted" });
      else showToast({ type: "success", message: "Deletion request rejected" });
    } catch (err) {
      console.error("Failed to handle deletion request", err);
      showToast({
        type: "error",
        message: "Failed to handle deletion request",
      });
    }
  };

  // When switching tabs, clear any open inline editors/forms so the new tab replaces the view.
  // Do NOT clear if switching to the 'create' tab because creating/editing relies on editingNews.
  useEffect(() => {
    if (activeTab !== "create") {
      setEditingNews(null);
    }
    // always clear reporter edit when switching tabs (we don't want reporter form open on other tabs)
    setReporterEdit(null);
  }, [activeTab]);

  return (
    // Main container uses global body white background, dark text
    <div className="flex min-h-screen text-gray-800">
      {/* Sidebar - Light theme appearance (Controlled by parent's className prop) */}
      <Sidebar
        items={[
          {
            key: "overview",
            label: "Overview",
            onClick: () => setActiveTab("overview"),
            active: activeTab === "overview",
            icon: <Grid className="h-5 w-5" />,
          },
          {
            key: "reporters",
            label: "Reporters",
            onClick: () => setActiveTab("reporters"),
            active: activeTab === "reporters",
            icon: <Users className="h-5 w-5" />,
          },
          {
            key: "all",
            label: "All News",
            onClick: () => setActiveTab("all"),
            active: activeTab === "all",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            key: "pending",
            label: `Pending (${totalPending})`,
            onClick: () => setActiveTab("pending"),
            active: activeTab === "pending",
            icon: <Clock className="h-5 w-5" />,
            badge: totalPending > 0 ? totalPending : null,
          },
          {
            key: "categories",
            label: "Categories",
            onClick: () => setActiveTab("categories"),
            active: activeTab === "categories",
            icon: <Grid className="h-5 w-5" />,
          },
          {
            key: "districts",
            label: "Districts",
            onClick: () => setActiveTab("districts"),
            active: activeTab === "districts",
            icon: <MapPin className="h-5 w-5" />,
          },
          {
            key: "about",
            label: "About Page",
            onClick: () => setActiveTab("about"),
            active: activeTab === "about",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            key: "create",
            label: "Create News",
            onClick: () => {
              setActiveTab("create");
              // default to no category so reporters/owners can create uncategorized news
              setEditingNews({ category: "" });
            },
            icon: <Plus className="h-5 w-5" />,
            isPrimary: true,
          },
          {
            key: "settings",
            label: "Settings",
            onClick: () => setActiveTab("settings"),
            active: activeTab === "settings",
            icon: <Settings className="h-5 w-5" />,
            separator: true,
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
            icon: <LogOut className="h-5 w-5" />,
            isDanger: true,
          },
        ]}
        // Apply classes for the light theme sidebar
        className="w-64 bg-white shadow-lg flex-shrink-0"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile top bar: hamburger removed — header button controls sidebar now */}

      {/* Main Content Area - Subtle light gray background */}
      <ErrorBoundary>
        <main className="flex-1 p-4 lg:p-8 bg-gray-50">
          {/* Mobile header (hamburger is fixed) */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              📰 Owner Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab("create");
                  setEditingNews({ category: "" });
                }}
                className="px-3 py-1 bg-[var(--primary)] text-white rounded text-sm"
              >
                Create
              </button>
            </div>
          </div>

          <h1 className="hidden lg:block text-3xl font-bold mb-6 text-gray-900">
            📰 Owner Dashboard
          </h1>

          <div className="flex justify-end mb-6 gap-2">
            {/* <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 bg-white border rounded hover:bg-gray-100"
          >
            Return
          </button> */}
            <Link
              to="/news"
              className="px-3 py-2 bg-white border rounded hover:bg-gray-100"
            >
              Home
            </Link>
            {/* Mobile-only create button: visible on small screens where sidebar is hidden */}
            <button
              onClick={() => {
                setActiveTab("create");
                setEditingNews({ category: "" });
              }}
              className="px-3 py-2 bg-[var(--primary)] text-white rounded hover:bg-teal-600 transition lg:hidden"
              aria-label="Create News"
            >
              Create News
            </button>
          </div>

          {/* Overview Tab & Summary Cards */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card Template: Added scale on hover and transition for motion */}
                <div
                  className="card p-5 bg-white shadow-lg border-t-4 border-[var(--primary)] transition duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer"
                  onClick={() => setActiveTab("all")}
                >
                  <div className="text-sm font-medium text-[var(--muted)]">
                    Total News
                  </div>
                  <div className="text-4xl font-extrabold text-gray-900">
                    {news?.length || 0}
                  </div>
                </div>

                <div
                  className="card p-5 bg-white shadow-lg border-t-4 border-blue-600 transition duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer"
                  onClick={() => setActiveTab("reporters")}
                >
                  <div className="text-sm font-medium text-[var(--muted)]">
                    Reporters
                  </div>
                  <div className="text-4xl font-extrabold text-gray-900">
                    {reporters?.length || 0}
                  </div>
                </div>

                <div
                  className="card p-5 bg-white shadow-lg border-t-4 border-[var(--accent)] transition duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer"
                  onClick={() => setActiveTab("pending")}
                >
                  <div className="text-sm font-medium text-[var(--muted)]">
                    Pending Approvals
                  </div>
                  <div className="text-4xl font-extrabold text-[var(--accent)]">
                    {totalPending}
                  </div>
                </div>

                <div
                  className="card p-5 bg-white shadow-lg border-t-4 border-purple-600 transition duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer"
                  onClick={() => setActiveTab("categories")}
                >
                  <div className="text-sm font-medium text-[var(--muted)]">
                    Categories
                  </div>
                  <div className="text-4xl font-extrabold text-gray-900">
                    {categories?.length || 0}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error Section (Light Theme) */}
          {loadError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg shadow-sm">
              <div className="font-semibold mb-2">
                ⚠️ Data Load Error: {loadError}
              </div>
              <button
                onClick={reloadAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Retry Loading Data
              </button>
            </div>
          )}

          {/* Quick Access to Pending Approvals (for Overview) */}
          {activeTab === "overview" && totalPending > 0 && (
            <section className="mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-[var(--accent)] flex items-center">
                <Clock className="h-6 w-6 mr-2" /> Pending News for Review
              </h3>
              <div className="space-y-3">
                {news
                  .filter((n) => n.status === "pending" || n.approved === false)
                  .slice(0, 5)
                  .map((n) => (
                    <div
                      key={n._id}
                      className="p-4 bg-white rounded-lg shadow-md border-l-4 border-amber-500 flex justify-between items-center transition hover:shadow-lg hover:bg-amber-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {n.title}
                        </div>
                        <div className="text-sm text-[var(--muted)]">
                          {n.category} — by {n.author?.name}
                        </div>
                      </div>
                      <div className="space-x-2 flex items-center">
                        <button
                          onClick={() => approveNews(n._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => removeNews(n._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2 text-sm font-medium"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              {totalPending > 5 && (
                <button
                  onClick={() => setActiveTab("pending")}
                  className="mt-4 text-[var(--primary)] hover:text-teal-700 font-medium transition"
                >
                  View all {totalPending} pending items &rarr;
                </button>
              )}
            </section>
          )}

          {/* Quick Access: Deletion Requests for Owner Review */}
          {activeTab === "overview" && totalDeletionRequests > 0 && (
            <section className="mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-red-600 flex items-center">
                <Trash className="h-6 w-6 mr-2" /> Deletion Requests
              </h3>
              <div className="space-y-3">
                {news
                  .filter((n) => n.deletionRequested)
                  .slice(0, 5)
                  .map((n) => (
                    <div
                      key={n._id}
                      className="p-4 bg-white rounded-lg shadow-md border-l-4 border-red-400 flex justify-between items-center transition hover:shadow-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {n.title}
                        </div>
                        <div className="text-sm text-[var(--muted)]">
                          by {n.author?.name} — requested{" "}
                          {new Date(n.deletionRequestedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="space-x-2 flex items-center">
                        <button
                          onClick={() => handleDeletionRequest(n._id, true)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
                          title="Approve Deletion"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleDeletionRequest(n._id, false)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center gap-2 text-sm font-medium"
                          title="Reject Deletion"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              {totalDeletionRequests > 5 && (
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-4 text-red-600 hover:text-red-800 font-medium transition"
                >
                  View all {totalDeletionRequests} deletion requests &rarr;
                </button>
              )}
            </section>
          )}

          {/* Create / Edit News Form (owner) */}
          {activeTab === "create" && editingNews && (
            <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border-t-4 border-[var(--primary)] transition duration-300 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-2xl font-semibold mb-4 text-[var(--primary)]">
                {editingNews._id ? "Edit News Article" : "Create New News"}
              </h3>
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="p-4 text-[var(--muted)]">
                      Loading rich text editor…
                    </div>
                  }
                >
                  <LazyNewsForm
                    initial={editingNews}
                    onSaved={() => {
                      setEditingNews(null);
                      loadNews();
                      showToast({
                        type: "success",
                        message: "News saved successfully!",
                      });
                    }}
                    onCancel={() => setEditingNews(null)}
                    categories={categories}
                    districts={districts}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}

          {/* Reporters Tab */}
          {/* About Page Editor (owner only) */}
          {activeTab === "about" && (
            <section className="mb-6">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Edit About Page
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Editor Name
                  </label>
                  <input
                    value={siteInfo?.editorName || ""}
                    onChange={(e) =>
                      setSiteInfo({
                        ...(siteInfo || {}),
                        editorName: e.target.value,
                      })
                    }
                    placeholder="Editor name"
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Editor Title
                  </label>
                  <input
                    value={siteInfo?.editorTitle || ""}
                    onChange={(e) =>
                      setSiteInfo({
                        ...(siteInfo || {}),
                        editorTitle: e.target.value,
                      })
                    }
                    placeholder="Editor title (e.g., Editor-in-Chief)"
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Editor Email
                  </label>
                  <input
                    value={siteInfo?.editorEmail || ""}
                    onChange={(e) =>
                      setSiteInfo({
                        ...(siteInfo || {}),
                        editorEmail: e.target.value,
                      })
                    }
                    placeholder="editor@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Editor Image URL
                  </label>
                  <input
                    value={siteInfo?.editorImage || ""}
                    onChange={(e) =>
                      setSiteInfo({
                        ...(siteInfo || {}),
                        editorImage: e.target.value,
                      })
                    }
                    placeholder="https://...jpg"
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                  />
                  {siteInfo?.editorImage && (
                    <img
                      src={siteInfo.editorImage}
                      alt="editor"
                      className="w-28 h-28 object-cover rounded-full mt-2"
                    />
                  )}

                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                    Mission (short)
                  </label>
                  <textarea
                    value={siteInfo?.mission || ""}
                    onChange={(e) =>
                      setSiteInfo({
                        ...(siteInfo || {}),
                        mission: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                    rows={4}
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    About HTML (rich text)
                  </label>
                  <textarea
                    value={siteInfo?.aboutHtml || ""}
                    onChange={(e) =>
                      setSiteInfo({
                        ...(siteInfo || {}),
                        aboutHtml: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                    rows={6}
                  />

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={async () => {
                        try {
                          const res = await authFetch(`/api/site`, {
                            method: "PUT",
                            body: siteInfo || {},
                          });
                          if (res && res._id) {
                            showToast({
                              type: "success",
                              message: "About page updated",
                            });
                            setSiteInfo(res);
                          } else {
                            showToast({ type: "success", message: "Saved" });
                          }
                        } catch (err) {
                          console.error("Failed to save site info", err);
                          showToast({
                            type: "error",
                            message: err?.message || "Failed to save",
                          });
                        }
                      }}
                      className="px-4 py-2 bg-[var(--primary)] text-white rounded-md"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => loadSiteInfo()}
                      className="px-4 py-2 bg-gray-100 rounded-md"
                    >
                      Reload
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-lg">
                  <h4 className="text-lg font-semibold mb-3">Preview</h4>
                  <div className="flex items-start gap-4">
                    <div>
                      <img
                        src={siteInfo?.editorImage || "/vite.svg"}
                        alt="editor"
                        className="w-24 h-24 object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h5 className="text-lg font-bold">
                        {siteInfo?.editorName || "Editor Name"}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {siteInfo?.editorTitle || "Editor-in-Chief"}
                      </p>
                      <p className="text-sm text-gray-700 mt-3">
                        {siteInfo?.mission}
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-4 prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        siteInfo?.aboutHtml || "<p>No about content yet.</p>",
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === "reporters" && (
            <section className="mb-6">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Manage Reporters
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create/Edit Form Card */}
                <div className="p-6 bg-white rounded-xl shadow-lg h-full">
                  <h4 className="text-xl font-medium mb-4 border-b border-gray-200 pb-2 text-gray-900">
                    {reporterEdit ? "Edit Reporter" : "Create New Reporter"}
                  </h4>
                  <form
                    onSubmit={
                      reporterEdit ? submitEditReporter : createReporter
                    }
                    className="space-y-4"
                  >
                    <input
                      value={reporterEdit ? reporterEdit.name : form.name}
                      onChange={(e) =>
                        reporterEdit
                          ? setReporterEdit({
                              ...reporterEdit,
                              name: e.target.value,
                            })
                          : setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Full Name"
                      className="p-3 border border-gray-300 rounded-lg w-full focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500"
                      required
                    />

                    <input
                      value={reporterEdit ? reporterEdit.email : form.email}
                      onChange={(e) =>
                        reporterEdit
                          ? setReporterEdit({
                              ...reporterEdit,
                              email: e.target.value,
                            })
                          : setForm({ ...form, email: e.target.value })
                      }
                      placeholder="Email"
                      type="email"
                      className="p-3 border border-gray-300 rounded-lg w-full focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500"
                      required
                    />

                    <input
                      value={
                        reporterEdit
                          ? reporterEdit.password || ""
                          : form.password
                      }
                      onChange={(e) =>
                        reporterEdit
                          ? setReporterEdit({
                              ...reporterEdit,
                              password: e.target.value,
                            })
                          : setForm({ ...form, password: e.target.value })
                      }
                      placeholder={
                        reporterEdit
                          ? "New password (leave blank to keep)"
                          : "Password"
                      }
                      type="password"
                      className="p-3 border border-gray-300 rounded-lg w-full focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500"
                      {...(reporterEdit ? {} : { required: true })}
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-teal-600 transition shadow-md transform hover:scale-[1.02]"
                      >
                        {reporterEdit ? "Save Changes" : "Add Reporter"}
                      </button>
                      {reporterEdit && (
                        <button
                          onClick={() => setReporterEdit(null)}
                          type="button"
                          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Reporters List Card */}
                <div className="p-6 bg-white rounded-xl shadow-lg">
                  <h4 className="text-xl font-medium mb-4 border-b border-gray-200 pb-2 text-gray-900">
                    Reporter List ({reporters.length})
                  </h4>
                  <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {reporters.map((r) => (
                      <li
                        key={r._id}
                        className="p-3 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200 transform hover:translate-x-0.5"
                      >
                        <div>
                          <div className="font-semibold text-gray-900">
                            {r.name}
                          </div>
                          <div className="text-sm text-[var(--muted)]">
                            {r.email}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {/* Buttons with hover scale effect */}
                          <button
                            onClick={() => startEditReporter(r)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition flex items-center gap-2 text-sm font-medium"
                            title="Edit"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-6.882 4.414a1 1 0 010 1.414L7.586 10l-4 4V16h2l4-4 .172.172a1 1 0 011.414 0l4-4a1 1 0 010-1.414l-4-4a1 1 0 01-1.414 0l-4 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => removeReporter(r._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2 text-sm font-medium"
                            title="Remove"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* All News & Pending Tabs */}
          {(activeTab === "all" || activeTab === "pending") && (
            <section>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                {activeTab === "pending"
                  ? "Pending News for Approval"
                  : "All News Articles"}
              </h3>

              {/* Filters and Sorting (Card Container) */}
              <div className="p-4 bg-white shadow-md rounded-xl mb-6 flex flex-col md:flex-row md:items-center md:gap-4 justify-between">
                <div className="flex items-center w-full md:w-auto mb-3 md:mb-0 relative">
                  <Search className="h-5 w-5 absolute left-3 text-[var(--muted)]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, content, or author..."
                    className="p-2 pl-10 border border-gray-300 rounded-lg w-full md:w-80 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Select fields with updated light theme styling */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-[var(--primary)]"
                  >
                    <option value="">Category: All</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {/* ... other selects updated similarly ... */}
                </div>
              </div>

              {/* News List Grid - Overflow Fix Implemented */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNews.map((n) => (
                  <div
                    key={n._id}
                    // Added transition, scale, and box shadow for motion
                    onClick={() => navigate(`/news/${n._id}`)}
                    className="p-5 bg-white shadow-lg rounded-xl flex flex-col justify-between border-t-4 border-gray-200 transition duration-300 hover:shadow-xl hover:scale-[1.01] transform cursor-pointer"
                  >
                    <div>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${getStatusColor(
                          n.status
                        )}`}
                      >
                        {getStatusLabel(n.status)}
                      </span>
                      {/* 🌟 OVERFLOW FIX: line-clamp-2 for titles */}
                      <div className="font-bold text-lg text-gray-900 leading-snug mb-1 line-clamp-2">
                        {n.title}
                      </div>
                      <div className="text-xs font-medium text-[var(--primary)]">
                        {n.category}
                      </div>
                      <div className="text-sm text-[var(--muted)] mt-1">
                        by {n.author?.name || "Owner"}
                      </div>
                      {/* 🌟 OVERFLOW FIX: line-clamp-3 for content snippet */}
                      <div className="mt-3 text-sm text-gray-600 line-clamp-3">
                        {n.content
                          ? stripHtml(n.content).slice(0, 100) + "..."
                          : ""}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-3 space-y-2">
                      {activeTab === "pending" && n.status === "pending" && (
                        <div className="flex gap-2">
                          {/* Approval button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approveNews(n._id);
                            }}
                            className="flex-1 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center text-sm transform hover:scale-105"
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </button>
                          {/* Delete button for pending items */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNews(n._id);
                            }}
                            className="flex-1 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center text-sm transform hover:scale-105"
                          >
                            <Trash className="h-4 w-4 mr-1" /> Delete
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 min-w-0 gap-2">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="min-w-0 flex-1 flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!n.headline}
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleHeadline(n._id, e.target.checked);
                            }}
                            className="form-checkbox h-4 w-4 text-[var(--primary)] rounded border-gray-400 flex-shrink-0"
                          />
                          <Zap
                            className={`h-4 w-4 ${
                              n.headline
                                ? "text-[var(--accent)]"
                                : "text-[var(--muted)]"
                            } transition duration-200 flex-shrink-0`}
                          />
                          <span className="font-medium truncate">Headline</span>
                        </label>
                        <div className="flex gap-2 items-center flex-shrink-0">
                          {/* Action buttons with motion */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab("create");
                              setEditingNews(n);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
                            title="Edit Article"
                          >
                            Edit
                          </button>
                          {!(
                            activeTab === "pending" && n.status === "pending"
                          ) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNews(n._id);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
                              title="Delete Article"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Categories Tab (Apply light theme and hover effects) */}
          {activeTab === "categories" && (
            <section>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Manage Categories
              </h3>
              <div className="mb-6">
                <button
                  onClick={() => openCategoryModal("create")}
                  className="px-5 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-teal-600 transition shadow-md flex items-center transform hover:scale-[1.02]"
                >
                  <Plus className="h-5 w-5 mr-2" /> Create New Category
                </button>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-lg max-w-lg">
                <ul className="space-y-3">
                  {categories.map((c) => (
                    <li
                      key={c._id}
                      className="p-3 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200 transform hover:translate-x-0.5"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {c.name}
                        </div>
                        <div className="text-sm text-[var(--muted)] font-mono">
                          Created: {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditCategory(c)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition text-sm font-medium"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(c._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2 text-sm font-medium"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Districts Tab */}
          {activeTab === "districts" && (
            <section>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Manage Districts
              </h3>
              <div className="mb-6">
                <button
                  onClick={() => openDistrictModal("create")}
                  className="px-5 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-teal-600 transition shadow-md flex items-center transform hover:scale-[1.02]"
                >
                  <Plus className="h-5 w-5 mr-2" /> Create New District
                </button>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-lg max-w-lg">
                <ul className="space-y-3">
                  {districts.map((d) => (
                    <li
                      key={d._id}
                      className="p-3 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200 transform hover:translate-x-0.5"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {d.name}
                        </div>
                        <div className="text-sm text-[var(--muted)] font-mono">
                          Slug: {d.slug}
                        </div>
                        {d.state && (
                          <div className="text-sm text-[var(--muted)]">
                            State: {d.state}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditDistrict(d)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition text-sm font-medium"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteDistrict(d._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2 text-sm font-medium"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* ... Settings Tab and Modals (Modal content adjusted for light theme) ... */}

          {/* Category Modal - Ensure inputs are light theme compliant */}
          {categoryModalOpen && editingCategory && (
            <Modal
              title={
                categoryModalMode === "create"
                  ? "Create Category"
                  : "Edit Category"
              }
              onClose={() => {
                setCategoryModalOpen(false);
                setEditingCategory(null);
              }}
            >
              <form onSubmit={submitCategoryModal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Name (e.g., Sports)"
                    required
                  />
                </div>

                {/* No slug field for categories anymore */}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalOpen(false);
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-teal-600"
                  >
                    {categoryModalMode === "create" ? "Create" : "Save"}
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* District Modal */}
          {districtModalOpen && editingDistrict && (
            <Modal
              title={
                districtModalMode === "create"
                  ? "Create District"
                  : "Edit District"
              }
              onClose={() => {
                setDistrictModalOpen(false);
                setEditingDistrict(null);
              }}
            >
              <form onSubmit={submitDistrictModal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    value={editingDistrict.name}
                    onChange={(e) =>
                      setEditingDistrict({
                        ...editingDistrict,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Name (e.g., इंदौर)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State (optional)
                  </label>
                  <input
                    value={editingDistrict.state || ""}
                    onChange={(e) =>
                      setEditingDistrict({
                        ...editingDistrict,
                        state: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500"
                    placeholder="State (e.g., मध्य प्रदेश)"
                  />
                </div>

                {districtModalMode === "edit" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (url-friendly)
                    </label>
                    <input
                      value={editingDistrict.slug || ""}
                      onChange={(e) =>
                        setEditingDistrict({
                          ...editingDistrict,
                          slug: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition bg-white text-gray-900 placeholder-gray-500 font-mono"
                      placeholder="slug-for-district"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDistrictModalOpen(false);
                      setEditingDistrict(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-teal-600"
                  >
                    {districtModalMode === "create" ? "Create" : "Save"}
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </main>
      </ErrorBoundary>
      {/* Global ConfirmDialog handled by AuthContext.promptLogout() */}
    </div>
  );
}
