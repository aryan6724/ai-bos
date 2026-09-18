import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSearch,
  Loader2,
  Trash2,
} from "lucide-react";

export default function AnalysisHistoryPanel({
  history = [],
  loading = false,
  selectedHistoryId = "",
  pagination = {},
  onView,
  onDelete,
  onPageChange,
}) {
  const formatDate = (date) => {
    if (!date) return "Unknown date";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return "Unknown date";
    }
  };

  const currentPage = Number(pagination.page) || 1;
  const pageSize = Number(pagination.pageSize) || 10;
  const total = Number(pagination.total) || 0;
  const totalPages = Number(pagination.totalPages) || 0;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage =
    totalPages > 0 && currentPage < totalPages;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Clock3 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Analysis History
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Previous AI analysis versions for this document.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-600">
            {total} {total === 1 ? "Version" : "Versions"}
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[180px] flex-col items-center justify-center px-5">
          <Loader2 size={25} className="animate-spin text-violet-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Loading analysis history...
          </p>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <FileSearch size={21} />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-700">
            No analysis history yet
          </p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Your future document analyses will appear here automatically.
          </p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <>
          <div className="divide-y divide-slate-100">
            {history.map((item, index) => {
              const isSelected =
                selectedHistoryId === item._id;

              const versionNumber =
                total -
                (currentPage - 1) * pageSize -
                index;

              return (
                <div
                  key={item._id}
                  className={`group flex items-center gap-3 p-4 transition ${
                    isSelected
                      ? "bg-violet-50/60"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      isSelected
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    v{Math.max(versionNumber, 1)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.documentName || "Untitled Document"}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(item.analyzedAt)}
                      </span>

                      {item.provider && (
                        <>
                          <span>•</span>
                          <span>{item.provider}</span>
                        </>
                      )}

                      {item.model && (
                        <>
                          <span>•</span>
                          <span className="max-w-[150px] truncate">
                            {item.model}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onView?.(item._id)}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-violet-50 px-3 text-xs font-semibold text-violet-600 transition hover:bg-violet-100"
                  >
                    View
                    <ChevronRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete?.(item._id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete history"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-400">
                Page{" "}
                <span className="font-bold text-slate-600">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-600">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!hasPreviousPage || loading}
                  onClick={() =>
                    onPageChange?.(currentPage - 1)
                  }
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!hasNextPage || loading}
                  onClick={() =>
                    onPageChange?.(currentPage + 1)
                  }
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
