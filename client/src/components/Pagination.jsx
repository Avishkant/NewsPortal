import React from "react";

export default function Pagination({
  total = 0,
  page = 1,
  perPage = 10,
  onPageChange = () => {},
  onPerPageChange = () => {},
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage || 1));

  const handlePerPage = (e) => {
    const v = Number(e.target.value) || 10;
    onPerPageChange(v);
    changePage(1);
  };

  const changePage = (p) => {
    try {
      onPageChange(p);
    } finally {
      if (typeof window !== "undefined" && window.scrollTo) {
        try {
          const header = document.querySelector("header");
          const offset = header ? header.getBoundingClientRect().height : 0;
          window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
        } catch {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }
  };

  const buildPageButtons = () => {
    const buttons = [];
    // show up to 5 page buttons centered around current
    const span = 2;
    let start = Math.max(1, page - span);
    let end = Math.min(totalPages, page + span);
    if (end - start < span * 2) {
      start = Math.max(1, Math.min(start, totalPages - span * 2));
      end = Math.min(totalPages, start + span * 2);
    }
    for (let p = start; p <= end; p++) {
      buttons.push(
        <button
          key={p}
          onClick={() => changePage(p)}
          className={`px-3 py-1 rounded ${
            p === page
              ? "bg-[var(--primary)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {p}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 flex-wrap ${className}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => changePage(Math.max(1, page - 1))}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          Prev
        </button>
        {buildPageButtons()}
        <button
          onClick={() => changePage(Math.min(totalPages, page + 1))}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          Next
        </button>
        <div className="text-sm text-gray-600 ml-3">
          Page {page} of {totalPages}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Per page</label>
        <select
          value={perPage}
          onChange={handlePerPage}
          className="px-2 py-1 border rounded bg-white"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <div className="text-sm text-gray-600">{total} items</div>
      </div>
    </div>
  );
}
