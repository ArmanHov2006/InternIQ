"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/database";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data: unknown = await res.json();
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

function initialsFromProfile(profile: Profile | null): string {
  const name = profile?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const u = profile?.username?.trim();
  if (u) return u.slice(0, 2).toUpperCase();
  return "?";
}

export interface ProfileFormProps {
  profile: Profile | null;
  onProfileChange: (profile: Profile) => void;
}

export function ProfileForm({ profile, onProfileChange }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [isOpenToWork, setIsOpenToWork] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setFullName("");
      setUsername("");
      setHeadline("");
      setBio("");
      setLocation("");
      setWebsiteUrl("");
      setGithubUrl("");
      setLinkedinUrl("");
      setTwitterUrl("");
      setIsOpenToWork(false);
      setAvatarPreview(null);
      return;
    }
    setFullName(profile.full_name ?? "");
    setUsername(profile.username ?? "");
    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setWebsiteUrl(profile.website_url ?? "");
    setGithubUrl(profile.github_url ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setTwitterUrl(profile.twitter_url ?? "");
    setIsOpenToWork(Boolean(profile.is_open_to_work));
    setAvatarPreview(profile.avatar_url || null);
  }, [profile]);

  const handleSave = async () => {
    if (!profile) {
      toast.error("No profile loaded yet.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          username,
          headline,
          bio,
          location,
          website_url: websiteUrl,
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          twitter_url: twitterUrl,
          is_open_to_work: isOpenToWork,
        }),
      });
      const updated = await parseJsonResponse<Profile>(res);
      onProfileChange(updated);
      setAvatarPreview(updated.avatar_url || null);
      toast.success("Profile saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 2MB or smaller.");
      return;
    }
    if (!profile) {
      toast.error("No profile loaded yet.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: fd,
      });
      const data = await parseJsonResponse<{ url: string }>(res);
      const next: Profile = { ...profile, avatar_url: data.url };
      onProfileChange(next);
      setAvatarPreview(data.url);
      toast.success("Photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarPreview ?? undefined} alt={fullName || "Profile"} />
          <AvatarFallback className="text-lg">{initialsFromProfile(profile)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(ev) => void handleFileChange(ev)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePickFile}
              disabled={uploading || !profile}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Change Photo"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">PNG or JPG, up to 2MB.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Your role · what you're looking for"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="A short intro for your public profile."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website_url">Website</Label>
          <Input
            id="website_url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub</Label>
          <Input
            id="github_url"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn</Label>
          <Input
            id="linkedin_url"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter_url">Twitter / X</Label>
          <Input
            id="twitter_url"
            type="url"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            placeholder="https://twitter.com/..."
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="is_open_to_work"
            type="checkbox"
            className="h-4 w-4 rounded border border-input"
            checked={isOpenToWork}
            onChange={(e) => setIsOpenToWork(e.target.checked)}
          />
          <Label htmlFor="is_open_to_work" className="font-normal">
            Open to work
          </Label>
        </div>
      </div>

      <Button type="button" onClick={() => void handleSave()} disabled={saving || !profile}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save profile"
        )}
      </Button>
    </div>
  );
}
