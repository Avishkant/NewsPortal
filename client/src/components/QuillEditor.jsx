import React, { useEffect } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

export default function QuillEditor({
  initialContent,
  onContentChange,
  modules,
  formats,
  handleImageUploadClick,
  quillInstanceRef,
}) {
  const { quill, quillRef } = useQuill({ modules, formats });

  useEffect(() => {
    if (quill) quillInstanceRef && (quillInstanceRef.current = quill);
    return () => {
      if (quillInstanceRef) quillInstanceRef.current = null;
    };
  }, [quill, quillInstanceRef]);

  useEffect(() => {
    if (!quill) return;
    try {
      if (initialContent) {
        quill.clipboard.dangerouslyPasteHTML(initialContent);
      }
    } catch {
      /* ignore */
    }

    const handler = () => onContentChange(quill.root.innerHTML);
    quill.on("text-change", handler);

    const toolbar = quill.getModule("toolbar");
    if (toolbar && typeof toolbar.addHandler === "function") {
      toolbar.addHandler("image", handleImageUploadClick);
    }

    return () => {
      quill.off("text-change", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quill]);

  useEffect(() => {
    if (!quill) return;
    try {
      const isMobile =
        typeof window !== "undefined" && window.innerWidth <= 768;
      if (isMobile) {
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
          } catch {
            // ignore
          }
        }, 120);
      }
    } catch {
      // ignore focus errors
    }
  }, [quill, quillRef]);

  return (
    <div
      ref={quillRef}
      className="quill-editor-container min-h-[250px] md:min-h-[400px] bg-white"
      tabIndex={0}
      onClick={() => {
        try {
          if (quill && typeof quill.focus === "function") quill.focus();
        } catch {
          // ignore
        }
      }}
    />
  );
}
