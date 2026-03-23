import { UserPlus } from "lucide-react";
import type { TaskResponse, UserProfile, UserRole } from "../backend";
import { UserRole as UserRoleEnum } from "../backend";
import type { UserWithPrincipal } from "../types";

interface Props {
  users: UserWithPrincipal[];
  selectedTask: TaskResponse | null;
  callerRole: UserRole;
  onAssignUser: (
    user: UserWithPrincipal,
    fieldType: "leader" | "member",
  ) => void;
}

function UserAvatar({ profile }: { profile: UserProfile }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{
        background: "oklch(0.55 0.22 260 / 0.13)",
        color: "oklch(0.55 0.22 260)",
        border: "1px solid oklch(0.55 0.22 260 / 0.27)",
      }}
    >
      {profile.avatarInitials || profile.displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function QuickAssignPanel({
  users,
  selectedTask,
  callerRole,
  onAssignUser,
}: Props) {
  const isManager = callerRole === UserRoleEnum.manager;

  const leaderUsers = isManager
    ? users.filter((u) => u.profile.role === UserRoleEnum.team_leader)
    : [];

  const memberUsers = users.filter(
    (u) =>
      u.profile.role === UserRoleEnum.team_member ||
      u.profile.role === UserRoleEnum.intern,
  );

  const hasUsers = leaderUsers.length > 0 || memberUsers.length > 0;

  return (
    <div
      className="card-surface rounded-2xl p-5 shadow-card"
      data-ocid="quick_assign.panel"
    >
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Quick Assign</h3>
      </div>

      {selectedTask ? (
        <div className="mb-4 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">Assigning to:</p>
          <p className="text-xs font-medium text-primary truncate">
            {selectedTask.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click a name to assign instantly
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-4 px-1">
          Select a task to assign
        </p>
      )}

      {!hasUsers && (
        <p
          className="text-xs text-muted-foreground text-center py-4"
          data-ocid="quick_assign.empty_state"
        >
          No team members yet
        </p>
      )}

      {/* Leaders section - managers only */}
      {isManager && leaderUsers.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Leaders
          </p>
          <div className="space-y-1">
            {leaderUsers.map((user) => (
              <button
                type="button"
                key={user.principal.toString()}
                data-ocid="quick_assign.button"
                onClick={() => onAssignUser(user, "leader")}
                disabled={!selectedTask}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
              >
                <UserAvatar profile={user.profile} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.profile.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">Team Leader</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Members section */}
      {memberUsers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Members
          </p>
          <div className="space-y-1">
            {memberUsers.map((user) => (
              <button
                type="button"
                key={user.principal.toString()}
                data-ocid="quick_assign.button"
                onClick={() => onAssignUser(user, "member")}
                disabled={!selectedTask}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
              >
                <UserAvatar profile={user.profile} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.profile.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.profile.role?.replace("_", " ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
