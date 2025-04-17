"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Instagram, Twitter, ChevronRight, User, AtSign, FileText, MapPin } from "lucide-react";
import { SocialInputDialog } from "@/components/social-input-dialog";
import { InputDialog } from "@/components/input-dialog";

interface ProfileEditDialogProps {
  profile: {
    name: string;
    username: string;
    bio: string;
    location: string;
    twitter: string;
    instagram: string;
    url: string;
  };
  onSave: (profile: ProfileEditDialogProps["profile"]) => void;
}

type InputType = "name" | "username" | "bio" | "location";

export function ProfileEditDialog({ profile, onSave }: ProfileEditDialogProps) {
  const [formData, setFormData] = useState(profile);
  const [open, setOpen] = useState(false);
  const [socialDialog, setSocialDialog] = useState<{
    open: boolean;
    type: "instagram" | "twitter" | null;
  }>({
    open: false,
    type: null,
  });
  const [inputDialog, setInputDialog] = useState<{
    open: boolean;
    type: InputType | null;
  }>({
    open: false,
    type: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
  };

  const handleSocialSave = (username: string) => {
    if (socialDialog.type) {
      setFormData(prev => ({
        ...prev,
        [socialDialog.type]: username
      }));
    }
  };

  const handleInputSave = (value: string) => {
    if (inputDialog.type) {
      setFormData(prev => ({
        ...prev,
        [inputDialog.type]: value
      }));
    }
  };

  const getInputConfig = (type: InputType) => {
    const config = {
      name: {
        title: "表示名",
        icon: User,
        value: formData.name
      },
      username: {
        title: "ID",
        icon: AtSign,
        value: formData.username
      },
      bio: {
        title: "自己紹介",
        icon: FileText,
        value: formData.bio
      },
      location: {
        title: "場所",
        icon: MapPin,
        value: formData.location
      }
    };
    return config[type];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">プロフィールを編集</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] p-0" closeButton={false}>
          <DialogHeader className="p-4 text-center border-b">
            <DialogTitle>プロフィールを編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-4">
            {/* Avatar Edit */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-background bg-muted overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces"
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-2">基本情報</h3>
              <div className="space-y-2 rounded-lg border">
                {(["name", "username", "bio", "location"] as const).map((type) => {
                  const config = getInputConfig(type);
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors"
                      onClick={() => setInputDialog({ open: true, type })}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{config.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="truncate max-w-[200px]">
                          {config.value || "未設定"}
                        </span>
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-2">SNS</h3>
              <div className="space-y-2 rounded-lg border">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors"
                  onClick={() => setSocialDialog({ open: true, type: "twitter" })}
                >
                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5" />
                    <span>X (Twitter)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formData.twitter || "未設定"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors"
                  onClick={() => setSocialDialog({ open: true, type: "instagram" })}
                >
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5" />
                    <span>Instagram</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formData.instagram || "未設定"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">保存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SocialInputDialog
        open={socialDialog.open}
        onOpenChange={(open) => setSocialDialog({ ...socialDialog, open })}
        type={socialDialog.type || "instagram"}
        value={socialDialog.type ? formData[socialDialog.type] : ""}
        onSave={handleSocialSave}
      />

      {inputDialog.type && (
        <InputDialog
          open={inputDialog.open}
          onOpenChange={(open) => setInputDialog({ ...inputDialog, open })}
          title={getInputConfig(inputDialog.type).title}
          value={formData[inputDialog.type]}
          onSave={handleInputSave}
          multiline={inputDialog.type === "bio"}
        />
      )}
    </>
  );
}