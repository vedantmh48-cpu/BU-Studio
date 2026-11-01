import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';

const MODEL_URL = 'https://huggingface.co/techycoder/isnet-background-removal/resolve/main/model_fp16.onnx';
const MODEL_SIZE = 1024;
let sessionPromise;
ort.env.wasm.wasmPaths = import.meta.env.DEV
  ? '/node_modules/onnxruntime-web/dist/'
  : { 'ort-wasm-simd-threaded.wasm': wasmUrl };

async function loadModel(onProgress) {
  const response = await fetch(MODEL_URL);
  if (!response.ok) {
    throw new Error(`Could not download the segmentation model (${response.status}). Check your connection and try again.`);
  }

  const contentLength = Number(response.headers.get('content-length')) || 0;
  const reader = response.body?.getReader();
  let modelBytes;
  if (!reader) {
    modelBytes = await response.arrayBuffer();
    onProgress(85);
  } else {
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      if (contentLength) onProgress(Math.min(80, Math.round((received / contentLength) * 80)));
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    modelBytes = bytes.buffer;
  }

  onProgress(85);
  return ort.InferenceSession.create(modelBytes, { executionProviders: ['wasm'] });
}

function getModelSession(onProgress) {
  if (!sessionPromise) {
    sessionPromise = loadModel(onProgress).catch((error) => {
      sessionPromise = undefined;
      throw error;
    });
  }
  return sessionPromise;
}

function readBlobAsBitmap(blob) {
  return createImageBitmap(blob);
}

export async function makeAlphaMask(imageBlob, onProgress = () => {}) {
  const bitmap = await readBlobAsBitmap(imageBlob);
  const inputCanvas = document.createElement('canvas');
  inputCanvas.width = MODEL_SIZE;
  inputCanvas.height = MODEL_SIZE;
  const inputContext = inputCanvas.getContext('2d', { willReadFrequently: true });
  if (!inputContext) {
    bitmap.close();
    throw new Error('Your browser could not prepare the image for background removal.');
  }

  inputContext.drawImage(bitmap, 0, 0, MODEL_SIZE, MODEL_SIZE);
  bitmap.close();
  const pixels = inputContext.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data;
  const planeSize = MODEL_SIZE * MODEL_SIZE;
  const input = new Float32Array(planeSize * 3);
  for (let pixel = 0; pixel < planeSize; pixel += 1) {
    const source = pixel * 4;
    input[pixel] = pixels[source] / 255 - 0.5;
    input[planeSize + pixel] = pixels[source + 1] / 255 - 0.5;
    input[planeSize * 2 + pixel] = pixels[source + 2] / 255 - 0.5;
  }

  const session = await getModelSession(onProgress);
  onProgress(90);
  const tensor = new ort.Tensor('float32', input, [1, 3, MODEL_SIZE, MODEL_SIZE]);
  const output = await session.run({ [session.inputNames[0]]: tensor });
  const maskTensor = output[session.outputNames[0]];
  const maskData = maskTensor.data;
  let minimum = Infinity;
  let maximumMask = -Infinity;
  for (let index = 0; index < planeSize; index += 1) {
    minimum = Math.min(minimum, maskData[index]);
    maximumMask = Math.max(maximumMask, maskData[index]);
  }
  const range = maximumMask - minimum;
  const mask = new Uint8ClampedArray(planeSize * 4);
  for (let index = 0; index < planeSize; index += 1) {
    const alpha = range > 0 ? Math.round(((maskData[index] - minimum) / range) * 255) : 0;
    const pixel = index * 4;
    mask[pixel] = 255;
    mask[pixel + 1] = 255;
    mask[pixel + 2] = 255;
    mask[pixel + 3] = alpha;
  }
  onProgress(100);
  return {
    data: new ImageData(mask, MODEL_SIZE, MODEL_SIZE),
    width: MODEL_SIZE,
    height: MODEL_SIZE,
  };
}

export async function composeCutout(imageBlob, alphaMask) {
  const bitmap = await readBlobAsBitmap(imageBlob);
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = alphaMask.width;
  maskCanvas.height = alphaMask.height;
  const maskContext = maskCanvas.getContext('2d');
  if (!maskContext) {
    bitmap.close();
    throw new Error('Your browser could not refine the foreground mask.');
  }
  maskContext.putImageData(alphaMask.data, 0, 0);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = bitmap.width;
  outputCanvas.height = bitmap.height;
  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) {
    bitmap.close();
    throw new Error('Your browser could not create the transparent foreground image.');
  }
  outputContext.drawImage(bitmap, 0, 0);
  outputContext.globalCompositeOperation = 'destination-in';
  outputContext.drawImage(maskCanvas, 0, 0, bitmap.width, bitmap.height);
  bitmap.close();
  const outputBlob = await new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The transparent foreground image could not be encoded.'));
    }, 'image/png');
  });
  return URL.createObjectURL(outputBlob);
}
