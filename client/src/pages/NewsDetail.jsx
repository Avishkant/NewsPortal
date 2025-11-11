import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { motion } from "framer-motion";
import { Share2, Edit, Trash2, Eye, MapPin } from "lucide-react";

// --- Main Component ---

export default function NewsDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const { user, token } = useAuth() || {};
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/news/${id}`)
      .then((d) => setItem(d))
      .catch(() =>
        showToast({ type: "error", message: "Failed to load article." })
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const remove = async () => {
    if (!confirm("Are you sure you want to delete this news item?")) return;
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

  // Determine the primary image URL
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
            {item.districtName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {item.districtName}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                isApproved
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {isApproved ? "Approved" : "Pending"}
            </span>
          </div>

          {/* Featured Image */}
          {imageUrl && (
            <motion.div
              className="mt-6 mb-4 w-full h-80 overflow-hidden rounded-lg shadow-md"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img
                src={imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </header>

        {/* --- Article Content --- */}
        <section className="article-content prose max-w-none mb-8">
          {/* SECURITY NOTE: Trusting item.content from RichTextEditor */}
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
                  if (navigator.share) {
                    await navigator.share({
                      title: item.title,
                      text: item.title,
                      url,
                    });
                  } else {
                    await navigator.clipboard.writeText(url);
                    showToast &&
                      showToast({
                        type: "success",
                        message: "Link copied to clipboard",
                      });
                  }
                } catch {
                  // Fallback if permission/native share fails
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

            {/* YouTube CTA - compact badge inline with share buttons */}
            {item.youtubeLink && (
              <a
                href={item.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Watch on YouTube"
                className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full font-medium text-sm shadow-md hover:bg-red-700 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M23.5 6.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1-3-.2-7.5-.2-7.5-.2s-4.6 0-7.5.2c-.4 0-1.3.1-2.1 1C1.7 4.5 1.5 6.2 1.5 6.2S1 8.2 1 10.2v1.6c0 2 .5 4 5.5 4.1 1.8.1 7.5.2 7.5.2s4.6 0 7.5-.2c.4 0 1.3-.1 2.1-1 .6-.7.8-2.4.8-2.4s.5-2 .5-4.1v-1.6c0-2.1-.5-4.1-.5-4.1zM9.8 15.4V8.6l6.2 3.4-6.2 3.4z" />
                </svg>
                <span className="hidden sm:inline">Watch on YouTube</span>
              </a>
            )}
          </div>
          {/* Reporter/Admin Actions */}
          {canEdit && (
            <div className="mt-6 pt-4 border-t border-gray-200 space-x-3">
              <motion.button
                onClick={() => navigate("/reporter")}
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
      </motion.div>
    </div>
  );
}
