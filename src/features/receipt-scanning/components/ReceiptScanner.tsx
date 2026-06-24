import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";

import { ReceiptReviewForm } from "@/features/receipt-scanning/components/ReceiptReviewForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult, Participant } from "@/types/split";
import type {
  OcrProgress,
  ParsedReceipt,
  ReceiptImportInput,
} from "@/features/receipt-scanning/types";
import { scanReceiptFile } from "@/features/receipt-scanning/scanReceipt";

type ScanFile = (
  file: File,
  onProgress: (progress: OcrProgress) => void,
  signal: AbortSignal,
) => Promise<ParsedReceipt>;

type ReceiptScannerProps = {
  participants: Participant[];
  hasExistingReceiptData: boolean;
  onImport: (input: ReceiptImportInput) => ActionResult;
  scanFile?: ScanFile;
};

export function ReceiptScanner({
  participants,
  hasExistingReceiptData,
  onImport,
  scanFile = scanReceiptFile,
}: ReceiptScannerProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"upload" | "scanning" | "review" | "error">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function resetScanner() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    previewUrlRef.current = null;
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(null);
    setReceipt(null);
    setError(null);
    setStatus("upload");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetScanner();
    }
  }

  async function startScan(file: File) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus("scanning");
    setError(null);
    setProgress({ status: "Preparing image", progress: null });

    try {
      const result = await scanFile(file, setProgress, controller.signal);

      if (!controller.signal.aborted) {
        setReceipt(result);
        setStatus("review");
      }
    } catch (scanError) {
      if (
        controller.signal.aborted ||
        (scanError instanceof DOMException && scanError.name === "AbortError")
      ) {
        return;
      }

      setError(
        scanError instanceof Error
          ? scanError.message
          : "Receipt scanning could not start. Check your connection and try again, or enter the receipt manually.",
      );
      setStatus("error");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  function handleFile(file: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    previewUrlRef.current = nextPreviewUrl;
    void startScan(file);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Camera className="h-4 w-4" />
          Scan receipt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-1 pr-8">
          <DialogTitle className="text-lg font-semibold">Scan receipt</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            The image stays in this browser. Review every field before importing.
          </DialogDescription>
        </div>

        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected receipt preview"
            className="max-h-48 w-full rounded-lg border object-contain"
          />
        ) : null}

        {status === "upload" ? (
          <div className="space-y-2 rounded-lg border border-dashed p-4">
            <Label htmlFor="receipt-image">Receipt image</Label>
            <Input
              id="receipt-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleFile(file);
                }
              }}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              JPEG, PNG, or WebP. Maximum 10 MB.
            </p>
          </div>
        ) : null}

        {status === "scanning" ? (
          <div className="space-y-3 rounded-lg border p-4" aria-live="polite">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning receipt
            </div>
            <p className="text-sm text-muted-foreground">
              {progress?.status ?? "Preparing image"}
              {progress?.progress === null || progress?.progress === undefined
                ? ""
                : ` ${Math.round(progress.progress * 100)}%`}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                abortControllerRef.current?.abort();
                setStatus("upload");
                setProgress(null);
              }}
            >
              Cancel scan
            </Button>
          </div>
        ) : null}

        {status === "error" && error ? (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertTitle>Receipt scan issue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (selectedFile) {
                    void startScan(selectedFile);
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Retry scan
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={resetScanner}>
                Choose another image
              </Button>
            </div>
          </div>
        ) : null}

        {status === "review" && receipt ? (
          <ReceiptReviewForm
            receipt={receipt}
            participants={participants}
            hasExistingReceiptData={hasExistingReceiptData}
            onImport={onImport}
            onCancel={() => handleOpenChange(false)}
            onImported={() => handleOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
