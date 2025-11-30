import { Link, useNavigate } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";
import LazyImage from "./LazyImage.jsx"; // Assuming LazyImage is available
import { motion } from "framer-motion";
import { formatDate } from "../utils/formatDate.js";

export default function RelatedCard({ item }) {
  const navigate = useNavigate();
  const thumb = item.image || "/vite.svg";

  const excerpt = (() => {
    if (!item?.content) return "";
    const t = String(item.content).replace(/<[^>]*>/g, "");
    return t.length > 80 ? t.slice(0, 77) + "..." : t; // Shorter excerpt for related cards
  })();

  return (
    <motion.article
      className="group flex flex-col gap-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-transform transform cursor-pointer"
      onClick={() => navigate(`/news/${item._id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/news/${item._id}`)}
      role="button"
      tabIndex={0}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
        <LazyImage
          src={thumb}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {/* Category Overlay Pill */}
        <div className="absolute left-2 top-2 bg-gray-900/80 text-white/90 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm shadow-md">
          {item.category}
        </div>
      </div>

      <div className="p-4 pt-0 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 line-clamp-3 group-hover:text-red-600 transition">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">{excerpt}</p>
        </div>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(item.createdAt)}</span>
            </span>
          </div>
          <span className="text-xs text-gray-700 font-semibold flex items-center gap-1 group-hover:text-red-600 transition">
            पढ़ें <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
