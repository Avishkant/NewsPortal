import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import ReporterIdCard from "../components/ReporterIdCard.jsx";
import { apiFetch } from "../api.js";

export default function ReporterProfile() {
  const { id } = useParams();
  const [reporter, setReporter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(
          `/api/reporters/public/${encodeURIComponent(id)}`
        );
        if (!mounted) return;
        setReporter(res);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="p-8">Loading reporter profile…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!reporter) return <div className="p-8">Reporter not found.</div>;

  // Render only the ID card centered on the page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <ReporterIdCard user={reporter} />
    </div>
  );
}
