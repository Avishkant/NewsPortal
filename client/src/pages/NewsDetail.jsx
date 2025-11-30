import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { motion } from "framer-motion";
import NewsCard from "../components/NewsCard.jsx"; // Note: Only used for reference, not rendering
import LazyImage from "../components/LazyImage.jsx";
import RelatedCard from "../components/RelatedCard.jsx"; // Now imports the enhanced card
import { Share2, Edit, Trash2, Eye, MapPin, Clock } from "lucide-react";
import { formatDate } from "../utils/formatDate.js";
import { useConfirm } from "../contexts/ConfirmContext.jsx";

// --- Related Articles Section Component ---
// This component loads and displays articles from the same category
function RelatedByCategory({ category, excludeId, max = 4 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // NOTE: This uses the global apiFetch, which is available in NewsDetail scope
    (async () => {
      try {
        const q = new URLSearchParams();
        q.set("category", String(category || ""));
        q.set("limit", String(max + 1));
        const resp = await apiFetch(`/api/news?${q.toString()}`);
        let list = Array.isArray(resp) ? resp : resp?.items || [];

        const filtered = list
          .filter((i) => String(i._id) !== String(excludeId))
          .slice(0, max);
        if (mounted) setItems(filtered);
      } catch (err) {
        console.warn("Failed to load related articles", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [category, excludeId, max]);

  if (loading)
    return (
      <div className="text-sm text-gray-500 py-4">
        Loading related articles…
      </div>
    );
  if (!items || items.length === 0)
    return (
      <div className="text-sm text-gray-500 py-4">
        No related articles found.
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
      {items.map((it) => (
        <motion.div
          key={it._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RelatedCard item={it} />
        </motion.div>
      ))}
    </div>
  );
}

// --- Main Component ---
export default function NewsDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const { user, token } = useAuth() || {};
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const promptConfirm = useConfirm();

  useEffect(() => {
    // Ensure the page is scrolled to top when opening an article
    try {
      if (typeof window !== "undefined" && window.scrollTo) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    } catch {
      /* ignore scroll errors */
    }

    setLoading(true);
    apiFetch(`/api/news/${id}`, { token })
      .then((d) => setItem(d))
      .catch(() =>
        showToast({ type: "error", message: "Failed to load article." })
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const remove = async () => {
    const ok = await promptConfirm({
      title: "Delete news",
      message: "Are you sure you want to delete this news item?",
    });
    if (!ok) return;
    try {
      await apiFetch(`/api/news/${id}`, { method: "DELETE", token });
      showToast({ type: "success", message: "News deleted successfully." });
      navigate("/news");
    } catch {
      showToast({ type: "error", message: "Failed to delete item." });
    }
  };

  // --- Render Status ---
  if (loading)
    return (
      <div className="p-10 text-center text-gray-600">Loading article...</div>
    );
  if (!item)
    return (
      <div className="p-10 text-center text-red-600">Article not found.</div>
    );

  const canEdit =
    user && (user.role === "owner" || item.author?._id === user.id);

  const imageUrl = item.image || item.imageFile || null;
  const isApproved = item.status === "approved" && item.approved !== false;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <motion.div
        className="max-w-4xl mx-auto p-6 md:p-10 bg-white shadow-xl rounded-xl mt-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* --- Header and Metadata --- */}
        <header className="mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold mb-3 text-gray-800">
            {item.title}
          </h1>

          <div className="text-sm text-gray-500 flex items-center flex-wrap gap-x-4">
            <span className="font-semibold text-gray-700">{item.category}</span>
            <span>by {item.author?.name || "Anonymous"}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(item.createdAt)}
            </span>
            {item.districtName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {item.districtName}
              </span>
            )}
            {/* Only show approval status to authorized users */}
            {user && (user.role === "owner" || user.role === "reporter") && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isApproved
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {isApproved ? "Approved" : "Pending"}
              </span>
            )}
          </div>

          {/* Featured Image */}
          {imageUrl && (
            <motion.div
              className="mt-6 mb-4 w-full overflow-hidden rounded-lg shadow-md"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <LazyImage
                src={imageUrl || "/vite.svg"}
                alt={item.title}
                className="w-full h-auto object-cover"
              />
            </motion.div>
          )}
        </header>

        {/* --- Article Content --- */}
        <section className="article-content prose lg:prose-lg max-w-none mb-8">
          <div dangerouslySetInnerHTML={{ __html: item.content }} />
        </section>

        {/* --- Footer Details and Actions --- */}
        <footer className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {item.views || 0} views
            </span>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                View Original Source <Share2 className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap items-center gap-4 py-2">
            <span className="font-semibold text-sm text-gray-700">Share:</span>

            {/* WhatsApp Button */}
            <motion.button
              onClick={() => {
                const url = `${window.location.origin}/news/${item._id}`;
                const text = encodeURIComponent(
                  `${item.title} - Read more: ${url}`
                );
                const wa = `https://wa.me/?text=${text}`;
                window.open(wa, "_blank");
              }}
              title="Share on WhatsApp"
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-full font-medium text-sm shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="h-4 w-4" /> WhatsApp
            </motion.button>

            {/* Facebook Button */}
            <motion.button
              onClick={() => {
                const url = encodeURIComponent(
                  `${window.location.origin}/news/${item._id}`
                );
                const fb = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                window.open(fb, "_blank", "noopener,noreferrer");
              }}
              title="Share on Facebook"
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#1877F2] text-white rounded-full font-medium text-sm shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="h-4 w-4" /> Facebook
            </motion.button>

            {/* Copy Link Button */}
            <motion.button
              onClick={async () => {
                const url = `${window.location.origin}/news/${item._id}`;
                try {
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                    showToast &&
                      showToast({
                        type: "success",
                        message: "Link copied to clipboard",
                      });
                  } else {
                    prompt("Copy this link:", url);
                  }
                } catch {
                  prompt("Copy this link:", url);
                }
              }}
              title="Share / Copy link"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-full font-medium text-sm hover:bg-gray-300 transition shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="h-4 w-4" /> Copy Link
            </motion.button>

            {/* YouTube CTA */}
            {item.youtubeLink && (
              <a
                href={item.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Watch on YouTube"
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-full font-medium text-sm shadow-md hover:bg-red-700 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                  role="img"
                >
                  <rect
                    x="1"
                    y="4"
                    width="22"
                    height="16"
                    rx="4"
                    fill="#FF0000"
                  />
                  <path d="M10 8l6 4-6 4z" fill="#fff" />
                </svg>
                <span className="hidden sm:inline">Watch on YouTube</span>
              </a>
            )}
          </div>

          {/* Reporter/Admin Actions */}
          {canEdit && (
            <div className="mt-6 pt-4 border-t border-gray-200 space-x-3">
              <motion.button
                onClick={() => {
                  // Route user to their dashboard, where the editor will open
                  navigate(`/reporter?editId=${id}`);
                }}
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit className="h-4 w-4 inline mr-1" /> Edit Article
              </motion.button>
              <motion.button
                onClick={remove}
                className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="h-4 w-4 inline mr-1" /> Delete
              </motion.button>
            </div>
          )}
        </footer>

        {/* --- Related Articles --- */}
        {item?.category && (
          <div className="mt-10">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3">
                More in {item.category}
              </h2>
              <RelatedByCategory
                category={item.category}
                excludeId={item._id}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
