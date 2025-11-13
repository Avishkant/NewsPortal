import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiFetch } from "../api.js";
import NewsCard from "../components/NewsCard.jsx"; // Assuming NewsCard is styled
import { motion } from "framer-motion";
import { FaNewspaper, FaTachometerAlt } from "react-icons/fa";

// Motion variants for the staggered grid
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
};

export default function NewsList() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const { user } = useAuth() || {};
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Sync category/district from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category") || "";
    const dist = params.get("district") || "";
    setCategory(cat);
    setDistrict(dist);
    // optionally you could store the query in state if needed
    // setSearch(q);
  }, [location.search]);

  useEffect(() => {
    setLoading(true);
    // Read filters directly from the URL to avoid races between effects
    const params = new URLSearchParams(location.search);
    const cat = params.get("category") || "";
    const dist = params.get("district") || "";
    const searchQ = params.get("q") || "";
    let q = "";
    if (cat) q += `category=${encodeURIComponent(cat)}`;
    if (dist) q += `${q ? "&" : ""}district=${encodeURIComponent(dist)}`;
    if (searchQ) q += `${q ? "&" : ""}q=${encodeURIComponent(searchQ)}`;
    const qs = q ? `?${q}` : "";
    apiFetch(`/api/news${qs}`)
      .then((data) => setItems(data || []))
      .finally(() => setLoading(false));
  }, [category, district, location.search]);

  const dashboardLink = user?.role === "owner" ? "/owner" : "/reporter";

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      {/* --- Header and Controls --- */}
      <motion.div
        className="max-w-7xl mx-auto flex items-center justify-between mb-8 border-b border-gray-200 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold text-gray-800 flex items-center gap-3">
          <FaNewspaper className="text-gray-600" /> Latest News
        </h1>

        <div className="flex items-center gap-4">
          {/* Dashboard Link */}
          {user && (user.role === "owner" || user.role === "reporter") && (
            <Link
              to={dashboardLink}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition flex items-center gap-2 shadow-md"
            >
              <FaTachometerAlt /> Dashboard
            </Link>
          )}

          {/* Category filter removed */}
        </div>
      </motion.div>

      {/* --- News Grid --- */}
      {loading ? (
        <div className="text-center p-10 text-gray-500">
          Loading articles...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-10 text-gray-500 border border-gray-200 bg-white rounded-xl shadow-sm">
          No news articles found in this category.
        </div>
      ) : (
        <motion.div
          className="max-w-7xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((n) => (
            <motion.div key={n._id} variants={itemVariants} className="h-full">
              <NewsCard item={n} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
