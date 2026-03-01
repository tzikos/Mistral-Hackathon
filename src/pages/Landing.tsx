import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Loader2, MessageCircle, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import Logo from "@/components/Logo";
import AvatarFallback from "@/components/AvatarFallback";

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
      className="group w-full text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-primary/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-200 group-hover:ring-primary/30 transition-all">
          <AvatarFallback src={card.avatar} name={card.name} textClassName="text-lg" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate group-hover:text-primary transition-colors">
              {card.name}
            </h3>
            {card.voice_id && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5">
                <MessageCircle size={10} />
                Voice
              </span>
            )}
          </div>
          {card.headline && (
            <p className="text-sm text-gray-500 mt-0.5 leading-snug line-clamp-2">
              {card.headline}
            </p>
          )}

          {/* Badge chips */}
          {badgeParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {badgeParts.map((b) => (
                <span
                  key={b}
                  className="text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5"
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
                  className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5"
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
  const [deepSearch, setDeepSearch] = useState(false);
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

  const runDeepSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        apiUrl(`/profiles/deep-search?q=${encodeURIComponent(q.trim())}`)
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

  const activeSearch = deepSearch ? runDeepSearch : runSearch;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => activeSearch(query), deepSearch ? 600 : 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeSearch, deepSearch]);

  // Auto-focus search on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSuggestion = (s: string) => {
    setQuery(s);
    activeSearch(s);
  };

  const hasResults = results.length > 0;
  const showEmpty = searched && !searching && !hasResults;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-gray-200">
        <Logo size="md" />

        <div className="flex items-center gap-3">
          {!authLoading && (
            isAuthenticated && profileId ? (
              <>
                <button
                  onClick={() => navigate(`/${profileId}`)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  <User size={15} />
                  My Profile
                </button>
                <button
                  onClick={() => { logout(); }}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/")}
                  className="text-sm text-gray-500 hover:text-gray-900 transition"
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
          <Logo size="lg" text="FindMe" className="block mb-2" />
          <p className="text-sm text-muted-foreground/70 mb-4">
            An app powered by{" "}
            <span className="font-medium" style={{ color: '#FA520F' }}>Mistral</span>
            {" × "}
            <span className="font-medium text-purple-500">ElevenLabs</span>
          </p>
          <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto">
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
              onKeyDown={(e) => e.key === "Enter" && activeSearch(query)}
              placeholder="e.g. Python, machine learning, full stack..."
              className="w-full bg-white border border-gray-300 focus:border-primary/60 text-gray-900 placeholder-gray-400 rounded-2xl pl-11 pr-12 py-4 text-sm outline-none transition-all duration-200 focus:bg-white focus:shadow-lg focus:shadow-primary/10"
            />
            {searching ? (
              <Loader2
                size={16}
                className="absolute right-4 text-gray-400 animate-spin"
              />
            ) : query ? (
              <button
                onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
                className="absolute right-4 text-gray-400 hover:text-gray-600 transition text-lg leading-none"
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
                  className="text-xs text-gray-500 border border-gray-300 hover:border-primary/40 hover:text-primary rounded-full px-3 py-1.5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Deep Search toggle */}
          <div className="flex justify-center mt-6">
            <div className="flex flex-col items-center gap-2">
              <div className={`deep-search-border ${deepSearch ? "is-active" : ""}`}>
                <button
                  className="deep-search-btn"
                  onClick={() => {
                    setDeepSearch((prev) => !prev);
                    setResults([]);
                    setSearched(false);
                  }}
                >
                  <Sparkles
                    size={17}
                    style={deepSearch ? { animation: "spin 3s linear infinite" } : {}}
                  />
                  Deep Search
                  {deepSearch && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white/90" />
                    </span>
                  )}
                </button>
              </div>
              {deepSearch && (
                <span className="text-[11px] text-violet-400 font-semibold tracking-[0.18em] uppercase animate-fade-in">
                  Semantic AI Search Active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-16">
        {hasResults && (
          <>
            <p className="text-xs text-gray-400 mb-4 text-center flex items-center justify-center gap-1.5">
              {deepSearch && <Sparkles size={11} className="text-violet-400" />}
              {results.length} profile{results.length !== 1 ? "s" : ""} found
              {deepSearch && <span className="text-violet-400">via semantic search</span>}
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
            <Search size={36} className="text-gray-300" />
            <p className="text-gray-500 text-sm">
              No profiles found for <strong className="text-gray-700">"{query}"</strong>
            </p>
            <p className="text-gray-400 text-xs">
              Try different keywords or a broader search
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
