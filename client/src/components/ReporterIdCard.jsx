import React from "react";
import LazyImage from "./LazyImage.jsx";
import logo from "../assets/logo.jpg";
import { useSite } from "../contexts/SiteContext.jsx";
import { formatDate } from "../utils/formatDate.js"; // Assuming formatDate is available
import { motion } from "framer-motion";
import { User, Mail, Zap, Clock, Shield } from "lucide-react"; // Icons for flair
import QRCode from "react-qr-code";

// Helper to format the unique ID chunked for readability
const formatId = (id) => (id ? `${id.slice(0, 8)}-...${id.slice(-4)}` : "—");

export default function ReporterIdCard({ user }) {
  const { site } = useSite() || {};
  const siteName = (site && (site.name || site.title)) || "MP Netwok 10 news";
  // Prefer a canonical site URL when available (owner can set this in SiteInfo)
  const canonicalBase =
    (site && (site.url || site.siteUrl || site.domain)) ||
    (typeof window !== "undefined" && window.location?.origin) ||
    "";

  return (
    <motion.div
      className="max-w-md mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="rounded-3xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-700 text-white">
        {/* --- Card Header & Banner --- */}
        <div
          // VIBRANT HEADER BANNER
          className="p-6 sm:p-8 flex justify-between items-start"
          style={{
            background: "linear-gradient(135deg, #FF6F00 0%, #D40B0B 100%)", // Red/Orange gradient
          }}
        >
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center overflow-hidden border-2 border-white">
              {/* Placeholder for User Image/Avatar */}
              <User className="w-12 h-12 text-gray-700" />
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-medium text-white/80">{siteName}</div>
            <div className="text-xl font-extrabold tracking-widest mt-1 text-white">
              PRESS CARD
            </div>
            <div className="text-sm font-semibold mt-1 uppercase text-white/90">
              {user?.role || "REPORTER"}
            </div>
          </div>
        </div>

        {/* --- Reporter Info & Details --- */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Name */}
          <div className="border-b border-gray-700 pb-3">
            <div className="text-3xl font-extrabold text-white">
              {user?.name || "REPORTER NAME"}
            </div>
          </div>

          {/* Reporter ID, Joined Date & Email - aligned in a responsive row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
                <Zap className="w-3 h-3" /> Reporter ID
              </div>
              <div className="font-mono text-sm mt-2 text-teal-300">
                {formatId(user?.reporterId || user?._id)}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
                <Clock className="w-3 h-3" /> Joined
              </div>
              <div className="text-sm mt-2 text-gray-300">
                {user?.createdAt ? formatDate(user.createdAt) : "—"}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
                <Mail className="w-3 h-3" /> Official Email
              </div>
              <div className="text-sm mt-2 break-words text-gray-300">
                {user?.email || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* --- Verification and QR Code Footer --- */}
        <div className="bg-gray-800 p-4 sm:p-6 flex items-end justify-between gap-4 border-t border-gray-700">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div className="text-sm font-semibold text-white">
                  VERIFIED PRESS
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Valid for {siteName}</div>
          </div>

          {/* QR Code: links to reporter profile/page */}
          {/* <div className="w-28 h-28 bg-white rounded-lg flex items-center justify-center border border-gray-600 shadow-inner p-1">
            {canonicalBase ? (
              <QRCode
                value={`${canonicalBase.replace(
                  /\/$/,
                  ""
                )}/reporter/${encodeURIComponent(
                  user?.reporterId || user?._id || ""
                )}`}
                size={96}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            ) : (
              <span className="text-xs text-gray-700 font-mono">QR</span>
            )}
          </div> */}
        </div>
      </div>
    </motion.div>
  );
}
