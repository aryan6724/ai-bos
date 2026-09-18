import express from "express";

import {
  deleteDocument,
  getMyDocuments,
  getDocumentDetails,
  uploadDocumentFile,
  searchDocuments,
} from "../controllers/documentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { uploadDocument } from "../middleware/uploadMiddleware.js";
import { auditAction } from "../middleware/auditMiddleware.js";

const router = express.Router();

/* ===========================
   Upload Document
=========================== */
router.post(
  "/upload",
  protect,
  uploadDocument.single("document"),
  auditAction({
    action: "DOCUMENT_UPLOADED",
    resourceType: "document",
    description: (req) =>
      `Uploaded "${req.file?.originalname || "document"}" in the ${
        req.body.category || "general"
      } category.`,
    getResourceId: (req, res) => res.locals.documentId,
    getMetadata: (req) => ({
      filename: req.file?.originalname,
      mimeType: req.file?.mimetype,
      size: req.file?.size,
      category: req.body.category || "general",
    }),
  }),
  uploadDocumentFile
);

/* ===========================
   Get My Documents
=========================== */
router.get(
  "/",
  protect,
  getMyDocuments
);

/* ===========================
   Semantic Search
=========================== */
router.post(
  "/search",
  protect,
  auditAction({
    action: "DOCUMENT_SEARCHED",
    resourceType: "document",
    description:
      "Performed a semantic search across uploaded documents.",
    getMetadata: (req) => ({
      queryLength:
        typeof req.body?.query === "string"
          ? req.body.query.trim().length
          : 0,
    }),
  }),
  searchDocuments
);

/* ===========================
   Document Details
=========================== */
router.get(
  "/:id/details",
  protect,
  auditAction({
    action: "DOCUMENT_VIEWED",
    resourceType: "document",
    description: (req) =>
      `Viewed document details for ${req.params.id}.`,
    getResourceId: (req) => req.params.id,
    getMetadata: () => ({
      tool: "document-vault",
      view: "details",
    }),
  }),
  getDocumentDetails
);

/* ===========================
   Delete Document
=========================== */
router.delete(
  "/:id",
  protect,
  auditAction({
    action: "DOCUMENT_DELETED",
    resourceType: "document",
    description: (req) =>
      `Deleted document ${req.params.id}.`,
    getResourceId: (req) => req.params.id,
  }),
  deleteDocument
);

export default router;