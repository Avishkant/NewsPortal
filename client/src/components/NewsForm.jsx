import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import API_BASE, { apiFetch } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css"; // Base Quill styles
import { Image, X, UploadCloud, Loader2, Save, Send } from "lucide-react"; // Added icons

export default function NewsForm({
  initial = {},
  onSaved,
  onCancel,
  categories = [],
  districts: districtsProp = null,
}) {
  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [category, setCategory] = useState(initial.category || "");
  const [district, setDistrict] = useState(initial.district || "");
  const [districtsList, setDistrictsList] = useState(
    Array.isArray(districtsProp) ? districtsProp : []
  );
  const [content, setContent] = useState(initial.content || "");
  const [image, setImage] = useState(initial.image || "");
  const [imagePublicId, setImagePublicId] = useState(
    initial.imagePublicId || ""
  );
  const [youtubeLink, setYoutubeLink] = useState(initial.youtubeLink || "");
  const [headline, setHeadline] = useState(!!initial.headline);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const { authFetch, token, user } = useAuth() || {};
  const { showToast } = useToast();
  const hiddenFileRef = useRef(null);
  const featureFileRef = useRef(null); // Ref for featured image upload

  // --- Quill Configuration ---
  const modules = {
    toolbar: {
      container: [
        [{ font: [] }, { size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [
          { list: "ordered" },
          { list: "bullet" },
          { indent: "-1" },
          { indent: "+1" },
        ],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: {
        // Handle inserting image into the editor by clicking the hidden input
        image: () => hiddenFileRef.current && hiddenFileRef.current.click(),
      },
    },
  };

  const formats = [
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "list",
    "indent",
    "link",
    "image",
    "video",
  ];

  const { quill, quillRef } = useQuill({ modules, formats });

  // --- State Synchronization ---
  useEffect(() => {
    setTitle(initial.title || "");
    setSlug(initial.slug || "");
    setCategory(initial.category || "");
    setDistrict(initial.district || "");
    setYoutubeLink(initial.youtubeLink || "");
    setContent(initial.content || "");
    setImage(initial.image || "");
    setImagePublicId(initial.imagePublicId || "");
    setHeadline(!!initial.headline);
  }, [initial]);

  // fetch districts if not provided by prop
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (Array.isArray(districtsProp) && districtsProp.length > 0) return;
      try {
        const list = await apiFetch("/api/districts");
        if (!mounted) return;
        if (Array.isArray(list) && list.length > 0) {
          setDistrictsList(list);
        }
      } catch (err) {
        console.warn("NewsForm: failed to load districts", err?.message || err);
      }
    })();
    return () => (mounted = false);
  }, [districtsProp]);

  // Sync quill content
  useEffect(() => {
    if (!quill) return;
    try {
      if (content) quill.clipboard.dangerouslyPasteHTML(content);
    } catch {
      // ignore
    }
    const handler = () => setContent(quill.root.innerHTML);
    quill.on("text-change", handler);
    return () => quill.off("text-change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quill]);

  // Focus and scroll editor into view on mobile when Quill initializes
  useEffect(() => {
    if (!quill) return;
    try {
      const isMobile =
        typeof window !== "undefined" && window.innerWidth <= 768;
      if (isMobile) {
        // Give the editor a brief moment to render before focusing
        setTimeout(() => {
          try {
            quill.focus();
            if (
              quillRef &&
              quillRef.current &&
              quillRef.current.scrollIntoView
            ) {
              quillRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          } catch (e) {
            /* ignore focus errors */
          }
        }, 120);
      }
    } catch (e) {
      /* ignore */
    }
  }, [quill, quillRef]);

  // --- Image Upload Logic (Unchanged, but uses featureFileRef for cleanup) ---
  const handleFile = (e, insertToEditor = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setUploadError(null);

    const fd = new FormData();
    fd.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      // Reset file input after use to allow re-uploading the same file
      if (e.target) e.target.value = "";

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.url) {
            if (insertToEditor && quill) {
              try {
                const range = quill.getSelection(true) || { index: 0 };
                quill.insertEmbed(range.index, "image", data.url);
                quill.setSelection((range.index || 0) + 1);
              } catch (err) {
                console.error("Failed to insert image into editor", err);
              }
            } else {
              setImage(data.url);
              setImagePublicId(data.public_id || "");
            }
            showToast({ type: "success", message: "Image uploaded" });
          } else {
            setUploadError("Upload succeeded but no URL returned");
            showToast({
              type: "error",
              message: "Upload succeeded but no URL returned",
            });
          }
        } catch (err) {
          console.error("Invalid upload response parsing error", err);
          setUploadError("Invalid server response");
          showToast({ type: "error", message: "Invalid upload response" });
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setUploadError(
            data?.message || `Upload failed (status ${xhr.status})`
          );
          showToast({
            type: "error",
            message: data?.message || `Upload failed (status ${xhr.status})`,
          });
        } catch (err) {
          console.error("Upload fallback parse error", err);
          setUploadError(`Upload failed (status ${xhr.status})`);
          showToast({
            type: "error",
            message: `Upload failed (status ${xhr.status})`,
          });
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      if (e.target) e.target.value = ""; // Reset file input
      setUploadError("Network error during upload");
      showToast({ type: "error", message: "Network error during upload" });
    };

    xhr.send(fd);
  };

  const removeImage = () => {
    setImage("");
    setImagePublicId("");
    // Optionally call API to delete the image based on imagePublicId here
  };

  // --- Submit Logic (Unchanged) ---
  const submit = async (e) => {
    e.preventDefault();
    // Ensure we capture latest quill HTML content (in case state lags)
    const currentContent = quill ? quill.root.innerHTML : content;

    // client-side validation to avoid server 'Missing fields' response
    const stripHtmlClient = (s = "") =>
      String(s || "")
        .replace(/<[^>]*>/g, "")
        .replace(/&[^;]+;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const missing = [];
    if (!title || !String(title).trim()) missing.push("title");
    if (!currentContent || !stripHtmlClient(currentContent))
      missing.push("content");
    if (missing.length) {
      showToast({ type: "error", message: `Missing: ${missing.join(", ")}` });
      return;
    }

    const body = {
      title,
      slug,
      category,
      district,
      youtubeLink,
      content: currentContent,
      image,
      imagePublicId,
      headline,
    };
    console.log("Submitting news body:", body);
    try {
      let res;
      if (initial._id) {
        res = await authFetch(`/api/news/${initial._id}`, {
          method: "PUT",
          body,
        });
      } else {
        res = await authFetch("/api/news", { method: "POST", body });
      }
      if (res && (res._id || res.id)) {
        showToast({ type: "success", message: "News saved" });
        onSaved && onSaved();
      } else {
        console.error("Save news failed", res);
        const msg =
          res?.message ||
          (res?.missing
            ? `Missing: ${res.missing.join(", ")}`
            : "Failed to save news");
        showToast({ type: "error", message: msg });
      }
    } catch (err) {
      console.error("Failed to save news", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to save news",
      });
    }
  };

  return (
    // Form Container with modern padding and spacing
    <form onSubmit={submit} className="space-y-6">
      {/* Group 1: Title, Slug, Category (2-column on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Title Input */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Article Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a compelling news title"
            required
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition duration-200 text-gray-900"
          />
        </div>

        {/* Slug Input */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug (URL identifier)
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="article-slug-here"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition duration-200 text-gray-900 font-mono text-sm"
          />
        </div> */}
      </div>

      {/* Group 2: Category and Featured Image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          {categories && categories.length > 0 ? (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition duration-200 cursor-pointer"
            >
              <option value="">No category (optional)</option>
              {categories.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition duration-200 text-gray-900"
            />
          )}
        </div>

        {/* District Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            District (Madhya Pradesh)
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition duration-200 cursor-pointer"
          >
            <option value="">All districts / Not specified</option>
            {(districtsList && districtsList.length > 0
              ? districtsList.map((d) => ({
                  key: d.slug || d._id || d.name,
                  label: d.name,
                }))
              : [
                  "Agar Malwa",
                  "Alirajpur",
                  "Anuppur",
                  "Ashoknagar",
                  "Balaghat",
                  "Barwani",
                  "Betul",
                  "Bhind",
                  "Bhopal",
                  "Burhanpur",
                  "Chhatarpur",
                  "Chhindwara",
                  "Damoh",
                  "Datia",
                  "Dewas",
                  "Dhar",
                  "Dindori",
                  "Guna",
                  "Gwalior",
                  "Harda",
                  "Indore",
                  "Narmadapuram (Hoshangabad)",
                  "Jabalpur",
                  "Jhabua",
                  "Katni",
                  "Khandwa",
                  "Khargone",
                  "Mandla",
                  "Mandsaur",
                  "Morena",
                  "Narsinghpur",
                  "Neemuch",
                  "Niwari",
                  "Panna",
                  "Raisen",
                  "Rajgarh",
                  "Ratlam",
                  "Rewa",
                  "Sagar",
                  "Satna",
                  "Sehore",
                  "Seoni",
                  "Shahdol",
                  "Shajapur",
                  "Sheopur",
                  "Shivpuri",
                  "Sidhi",
                  "Singrauli",
                  "Tikamgarh",
                  "Ujjain",
                  "Umaria",
                  "Vidisha",
                ].map((d) => ({ key: d, label: d }))
            ).map((d) => (
              <option key={d.key} value={d.label}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        {/* YouTube Link (optional) */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Link (optional)
          </label>
          <input
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition duration-200 text-gray-900"
          />
        </div>
        {/* Featured Image Upload */}
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-inner">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Image className="h-4 w-4 mr-1 text-[var(--primary)]" /> Featured
            Image
          </label>

          {!image ? (
            <label className="block cursor-pointer">
              <input
                ref={featureFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e, false)}
                className="hidden"
                disabled={uploading}
              />
              <div className="p-4 border-2 border-dashed border-gray-400 rounded-lg text-center text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] transition duration-200 flex flex-col items-center justify-center">
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="mt-1">Uploading... {progress}%</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-6 w-6" />
                    <span className="mt-1 text-sm">
                      Click to upload (Max 2MB)
                    </span>
                  </>
                )}
              </div>
            </label>
          ) : (
            <div className="relative">
              <img
                src={image}
                alt="Featured Preview"
                className="w-full h-40 md:h-48 lg:h-56 object-cover rounded-lg shadow-md"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition transform hover:scale-110 shadow-lg"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {uploadError && (
            <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 border border-red-300 rounded-md">
              {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* Headline toggle - visible to owners only */}
      {user && user.role === "owner" && (
        <div className="flex items-center gap-3">
          <input
            id="headline"
            type="checkbox"
            checked={headline}
            onChange={(e) => setHeadline(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="headline" className="text-sm text-gray-700">
            Mark as site headline
          </label>
        </div>
      )}

      {/* Group 3: Rich Text Editor (Quill) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Article Content
        </label>
        {/* Custom Quill Styles: Ensures white background for content area and full width */}
        {/* Responsive heights: smaller on mobile, taller on desktop for comfortable editing */}
        <div
          ref={quillRef}
          className="quill-editor-container min-h-[250px] md:min-h-[400px]"
        />
        <input
          ref={hiddenFileRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e, true)}
          className="hidden"
        />
      </div>

      {/* Group 4: Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          className="px-6 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition duration-200 flex items-center transform hover:scale-[1.01] active:scale-95"
          disabled={uploading}
        >
          {initial._id ? (
            <Save className="h-5 w-5 mr-2" />
          ) : (
            <Send className="h-5 w-5 mr-2" />
          )}
          {initial._id ? "Update News" : "Publish News"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition duration-200 transform hover:scale-[1.01] active:scale-95"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/* * 🚨 NOTE: You MUST add custom CSS for the Quill editor to ensure proper light theme styling.
 * Add this CSS snippet to your global stylesheet (e.g., App.css)
 */
/*
.quill-editor-container .ql-container {
    height: 400px; 
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    border-color: #e5e7eb !important; // Match Tailwind gray-300
}
.quill-editor-container .ql-toolbar {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background-color: #f9fafb; // Match Tailwind gray-50
    border-color: #e5e7eb !important;
}
.quill-editor-container .ql-editor {
    min-height: 400px;
    background-color: white; // Ensures content area is white
    color: #1f2937; // Ensures text is dark
}
*/
