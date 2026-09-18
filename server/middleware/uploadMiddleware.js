import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/documents";

// ==========================================
// Create Upload Directory
// ==========================================

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ==========================================
// Storage Configuration
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${extension}`
    );
  },
});

// ==========================================
// Allowed MIME Types
// ==========================================

const allowedMimeTypes = {
  ".pdf": "application/pdf",

  ".txt": "text/plain",

  ".doc": "application/msword",

  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// ==========================================
// File Filter
// ==========================================

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const expectedMimeType =
    allowedMimeTypes[extension];

  // Reject unknown extensions
  if (!expectedMimeType) {
    return cb(
      new Error(
        "Only PDF, TXT, DOC, DOCX, JPG, JPEG, PNG and WEBP files are allowed."
      ),
      false
    );
  }

  // Reject MIME type / extension mismatch
  if (file.mimetype !== expectedMimeType) {
    return cb(
      new Error(
        "File type does not match the file extension."
      ),
      false
    );
  }

  return cb(null, true);
};

// ==========================================
// Multer Upload Configuration
// ==========================================

export const uploadDocument = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum file size: 20 MB
    fileSize: 20 * 1024 * 1024,

    // Only one file should be uploaded
    files: 1,
  },
});