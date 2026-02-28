import type { Profile } from "@/types/profile";
import { apiUrl } from "@/lib/api";

export async function uploadFile(
  profileId: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiUrl(`/profile/${profileId}/upload`), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  // The backend returns a path like "/uploads/profileId/file.jpg"
  // Prepend the API base so it resolves to the correct backend URL
  const url = data.url as string;
  return url.startsWith("http") ? url : apiUrl(url);
}

export async function parseCv(
  profileId: string,
  file: File
): Promise<Partial<Profile>> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiUrl(`/profile/${profileId}/parse-cv`), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "CV parsing failed" }));
    throw new Error(err.detail || "CV parsing failed");
  }

  return res.json();
}

export async function cloneVoice(
  profileId: string,
  audioBlob: Blob
): Promise<{ voice_id: string; status: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "voice-sample.wav");

  const res = await fetch(apiUrl(`/profile/${profileId}/clone-voice`), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Voice cloning failed" }));
    throw new Error(err.detail || "Voice cloning failed");
  }

  return res.json();
}

