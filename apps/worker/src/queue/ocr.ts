import { createWorker, type ImageLike } from "tesseract.js";

export async function extractTextFromImage(image: ImageLike) {
  const worker = await createWorker("eng");

  const result = await worker.recognize(image);

  await worker.terminate();

  return result.data.text;
}
