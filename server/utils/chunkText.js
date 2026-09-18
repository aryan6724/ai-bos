export const chunkText = (
  pageTexts,
  chunkSize = 500,
  overlap = 100
) => {
  const chunks = [];

  // Validate input
  if (!Array.isArray(pageTexts)) {
    console.log("CHUNKING ERROR: pageTexts is not an array.");
    return chunks;
  }

  // Validate chunk size
  if (chunkSize <= 0) {
    console.log("CHUNKING ERROR: chunkSize must be greater than 0.");
    return chunks;
  }

  // Validate overlap
  if (overlap < 0 || overlap >= chunkSize) {
    console.log(
      "CHUNKING ERROR: overlap must be >= 0 and smaller than chunkSize."
    );
    return chunks;
  }

  let globalChunkIndex = 0;

  for (const pageData of pageTexts) {
    const page = Number(pageData?.page);
    const text = pageData?.text || "";

    // Validate page number
    if (!Number.isFinite(page) || page <= 0) {
      console.log(
        "CHUNKING ERROR: Invalid page number:",
        pageData
      );
      continue;
    }

    // Skip empty pages
    if (!text.trim()) {
      continue;
    }

    const words = text.split(/\s+/);

    let index = 0;

    while (index < words.length) {
      const chunk = words
        .slice(index, index + chunkSize)
        .join(" ")
        .trim();

      if (chunk) {
        const chunkData = {
          chunkIndex: globalChunkIndex,
          page: page,
          text: chunk,
        };

        chunks.push(chunkData);

        // Temporary debug log
        console.log("CHUNK CREATED:", {
          chunkIndex: globalChunkIndex,
          page,
          characters: chunk.length,
        });

        globalChunkIndex += 1;
      }

      index += chunkSize - overlap;
    }
  }

  console.log(
    `CHUNKING COMPLETE: ${chunks.length} chunks created.`
  );

  return chunks;
};