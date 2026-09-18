import api from "./api";

/* ===========================
   Ask Document Question
=========================== */

export const askDocumentQuestion = async ({
  documentId,
  question,
}) => {
  const response = await api.post(
    `/document-chat/${documentId}/ask`,
    { question }
  );

  return response.data;
};

/* ===========================
   Chat History
=========================== */

export const getDocumentChatHistory = async (
  documentId
) => {
  const response = await api.get(
    `/document-chat/${documentId}`
  );

  return response.data;
};

/* ===========================
   Clear Chat History
=========================== */

export const clearDocumentChatHistory = async (
  documentId
) => {
  const response = await api.delete(
    `/document-chat/${documentId}`
  );

  return response.data;
};

/* ===========================
   Regenerate Answer
=========================== */

export const regenerateDocumentChat = async (
  chatId
) => {
  const response = await api.post(
    `/document-chat/${chatId}/regenerate`
  );

  return response.data;
};

/* ===========================
   Feedback
=========================== */

export const updateDocumentChatFeedback = async (
  chatId,
  feedback
) => {
  const response = await api.patch(
    `/document-chat/${chatId}/feedback`,
    { feedback }
  );

  return response.data;
};
