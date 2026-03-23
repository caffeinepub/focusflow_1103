import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Project,
  TaskPriority,
  type TaskResponse,
  type UserProfile,
  UserRole,
} from "../backend";
import { useCreateTask, useUpdateTask } from "../hooks/useQueries";
import type { UserWithPrincipal } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  task?: TaskResponse | null;
  projects: Project[];
  callerRole?: UserRole;
  defaultProjectId?: bigint;
  allUsersWithPrincipals: UserWithPrincipal[];
  quickAssignUser?: {
    principal: Principal;
    profile: UserProfile;
    fieldType: "leader" | "member";
  } | null;
}

function findPrincipalByName(
  displayName: string,
  users: UserWithPrincipal[],
): Principal | null {
  const found = users.find((u) => u.profile.displayName === displayName);
  return found ? found.principal : null;
}

export default function TaskModal({
  open,
  onClose,
  task,
  projects,
  callerRole,
  defaultProjectId,
  allUsersWithPrincipals,
  quickAssignUser,
}: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.medium);
  const [projectId, setProjectId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [assignedToLeaderPrincipal, setAssignedToLeaderPrincipal] =
    useState<string>("none");
  const [assignedToMemberPrincipal, setAssignedToMemberPrincipal] =
    useState<string>("none");

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isPending = createTask.isPending || updateTask.isPending;

  const isManager = callerRole === UserRole.manager;
  const isTeamLeader = callerRole === UserRole.team_leader;

  const leaderUsers = allUsersWithPrincipals.filter(
    (u) => u.profile.role === UserRole.team_leader,
  );
  const memberUsers = allUsersWithPrincipals.filter(
    (u) =>
      u.profile.role === UserRole.team_member ||
      u.profile.role === UserRole.intern,
  );

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setProjectId(task.projectId.toString());
      const d = new Date(Number(task.dueDate / 1_000_000n));
      setDueDate(d.toISOString().split("T")[0]);

      if (task.assignedToLeader) {
        const p = findPrincipalByName(
          task.assignedToLeader.displayName,
          allUsersWithPrincipals,
        );
        setAssignedToLeaderPrincipal(p ? p.toString() : "none");
      } else {
        setAssignedToLeaderPrincipal("none");
      }

      if (task.assignedTo) {
        const p = findPrincipalByName(
          task.assignedTo.displayName,
          allUsersWithPrincipals,
        );
        setAssignedToMemberPrincipal(p ? p.toString() : "none");
      } else {
        setAssignedToMemberPrincipal("none");
      }
    } else {
      setTitle("");
      setPriority(TaskPriority.medium);
      setProjectId(
        defaultProjectId?.toString() || (projects[0]?.id.toString() ?? ""),
      );
      setDueDate("");
      setAssignedToLeaderPrincipal("none");
      setAssignedToMemberPrincipal("none");
    }
  }, [task, defaultProjectId, projects, open, allUsersWithPrincipals]);

  // Apply quick assign user when it changes
  useEffect(() => {
    if (!quickAssignUser || !open) return;
    const principalStr = quickAssignUser.principal.toString();
    if (quickAssignUser.fieldType === "leader") {
      setAssignedToLeaderPrincipal(principalStr);
    } else {
      setAssignedToMemberPrincipal(principalStr);
    }
  }, [quickAssignUser, open]);

  const resolvePrincipal = (str: string): Principal | null => {
    if (str === "none" || !str) return null;
    const found = allUsersWithPrincipals.find(
      (u) => u.principal.toString() === str,
    );
    return found ? found.principal : null;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !dueDate || !projectId) return;
    const dateNs = BigInt(new Date(dueDate).getTime()) * 1_000_000n;
    const assignedTo = resolvePrincipal(assignedToMemberPrincipal);
    const assignedToLeader = isManager
      ? resolvePrincipal(assignedToLeaderPrincipal)
      : null;
    try {
      if (task) {
        await updateTask.mutateAsync({
          id: task.id,
          title: title.trim(),
          priority,
          assignedTo,
          assignedToLeader,
          dueDate: dateNs,
          completed: task.completed,
        });
        toast.success("Task updated!");
      } else {
        await createTask.mutateAsync({
          title: title.trim(),
          priority,
          projectId: BigInt(projectId),
          assignedTo,
          assignedToLeader,
          dueDate: dateNs,
        });
        toast.success("Task created!");
      }
      onClose();
    } catch {
      toast.error("Failed to save task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border rounded-2xl shadow-modal max-w-lg"
        data-ocid="task.modal"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {task ? "Edit Task" : "Add Task"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Title *</Label>
            <Input
              data-ocid="task.input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger
                  data-ocid="task.select"
                  className="bg-secondary/40 border-border text-foreground rounded-xl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value={TaskPriority.high}>High</SelectItem>
                  <SelectItem value={TaskPriority.medium}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.low}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Due Date *</Label>
              <Input
                data-ocid="task.input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-secondary/40 border-border text-foreground rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger
                data-ocid="task.select"
                className="bg-secondary/40 border-border text-foreground rounded-xl"
              >
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {projects.map((p) => (
                  <SelectItem key={p.id.toString()} value={p.id.toString()}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment fields */}
          {isManager && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                Assign Team Leader
              </Label>
              <Select
                value={assignedToLeaderPrincipal}
                onValueChange={setAssignedToLeaderPrincipal}
              >
                <SelectTrigger
                  data-ocid="task.select"
                  className="bg-secondary/40 border-border text-foreground rounded-xl"
                >
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">None</SelectItem>
                  {leaderUsers.map((u) => (
                    <SelectItem
                      key={u.principal.toString()}
                      value={u.principal.toString()}
                    >
                      {u.profile.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(isManager || isTeamLeader) && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Assign Member</Label>
              <Select
                value={assignedToMemberPrincipal}
                onValueChange={setAssignedToMemberPrincipal}
              >
                <SelectTrigger
                  data-ocid="task.select"
                  className="bg-secondary/40 border-border text-foreground rounded-xl"
                >
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">None</SelectItem>
                  {memberUsers.map((u) => (
                    <SelectItem
                      key={u.principal.toString()}
                      value={u.principal.toString()}
                    >
                      {u.profile.displayName}{" "}
                      <span className="text-muted-foreground capitalize text-xs">
                        ({u.profile.role?.replace("_", " ")})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="task.cancel_button"
            variant="outline"
            onClick={onClose}
            className="border-border rounded-xl"
          >
            Cancel
          </Button>
          <Button
            data-ocid="task.submit_button"
            onClick={handleSubmit}
            disabled={!title.trim() || !dueDate || !projectId || isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : task ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
