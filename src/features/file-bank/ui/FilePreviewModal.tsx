import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FileRecord } from "../logic/file-bank.types";

interface Props {
  file: FileRecord | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: Props) {
  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="truncate text-base">{file?.title}</DialogTitle>
        </DialogHeader>
        {file && (
          <iframe
            src={file.file_url}
            title={file.title}
            className="flex-1 w-full border-0"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
