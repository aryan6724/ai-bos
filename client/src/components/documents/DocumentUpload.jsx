import { useState } from "react";
import UploadDropzone from "./UploadDropzone";
import DocumentList from "./DocumentList";

export default function DocumentUpload() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Documents
        </h1>

        <p className="mt-2 text-slate-400">
          Upload PDFs, DOCX and TXT files to chat with AI.
        </p>
      </div>

      {/* Upload Section */}
      <UploadDropzone
        onUploadComplete={handleUploadComplete}
      />

      {/* Uploaded Documents */}
      <DocumentList refreshKey={refreshKey} />
    </div>
  );
}