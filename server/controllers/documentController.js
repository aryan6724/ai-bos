import DocumentChunk from "../models/DocumentChunk.js";
import { chunkText } from "../utils/chunkText.js";
import fs from "fs";
import Document from "../models/Document.js";
import createNotification from "../utils/createNotification.js";
import { extractDocumentText } from "../utils/documentTextExtractor.js";
import { analyzeDocument } from "../utils/documentAnalyzer.js";
import { generateEmbedding } from "../services/embeddingService.js";
import { semanticSearch } from "../services/semanticSearchService.js";
import mongoose from "mongoose";

// ==========================================
// Upload Document
// ==========================================

export const uploadDocumentFile = async (
  req,
  res,
  next
) => {
  let uploadedDocument = null;

  try {
    const uploadedFile = req.file;

    if (!uploadedFile) {
      res.status(400);
      throw new Error(
        "Please upload a document file"
      );
    }

    // ==========================================
    // 1. Create Document
    // ==========================================

    uploadedDocument = await Document.create({
      user: req.user._id,
      originalName: uploadedFile.originalname,
      fileName: uploadedFile.filename,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      storagePath: uploadedFile.path,
      category: req.body.category || "general",
      status: "processing",
      isIndexed: false,
      isDeleted: false,
    });

    // ==========================================
    // 2. Extract Text
    // ==========================================

    const extracted =
      await extractDocumentText(
        uploadedDocument
      );

    uploadedDocument.text =
      extracted.text || "";

    uploadedDocument.pages =
      extracted.pages || 0;

    uploadedDocument.wordCount =
      uploadedDocument.text.trim()
        ? uploadedDocument.text
            .trim()
            .split(/\s+/).length
        : 0;

    await uploadedDocument.save();

    // ==========================================
    // 3. Empty Document Check
    // ==========================================

    if (!uploadedDocument.text.trim()) {
      uploadedDocument.status = "failed";
      uploadedDocument.isIndexed = false;
      uploadedDocument.processedAt = new Date();
      uploadedDocument.indexedAt = undefined;

      await uploadedDocument.save();

      return res.status(400).json({
        success: false,
        message:
          "No readable text found in the document.",
      });
    }

    // ==========================================
    // 4. Create Document Chunks
    // ==========================================

    const chunks = chunkText(
      extracted.pageTexts
    );

    if (!chunks.length) {
      uploadedDocument.status = "failed";
      uploadedDocument.isIndexed = false;
      uploadedDocument.processedAt = new Date();
      uploadedDocument.indexedAt = undefined;

      await uploadedDocument.save();

      return res.status(400).json({
        success: false,
        message:
          "Unable to create searchable document chunks.",
      });
    }

    console.log(
      `Creating ${chunks.length} document chunks...`
    );

    // ==========================================
    // 5. Generate Embedding For EACH Chunk
    // ==========================================

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      console.log(
        `Generating embedding for chunk ${
          i + 1
        }/${chunks.length}`
      );

      const chunkEmbedding =
        await generateEmbedding(
          chunk.text
        );

      if (
        !chunkEmbedding ||
        !Array.isArray(chunkEmbedding) ||
        chunkEmbedding.length === 0
      ) {
        throw new Error(
          `Failed to generate embedding for chunk ${
            i + 1
          }.`
        );
      }

      await DocumentChunk.create({
        document: uploadedDocument._id,
        user: req.user._id,
        chunkIndex: chunk.chunkIndex,
        page: chunk.page,
        content: chunk.text,
        wordCount: chunk.text
          .trim()
          .split(/\s+/).length,
        embedding: chunkEmbedding,
      });
    }

    console.log(
      `Successfully created ${chunks.length} document chunks.`
    );

    // ==========================================
    // 6. AI Document Analysis
    // ==========================================

    const analysis =
      await analyzeDocument(
        uploadedDocument
      );

    uploadedDocument.summary =
      analysis?.summary || "";

    uploadedDocument.keywords =
      Array.isArray(analysis?.keywords)
        ? analysis.keywords
        : [];

    uploadedDocument.language =
      analysis?.language || "en";

    uploadedDocument.documentType =
      analysis?.documentType || "General";

    uploadedDocument.entities = {
      people: Array.isArray(
        analysis?.entities?.people
      )
        ? analysis.entities.people
        : [],

      organizations: Array.isArray(
        analysis?.entities?.organizations
      )
        ? analysis.entities.organizations
        : [],

      dates: Array.isArray(
        analysis?.entities?.dates
      )
        ? analysis.entities.dates
        : [],

      amounts: Array.isArray(
        analysis?.entities?.amounts
      )
        ? analysis.entities.amounts
        : [],
    };

    await uploadedDocument.save();

    console.log(
      "AI Document Analysis completed successfully."
    );

    // ==========================================
    // 7. Generate Document-Level Embedding
    // ==========================================

    console.log(
      "Generating document-level embedding..."
    );

    const documentEmbeddingText = `
Document Name: ${uploadedDocument.originalName}

Document Type: ${
      uploadedDocument.documentType ||
      "General"
    }

Summary:
${uploadedDocument.summary || ""}

Keywords:
${(
      uploadedDocument.keywords || []
    ).join(", ")}

Language:
${uploadedDocument.language || "en"}
`;

    const documentEmbedding =
      await generateEmbedding(
        documentEmbeddingText
      );

    // ==========================================
    // Validate Document-Level Embedding
    // ==========================================

    if (
      !documentEmbedding ||
      !Array.isArray(documentEmbedding) ||
      documentEmbedding.length === 0
    ) {
      throw new Error(
        "Failed to generate document-level embedding."
      );
    }

    uploadedDocument.embedding =
      documentEmbedding;

    console.log(
      "Document-level embedding generated successfully."
    );

    // ==========================================
    // 8. Mark Document As Indexed / Ready
    // ==========================================

    uploadedDocument.isIndexed = true;
    uploadedDocument.status = "ready";
    uploadedDocument.processedAt = new Date();
    uploadedDocument.indexedAt = new Date();

    await uploadedDocument.save();

    console.log(
      `Document ${uploadedDocument._id} is ready.`
    );

    // ==========================================
    // 9. Notification
    // ==========================================

    await createNotification({
      user: req.user,
      title: "Document Uploaded",
      message: `${uploadedDocument.originalName} uploaded successfully.`,
      type: "success",
      category: "document",
      actionUrl: "/dashboard/documents",
      icon: "FileText",
    });

// ==========================================
// 9.5 Audit Resource ID
// ==========================================

res.locals.documentId = String(
  uploadedDocument._id
);

// ==========================================
// 10. Response
// ==========================================

return res.status(201).json({
  success: true,
  message: "Document uploaded successfully",

  // Return only safe document fields.
  // Do NOT expose extracted text, embeddings,
  // storage path, or other internal fields.
  document: {
    id: uploadedDocument._id,
    originalName: uploadedDocument.originalName,
    fileName: uploadedDocument.fileName,
    mimeType: uploadedDocument.mimeType,
    size: uploadedDocument.size,
    category: uploadedDocument.category,
    status: uploadedDocument.status,
    pages: uploadedDocument.pages,
    wordCount: uploadedDocument.wordCount,
    language: uploadedDocument.language,
    summary: uploadedDocument.summary,
    keywords: uploadedDocument.keywords,
    documentType: uploadedDocument.documentType,
    isIndexed: uploadedDocument.isIndexed,
    createdAt: uploadedDocument.createdAt,
    updatedAt: uploadedDocument.updatedAt,
  },

  chunksCreated: chunks.length,
});

  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "Upload Document Processing Error"
    );
    console.error(error);
    console.error(
      "========================================"
    );

    // ==========================================
    // Cleanup After Processing Failure
    // ==========================================

    if (uploadedDocument?._id) {
      try {
        // ----------------------------------------
        // 1. Delete generated chunks
        // ----------------------------------------

        await DocumentChunk.deleteMany({
          document: uploadedDocument._id,
          user: req.user._id,
        });

        console.log(
          `Document chunks deleted for failed document ${uploadedDocument._id}.`
        );

        // ----------------------------------------
        // 2. Delete physical uploaded file
        // ----------------------------------------

        if (
          uploadedDocument.storagePath &&
          fs.existsSync(
            uploadedDocument.storagePath
          )
        ) {
          fs.unlinkSync(
            uploadedDocument.storagePath
          );

          console.log(
            `Physical file deleted for failed document ${uploadedDocument._id}.`
          );
        }

        // ----------------------------------------
        // 3. Mark document as failed
        // ----------------------------------------

        uploadedDocument.status =
          "failed";

        uploadedDocument.isIndexed = false;
        uploadedDocument.processedAt =
          new Date();
        uploadedDocument.indexedAt =
          undefined;

        await uploadedDocument.save();

        console.error(
          `Document ${uploadedDocument._id} marked as failed.`
        );
      } catch (cleanupError) {
        console.error(
          "Document cleanup failed:"
        );

        console.error(cleanupError);
      }
    }

    next(error);
  }
};

