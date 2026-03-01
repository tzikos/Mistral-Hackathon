import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFile, parseCv, cloneVoice } from "@/lib/upload";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import {
  Database,
  Code,
  Activity,
  LineChart,
  BookOpen,
  Award,
  MessageCircle,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  Trash2,
  HelpCircle,
  Cpu,
  Globe,
  Heart,
  Layers,
  Lock,
  Mail,
  Monitor,
  Palette,
  PenTool,
  Rocket,
  Search,
  Server,
  Settings,
  Shield,
  Star,
  Terminal,
  TrendingUp,
  Users,
  Zap,
  Brain,
  Camera,
  Cloud,
  Compass,
  FileText,
  Lightbulb,
  Loader2,
  FileUp,
  CheckSquare,
  Square,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Profile,
  AboutSection,
  PortfolioSection,
  PortfolioItem,
  Expertise,
  Education,
  Certification,
  Links,
} from "@/types/profile";

const ICON_OPTIONS: { value: string; Icon: LucideIcon }[] = [
  { value: "Database", Icon: Database },
  { value: "Code", Icon: Code },
  { value: "Activity", Icon: Activity },
  { value: "LineChart", Icon: LineChart },
  { value: "BookOpen", Icon: BookOpen },
  { value: "Award", Icon: Award },
  { value: "MessageCircle", Icon: MessageCircle },
  { value: "Cpu", Icon: Cpu },
  { value: "Globe", Icon: Globe },
  { value: "Heart", Icon: Heart },
  { value: "Layers", Icon: Layers },
  { value: "Lock", Icon: Lock },
  { value: "Mail", Icon: Mail },
  { value: "Monitor", Icon: Monitor },
  { value: "Palette", Icon: Palette },
  { value: "PenTool", Icon: PenTool },
  { value: "Rocket", Icon: Rocket },
  { value: "Search", Icon: Search },
  { value: "Server", Icon: Server },
  { value: "Settings", Icon: Settings },
  { value: "Shield", Icon: Shield },
  { value: "Star", Icon: Star },
  { value: "Terminal", Icon: Terminal },
  { value: "TrendingUp", Icon: TrendingUp },
  { value: "Users", Icon: Users },
  { value: "Zap", Icon: Zap },
  { value: "Brain", Icon: Brain },
  { value: "Camera", Icon: Camera },
  { value: "Cloud", Icon: Cloud },
  { value: "Compass", Icon: Compass },
  { value: "FileText", Icon: FileText },
  { value: "Lightbulb", Icon: Lightbulb },
];

const COLOR_OPTIONS: { value: string; hex: string; label: string }[] = [
  { value: "blue", hex: "#3b82f6", label: "Blue" },
  { value: "green", hex: "#22c55e", label: "Green" },
  { value: "purple", hex: "#a855f7", label: "Purple" },
  { value: "amber", hex: "#f59e0b", label: "Amber" },
  { value: "red", hex: "#ef4444", label: "Red" },
  { value: "pink", hex: "#ec4899", label: "Pink" },
  { value: "indigo", hex: "#6366f1", label: "Indigo" },
  { value: "teal", hex: "#14b8a6", label: "Teal" },
  { value: "cyan", hex: "#06b6d4", label: "Cyan" },
  { value: "orange", hex: "#f97316", label: "Orange" },
  { value: "emerald", hex: "#10b981", label: "Emerald" },
  { value: "rose", hex: "#f43f5e", label: "Rose" },
];

const EDIT_STEPS = ["CV Import", "Basics", "About", "Portfolio", "Photo & Voice", "Links & Finish"];
const CREATE_STEPS = ["Account", "Basics", "About", "Portfolio", "Photo & Voice", "Links & Finish"];

const emptyProfile: Profile = {
  id: "",
  name: "",
  headline: "",
  badge: "",
  description: "",
  avatar: undefined,
  about: {
    bio: [""],
    skills: [],
    expertise: [],
    education: [],
    certifications: [],
  },
  portfolio: { projects: [], workExperience: [], talksAndAwards: [] },
  links: {},
};

// ── Help tooltip ────────────────────────────────────────────

function HelpTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex ml-1.5 text-muted-foreground hover:text-foreground transition-colors align-middle"
        >
          <HelpCircle size={15} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Reusable sub-components ─────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="hover:text-red-500"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder || "Type and press Enter"}
      />
    </div>
  );
}

