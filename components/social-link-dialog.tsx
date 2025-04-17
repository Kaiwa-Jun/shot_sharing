"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

interface SocialLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "instagram" | "twitter";
  username: string;
  onSave: (username: string) => void;
}

const SOCIAL_CONFIG = {
  instagram: {
    title: "Instagram",
    placeholder: "ユーザーネーム",
    prefix: "www.instagram.com/"
  },
  twitter: {
    title: "X (Twitter)",
    placeholder: "ユーザーネーム",
    prefix: "x.com/"
  }
};

export function SocialLinkDialog({ open, onOpenChange, type, username, onSave }: SocialLinkDialogProps) {
  const [value, setValue] = useState(username);
  const config = SOCIAL_CONFIG[type];

  const handleSave = () => {
    onSave(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-row items-center gap-4">
          <button onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <div className="flex items-center rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{config.prefix}</span>
              <input
                className="flex-1 border-0 bg-transparent p-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                placeholder={config.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}