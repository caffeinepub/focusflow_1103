import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Crown, Loader2, UserCheck, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type UserProfile, UserRole } from "../backend";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface Props {
  existingProfile: UserProfile | null;
}

const roles = [
  {
    id: UserRole.manager,
    label: "Manager",
    desc: "Full CRUD, assign projects & tasks",
    icon: Crown,
    color: "oklch(0.73 0.22 155)",
  },
  {
    id: UserRole.team_leader,
    label: "Team Leader",
    desc: "Manage tasks in assigned projects",
    icon: Users,
    color: "oklch(0.55 0.22 260)",
  },
  {
    id: UserRole.team_member,
    label: "Team Member",
    desc: "Complete assigned tasks",
    icon: UserCheck,
    color: "oklch(0.65 0.18 195)",
  },
  {
    id: UserRole.intern,
    label: "Intern",
    desc: "Read-only access",
    icon: BookOpen,
    color: "oklch(0.68 0.14 65)",
  },
];

export default function RoleSelectionScreen({ existingProfile }: Props) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState(
    existingProfile?.displayName || "",
  );
  const [bio, setBio] = useState(existingProfile?.bio || "");
  const [step, setStep] = useState<"role" | "profile">("role");

  const saveProfileMutation = useSaveCallerUserProfile();

  const handleContinue = () => {
    if (!selectedRole) return;
    setStep("profile");
  };

  const handleComplete = async () => {
    if (!selectedRole || !displayName.trim()) return;
    const initials = displayName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    try {
      // Save full profile including the selected role in one call
      await saveProfileMutation.mutateAsync({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarInitials: initials,
        role: selectedRole,
      });
      toast.success("Profile set up successfully!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const isPending = saveProfileMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.73 0.22 155)" }}
            >
              <Zap className="w-4 h-4 text-background" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-foreground">FocusFlow</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {step === "role" ? "Choose your role" : "Set up your profile"}
          </h1>
          <p className="text-muted-foreground">
            {step === "role"
              ? "This determines your access and permissions"
              : "Tell us a bit about yourself"}
          </p>
        </div>

        <div className="card-surface rounded-2xl p-6 shadow-modal">
          {step === "role" ? (
            <div className="space-y-3" data-ocid="role_selection.panel">
              {roles.map(({ id, label, desc, icon: Icon, color }, i) => (
                <motion.button
                  type="button"
                  key={id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  data-ocid={`role_selection.item.${i + 1}`}
                  onClick={() => setSelectedRole(id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    selectedRole === id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/30 hover:bg-secondary/60"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{label}</div>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                  </div>
                  {selectedRole === id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              ))}
              <Button
                data-ocid="role_selection.submit_button"
                onClick={handleContinue}
                disabled={!selectedRole}
                className="w-full h-11 mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold"
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4" data-ocid="profile_setup.panel">
              <div className="space-y-2">
                <Label
                  htmlFor="displayName"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name *
                </Label>
                <Input
                  id="displayName"
                  data-ocid="profile_setup.input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="bio"
                  className="text-sm font-medium text-foreground"
                >
                  Bio / Title
                </Label>
                <Textarea
                  id="bio"
                  data-ocid="profile_setup.textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  data-ocid="profile_setup.cancel_button"
                  variant="outline"
                  onClick={() => setStep("role")}
                  className="flex-1 h-11 rounded-xl border-border"
                >
                  Back
                </Button>
                <Button
                  data-ocid="profile_setup.submit_button"
                  onClick={handleComplete}
                  disabled={!displayName.trim() || isPending}
                  className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
