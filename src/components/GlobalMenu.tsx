import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Sun, Moon, Pencil, LogOut, LogIn } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

interface GlobalMenuProps {
  /** Show "Edit Profile" option */
  showEditProfile?: boolean;
  /** Path to navigate to when Edit Profile is clicked */
  editProfilePath?: string;
}

const GlobalMenu: React.FC<GlobalMenuProps> = ({
  showEditProfile = false,
  editProfilePath,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open menu"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-[100]">
          {/* Theme toggle */}
          <button
            onClick={() => { toggleTheme(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {/* Edit Profile — only for own profile */}
          {showEditProfile && editProfilePath && (
            <>
              <div className="mx-3 my-1 border-t border-gray-100 dark:border-white/10" />
              <button
                onClick={() => { navigate(editProfilePath); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Pencil size={15} />
                Edit Profile
              </button>
            </>
          )}

          {/* Sign In / Sign Out */}
          <div className="mx-3 my-1 border-t border-gray-100 dark:border-white/10" />
          {isAuthenticated ? (
            <button
              onClick={() => { logout(); navigate("/"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          ) : (
            <button
              onClick={() => { navigate("/"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <LogIn size={15} />
              Sign in
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalMenu;
