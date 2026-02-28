import type { Profile } from "@/types/profile";

export async function uploadFile(
  profileId: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/profile/${profileId}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.url as string;
}

export async function parseCv(
  profileId: string,
  file: File
): Promise<Partial<Profile>> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/profile/${profileId}/parse-cv`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "CV parsing failed" }));
    throw new Error(err.detail || "CV parsing failed");
  }

  return res.json();
}
