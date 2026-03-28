"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/ui/magnetic-button";
import type { ExportPdfPayload } from "@/lib/pdf/types";
import { triggerPdfExport } from "@/lib/pdf/client-export";

type ExportSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payloadFactory: (settings: { filename: string; includeMetadata: boolean }) => ExportPdfPayload;
  defaultFilename: string;
};

export const ExportSettingsDialog = ({
  open,
  onOpenChange,
  payloadFactory,
  defaultFilename,
}: ExportSettingsDialogProps) => {
  const [filename, setFilename] = useState(defaultFilename);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (open) {
      setFilename(defaultFilename);
      setIncludeMetadata(true);
    }
  }, [defaultFilename, open]);

  const runExport = async () => {
    const cleanName = filename.trim();
    if (cleanName.length < 3) {
      toast.error("Filename must be at least 3 characters.");
      return;
    }
    setExporting(true);
    try {
      await triggerPdfExport(payloadFactory({ filename: cleanName, includeMetadata }));
      toast.success("PDF exported.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md rounded-2xl border-white/10">
        <DialogHeader>
          <DialogTitle>Export PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-export-filename">Filename</Label>
            <Input
              id="pdf-export-filename"
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              placeholder="interniq-export"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <Label htmlFor="pdf-export-metadata" className="text-sm">
              Include metadata block
            </Label>
            <input
              id="pdf-export-metadata"
              type="checkbox"
              checked={includeMetadata}
              onChange={(event) => setIncludeMetadata(event.target.checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Template: Premium Default
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <MagneticButton
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </MagneticButton>
          <MagneticButton className="flex-1" onClick={() => void runExport()} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export PDF"
            )}
          </MagneticButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
