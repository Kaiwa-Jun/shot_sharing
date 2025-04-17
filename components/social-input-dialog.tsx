"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SocialInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "instagram" | "twitter";
  value: string;
  onSave: (value: string) => void;
}

const SOCIAL_CONFIG = {
  instagram: {
    title: "Instagram",
    prefix: "www.instagram.com/",
    placeholder: "ユーザーネーム"
  },
  twitter: {
    title: "X (Twitter)",
    prefix: "x.com/",
    placeholder: "ユーザーネーム"
  }
};

export function SocialInputDialog({
  open,
  onOpenChange,
  type,
  value,
  onSave
}: SocialInputDialogProps) {
  const config = SOCIAL_CONFIG[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0" closeButton={false}>
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">{config.title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center pointer-events-none px-3">
              <span className="text-muted-foreground">{config.prefix}</span>
            </div>
            <input
              className="w-full h-12 pl-[140px] pr-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={config.placeholder}
              value={value}
              onChange={(e) => onSave(e.target.value)}
            />
          </div>
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