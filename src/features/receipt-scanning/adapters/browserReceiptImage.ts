const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MIN_LONGEST_EDGE = 600;
const MAX_LONGEST_EDGE = 2200;

type ReceiptDimensions = {
  width: number;
  height: number;
};

type ReceiptImageEnvironment = {
  createBitmap: (file: Blob) => Promise<ImageBitmap>;
  createCanvas: () => HTMLCanvasElement;
};

type ReceiptImageValidation =
  | {
      ok: true;
      dimensions: ReceiptDimensions;
    }
  | {
      ok: false;
      error: string;
    };

async function defaultReadDimensions(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    return {
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}

function getDefaultEnvironment(): ReceiptImageEnvironment {
  return {
    createBitmap: (file) =>
      createImageBitmap(file, { imageOrientation: "from-image" }),
    createCanvas: () => document.createElement("canvas"),
  };
}

export async function validateReceiptImage(
  file: File,
  readDimensions: (file: File) => Promise<ReceiptDimensions> = defaultReadDimensions,
): Promise<ReceiptImageValidation> {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Choose a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Choose an image smaller than 10 MB.",
    };
  }

  try {
    const dimensions = await readDimensions(file);

    if (Math.max(dimensions.width, dimensions.height) < MIN_LONGEST_EDGE) {
      return {
        ok: false,
        error: "This image is too small to scan clearly. Try a higher-resolution photo.",
      };
    }

    return {
      ok: true,
      dimensions,
    };
  } catch {
    return {
      ok: false,
      error: "This image could not be opened. Try a different file.",
    };
  }
}

export function getScaledReceiptDimensions(width: number, height: number) {
  const longestEdge = Math.max(width, height);

  if (longestEdge <= MAX_LONGEST_EDGE) {
    return { width, height };
  }

  const scale = MAX_LONGEST_EDGE / longestEdge;

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function preprocessReceiptImage(
  file: File,
  environment: ReceiptImageEnvironment = getDefaultEnvironment(),
) {
  const bitmap = await environment.createBitmap(file);

  try {
    const dimensions = getScaledReceiptDimensions(bitmap.width, bitmap.height);
    const canvas = environment.createCanvas();
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas rendering is unavailable.");
    }

    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    const imageData = context.getImageData(0, 0, dimensions.width, dimensions.height);

    for (let index = 0; index < imageData.data.length; index += 4) {
      const grayscale = Math.round(
        imageData.data[index] * 0.299 +
          imageData.data[index + 1] * 0.587 +
          imageData.data[index + 2] * 0.114,
      );
      imageData.data[index] = grayscale;
      imageData.data[index + 1] = grayscale;
      imageData.data[index + 2] = grayscale;
    }

    context.putImageData(imageData, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to prepare receipt image."));
        }
      }, "image/png");
    });
  } finally {
    bitmap.close();
  }
}
