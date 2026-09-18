import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const extractDocumentText = async (document) => {
  const filePath = document.storagePath;
  const extension = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    throw new Error("Document file not found.");
  }

  // ======================================================
  // PDF
  // ======================================================

  if (extension === ".pdf") {
    const buffer = fs.readFileSync(filePath);

    const pageTexts = [];

    // Do not depend on pageData.pageIndex.
    // Some pdf-parse versions do not expose it.
    let currentPage = 0;

    const result = await pdfParse(buffer, {
      pagerender: async (pageData) => {
        currentPage += 1;

        const pageNumber = currentPage;

        const textContent =
          await pageData.getTextContent();

        const pageText = textContent.items
          .map((item) => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        pageTexts.push({
          page: pageNumber,
          text: pageText,
        });

        return pageText;
      },
    });

    console.log(
      "PDF Page Extraction:",
      pageTexts.map((page) => ({
        page: page.page,
        characters: page.text.length,
      }))
    );

    return {
      text: result.text,
      pages: result.numpages,

      pageTexts,
    };
  }

  // ======================================================
  // DOCX
  // ======================================================

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      path: filePath,
    });

    return {
      text: result.value,
      pages: 1,

      pageTexts: [
        {
          page: 1,
          text: result.value || "",
        },
      ],
    };
  }

  // ======================================================
  // TXT
  // ======================================================

  if (extension === ".txt") {
    const text = fs.readFileSync(
      filePath,
      "utf8"
    );

    return {
      text,
      pages: 1,

      pageTexts: [
        {
          page: 1,
          text: text || "",
        },
      ],
    };
  }

  // ======================================================
  // Unsupported file
  // ======================================================

  return {
    text: "",
    pages: 0,
    pageTexts: [],
  };
};