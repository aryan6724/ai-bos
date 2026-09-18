import api from "./api";

/* ===========================
   Upload Document
=========================== */

export const uploadDocument = async ({
  file,
  category = "general",
  onUploadProgress,
}) => {
  const formData = new FormData();

  formData.append("document", file);
  formData.append("category", category);

  const response = await api.post(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    }
  );

  return response.data;
};

/* ===========================
   Get Documents
=========================== */

export const getDocuments = async () => {
  const response = await api.get("/documents");

  return response.data;
};

/* ===========================
   Delete Document
=========================== */

export const deleteDocument = async (documentId) => {
  const response = await api.delete(
    `/documents/${documentId}`
  );

  return response.data;
};

/* ===========================
   Semantic Search
=========================== */

export const searchDocuments = async (query) => {
  const response = await api.post(
    "/documents/search",
    {
      query,
    }
  );

  return response.data;
};

/* ===========================
   Get Document Details
=========================== */

export const getDocumentDetails = async (documentId) => {
  const response = await api.get(
    `/documents/${documentId}/details`
  );

  return response.data;
};