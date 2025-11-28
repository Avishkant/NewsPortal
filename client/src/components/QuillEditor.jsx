import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  Trash2,
  Type,
  Palette,
  PaintBucket,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Minus,
  CheckCircle,
} from "lucide-react"; // Using Lucide Icons for clarity

// Define a palette for quick color selection
const COLOR_PALETTE = [
  "#000000",
  "#D32F2F",
  "#00B8D4",
  "#6A1B9A",
  "#388E3C",
  "#424242",
  "#FF9800",
  "#4A148C",
  "#0000FF",
  "#FFFFFF",
];

export default function QuillEditor({
  initialContent,
  onContentChange,
  quillInstanceRef,
  handleImageUploadClick, // Assuming this is passed for image handling
}) {
  const ref = useRef(null);
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [foreColor, setForeColor] = useState("#000000");
  const [backColor, setBackColor] = useState("#FFFFFF");

  // Popover state management
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const colorWrapperRef = useRef(null);
  const bgWrapperRef = useRef(null);

  // Preserve the Quill ref contract
  useEffect(() => {
    if (quillInstanceRef) quillInstanceRef.current = null;
    return () => {
      if (quillInstanceRef) quillInstanceRef.current = null;
    };
  }, [quillInstanceRef]);

  // Set initial content and focus caret
  useEffect(() => {
    try {
      if (ref.current && typeof initialContent === "string") {
        ref.current.innerHTML = initialContent;
      }
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
          } catch (err) {
            void err;
          }
        };
        setTimeout(setCaretToStart, 0);
      }
    } catch {}
  }, [initialContent]);

  // --- Command Execution & State Sync ---
  const exec = (cmd, value = null) => {
    try {
      if (document && typeof document.execCommand === "function") {
        document.execCommand(cmd, false, value);
      }
    } catch (err) {
      console.warn("execCommand failed:", err);
    }
    // Notify parent and update active state
    try {
      onContentChange && onContentChange(ref.current?.innerHTML || "");
      document.dispatchEvent(new Event("selectionchange"));
    } catch (err) {
      console.warn("onContentChange/dispatch failed:", err);
    }
  };

  const updateActive = () => {
    try {
      if (!ref.current) return;
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) return;

      // Update basic command states
      setBoldActive(!!document.queryCommandState("bold"));
      setItalicActive(!!document.queryCommandState("italic"));
      setUnderlineActive(!!document.queryCommandState("underline"));

      // Update color and font (using queryCommandValue is most reliable)
      let f =
        document.queryCommandValue("fontName") ||
        window.getComputedStyle(
          sel.anchorNode.nodeType === 3
            ? sel.anchorNode.parentElement
            : sel.anchorNode
        ).fontFamily ||
        "";
      setFontFamily(f.replace(/"/g, "").split(",")[0].trim());
      setForeColor(
        document.queryCommandValue("foreColor") ||
          window.getComputedStyle(
            sel.anchorNode.nodeType === 3
              ? sel.anchorNode.parentElement
              : sel.anchorNode
          ).color ||
          "#000000"
      );
      setBackColor(
        document.queryCommandValue("hiliteColor") ||
          window.getComputedStyle(
            sel.anchorNode.nodeType === 3
              ? sel.anchorNode.parentElement
              : sel.anchorNode
          ).backgroundColor ||
          "#ffffff"
      );
    } catch (err) {
      // console.warn("QuillEditor updateActive error:", err);
    }
  };

  useEffect(() => {
    const el = ref.current;
    document.addEventListener("selectionchange", updateActive);
    if (el) {
      el.addEventListener("keyup", updateActive);
      el.addEventListener("mouseup", updateActive);
    }
    setTimeout(updateActive, 0); // Initial update

    return () => {
      document.removeEventListener("selectionchange", updateActive);
      if (el) {
        el.removeEventListener("keyup", updateActive);
        el.removeEventListener("mouseup", updateActive);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Popover and Cleanup Logic ---

  useEffect(() => {
    const onDocClick = (e) => {
      const target = e.target;
      if (
        showColorPicker &&
        colorWrapperRef.current &&
        !colorWrapperRef.current.contains(target)
      ) {
        setShowColorPicker(false);
      }
      if (
        showBgPicker &&
        bgWrapperRef.current &&
        !bgWrapperRef.current.contains(target)
      ) {
        setShowBgPicker(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowColorPicker(false);
        setShowBgPicker(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showColorPicker, showBgPicker]);

  // Handler functions
  const handleColorSelect = (color) => {
    exec("foreColor", color);
    setShowColorPicker(false);
  };
  const handleBgSelect = (color) => {
    exec("hiliteColor", color);
    setShowBgPicker(false);
  };
  const handleResetColor = (isBackground) => {
    isBackground
      ? exec("hiliteColor", "#ffffff")
      : exec("foreColor", "#000000");
    isBackground ? setShowBgPicker(false) : setShowColorPicker(false);
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL (include https://)");
    if (url) exec("createLink", url);
  };

  const handleImage = () => {
    if (typeof handleImageUploadClick === "function") {
      handleImageUploadClick();
    } else {
      const url = window.prompt("Image URL");
      if (url) {
        exec("insertImage", url);
      }
    }
  };

  const handleFormatCommand = (cmd) => {
    exec(cmd);
  };

  // --- Render UI ---
  return (
    <div className="border border-gray-300 rounded-xl bg-white shadow-xl text-left">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        {/* Group 1: Basic Formatting (B, I, U) */}
        <div className="flex border rounded-lg overflow-hidden border-gray-200">
          <ToolButton
            cmd="bold"
            active={boldActive}
            icon={Bold}
            onClick={() => exec("bold")}
          />
          <ToolButton
            cmd="italic"
            active={italicActive}
            icon={Italic}
            onClick={() => exec("italic")}
          />
          <ToolButton
            cmd="underline"
            active={underlineActive}
            icon={Underline}
            onClick={() => exec("underline")}
          />
        </div>

        {/* Group 2: Font/Block Style */}
        <select
          aria-label="Font family"
          value={fontFamily}
          onChange={(e) => exec("fontName", e.target.value)}
          className="px-2 py-1 border rounded-lg bg-white text-sm text-gray-700 h-9 focus:ring-gray-800"
        >
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="monospace">Monospace</option>
        </select>

        <ToolButton
          cmd="formatBlock"
          value="blockquote"
          icon={Code}
          label="Code"
          onClick={() => exec("formatBlock", "blockquote")}
        />

        {/* Group 3: Lists */}
        <div className="flex border rounded-lg overflow-hidden border-gray-200">
          <ToolButton
            cmd="insertUnorderedList"
            icon={List}
            onClick={() => exec("insertUnorderedList")}
          />
          <ToolButton
            cmd="insertOrderedList"
            icon={ListOrdered}
            onClick={() => exec("insertOrderedList")}
          />
        </div>

        {/* Group 4: Alignment */}
        <div className="flex border rounded-lg overflow-hidden border-gray-200">
          <ToolButton
            cmd="justifyLeft"
            icon={AlignLeft}
            onClick={() => exec("justifyLeft")}
          />
          <ToolButton
            cmd="justifyCenter"
            icon={AlignCenter}
            onClick={() => exec("justifyCenter")}
          />
          <ToolButton
            cmd="justifyRight"
            icon={AlignRight}
            onClick={() => exec("justifyRight")}
          />
        </div>

        {/* Group 5: Color Pickers */}
        <div className="relative flex items-center gap-1.5">
          {/* Text Color Picker */}
          <div ref={colorWrapperRef}>
            <ToolButton
              type="button"
              title={`Text color: ${foreColor}`}
              icon={Palette}
              style={{ color: foreColor }}
              onClick={() => setShowColorPicker((v) => !v)}
            />
            <AnimatePresence>
              {showColorPicker && (
                <ColorPickerPopover
                  onSelect={handleColorSelect}
                  onReset={() => handleResetColor(false)}
                  currentColor={foreColor}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Background Color Picker */}
          <div ref={bgWrapperRef}>
            <ToolButton
              type="button"
              title={`Background color: ${backColor}`}
              icon={PaintBucket}
              style={{ color: backColor }}
              onClick={() => setShowBgPicker((v) => !v)}
            />
            <AnimatePresence>
              {showBgPicker && (
                <ColorPickerPopover
                  onSelect={handleBgSelect}
                  onReset={() => handleResetColor(true)}
                  currentColor={backColor}
                  isBackground={true}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Group 6: Links and Media */}
        <ToolButton cmd="createLink" icon={Link} onClick={handleLink} />
        <ToolButton cmd="insertImage" icon={Image} onClick={handleImage} />

        {/* Group 7: Cleanup */}
        <ToolButton
          cmd="removeFormat"
          icon={Trash2}
          onClick={() => exec("removeFormat")}
          title="Clear Formatting"
        />
      </div>

      {/* EDITOR AREA */}
      <div
        ref={ref}
        contentEditable
        tabIndex={0}
        suppressContentEditableWarning
        className="p-4 min-h-[400px] prose max-w-none text-left focus:ring-0"
        style={{ outline: "none", whiteSpace: "pre-wrap", cursor: "text" }}
        onInput={(e) =>
          onContentChange && onContentChange(e.currentTarget.innerHTML)
        }
      />
    </div>
  );
}

// --- Reusable Toolbar Button Component ---
const ToolButton = ({
  cmd,
  value,
  icon: Icon,
  active,
  onClick,
  title,
  label,
  style,
}) => {
  const isActive =
    active ||
    (document.queryCommandEnabled(cmd) && document.queryCommandState(cmd));
  return (
    <motion.button
      type="button"
      title={title || label || cmd}
      onClick={onClick}
      className={`p-2 rounded transition duration-150 ${
        isActive
          ? "bg-gray-200 text-gray-900"
          : "hover:bg-gray-100 text-gray-700"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={style}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
};

// --- Reusable Color Picker Popover Component ---
const ColorPickerPopover = ({
  onSelect,
  onReset,
  currentColor,
  isBackground = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, originY: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 mt-2 p-2 bg-white border border-gray-300 rounded-lg shadow-xl"
      style={{
        left: isBackground ? "auto" : 0,
        right: isBackground ? 0 : "auto",
      }} // Position popover neatly
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-700">
          {isBackground ? "Background" : "Text"} Color
        </span>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md shadow-sm"
        >
          <CheckCircle className="w-4 h-4 text-gray-700" />
          <span>Reset</span>
        </button>
      </div>

      {/* Color Swatches */}
      <div className="grid grid-cols-5 gap-1.5">
        {COLOR_PALETTE.map((color) => (
          <motion.button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            className="w-6 h-6 rounded-full border border-gray-300 transition"
            style={{ backgroundColor: color }}
            whileHover={{ scale: 1.1 }}
          >
            {currentColor &&
              currentColor.toLowerCase() === color.toLowerCase() && (
                <CheckCircle
                  className="w-4 h-4 mx-auto"
                  style={{
                    color:
                      color === "#ffffff" || color === "rgb(255, 255, 255)"
                        ? "#000"
                        : "#fff",
                  }}
                />
              )}
          </motion.button>
        ))}
      </div>

      {/* Native Color Picker (Fallback/Custom) */}
      <div className="mt-2">
        <input
          type="color"
          value={currentColor || (isBackground ? "#ffffff" : "#000000")}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full h-8 p-0 border rounded-lg cursor-pointer"
        />
      </div>
    </motion.div>
  );
};
