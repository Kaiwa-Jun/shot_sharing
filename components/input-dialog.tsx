"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
}

export function InputDialog({
  open,
  onOpenChange,
  title,
  value,
  onSave,
  multiline = false
}: InputDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0" closeButton={false}>
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {multiline ? (
            <textarea
              className="w-full min-h-[120px] p-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              value={value}
              onChange={(e) => onSave(e.target.value)}
            />
          ) : (
            <input
              className="w-full h-12 px-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={value}
              onChange={(e) => onSave(e.target.value)}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button
            onClick={() => {
              onSave(value);
              onOpenChange(false);
            }}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}