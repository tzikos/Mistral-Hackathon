import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Loader2, MessageCircle, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";

interface ProfileCard {
  id: string;
  name: string;
  headline: string;
  badge: string;
  avatar: string | null;
  voice_id: string | null;
  skills: string[];
  score: number;
}

const SUGGESTIONS = [
  "machine learning engineer",
  "full stack developer",
  "data scientist",
  "product designer",
  "devops",
  "mobile developer",
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : (parts[0] || "?").slice(0, 2);
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/40 to-primary/20 rounded-full text-white font-semibold text-lg select-none">
      {letters.toUpperCase()}
    </div>
  );
}

function ProfileCardComponent({
  card,
  onClick,
}: {
  card: ProfileCard;
  onClick: () => void;
}) {
  const badgeParts = card.badge
    ? card.badge.split(/\s*[-–]\s*/).filter(Boolean)
    : [];

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white/4 hover:bg-white/8 border border-white/10 hover:border-primary/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/10 group-hover:ring-primary/30 transition-all">
          {card.avatar ? (
            <img
              src={card.avatar}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Initials name={card.name} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white text-base leading-tight truncate group-hover:text-primary transition-colors">
              {card.name}
            </h3>
            {card.voice_id && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-emerald-400 border border-emerald-400/30 rounded-full px-2 py-0.5">
                <MessageCircle size={10} />
                Voice
              </span>
            )}
          </div>
          {card.headline && (
            <p className="text-sm text-gray-400 mt-0.5 leading-snug line-clamp-2">
              {card.headline}
            </p>
          )}

          {/* Badge chips */}
          {badgeParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {badgeParts.map((b) => (
                <span
                  key={b}
                  className="text-[10px] font-medium bg-primary/15 text-primary border border-primary/20 rounded-full px-2 py-0.5"
                >
                  {b.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Skills */}
          {card.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {card.skills.map((s) => (
                <span
                  key={s}
                  className="text-[10px] text-gray-400 bg-white/5 border border-white/10 rounded-full px-2 py-0.5"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, profileId, logout, isLoading: authLoading } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        apiUrl(`/profiles/search?q=${encodeURIComponent(q.trim())}`)
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setSearched(true);
      }
    } catch {
      // silent fail — keep previous results
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Auto-focus search on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSuggestion = (s: string) => {
    setQuery(s);
    runSearch(s);
  };

  const hasResults = results.length > 0;
  const showEmpty = searched && !searching && !hasResults;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/6">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <span className="font-semibold text-white tracking-tight">Talently</span>
        </div>

        <div className="flex items-center gap-3">
          {!authLoading && (
            isAuthenticated && profileId ? (
              <>
                <button
                  onClick={() => navigate(`/${profileId}`)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/8"
                >
                  <User size={15} />
                  My Profile
                </button>
                <button
                  onClick={() => { logout(); }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/create")}
                  className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition"
                >
                  Create Profile
                </button>
              </>
            )
          )}
        </div>
      </header>

      {/* Hero + search */}
      <div className="flex flex-col items-center px-4 pt-20 pb-10">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Find the right{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              talent
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
            Search by skills, role, experience, or anything else across all profiles
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full max-w-2xl relative">
          <div className="relative flex items-center">
            <Search
              size={18}
              className="absolute left-4 text-gray-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
              placeholder="e.g. Python, machine learning, full stack..."
              className="w-full bg-white/8 border border-white/15 focus:border-primary/60 text-white placeholder-gray-500 rounded-2xl pl-11 pr-12 py-4 text-sm outline-none transition-all duration-200 focus:bg-white/10 focus:shadow-lg focus:shadow-primary/10"
            />
            {searching ? (
              <Loader2
                size={16}
                className="absolute right-4 text-gray-400 animate-spin"
              />
            ) : query ? (
              <button
                onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
                className="absolute right-4 text-gray-500 hover:text-gray-300 transition text-lg leading-none"
              >
                ×
              </button>
            ) : null}
          </div>

          {/* Suggestion chips — shown only when no query */}
          {!query && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs text-gray-400 border border-white/10 hover:border-primary/40 hover:text-primary rounded-full px-3 py-1.5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-16">
        {hasResults && (
          <>
            <p className="text-xs text-gray-500 mb-4 text-center">
              {results.length} profile{results.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((card) => (
                <ProfileCardComponent
                  key={card.id}
                  card={card}
                  onClick={() => navigate(`/${card.id}`)}
                />
              ))}
            </div>
          </>
        )}

        {showEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Search size={36} className="text-gray-700" />
            <p className="text-gray-400 text-sm">
              No profiles found for <strong className="text-gray-300">"{query}"</strong>
            </p>
            <p className="text-gray-600 text-xs">
              Try different keywords or a broader search
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
