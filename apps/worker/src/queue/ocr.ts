import { createWorker, type ImageLike, type Worker } from "tesseract.js";

let worker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker("eng");
  }
  return worker;
}

export async function extractTextFromImage(image: ImageLike): Promise<string> {
  const w = await getWorker();
  const result = await w.recognize(image);
  return result.data.text;
}

export async function destroyOcrWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
