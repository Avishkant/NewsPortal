import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion"; // Import motion
import { Clock, Tag, Edit } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function NewsCard({ item }) {
  const { user } = useAuth() || {};
  const [visible, setVisible] = useState(false);

  // Staggered entrance transition effect
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const excerpt = (() => {
    if (!item?.content) return "";
    // Strips HTML tags from the content
    const t = String(item.content).replace(/<[^>]*>/g, "");
    return t.length > 140 ? t.slice(0, 137) + "..." : t;
  })();

  // --- Render Component ---
  return (
    <motion.article
      // Framer Motion for powerful hover effects and entrance animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
      whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg h-full flex flex-col min-h-[420px]"
    >
      <Link to={`/news/${item._id}`} className="block">
        <div className="h-40 md:h-48 w-full bg-gray-100 overflow-hidden relative">
          <motion.img
            src={item.image || "/vite.svg"}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
            // Image zoom on hover inside the card
            whileHover={{ scale: 1.1 }}
          />
          {/* Subtle gradient to anchor text if necessary */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Edit button: visible to owner or the article author */}
          {user &&
            (user.role === "owner" ||
              (item.author &&
                (item.author._id === user.id || item.author === user.id))) && (
              <Link
                to={`/news/${item._id}`}
                className="absolute top-3 right-3 bg-white/90 text-gray-800 p-2 rounded-full shadow-md hover:bg-white"
                title="Edit Article"
              >
                <Edit className="h-4 w-4" />
              </Link>
            )}

          {/* Optional Headline Badge */}
          {item.headline && (
            <span className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              HEADLINE
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        {/* Title and Date */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg md:text-xl font-extrabold text-gray-900 line-clamp-2">
            <Link
              to={`/news/${item._id}`}
              className="hover:text-blue-600 transition"
            >
              {item.title}
            </Link>
          </h3>
        </div>

        {/* Excerpt */}
        <p className="mt-2 text-sm text-gray-600 line-clamp-3 flex-1">
          {excerpt}
        </p>

        {/* Metadata and Author (stick to bottom) */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            {/* Category Pill */}
            {item.category && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                {item.category}
              </span>
            )}

            {/* Author */}
            <span className="text-xs text-gray-500">
              {item.author?.name || "Reporter"}
            </span>
          </div>

          {/* Action and Date */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />{" "}
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
            <Link
              to={`/news/${item._id}`}
              className="text-sm px-3 py-1 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-700 transition font-semibold"
            >
              Read
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