// ==========================================
// Get My Documents
// ==========================================

export const getMyDocuments = async (
  req,
  res,
  next
) => {
  try {
    const documents =
      await Document.find({
        user: req.user._id,
        isDeleted: false,
      })
        .select(
          "originalName fileName mimeType size category status pages wordCount language summary keywords documentType createdAt updatedAt"
        )
        .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalDocuments:
        documents.length,
      documents,
    });
  } catch (error) {
    console.error(
      "Get Documents Error:",
      error
    );

    next(error);
  }
};

// ==========================================
// Get Document Details / Extracted Text
// ==========================================

export const getDocumentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await Document.findOne({
      _id: id,
      user: req.user._id,
      isDeleted: false,
    }).select(
      "originalName fileName mimeType size category status pages wordCount language summary keywords documentType text isIndexed aiAnalysis createdAt updatedAt processedAt indexedAt"
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Get document details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch document details",
    });
  }
};

// ==========================================
// Delete Document
// ==========================================

export const deleteDocument = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // Validate Document ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    // ==========================================
    // Find Only Current User's Document
    // ==========================================

    const document = await Document.findOne({
      _id: id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // ==========================================
    // Delete Physical File
    // ==========================================

    if (
      document.storagePath &&
      fs.existsSync(document.storagePath)
    ) {
      fs.unlinkSync(document.storagePath);
    }

    // ==========================================
    // Delete Document Chunks
    // ==========================================

    await DocumentChunk.deleteMany({
      document: document._id,
      user: req.user._id,
    });

    // ==========================================
    // Soft Delete Document
    // ==========================================

    document.isDeleted = true;
    document.isIndexed = false;
    document.status = "failed";

    await document.save();

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
      documentId: document._id,
    });
  } catch (error) {
    console.error(
      "Delete Document Error:",
      error
    );

    next(error);
  }
};

// ==========================================
// Semantic Document Search
// ==========================================

export const searchDocuments = async (
  req,
  res,
  next
) => {
  try {
    const { query } = req.body;

    if (
      !query ||
      typeof query !== "string" ||
      !query.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Search query is required.",
      });
    }

    const results =
      (await semanticSearch(
        query.trim(),
        req.user._id
      )) || [];

    return res.status(200).json({
      success: true,
      query: query.trim(),
      totalResults:
        results.length,
      results,
    });
  } catch (error) {
    console.error(
      "Document Search Error:",
      error
    );

    next(error);
  }
};