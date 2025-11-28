import React, { useEffect, useRef, useState } from "react";

// Lightweight contentEditable editor used as a safe fallback when Quill
// or react-quill are not installed. This keeps the NewsForm usable without
// requiring heavy editor dependencies and avoids Vite prebundle errors.
export default function QuillEditor({
  initialContent,
  onContentChange,
  quillInstanceRef,
  handleImageUploadClick,
}) {
  const ref = useRef(null);
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  const [fontFamily, setFontFamily] = useState("");
  const [foreColor, setForeColor] = useState("");
  const [backColor, setBackColor] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  useEffect(() => {
    if (quillInstanceRef) quillInstanceRef.current = null;
    return () => {
      if (quillInstanceRef) quillInstanceRef.current = null;
    };
  }, [quillInstanceRef]);

  useEffect(() => {
    try {
      if (ref.current && typeof initialContent === "string") {
        ref.current.innerHTML = initialContent;
      }
      // eslint-disable-next-line no-empty
    } catch {}
    // After setting initial content, move caret to start of editor
    try {
      if (ref.current) {
        const setCaretToStart = () => {
          try {
            ref.current.focus();
            const range = document.createRange();
            range.selectNodeContents(ref.current);
            range.collapse(true); // collapse to start
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          } catch {
            // ignore
          }
        };
        // Schedule after paint to ensure DOM ready
        setTimeout(setCaretToStart, 0);
      }
    } catch {
      // ignore
    }
  }, [initialContent]);

  // Update toolbar active states based on current selection / caret
  useEffect(() => {
    const updateActive = () => {
      try {
        if (!ref.current) return;
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) return;
        const node =
          sel.anchorNode.nodeType === 3
            ? sel.anchorNode.parentElement
            : sel.anchorNode;

        // basic command states
        const isBold =
          document.queryCommandState && document.queryCommandState("bold");
        const isItalic =
          document.queryCommandState && document.queryCommandState("italic");
        const isUnderline =
          document.queryCommandState && document.queryCommandState("underline");
        setBoldActive(!!isBold);
        setItalicActive(!!isItalic);
        setUnderlineActive(!!isUnderline);

        // font family and colors via commandValue or computed style
        let f = "";
        try {
          f =
            document.queryCommandValue &&
            document.queryCommandValue("fontName");
        } catch {
          // ignore
        }
        if (!f) {
          try {
            f = window.getComputedStyle(node).fontFamily || "";
          } catch {
            f = "";
          }
        }
        setFontFamily(f.replace(/"/g, ""));

        let fc = "";
        try {
          fc =
            document.queryCommandValue &&
            document.queryCommandValue("foreColor");
        } catch {
          // ignore
        }
        if (!fc) {
          try {
            fc = window.getComputedStyle(node).color || "";
          } catch {
            fc = "";
          }
        }
        setForeColor(fc || "");

        let bc = "";
        try {
          bc =
            document.queryCommandValue &&
            document.queryCommandValue("hiliteColor");
        } catch {
          // ignore
        }
        if (!bc) {
          try {
            bc = window.getComputedStyle(node).backgroundColor || "";
          } catch {
            bc = "";
          }
        }
        setBackColor(bc || "");
      } catch (err) {
        console.warn("QuillEditor updateActive error:", err);
      }
    };

    document.addEventListener("selectionchange", updateActive);
    // also update on clicks/keyup
    const el = ref.current;
    if (el) {
      el.addEventListener("keyup", updateActive);
      el.addEventListener("mouseup", updateActive);
    }

    // initial update
    setTimeout(updateActive, 0);

    return () => {
      document.removeEventListener("selectionchange", updateActive);
      if (el) {
        el.removeEventListener("keyup", updateActive);
        el.removeEventListener("mouseup", updateActive);
      }
    };
  }, []);

  const exec = (cmd, value = null) => {
    // Some browsers may not support execCommand, guard it
    try {
      if (document && typeof document.execCommand === "function") {
        document.execCommand(cmd, false, value);
      } else {
        // Basic fallback: for bold/italic/underline, wrap selection
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const span = document.createElement("span");
        if (cmd === "bold") span.style.fontWeight = "bold";
        if (cmd === "italic") span.style.fontStyle = "italic";
        if (cmd === "underline") span.style.textDecoration = "underline";
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
    } catch (err) {
      console.warn("QuillEditor exec fallback failed:", err);
    }
    // Notify parent of content change
    try {
      onContentChange && onContentChange(ref.current?.innerHTML || "");
    } catch (err) {
      console.warn("QuillEditor onContentChange error:", err);
    }
    // update toolbar active state after exec
    try {
      const ev = new Event("selectionchange");
      document.dispatchEvent(ev);
    } catch (err) {
      console.warn("QuillEditor dispatch selectionchange failed:", err);
    }
  };

  const clearColorFromSelection = (isBackground = false) => {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const container =
        range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;

      // Walk elements inside container and clear color styles for nodes intersecting the range
      const els = container.querySelectorAll
        ? container.querySelectorAll("*")
        : [];
      els.forEach((el) => {
        try {
          if (range.intersectsNode(el)) {
            if (isBackground) el.style.backgroundColor = "";
            else el.style.color = "";
            if (!el.getAttribute("style")) el.removeAttribute("style");
          }
        } catch (err) {
          void err;
        }
      });

      // Also handle direct parent of text selection
      const parent =
        sel.anchorNode && sel.anchorNode.nodeType === 3
          ? sel.anchorNode.parentElement
          : null;
      if (parent) {
        if (isBackground) parent.style.backgroundColor = "";
        else parent.style.color = "";
        if (!parent.getAttribute("style")) parent.removeAttribute("style");
      }

      onContentChange && onContentChange(ref.current?.innerHTML || "");
      try {
        document.dispatchEvent(new Event("selectionchange"));
      } catch (err) {
        void err;
      }
    } catch (err) {
      console.warn("clearColorFromSelection error:", err);
    }
  };

  const handleLink = () => {
    try {
      const url = window.prompt("Enter URL (including http://)");
      if (url) exec("createLink", url);
    } catch (err) {
      console.warn("QuillEditor insert image fallback failed:", err);
    }
  };

  const handleImage = () => {
    if (typeof handleImageUploadClick === "function") {
      handleImageUploadClick();
    } else {
      // No handler provided; as a fallback, prompt for an image URL
      const url = window.prompt("Image URL");
      if (url && ref.current) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          sel.getRangeAt(0).insertNode(img);
        } else {
          ref.current.appendChild(img);
        }
        onContentChange && onContentChange(ref.current.innerHTML);
      }
    }
  };

  return (
    <div className="border rounded-lg bg-white text-left">
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-white">
        <button
          type="button"
          onClick={() => exec("bold")}
          className={`px-3 py-1 rounded-md text-sm font-semibold ${
            boldActive ? "bg-gray-200" : "hover:bg-gray-50"
          }`}
          aria-pressed={boldActive}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className={`px-3 py-1 rounded-md text-sm font-semibold ${
            italicActive ? "bg-gray-200" : "hover:bg-gray-50"
          }`}
          aria-pressed={italicActive}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className={`px-3 py-1 rounded-md text-sm font-semibold ${
            underlineActive ? "bg-gray-200" : "hover:bg-gray-50"
          }`}
          aria-pressed={underlineActive}
        >
          U
        </button>
        <button
          type="button"
          onClick={handleLink}
          className="px-3 py-1 rounded-md text-sm hover:bg-gray-50"
        >
          Link
        </button>
        <button
          type="button"
          onClick={handleImage}
          className="px-3 py-1 rounded-md text-sm hover:bg-gray-50"
        >
          Image
        </button>

        <select
          aria-label="Font family"
          value={fontFamily || ""}
          onChange={(e) => {
            exec("fontName", e.target.value);
            setFontFamily(e.target.value);
          }}
          className="px-2 py-1 border rounded bg-white text-sm"
        >
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
        </select>

        <div className="relative">
          <button
            type="button"
            title="Text color"
            onClick={() => setShowColorPicker((v) => !v)}
            className="flex items-center gap-2 px-2 py-1 border rounded"
          >
            <span
              className="w-3 h-3 inline-block border"
              style={{ background: foreColor || "#000" }}
            />
            <span className="text-xs">A</span>
          </button>
          {showColorPicker && (
            <div className="absolute z-50 mt-2 p-2 bg-white border rounded shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    clearColorFromSelection(false);
                    setForeColor("");
                    setShowColorPicker(false);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
                <div className="flex-1" />
              </div>
              <div className="mt-0">
                <input
                  type="color"
                  value={foreColor || "#000000"}
                  onChange={(e) => {
                    exec("foreColor", e.target.value);
                    setForeColor(e.target.value);
                    setShowColorPicker(false);
                  }}
                  className="w-full h-8 p-0 border rounded"
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            title="Background color"
            onClick={() => setShowBgPicker((v) => !v)}
            className="flex items-center gap-2 px-2 py-1 border rounded"
          >
            <span
              className="w-3 h-3 inline-block border"
              style={{ background: backColor || "#fff" }}
            />
            <span className="text-xs">Bg</span>
          </button>
          {showBgPicker && (
            <div className="absolute z-50 mt-2 p-2 bg-white border rounded shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    clearColorFromSelection(true);
                    setBackColor("");
                    setShowBgPicker(false);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
                <div className="flex-1" />
              </div>
              <div className="mt-0">
                <input
                  type="color"
                  value={backColor || "#ffffff"}
                  onChange={(e) => {
                    try {
                      exec("hiliteColor", e.target.value);
                    } catch {
                      exec("backColor", e.target.value);
                    }
                    setBackColor(e.target.value);
                    setShowBgPicker(false);
                  }}
                  className="w-full h-8 p-0 border rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        tabIndex={0}
        suppressContentEditableWarning
        className="p-2 min-h-[250px] md:min-h-[400px] prose max-w-none text-left"
        style={{ outline: "none", whiteSpace: "pre-wrap" }}
        onInput={(e) =>
          onContentChange && onContentChange(e.currentTarget.innerHTML)
        }
      />
    </div>
  );
}
