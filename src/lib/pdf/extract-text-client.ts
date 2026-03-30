let workerConfigured = false;

async function configurePdfWorker() {
  if (workerConfigured) return;
  const pdfjsLib = await import("pdfjs-dist");
  // Do not use `new URL(..., import.meta.url)` here: webpack bundles the worker into
  // the client chunk and Terser fails on `import.meta` inside pdf.worker.min.mjs.
  const v = pdfjsLib.version ?? "5.5.207";
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${v}/build/pdf.worker.min.mjs`;
  workerConfigured = true;
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  await configurePdfWorker();
  const pdfjsLib = await import("pdfjs-dist");
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const chunks: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) chunks.push(text);
  }

  return chunks.join("\n\n").trim();
}
