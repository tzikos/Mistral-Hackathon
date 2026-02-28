import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Volume2, Loader2, User, RotateCcw } from "lucide-react";
import type { Profile } from "@/types/profile";
import { apiUrl } from "@/lib/api";

function getOrCreateSessionId(profileId: string): string {
  const key = `session_id_${profileId}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

type Status = "idle" | "recording" | "processing" | "speaking";

interface ChatEntry {
  id: string;
  userText: string;
  aiText: string;
  audioB64?: string | null;
}

const Agent = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const sessionIdRef = useRef<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialise session
  useEffect(() => {
    if (!profileId) return;
    sessionIdRef.current = getOrCreateSessionId(profileId);
  }, [profileId]);

  // Load profile
  useEffect(() => {
    if (!profileId) return;
    fetch(apiUrl(`/profile/${profileId}`))
      .then((res) => {
        if (!res.ok) throw new Error(`Profile not found (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [profileId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, status]);

  // Cleanup on unmount: stop audio, recording, and mic streams
  useEffect(() => {
    return () => {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      // Stop recording if active
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
      // Stop all mic tracks
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setStatus("recording");
    } catch {
      setError(
        "Microphone access denied. Please allow microphone permissions."
      );
    }
  }, [profileId]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setStatus("processing");
    }
  }, []);

  const sendAudio = async (audioBlob: Blob) => {
    if (!profileId) return;
    setStatus("processing");
    setCurrentTranscript("");

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("session_id", sessionIdRef.current);

      const res = await fetch(apiUrl(`/profile/${profileId}/chat`), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Chat request failed");
      }

      const data = await res.json();
      const entry: ChatEntry = {
        id: Date.now().toString(),
        userText: data.transcription || "(unintelligible)",
        aiText: data.reply || "I couldn't generate a response.",
        audioB64: data.audio?.base64 || null,
      };

      setChat((prev) => [...prev, entry]);
      setCurrentTranscript("");

      // Play audio if available
      if (entry.audioB64) {
        setStatus("speaking");
        const audioData = Uint8Array.from(atob(entry.audioB64), (c) =>
          c.charCodeAt(0)
        );
        const blob = new Blob([audioData], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setStatus("idle");
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setStatus("idle");
          URL.revokeObjectURL(url);
        };
        await audio.play();
      } else {
        setStatus("idle");
      }
    } catch (err: any) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setStatus("idle");
  };

  const newConversation = useCallback(() => {
    if (!profileId) return;
    // Clear server-side history
    fetch(apiUrl(`/profile/${profileId}/chat/${sessionIdRef.current}`), {
      method: "DELETE",
    }).catch(() => {});
    // Generate a fresh session id
    const id = crypto.randomUUID();
    localStorage.setItem(`session_id_${profileId}`, id);
    sessionIdRef.current = id;
    // Reset UI
    setChat([]);
    setError(null);
    stopAudio();
  }, [profileId]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && status === "idle" && !e.repeat) {
        e.preventDefault();
        startRecording();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && status === "recording") {
        e.preventDefault();
        stopRecording();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [status, startRecording, stopRecording]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 text-white px-4">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition"
        >
          Go Home
        </button>
      </div>
    );
  }

  const statusLabel =
    status === "recording"
      ? "Listening..."
      : status === "processing"
        ? "Thinking..."
        : status === "speaking"
          ? "Speaking..."
          : "Press & hold to talk";

  const statusColor =
    status === "recording"
      ? "text-red-400"
      : status === "processing"
        ? "text-amber-400"
        : status === "speaking"
          ? "text-emerald-400"
          : "text-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/10">
        <button
          onClick={() => navigate(`/${profileId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={18} />
          <span className="text-sm hidden sm:inline">Back to Profile</span>
        </button>
        <div className="flex items-center gap-3">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-8 h-8 rounded-full object-cover border border-white/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
          )}
          <span className="font-medium text-sm">
            Talk to {profile?.name || "AI"}
          </span>
          {chat.length > 0 && (
            <button
              onClick={newConversation}
              title="New conversation"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded hover:bg-white/10"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {chat.length === 0 && status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User size={32} className="text-primary" />
              )}
            </div>
            <h2 className="text-xl font-semibold">
              Hi! I'm {profile?.name}'s AI representative
            </h2>
            <p className="text-gray-400 max-w-md text-sm">
              {profile?.description ||
                "Ask me anything about their professional background, skills, and experience."}
            </p>
            <p className="text-xs text-gray-500">
              Hold <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono">Space</kbd> or press the mic button to start talking
            </p>
          </div>
        )}

        {chat.map((entry) => (
          <div key={entry.id} className="space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-md px-4 py-3">
                <p className="text-sm">{entry.userText}</p>
              </div>
            </div>
            {/* AI response */}
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3">
                <p className="text-sm">{entry.aiText}</p>
                {entry.audioB64 && (
                  <button
                    onClick={() => {
                      const audioData = Uint8Array.from(
                        atob(entry.audioB64!),
                        (c) => c.charCodeAt(0)
                      );
                      const blob = new Blob([audioData], {
                        type: "audio/mpeg",
                      });
                      const url = URL.createObjectURL(blob);
                      const audio = new Audio(url);
                      audio.onended = () => URL.revokeObjectURL(url);
                      audio.play();
                    }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition"
                  >
                    <Volume2 size={14} /> Play again
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {status === "processing" && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-amber-400" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 sm:mx-8 mb-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:text-red-300">
            ×
          </button>
        </div>
      )}

      {/* Bottom control */}
      <div className="border-t border-white/10 px-4 sm:px-8 py-6">
        <div className="flex flex-col items-center gap-3">
          <p className={`text-sm font-medium ${statusColor} transition-colors`}>
            {statusLabel}
          </p>

          <button
            onMouseDown={() => status === "idle" && startRecording()}
            onMouseUp={() => status === "recording" && stopRecording()}
            onMouseLeave={() => status === "recording" && stopRecording()}
            onTouchStart={(e) => {
              e.preventDefault();
              if (status === "idle") startRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (status === "recording") stopRecording();
            }}
            onClick={() => {
              if (status === "speaking") stopAudio();
            }}
            disabled={status === "processing"}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200
              ${status === "recording"
                ? "bg-red-500 scale-110 shadow-lg shadow-red-500/30 animate-pulse"
                : status === "processing"
                  ? "bg-amber-500/20 cursor-wait"
                  : status === "speaking"
                    ? "bg-emerald-500/20 hover:bg-emerald-500/30"
                    : "bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95"
              }
              disabled:opacity-50
            `}
          >
            {status === "recording" ? (
              <MicOff size={28} />
            ) : status === "processing" ? (
              <Loader2 size={28} className="animate-spin" />
            ) : status === "speaking" ? (
              <Volume2 size={28} className="text-emerald-400" />
            ) : (
              <Mic size={28} />
            )}
          </button>

          {!profile?.voice_id && (
            <p className="text-xs text-amber-400/70 text-center max-w-xs">
              Voice not cloned yet — responses will be text-only
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agent;
