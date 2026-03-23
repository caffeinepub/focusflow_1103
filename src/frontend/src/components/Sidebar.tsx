import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type UserProfile, UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUpdateProfile } from "../hooks/useQueries";

interface Props {
  userProfile: UserProfile;
  activeView: string;
  setActiveView: (
    v: "dashboard" | "projects" | "tasks" | "team" | "settings",
  ) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const roleLabels: Record<string, string> = {
  [UserRole.manager]: "Manager",
  [UserRole.team_leader]: "Team Leader",
  [UserRole.team_member]: "Team Member",
  [UserRole.intern]: "Intern",
};

const roleColors: Record<string, string> = {
  [UserRole.manager]: "oklch(0.73 0.22 155)",
  [UserRole.team_leader]: "oklch(0.55 0.22 260)",
  [UserRole.team_member]: "oklch(0.65 0.18 195)",
  [UserRole.intern]: "oklch(0.68 0.14 65)",
};

export default function Sidebar({
  userProfile,
  activeView,
  setActiveView,
}: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.displayName);
  const [editBio, setEditBio] = useState(userProfile.bio);
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const roleColor =
    roleColors[userProfile.role || ""] || "oklch(0.73 0.22 155)";

  const handleSaveProfile = async () => {
    const initials = editName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    try {
      await updateProfile.mutateAsync({
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarInitials: initials,
      });
      toast.success("Profile updated!");
      setProfileOpen(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "oklch(var(--sidebar))" }}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.73 0.22 155)" }}
          >
            <Zap className="w-4 h-4 text-background" fill="currentColor" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            FocusFlow
          </span>
        </div>
      </div>

      {/* Profile block */}
      <div className="px-4 py-4 border-b border-border/60">
        <button
          type="button"
          data-ocid="sidebar.toggle"
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors text-left"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: `${roleColor}33`,
              color: roleColor,
              border: `1px solid ${roleColor}55`,
            }}
          >
            {userProfile.avatarInitials ||
              userProfile.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {userProfile.displayName}
            </div>
            <div
              className="text-xs font-medium truncate"
              style={{ color: roleColor }}
            >
              {roleLabels[userProfile.role || ""] || "User"}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              data-ocid="sidebar.panel"
            >
              <div className="pt-3 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Display Name
                  </Label>
                  <Input
                    data-ocid="sidebar.input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 text-sm bg-secondary/40 border-border rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Bio / Title
                  </Label>
                  <Textarea
                    data-ocid="sidebar.textarea"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="text-sm bg-secondary/40 border-border rounded-lg resize-none"
                    rows={2}
                  />
                </div>
                <Button
                  data-ocid="sidebar.save_button"
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                  className="w-full h-8 bg-primary text-primary-foreground text-xs rounded-lg"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" data-ocid="sidebar.panel">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            data-ocid={`nav.${id}.link`}
            onClick={() =>
              setActiveView(
                id as "dashboard" | "projects" | "tasks" | "team" | "settings",
              )
            }
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeView === id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border/60 space-y-1">
        <button
          type="button"
          data-ocid="sidebar.delete_button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
        <p className="text-center text-xs text-muted-foreground/60 pt-2">
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
