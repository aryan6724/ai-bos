import api from "./api";

// ======================================================
// AI DOCUMENT GENERATOR
// ======================================================

export const generateDocument = async (payload) => {
  const response = await api.post("/ai/generate", payload);
  return response.data;
};

// ======================================================
// AI GENERATION HISTORY
// ======================================================

export const getGenerationHistory = async ({
  page = 1,
  pageSize = 6,
  search = "",
  type = "all",
} = {}) => {
  const response = await api.get("/ai/history", {
    params: {
      page,
      pageSize,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(type && type !== "all" ? { type } : {}),
    },
  });

  return response.data;
};

export const deleteGeneration = async (id) => {
  const response = await api.delete(`/ai/history/${id}`);
  return response.data;
};

export const deleteAllGenerations = async () => {
  const response = await api.delete("/ai/history");
  return response.data;
};

// ======================================================
// AI TEXT TOOLS
// ======================================================

export const improveText = async (payload) => {
  const response = await api.post(
    "/ai/tools/improve-text",
    payload
  );

  return response.data;
};

export const summarizeText = async (payload) => {
  const response = await api.post(
    "/ai/tools/summarize",
    payload
  );

  return response.data;
};

export const rewriteText = async (payload) => {
  const response = await api.post(
    "/ai/tools/rewrite-text",
    payload
  );

  return response.data;
};

export const translateText = async (payload) => {
  const response = await api.post(
    "/ai/tools/translate",
    payload
  );

  return response.data;
};

// ======================================================
// AI DOCUMENT ANALYZER
// ======================================================

export const analyzeDocument = async (
  documentId,
  forceReanalyze = false
) => {
  const response = await api.post(
    "/ai/documents/analyze",
    {
      documentId,
      forceReanalyze,
    }
  );

  return response.data;
};

// ======================================================
// DOCUMENT ANALYSIS HISTORY
// ======================================================

export const getAnalysisHistory = async ({
  documentId = "",
  page = 1,
  pageSize = 10,
} = {}) => {
  const response = await api.get(
    "/ai/documents/analysis-history",
    {
      params: {
        page,
        pageSize,
        ...(documentId ? { documentId } : {}),
      },
    }
  );

  return response.data;
};

export const getAnalysisHistoryById = async (
  historyId
) => {
  const response = await api.get(
    `/ai/documents/analysis-history/${historyId}`
  );

  return response.data;
};

export const deleteAnalysisHistory = async (
  historyId
) => {
  const response = await api.delete(
    `/ai/documents/analysis-history/${historyId}`
  );

  return response.data;
};