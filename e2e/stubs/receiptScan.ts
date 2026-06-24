export async function scanReceiptFile(
  _file: File,
  onProgress: (progress: { status: string; progress: number | null }) => void,
  signal: AbortSignal,
) {
  onProgress({ status: "recognizing text", progress: 0.5 });

  if (signal.aborted) {
    throw new DOMException("Receipt scanning was cancelled.", "AbortError");
  }

  return {
    items: [
      {
        name: "Latte",
        amountCents: 450,
        sourceLine: "Latte 4.50",
      },
    ],
    subtotalCents: 450,
    taxCents: 40,
    tipCents: 100,
    totalCents: 590,
    warnings: [],
  };
}