function ImageUpload({
  profileId,
  currentUrl,
  onUploaded,
  label,
}: {
  profileId: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(profileId, file);
      onUploaded(url);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && (
        <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      )}
      {currentUrl && (
        <img
          src={currentUrl}
          alt="preview"
          className="w-24 h-24 object-cover rounded-full mb-2 border"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={14} className="mr-1.5" />
        {uploading ? "Uploading..." : "Choose Image"}
      </Button>
    </div>
  );
}

function FileUpload({
  profileId,
  currentUrl,
  onUploaded,
  label,
  accept,
}: {
  profileId: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(profileId, file);
      onUploaded(url);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && (
        <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      )}
      {currentUrl && (
        <p className="text-sm text-muted-foreground mb-1 truncate">
          {currentUrl}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept || "*/*"}
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={14} className="mr-1.5" />
        {uploading ? "Uploading..." : "Choose File"}
      </Button>
    </div>
  );
}

// ── CV progress overlay ─────────────────────────────────────

const CV_STAGES = [
  { label: "Uploading your CV...", target: 15 },
  { label: "Running OCR on document...", target: 40 },
  { label: "Extracting profile data with AI...", target: 75 },
  { label: "Finalizing your profile...", target: 95 },
];

// Fun texts that cycle while stuck near 99%
const CV_FUN_TEXTS = [
  "Teaching the AI to read your handwriting... 🤓",
  "Convincing Mistral your experience is impressive...",
  "Counting your achievements (this may take a while)...",
  "Cross-referencing with the LinkedIn database... just kidding 😅",
  "Making sure your skills section doesn't brag too much...",
  "Running spell-check on your ambitions...",
  "Asking ElevenLabs to narrate your career story...",
  "Polishing your professional persona...",
  "Almost there — good things take time ✨",
  "Negotiating your salary history with the AI...",
  "Fact-checking your 'proficient in Excel' claim...",
  "Translating corporate buzzwords into human speech...",
];

function CvProgressOverlay() {
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [funTextIdx, setFunTextIdx] = useState(0);
  const [showFunText, setShowFunText] = useState(false);

  // Cycle fun texts every 2.8s once we're in the "creeping" phase
  useEffect(() => {
    if (!showFunText) return;
    const id = setInterval(() => {
      setFunTextIdx((i) => (i + 1) % CV_FUN_TEXTS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [showFunText]);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;

    // Total simulated duration ~12s across all stages
    const stageDurations = [1200, 3000, 5000, 2800];
    const totalStagedMs = stageDurations.reduce((a, b) => a + b, 0);

    const tick = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;

      if (elapsed < totalStagedMs) {
        // Normal staged phase: 0 → 95%
        let accumulated = 0;
        let currentStage = 0;
        let stageProgress = 0;

        for (let i = 0; i < stageDurations.length; i++) {
          if (elapsed < accumulated + stageDurations[i]) {
            currentStage = i;
            stageProgress = (elapsed - accumulated) / stageDurations[i];
            break;
          }
          accumulated += stageDurations[i];
          if (i === stageDurations.length - 1) {
            currentStage = i;
            stageProgress = 1;
          }
        }

        setStageIdx(currentStage);
        setShowFunText(false);

        const prevTarget = currentStage > 0 ? CV_STAGES[currentStage - 1].target : 0;
        const currTarget = CV_STAGES[currentStage].target;
        const eased = 1 - Math.pow(1 - Math.min(stageProgress, 1), 2);
        const pct = prevTarget + (currTarget - prevTarget) * eased;
        setProgress(Math.min(pct, 95));
      } else {
        // Creeping phase: 95 → 99% over ~60s, asymptotically
        const creepElapsed = elapsed - totalStagedMs;
        const creepDuration = 60_000;
        const t = Math.min(creepElapsed / creepDuration, 1);
        // Logarithmic creep: fast at start, nearly stops near end
        const creep = 4 * (1 - Math.pow(1 - t, 0.15));
        setProgress(95 + creep);
        setShowFunText(true);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Filled pie chart calculation
  const r = 54;
  const cx = 60;
  const cy = 60;
  const angle = (progress / 100) * 360;
  const angleRad = (angle * Math.PI) / 180;
  const endX = cx + r * Math.sin(angleRad);
  const endY = cy - r * Math.cos(angleRad);
  const largeArc = angle > 180 ? 1 : 0;

  let piePath = "";
  if (progress >= 100) {
    piePath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
  } else if (progress > 0) {
    piePath = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }

  const label = showFunText
    ? CV_FUN_TEXTS[funTextIdx]
    : CV_STAGES[stageIdx].label;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-36 h-36 mb-6">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />
          {piePath && <path d={piePath} fill="#FA520F" />}
          <circle cx={cx} cy={cy} r="38" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color: '#FA520F' }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2">Analyzing your CV</h2>
      <p className="text-muted-foreground text-sm text-center max-w-xs min-h-[1.5rem] transition-opacity duration-500">
        {label}
      </p>
      <p className="mt-6 text-xs text-muted-foreground/50">
        Powered by{" "}
        <span className="font-medium" style={{ color: '#FA520F' }}>Mistral</span>
        {" × "}
        <span className="font-medium text-purple-500">ElevenLabs</span>
      </p>
    </div>
  );
}

// ── Main wizard component ───────────────────────────────────

const CreateProfile = () => {
  const { profileId: paramProfileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { register } = useAuth();

  // create mode = no profileId in URL (/create)
  const isCreateMode = !paramProfileId;
  const STEPS = isCreateMode ? CREATE_STEPS : EDIT_STEPS;

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(!!paramProfileId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);
  const [saving, setSaving] = useState(false);

  // Account step state (create mode only)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  // After registration, store the profileId so subsequent steps can use it
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);

  // CV upload + auto-fill state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [autoFillFromCv, setAutoFillFromCv] = useState(false);
  const [parsingCv, setParsingCv] = useState(false);
  const [cvWarning, setCvWarning] = useState<string | null>(null);

  // Edit mode: CV re-upload state
  const [editCvFile, setEditCvFile] = useState<File | null>(null);
  const [reparsingCv, setReparsingCv] = useState(false);
  const [reparseSuccess, setReparseSuccess] = useState(false);

  const activeProfileId = paramProfileId || createdProfileId;

  // Load existing profile data (edit mode)
  useEffect(() => {
    if (!paramProfileId) return;
    fetch(apiUrl(`/profile/${paramProfileId}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile({
            ...emptyProfile,
            ...data,
            about: { ...emptyProfile.about, ...data.about },
            portfolio: { ...emptyProfile.portfolio, ...data.portfolio },
            links: { ...emptyProfile.links, ...data.links },
          });
        }
      })
      .finally(() => setLoading(false));
  }, [paramProfileId]);

  const updateField = <K extends keyof Profile>(
    key: K,
    value: Profile[K]
  ) => {
    setProfile((p) => ({ ...p, [key]: value }));
  };

  const updateAbout = <K extends keyof AboutSection>(
    key: K,
    value: AboutSection[K]
  ) => {
    setProfile((p) => ({ ...p, about: { ...p.about, [key]: value } }));
  };

  const updatePortfolio = <K extends keyof PortfolioSection>(
    key: K,
    value: PortfolioSection[K]
  ) => {
    setProfile((p) => ({
      ...p,
      portfolio: { ...p.portfolio, [key]: value },
    }));
  };

  const updateLinks = <K extends keyof Links>(key: K, value: Links[K]) => {
    setProfile((p) => ({ ...p, links: { ...p.links, [key]: value } }));
  };

  const handleAccountNext = async () => {
    setAccountError(null);

    if (password !== confirmPassword) {
      setAccountError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setAccountError("Password must be at least 6 characters");
      return;
    }
    if (username.length < 3) {
      setAccountError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setAccountError("Username can only contain letters, numbers, hyphens and underscores");
      return;
    }

    setRegistering(true);
    try {
      const pid = await register(username, password);
      setCreatedProfileId(pid);

      // If CV auto-fill is enabled, parse the CV before advancing
      if (autoFillFromCv && cvFile) {
        setRegistering(false);
        setParsingCv(true);
        try {
          const parsed = await parseCv(pid, cvFile);
          // Merge parsed data into profile (only overwrite non-empty fields)
          setProfile((prev) => {
            const merged = { ...prev };
            if (parsed.name) merged.name = parsed.name;
            if (parsed.headline) merged.headline = parsed.headline;
            if (parsed.badge) merged.badge = parsed.badge;
            if (parsed.description) merged.description = parsed.description;
            if (parsed.about) {
              merged.about = {
                bio: parsed.about.bio?.length ? parsed.about.bio : prev.about.bio,
                skills: parsed.about.skills?.length ? parsed.about.skills : prev.about.skills,
                expertise: parsed.about.expertise?.length ? parsed.about.expertise : prev.about.expertise,
                education: parsed.about.education?.length ? parsed.about.education : prev.about.education,
                certifications: parsed.about.certifications?.length ? parsed.about.certifications : prev.about.certifications,
              };
            }
            if (parsed.portfolio) {
              merged.portfolio = {
                projects: parsed.portfolio.projects?.length ? parsed.portfolio.projects : prev.portfolio.projects,
                workExperience: parsed.portfolio.workExperience?.length ? parsed.portfolio.workExperience : prev.portfolio.workExperience,
                talksAndAwards: parsed.portfolio.talksAndAwards?.length ? parsed.portfolio.talksAndAwards : prev.portfolio.talksAndAwards,
              };
            }
            if (parsed.links) {
              merged.links = {
                ...prev.links,
                ...(parsed.links.cv ? { cv: parsed.links.cv } : {}),
                ...(parsed.links.linkedIn ? { linkedIn: parsed.links.linkedIn } : {}),
                ...(parsed.links.github ? { github: parsed.links.github } : {}),
                ...(parsed.links.instagram ? { instagram: parsed.links.instagram } : {}),
              };
            }
            return merged;
          });
        } catch (err: any) {
          setCvWarning(
            `CV parsing failed: ${err.message}. You can fill in your details manually.`
          );
        } finally {
          setParsingCv(false);
        }
      }

      setStep((s) => s + 1);
    } catch (err: any) {
      setAccountError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleReparseCV = async () => {
    if (!editCvFile || !activeProfileId) return;
    setReparsingCv(true);
    setReparseSuccess(false);
    try {
      const parsed = await parseCv(activeProfileId, editCvFile);
      setProfile((prev) => {
        const merged = { ...prev };
        if (parsed.name) merged.name = parsed.name;
        if (parsed.headline) merged.headline = parsed.headline;
        if (parsed.badge) merged.badge = parsed.badge;
        if (parsed.description) merged.description = parsed.description;
        if (parsed.about) {
          merged.about = {
            bio: parsed.about.bio?.length ? parsed.about.bio : prev.about.bio,
            skills: parsed.about.skills?.length ? parsed.about.skills : prev.about.skills,
            expertise: parsed.about.expertise?.length ? parsed.about.expertise : prev.about.expertise,
            education: parsed.about.education?.length ? parsed.about.education : prev.about.education,
            certifications: parsed.about.certifications?.length ? parsed.about.certifications : prev.about.certifications,
          };
        }
        if (parsed.portfolio) {
          merged.portfolio = {
            projects: parsed.portfolio.projects?.length ? parsed.portfolio.projects : prev.portfolio.projects,
            workExperience: parsed.portfolio.workExperience?.length ? parsed.portfolio.workExperience : prev.portfolio.workExperience,
            talksAndAwards: parsed.portfolio.talksAndAwards?.length ? parsed.portfolio.talksAndAwards : prev.portfolio.talksAndAwards,
          };
        }
        if (parsed.links) {
          merged.links = {
            ...prev.links,
            ...(parsed.links.cv ? { cv: parsed.links.cv } : {}),
            ...(parsed.links.linkedIn ? { linkedIn: parsed.links.linkedIn } : {}),
            ...(parsed.links.github ? { github: parsed.links.github } : {}),
            ...(parsed.links.instagram ? { instagram: parsed.links.instagram } : {}),
          };
        }
        return merged;
      });
      setReparseSuccess(true);
      setEditCvFile(null);
    } catch (err: any) {
      setCvWarning(`CV re-parsing failed: ${err.message}`);
    } finally {
      setReparsingCv(false);
    }
  };

  const handleCvImport = async () => {
    if (!autoFillFromCv || !cvFile || !paramProfileId) {
      setStep((s) => s + 1);
      return;
    }
    setParsingCv(true);
    try {
      const parsed = await parseCv(paramProfileId, cvFile);
      setProfile((prev) => {
        const merged = { ...prev };
        if (parsed.name) merged.name = parsed.name;
        if (parsed.headline) merged.headline = parsed.headline;
        if (parsed.badge) merged.badge = parsed.badge;
        if (parsed.description) merged.description = parsed.description;
        if (parsed.about) {
          merged.about = {
            bio: parsed.about.bio?.length ? parsed.about.bio : prev.about.bio,
            skills: parsed.about.skills?.length ? parsed.about.skills : prev.about.skills,
            expertise: parsed.about.expertise?.length ? parsed.about.expertise : prev.about.expertise,
            education: parsed.about.education?.length ? parsed.about.education : prev.about.education,
            certifications: parsed.about.certifications?.length ? parsed.about.certifications : prev.about.certifications,
          };
        }
        if (parsed.portfolio) {
          merged.portfolio = {
            projects: parsed.portfolio.projects?.length ? parsed.portfolio.projects : prev.portfolio.projects,
            workExperience: parsed.portfolio.workExperience?.length ? parsed.portfolio.workExperience : prev.portfolio.workExperience,
            talksAndAwards: parsed.portfolio.talksAndAwards?.length ? parsed.portfolio.talksAndAwards : prev.portfolio.talksAndAwards,
          };
        }
        if (parsed.links) {
          merged.links = {
            ...prev.links,
            ...(parsed.links.cv ? { cv: parsed.links.cv } : {}),
            ...(parsed.links.linkedIn ? { linkedIn: parsed.links.linkedIn } : {}),
            ...(parsed.links.github ? { github: parsed.links.github } : {}),
            ...(parsed.links.instagram ? { instagram: parsed.links.instagram } : {}),
          };
        }
        return merged;
      });
    } catch (err: any) {
      setCvWarning(`CV parsing failed: ${err.message}. You can fill in your details manually.`);
    } finally {
      setParsingCv(false);
    }
    setStep((s) => s + 1);
  };

  const saveProfile = async () => {
    if (!activeProfileId) return;
    setSaving(true);
    try {
      // Use a replacer that converts undefined → null so the backend removes those keys.
      const body = JSON.stringify(profile, (_key, value) =>
        value === undefined ? null : value
      );
      const res = await fetch(apiUrl(`/profile/${activeProfileId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) throw new Error("Save failed");
      navigate(`/${activeProfileId}`);
    } catch {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // step 0 is always a special non-content step (Account in create mode, CV Import in edit mode).
  // Content steps (Basics, About, …) start at step 1 in both modes.
  const contentStep = step - 1;

  const handleNext = () => {
    if (isCreateMode && step === 0) {
      handleAccountNext();
      return;
    }
    if (!isCreateMode && step === 0) {
      handleCvImport();
      return;
    }
    setStep((s) => s + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* CV parsing overlay with progress */}
      {(parsingCv || reparsingCv) && (
        <CvProgressOverlay />
      )}

      {/* CV warning banner */}
      {cvWarning && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <span>{cvWarning}</span>
          <button
            type="button"
            onClick={() => setCvWarning(null)}
            className="ml-4 hover:text-amber-900 dark:hover:text-amber-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-muted-foreground/60 text-sm hidden sm:inline">·</span>
              <h1 className="text-sm font-medium text-muted-foreground hidden sm:inline">
                {isCreateMode ? "Create Profile" : "Edit Profile"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </span>
              {!isCreateMode && (
                <button
                  onClick={() => navigate(`/${paramProfileId}`)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Exit without saving"
                >
                  <X size={15} />
                  <span className="hidden sm:inline">Exit without saving</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {STEPS.map((label, i) => (
              <button
                key={label}
                onClick={() => {
                  // In create mode, don't allow jumping past Account until registered
                  if (isCreateMode && i > 0 && !createdProfileId) return;
                  // Don't allow jumping back to Account after registration
                  if (isCreateMode && i === 0 && createdProfileId) return;
                  setStep(i);
                }}
                className="flex-1 text-center"
              >
                <div
                  className={`h-2 rounded-full mb-1 transition-colors ${i <= step
                    ? "bg-primary"
                    : "bg-gray-200 dark:bg-gray-700"
                    }`}
                />
                <span
                  className={`text-xs ${i === step
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                    }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {isCreateMode && step === 0 && (
          <StepAccount
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            error={accountError}
            cvFile={cvFile}
            setCvFile={setCvFile}
            autoFillFromCv={autoFillFromCv}
            setAutoFillFromCv={setAutoFillFromCv}
          />
        )}
        {!isCreateMode && step === 0 && (
          <StepCvImport
            cvFile={cvFile}
            setCvFile={setCvFile}
            autoFillFromCv={autoFillFromCv}
            setAutoFillFromCv={setAutoFillFromCv}
          />
        )}
        {contentStep === 0 && (
          <StepBasics
            profile={profile}
            profileId={activeProfileId || ""}
            updateField={updateField}
          />
        )}
        {contentStep === 1 && (
          <StepAbout
            about={profile.about}
            updateAbout={updateAbout}
          />
        )}
        {contentStep === 2 && (
          <StepPortfolio
            portfolio={profile.portfolio}
            profileId={activeProfileId || ""}
            updatePortfolio={updatePortfolio}
          />
        )}
        {contentStep === 3 && (
          <StepVoice
            profile={profile}
            profileId={activeProfileId || ""}
            updateField={updateField}
          />
        )}
        {contentStep === 4 && (
          <StepLinks
            links={profile.links}
            profileId={activeProfileId || ""}
            updateLinks={updateLinks}
            profile={profile}
            isEditMode={!isCreateMode}
            editCvFile={editCvFile}
            setEditCvFile={setEditCvFile}
            onReparseCV={handleReparseCV}
            reparsingCv={reparsingCv}
            reparseSuccess={reparseSuccess}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={
              step === 0 || (isCreateMode && step === 1 && !!createdProfileId)
            }
          >
            <ChevronLeft size={16} className="mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={step === 0 && (registering || parsingCv)}
            >
              {isCreateMode && step === 0 && registering
                ? "Creating account..."
                : step === 0 && parsingCv
                  ? (<><Loader2 size={16} className="mr-1.5 animate-spin" />Analyzing CV...</>)
                  : "Next"}
              {!(step === 0 && (registering || parsingCv)) && (
                <ChevronRight size={16} className="ml-1" />
              )}
            </Button>
          ) : (
            <Button onClick={saveProfile} disabled={saving}>
              <Save size={16} className="mr-1.5" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Step 0 (edit mode): CV Import ───────────────────────────

function StepCvImport({
  cvFile,
  setCvFile,
  autoFillFromCv,
  setAutoFillFromCv,
}: {
  cvFile: File | null;
  setCvFile: (f: File | null) => void;
  autoFillFromCv: boolean;
  setAutoFillFromCv: (v: boolean) => void;
}) {
  const cvInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Speed up your profile setup</h2>
        <p className="text-muted-foreground">
          Upload your CV and let AI pre-fill your profile. You can review and edit everything in the next steps.
        </p>
      </div>

      <div className="border-2 rounded-lg p-6 space-y-4" style={{ borderColor: '#FA520F', backgroundColor: '#FA520F0D' }}>
        <div className="flex items-start gap-3">
          <FileUp size={20} className="mt-0.5 shrink-0" style={{ color: '#FA520F' }} />
          <div>
            <h3 className="font-semibold text-sm">
              Auto-fill from CV
              <HelpTip text="Upload your CV as a PDF and we'll use AI to extract your information and pre-fill the profile wizard. You can review and edit everything before saving." />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF files only. Your data stays private.
            </p>
          </div>
        </div>

        <div>
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setCvFile(file);
              if (file) setAutoFillFromCv(true);
            }}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FA520F' }}
            >
              <Upload size={14} />
              {cvFile ? "Change File" : "Choose PDF"}
            </button>
            {cvFile && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {cvFile.name}
              </span>
            )}
            {cvFile && (
              <button
                type="button"
                onClick={() => {
                  setCvFile(null);
                  setAutoFillFromCv(false);
                  if (cvInputRef.current) cvInputRef.current.value = "";
                }}
                className="text-muted-foreground hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {cvFile && (
          <button
            type="button"
            onClick={() => setAutoFillFromCv(!autoFillFromCv)}
            className="flex items-center gap-2 text-sm hover:text-foreground transition-colors"
          >
            {autoFillFromCv ? (
              <CheckSquare size={18} style={{ color: '#FA520F' }} />
            ) : (
              <Square size={18} className="text-muted-foreground" />
            )}
            <span>Auto-fill profile from CV using AI</span>
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        No CV? Click <strong>Next</strong> to fill in your details manually.
      </p>
    </div>
  );
}

// ── Step 0 (create mode): Account ───────────────────────────

function StepAccount({
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  cvFile,
  setCvFile,
  autoFillFromCv,
  setAutoFillFromCv,
}: {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  error: string | null;
  cvFile: File | null;
  setCvFile: (f: File | null) => void;
  autoFillFromCv: boolean;
  setAutoFillFromCv: (v: boolean) => void;
}) {
  const cvInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Your Account</h2>

      <div className="space-y-4">
        <div>
          <Label>Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. johndoe"
            minLength={3}
            maxLength={30}
            pattern="^[a-zA-Z0-9_-]+$"
            title="Letters, numbers, hyphens and underscores only"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Letters, numbers, hyphens and underscores only (3-30 chars)
          </p>
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            minLength={6}
          />
        </div>

        <div>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            minLength={6}
          />
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-sm text-red-500 mt-1">
              Passwords do not match
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* CV upload section */}
      <div className="border-2 rounded-lg p-5 space-y-4" style={{ borderColor: '#FA520F', backgroundColor: '#FA520F0D' }}>
        <div className="flex items-start gap-3">
          <FileUp size={20} className="mt-0.5 shrink-0" style={{ color: '#FA520F' }} />
          <div>
            <h3 className="font-semibold text-sm">
              Speed up profile creation
              <HelpTip text="Upload your CV as a PDF and we'll use AI to extract your information and pre-fill the profile wizard. You can review and edit everything before saving." />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload your CV to auto-fill your profile using AI
            </p>
          </div>
        </div>

        <div>
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setCvFile(file);
              if (file) setAutoFillFromCv(true);
            }}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FA520F' }}
            >
              <Upload size={14} />
              {cvFile ? "Change File" : "Choose PDF"}
            </button>
            {cvFile && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {cvFile.name}
              </span>
            )}
            {cvFile && (
              <button
                type="button"
                onClick={() => {
                  setCvFile(null);
                  setAutoFillFromCv(false);
                  if (cvInputRef.current) cvInputRef.current.value = "";
                }}
                className="text-muted-foreground hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {cvFile && (
          <button
            type="button"
            onClick={() => setAutoFillFromCv(!autoFillFromCv)}
            className="flex items-center gap-2 text-sm hover:text-foreground transition-colors"
          >
            {autoFillFromCv ? (
              <CheckSquare size={18} style={{ color: '#FA520F' }} />
            ) : (
              <Square size={18} className="text-muted-foreground" />
            )}
            <span>Auto-fill profile from CV using AI</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Basics ──────────────────────────────────────────

function StepBasics({
  profile,
  profileId,
  updateField,
}: {
  profile: Profile;
  profileId: string;
  updateField: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Basic Information</h2>

      <div className="space-y-4">
        <div>
          <Label>Full Name <HelpTip text="Your display name shown at the top of your profile." /></Label>
          <Input
            value={profile.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label>Headline <HelpTip text="A short phrase that describes what you do. Shown prominently below your name." /></Label>
          <Input
            value={profile.headline}
            onChange={(e) => updateField("headline", e.target.value)}
            placeholder="Translating data into actionable insights"
          />
        </div>

        <div>
          <Label>Badge / Tagline <HelpTip text="A compact label summarizing your areas of focus, e.g. 'Data - ML/AI - MLOps'." /></Label>
          <Input
            value={profile.badge}
            onChange={(e) => updateField("badge", e.target.value)}
            placeholder="Data - ML/AI - MLOps"
          />
        </div>

        <div>
          <Label>Short Description <HelpTip text="A 1-2 sentence summary that appears in your hero section." /></Label>
          <textarea
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
            value={profile.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="A short description about yourself..."
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: About ───────────────────────────────────────────

function StepAbout({
  about,
  updateAbout,
}: {
  about: AboutSection;
  updateAbout: <K extends keyof AboutSection>(
    key: K,
    value: AboutSection[K]
  ) => void;
}) {
  // Bio paragraphs
  const updateBio = (idx: number, value: string) => {
    const newBio = [...about.bio];
    newBio[idx] = value;
    updateAbout("bio", newBio);
  };
  const addBio = () => updateAbout("bio", [...about.bio, ""]);
  const removeBio = (idx: number) =>
    updateAbout(
      "bio",
      about.bio.filter((_, i) => i !== idx)
    );

  // Expertise
  const addExpertise = () =>
    updateAbout("expertise", [
      ...about.expertise,
      { title: "", description: "", icon: "Code", color: "blue" },
    ]);
  const removeExpertise = (idx: number) =>
    updateAbout(
      "expertise",
      about.expertise.filter((_, i) => i !== idx)
    );
  const updateExpertiseItem = (
    idx: number,
    field: keyof Expertise,
    value: string
  ) => {
    const updated = [...about.expertise];
    updated[idx] = { ...updated[idx], [field]: value };
    updateAbout("expertise", updated);
  };

  // Education
  const addEducation = () =>
    updateAbout("education", [
      ...about.education,
      { degree: "", institution: "", period: "", focus: null },
    ]);
  const removeEducation = (idx: number) =>
    updateAbout(
      "education",
      about.education.filter((_, i) => i !== idx)
    );
  const updateEducationItem = (
    idx: number,
    field: keyof Education,
    value: string | null
  ) => {
    const updated = [...about.education];
    updated[idx] = { ...updated[idx], [field]: value };
    updateAbout("education", updated);
  };

  // Certifications
  const addCert = () =>
    updateAbout("certifications", [
      ...about.certifications,
      { title: "", description: "" },
    ]);
  const removeCert = (idx: number) =>
    updateAbout(
      "certifications",
      about.certifications.filter((_, i) => i !== idx)
    );
  const updateCertItem = (
    idx: number,
    field: keyof Certification,
    value: string
  ) => {
    const updated = [...about.certifications];
    updated[idx] = { ...updated[idx], [field]: value };
    updateAbout("certifications", updated);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">About You</h2>

      {/* Bio */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Bio Paragraphs <HelpTip text="Write about yourself in 1-3 paragraphs. Each paragraph appears as a separate block in your About section." /></Label>
          <Button type="button" variant="outline" size="sm" onClick={addBio}>
            <Plus size={14} className="mr-1" /> Add Paragraph
          </Button>
        </div>
        {about.bio.map((para, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
              value={para}
              onChange={(e) => updateBio(i, e.target.value)}
              placeholder={`Paragraph ${i + 1}`}
            />
            {about.bio.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBio(i)}
              >
                <Trash2 size={16} className="text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </section>

      {/* Skills */}
      <section className="space-y-2">
        <Label className="text-base font-semibold">Skills <HelpTip text="Add your technical skills as tags. Type a skill name and press Enter to add it." /></Label>
        <TagInput
          tags={about.skills}
          onChange={(s) => updateAbout("skills", s)}
          placeholder="Type a skill and press Enter"
        />
      </section>

      {/* Expertise */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Expertise <HelpTip text="Highlight your key areas of expertise. Each card has a title, description, icon and color that will be displayed on your profile." /></Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExpertise}
          >
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </div>
        {about.expertise.map((exp, i) => {
          const SelectedIcon =
            ICON_OPTIONS.find((o) => o.value === exp.icon)?.Icon || Code;
          return (
            <div
              key={i}
              className="border rounded-lg p-4 space-y-3 relative"
            >
              <button
                type="button"
                onClick={() => removeExpertise(i)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
              <div>
                <Label>Title</Label>
                <Input
                  value={exp.title}
                  onChange={(e) =>
                    updateExpertiseItem(i, "title", e.target.value)
                  }
                  placeholder="Data Engineering"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={exp.description}
                  onChange={(e) =>
                    updateExpertiseItem(i, "description", e.target.value)
                  }
                  placeholder="Building automated pipelines..."
                />
              </div>
              <div>
                <Label>Icon <HelpTip text="Pick an icon that represents this area of expertise. It will be displayed on the card." /></Label>
                <div className="grid grid-cols-8 sm:grid-cols-11 gap-1.5 mt-1.5 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800/50 max-h-36 overflow-y-auto">
                  {ICON_OPTIONS.map((opt) => (
                    <Tooltip key={opt.value}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() =>
                            updateExpertiseItem(i, "icon", opt.value)
                          }
                          className={`w-9 h-9 flex items-center justify-center rounded-md transition-all ${exp.icon === opt.value
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
                            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <opt.Icon size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {opt.value}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Color <HelpTip text="Choose a color for the icon on your expertise card." /></Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <Tooltip key={c.value}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() =>
                            updateExpertiseItem(i, "color", c.value)
                          }
                          className={`w-8 h-8 rounded-full border-2 transition-all ${exp.color === c.value
                            ? "border-foreground scale-110 ring-2 ring-offset-1 ring-foreground/30"
                            : "border-transparent hover:scale-105"
                            }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {c.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Education */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Education <HelpTip text="List your degrees and academic background. Include the institution, time period, and optionally a focus area." /></Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEducation}
          >
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </div>
        {about.education.map((edu, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 space-y-3 relative"
          >
            <button
              type="button"
              onClick={() => removeEducation(i)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Degree</Label>
                <Input
                  value={edu.degree}
                  onChange={(e) =>
                    updateEducationItem(i, "degree", e.target.value)
                  }
                  placeholder="M.Sc. Computer Science"
                />
              </div>
              <div>
                <Label>Institution</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) =>
                    updateEducationItem(i, "institution", e.target.value)
                  }
                  placeholder="MIT"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Period</Label>
                <Input
                  value={edu.period}
                  onChange={(e) =>
                    updateEducationItem(i, "period", e.target.value)
                  }
                  placeholder="2020-2024"
                />
              </div>
              <div>
                <Label>Focus (optional)</Label>
                <Input
                  value={edu.focus || ""}
                  onChange={(e) =>
                    updateEducationItem(
                      i,
                      "focus",
                      e.target.value || null
                    )
                  }
                  placeholder="Machine Learning"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Certifications */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Certifications <HelpTip text="Professional certifications, awards, or other credentials you've earned." /></Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCert}
          >
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </div>
        {about.certifications.map((cert, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 space-y-3 relative"
          >
            <button
              type="button"
              onClick={() => removeCert(i)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
            <div>
              <Label>Title</Label>
              <Input
                value={cert.title}
                onChange={(e) =>
                  updateCertItem(i, "title", e.target.value)
                }
                placeholder="AWS Certified Solutions Architect"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={cert.description}
                onChange={(e) =>
                  updateCertItem(i, "description", e.target.value)
                }
                placeholder="Professional certification"
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// ── Step 3: Portfolio ───────────────────────────────────────

function StepPortfolio({
  portfolio,
  profileId,
  updatePortfolio,
}: {
  portfolio: PortfolioSection;
  profileId: string;
  updatePortfolio: <K extends keyof PortfolioSection>(
    key: K,
    value: PortfolioSection[K]
  ) => void;
}) {
  const [tab, setTab] = useState<
    "projects" | "workExperience" | "talksAndAwards"
  >("workExperience");

  const tabOrder = ["workExperience", "projects", "talksAndAwards"] as const;
  const tabLabels: Record<(typeof tabOrder)[number], string> = {
    workExperience: "Work Experience",
    projects: "Projects",
    talksAndAwards: "Talks & Awards",
  };

  const items = portfolio[tab];

  const nextId = () => {
    const all = [
      ...portfolio.projects,
      ...portfolio.workExperience,
      ...portfolio.talksAndAwards,
    ];
    return all.length === 0 ? 0 : Math.max(...all.map((i) => i.id)) + 1;
  };

  const addItem = () => {
    const newItem: PortfolioItem = {
      id: nextId(),
      title: "",
      description: "",
      tags: [],
      image: "",
    };
    updatePortfolio(tab, [...items, newItem]);
  };

  const removeItem = (idx: number) => {
    updatePortfolio(
      tab,
      items.filter((_, i) => i !== idx)
    );
  };

  const updateItem = (
    idx: number,
    field: keyof PortfolioItem,
    value: any
  ) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    updatePortfolio(tab, updated);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Portfolio <HelpTip text="Showcase your work across three categories. Each item can have an image, tags, and an optional link." /></h2>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b pb-2">
        {tabOrder.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${tab === key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 space-y-3 relative"
          >
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>

            <div>
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(i, "title", e.target.value)}
                placeholder="Project title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
                value={item.description}
                onChange={(e) =>
                  updateItem(i, "description", e.target.value)
                }
                placeholder="Short description"
              />
            </div>

            <div>
              <Label>Detailed Description (optional) <HelpTip text="A longer description shown when visitors click on the item card." /></Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                value={item.detailedDescription || ""}
                onChange={(e) =>
                  updateItem(
                    i,
                    "detailedDescription",
                    e.target.value || undefined
                  )
                }
                placeholder="Longer description..."
              />
            </div>

            <div>
              <Label>Tags</Label>
              <TagInput
                tags={item.tags}
                onChange={(tags) => updateItem(i, "tags", tags)}
                placeholder="Add tag and press Enter"
              />
            </div>

            <ImageUpload
              profileId={profileId}
              currentUrl={item.image || undefined}
              onUploaded={(url) => updateItem(i, "image", url)}
              label="Image"
            />

            <div>
              <Label>Link (optional)</Label>
              <Input
                value={item.link || ""}
                onChange={(e) =>
                  updateItem(i, "link", e.target.value || undefined)
                }
                placeholder="https://..."
              />
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addItem}>
          <Plus size={16} className="mr-1.5" /> Add{" "}
          {tab === "projects"
            ? "Project"
            : tab === "workExperience"
              ? "Experience"
              : "Talk / Award"}
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: Photo & Voice ────────────────────────────────────

function StepVoice({
  profile,
  profileId,
  updateField,
}: {
  profile: Profile;
  profileId: string;
  updateField: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [cloned, setCloned] = useState(!!profile.voice_id);
  const [deleting, setDeleting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setCloneError(null);
    } catch {
      setCloneError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleClone = async () => {
    if (!audioBlob || !profileId) return;
    setCloning(true);
    setCloneError(null);
    try {
      const result = await cloneVoice(profileId, audioBlob);
      updateField("voice_id", result.voice_id);
      setCloned(true);
    } catch (err: any) {
      setCloneError(err.message);
    } finally {
      setCloning(false);
    }
  };

  const handleDeleteVoice = async () => {
    if (!profileId) return;
    setDeleting(true);
    setCloneError(null);
    try {
      const res = await fetch(apiUrl(`/profile/${profileId}/voice`), { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete voice");
      }
      updateField("voice_id", undefined);
      setCloned(false);
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err: any) {
      setCloneError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">
        Photo & Voice{" "}
        <HelpTip text="Upload a profile photo and record your voice. The voice recording will be used to create an AI voice clone that represents you on your shareable profile page." />
      </h2>

      {/* Avatar */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Profile Photo</Label>
        <ImageUpload
          profileId={profileId}
          currentUrl={profile.avatar}
          onUploaded={(url) => updateField("avatar", url)}
        />
      </div>

      {/* Voice recording */}
      <div className="border rounded-lg p-6 space-y-4 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-start gap-3">
          <Mic size={20} className="text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Voice Cloning</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record 10-30 seconds of your voice speaking naturally. This will be used to generate AI responses in your voice.
            </p>
          </div>
        </div>

        {/* Sample script */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Sample script — read this aloud</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            "Hi, I'm excited to share a bit about my professional journey. Over the years I've worked on challenging
            projects that pushed me to grow both technically and creatively. I enjoy collaborating with driven teams,
            solving complex problems, and turning ideas into real products that make a difference. I believe in
            continuous learning and bringing genuine enthusiasm to everything I do."
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Record button */}
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${recording
              ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30"
              : "bg-primary/10 hover:bg-primary/20"
              }`}
          >
            {recording ? (
              <MicOff size={24} className="text-white" />
            ) : (
              <Mic size={24} className="text-primary" />
            )}
          </button>
          <p className="text-sm text-muted-foreground">
            {recording
              ? "Recording... Click to stop"
              : audioBlob
                ? "Recording ready"
                : "Click to start recording"}
          </p>
        </div>

        {/* Playback */}
        {audioUrl && (
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-muted-foreground" />
            <audio controls src={audioUrl} className="flex-1 h-10" />
          </div>
        )}

        {/* Clone button */}
        {audioBlob && !cloned && (
          <Button
            type="button"
            onClick={handleClone}
            disabled={cloning}
            className="w-full"
          >
            {cloning ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Cloning voice...
              </>
            ) : (
              "Clone My Voice"
            )}
          </Button>
        )}

        {/* Success + delete */}
        {cloned && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
              Voice cloned successfully! Visitors will hear your AI in your voice.
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteVoice}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? (
                <><Loader2 size={14} className="mr-2 animate-spin" />Deleting voice...</>
              ) : (
                <><Trash2 size={14} className="mr-2" />Delete Voice</>
              )}
            </Button>
          </div>
        )}

        {/* Error */}
        {cloneError && (
          <p className="text-sm text-red-500">{cloneError}</p>
        )}
      </div>
    </div>
  );
}

// ── Step 5: Links & Finish ──────────────────────────────────

function StepLinks({
  links,
  profileId,
  updateLinks,
  profile,
  isEditMode,
  editCvFile,
  setEditCvFile,
  onReparseCV,
  reparsingCv,
  reparseSuccess,
}: {
  links: Links;
  profileId: string;
  updateLinks: <K extends keyof Links>(key: K, value: Links[K]) => void;
  profile: Profile;
  isEditMode?: boolean;
  editCvFile?: File | null;
  setEditCvFile?: (f: File | null) => void;
  onReparseCV?: () => void;
  reparsingCv?: boolean;
  reparseSuccess?: boolean;
}) {
  const editCvInputRef = useRef<HTMLInputElement>(null);
  // Toggle is on when the user explicitly enabled it (cvVisible === true) or
  // when a CV URL already exists and they haven't explicitly hidden it.
  const [cvToggled, setCvToggled] = useState(!!links.cv && links.cvVisible !== false);

  const handleCvToggle = () => {
    if (cvToggled) {
      setCvToggled(false);
      updateLinks("cvVisible", false);   // hide — but keep the URL in links.cv
    } else {
      setCvToggled(true);
      updateLinks("cvVisible", true);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Links & Finish <HelpTip text="Add external links and upload your CV. All fields are optional. Review the summary below before saving." /></h2>

      <div className="space-y-4">
        {/* CV Download Toggle */}
        <div className="border rounded-lg p-4 space-y-3">
          <button
            type="button"
            onClick={handleCvToggle}
            className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors"
          >
            {cvToggled ? (
              <CheckSquare size={18} className="text-primary" />
            ) : (
              <Square size={18} className="text-muted-foreground" />
            )}
            Show "Download CV" button on my profile
          </button>

          {cvToggled && (
            <div className="pl-6 space-y-2">
              <p className="text-xs text-muted-foreground">
                Upload your CV as a PDF — it will be stored and linked as a download button on your profile page.
              </p>
              <FileUpload
                profileId={profileId}
                currentUrl={links.cv}
                onUploaded={(url) => { updateLinks("cv", url); updateLinks("cvVisible", true); }}
                label=""
                accept=".pdf,application/pdf"
              />
              {links.cv && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> CV uploaded — visitors can download it from your profile.
                </p>
              )}
            </div>
          )}
        </div>

        {isEditMode && (
          <div className="border-2 rounded-lg p-5 space-y-4" style={{ borderColor: '#FA520F', backgroundColor: '#FA520F0D' }}>
            <div className="flex items-start gap-3">
              <FileUp size={20} className="mt-0.5 shrink-0" style={{ color: '#FA520F' }} />
              <div>
                <h3 className="font-semibold text-sm">
                  Re-parse CV with AI
                  <HelpTip text="Upload a new CV to overwrite your profile data using AI extraction. This will replace your existing profile info with the parsed data." />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a new PDF to overwrite your profile entries
                </p>
              </div>
            </div>

            <input
              ref={editCvInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setEditCvFile?.(file);
              }}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => editCvInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#FA520F' }}
              >
                <Upload size={14} />
                {editCvFile ? "Change PDF" : "Choose PDF"}
              </button>
              {editCvFile && (
                <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {editCvFile.name}
                </span>
              )}
              {editCvFile && (
                <button
                  type="button"
                  onClick={() => {
                    setEditCvFile?.(null);
                    if (editCvInputRef.current) editCvInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {editCvFile && (
              <Button
                type="button"
                onClick={onReparseCV}
                disabled={reparsingCv}
                className="w-full"
              >
                {reparsingCv ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" />Analyzing CV...</>
                ) : (
                  <><FileUp size={16} className="mr-2" />Re-parse & Overwrite Profile</>
                )}
              </Button>
            )}

            {reparseSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                Profile data updated from CV! Review below and save when ready.
              </div>
            )}
          </div>
        )}

        <div>
          <Label>LinkedIn <HelpTip text="Your main LinkedIn profile URL." /></Label>
          <Input
            value={links.linkedIn || ""}
            onChange={(e) =>
              updateLinks("linkedIn", e.target.value || undefined)
            }
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div>
          <Label>GitHub</Label>
          <Input
            value={links.github || ""}
            onChange={(e) =>
              updateLinks("github", e.target.value || undefined)
            }
            placeholder="https://github.com/..."
          />
        </div>

        <div>
          <Label>Instagram</Label>
          <Input
            value={links.instagram || ""}
            onChange={(e) =>
              updateLinks("instagram", e.target.value || undefined)
            }
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <Label>Projects LinkedIn <HelpTip text="Link to your LinkedIn projects section for a direct 'see all projects' shortcut." /></Label>
          <Input
            value={links.projectsLinkedIn || ""}
            onChange={(e) =>
              updateLinks("projectsLinkedIn", e.target.value || undefined)
            }
            placeholder="https://linkedin.com/in/.../details/projects/"
          />
        </div>
      </div>

      {/* Review summary */}
      <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50 space-y-3">
        <h3 className="text-lg font-semibold">Profile Summary</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Name:</span>
          <span>{profile.name || "—"}</span>
          <span className="text-muted-foreground">Headline:</span>
          <span>{profile.headline || "—"}</span>
          <span className="text-muted-foreground">Skills:</span>
          <span>{profile.about.skills.join(", ") || "—"}</span>
          <span className="text-muted-foreground">Projects:</span>
          <span>{profile.portfolio.projects.length}</span>
          <span className="text-muted-foreground">Work Experience:</span>
          <span>{profile.portfolio.workExperience.length}</span>
          <span className="text-muted-foreground">Talks & Awards:</span>
          <span>{profile.portfolio.talksAndAwards.length}</span>
        </div>
      </div>
    </div>
  );
}

export default CreateProfile;
