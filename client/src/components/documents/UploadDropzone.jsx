import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadDocument } from "../../services/documentService";
import toast from "react-hot-toast";

export default function UploadDropzone({
  onUploadComplete,
}) {
  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /* ===========================
     Upload Files
  =========================== */

const uploadFiles = async (files) => {
  if (!files.length) return;

  setUploading(true);
  setProgress(0);

  try {
    for (const file of files) {
      await uploadDocument({
        file,
        category: "general",
        onUploadProgress: (event) => {
          if (!event.total) return;

          const percent = Math.round(
            (event.loaded * 100) / event.total
          );

          setProgress(percent);
        },
      });
    }

    setProgress(100);

    toast.success("Document uploaded successfully!");

    // Refresh document list after successful upload
    onUploadComplete?.();
  } catch (error) {
    toast.error(
  error?.response?.data?.message ||
    "Upload failed."
);
  } finally {
    setUploading(false);
  }
};

  /* ===========================
     Handle Files
  =========================== */

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files);

    setSelectedFiles(validFiles);

    uploadFiles(validFiles);
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      {/* Hidden File Input */}

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Dropzone */}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`w-full max-w-3xl rounded-3xl border-2 border-dashed p-16 text-center transition-all ${
          dragging
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-slate-700 bg-[#111827] hover:border-cyan-500"
        }`}
      >
        <UploadCloud
          size={70}
          className="mx-auto text-cyan-400"
        />

        <h2 className="mt-6 text-2xl font-semibold text-white">
          Drag & Drop Documents
        </h2>

        <p className="mt-3 text-slate-400">
          Upload PDF, DOCX or TXT files.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-8 rounded-xl bg-cyan-500 px-6 py-3 font-medium text-slate-900 transition hover:bg-cyan-400"
        >
          Browse Files
        </button>

        {/* Upload Progress */}

        {uploading && (
          <div className="mt-8">
            <div className="mb-2 flex justify-between text-sm text-slate-400">
              <span>Uploading...</span>

              <span>{progress}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Selected Files */}

        {selectedFiles.length > 0 && (
          <div className="mt-10 text-left">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Selected Files
            </h3>

            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-[#0B1220] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {file.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      uploading
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {uploading ? "Uploading..." : "Ready"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}