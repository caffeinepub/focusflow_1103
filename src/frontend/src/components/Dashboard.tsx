import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { AlertCircle, ListTodo, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Project,
  TaskPriority,
  type TaskResponse,
  type UserProfile,
  UserRole,
} from "../backend";
import {
  useGetAllProjects,
  useGetAllUsers,
  useGetAllUsersWithPrincipals,
  useGetTasks,
  useUpdateTask,
} from "../hooks/useQueries";
import type { UserWithPrincipal } from "../types";
import ProjectCard from "./ProjectCard";
import ProjectDetailModal from "./ProjectDetailModal";
import ProjectModal from "./ProjectModal";
import QuickAssignPanel from "./QuickAssignPanel";
import Sidebar from "./Sidebar";
import TaskModal from "./TaskModal";

interface Props {
  userProfile: UserProfile;
  activeView: "dashboard" | "projects" | "tasks" | "team" | "settings";
  setActiveView: (
    v: "dashboard" | "projects" | "tasks" | "team" | "settings",
  ) => void;
}

const gradients = [
  "gradient-blue-cyan",
  "gradient-purple-pink",
  "gradient-red-purple",
  "gradient-teal-green",
];

function formatDate(time: bigint) {
  return new Date(Number(time / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; color: string; bg: string }
> = {
  [TaskPriority.high]: {
    label: "High",
    color: "oklch(0.61 0.19 25)",
    bg: "oklch(0.61 0.19 25 / 0.15)",
  },
  [TaskPriority.medium]: {
    label: "Medium",
    color: "oklch(0.68 0.14 65)",
    bg: "oklch(0.68 0.14 65 / 0.15)",
  },
  [TaskPriority.low]: {
    label: "Low",
    color: "oklch(0.70 0.19 155)",
    bg: "oklch(0.70 0.19 155 / 0.15)",
  },
};

function findPrincipal(
  displayName: string,
  usersWithPrincipals: UserWithPrincipal[],
): Principal | null {
  const found = usersWithPrincipals.find(
    (u) => u.profile.displayName === displayName,
  );
  return found ? found.principal : null;
}

function AssigneeChip({ profile }: { profile: UserProfile }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: "oklch(0.55 0.22 260 / 0.13)",
        color: "oklch(0.75 0.18 260)",
        border: "1px solid oklch(0.55 0.22 260 / 0.25)",
      }}
    >
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
        style={{ background: "oklch(0.55 0.22 260 / 0.3)" }}
      >
        {profile.avatarInitials ||
          profile.displayName.slice(0, 2).toUpperCase()}
      </span>
      <span className="truncate max-w-[60px]">{profile.displayName}</span>
    </span>
  );
}

export default function Dashboard({
  userProfile,
  activeView,
  setActiveView,
}: Props) {
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskResponse | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [quickAssignUser, setQuickAssignUser] = useState<{
    principal: Principal;
    profile: UserProfile;
    fieldType: "leader" | "member";
  } | null>(null);

  const { data: projects = [], isLoading: projectsLoading } =
    useGetAllProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasks();
  const { data: allUsers = [] } = useGetAllUsers();
  const { data: allUsersWithPrincipals = [] } = useGetAllUsersWithPrincipals();
  const updateTask = useUpdateTask();

  const isManager = userProfile.role === UserRole.manager;
  const isTeamLeader = userProfile.role === UserRole.team_leader;
  const isReadOnly = userProfile.role === UserRole.intern;
  const canToggleTask = !isReadOnly;
  const canAddTask = isManager || isTeamLeader;
  const showQuickAssign = isManager || isTeamLeader;

  // Compute project progress client-side
  const projectProgressMap = tasks.reduce(
    (acc, task) => {
      const key = task.projectId.toString();
      if (!acc[key]) acc[key] = { completed: 0, total: 0 };
      acc[key].total++;
      if (task.completed) acc[key].completed++;
      return acc;
    },
    {} as Record<string, { completed: number; total: number }>,
  );

  const handleToggleTask = async (task: TaskResponse) => {
    if (!canToggleTask) return;
    const assignedToPrincipal = task.assignedTo
      ? findPrincipal(task.assignedTo.displayName, allUsersWithPrincipals)
      : null;
    const assignedToLeaderPrincipal = task.assignedToLeader
      ? findPrincipal(task.assignedToLeader.displayName, allUsersWithPrincipals)
      : null;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: task.title,
        priority: task.priority,
        assignedTo: assignedToPrincipal,
        assignedToLeader: assignedToLeaderPrincipal,
        dueDate: task.dueDate,
        completed: !task.completed,
      });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleQuickAssign = (
    user: UserWithPrincipal,
    fieldType: "leader" | "member",
  ) => {
    if (!selectedTask) return;
    setQuickAssignUser({
      principal: user.principal,
      profile: user.profile,
      fieldType,
    });
    setEditTask(selectedTask);
    setTaskModalOpen(true);
  };

  const roleLabels: Record<string, string> = {
    [UserRole.manager]: "Manager",
    [UserRole.team_leader]: "Team Leader",
    [UserRole.team_member]: "Team Member",
    [UserRole.intern]: "Intern",
  };

  const displayedProjects =
    activeView === "projects" ? projects : projects.slice(0, 6);
  const displayedTasks = activeView === "tasks" ? tasks : tasks.slice(0, 10);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userProfile={userProfile}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-bold text-foreground mb-1.5">
              Welcome back, {userProfile.displayName.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground text-base">
              {roleLabels[userProfile.role || ""] || "User"} · Manage your
              projects and tasks
            </p>
          </motion.div>

          {/* Projects Section */}
          {(activeView === "dashboard" || activeView === "projects") && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-foreground">
                  Your Projects
                </h2>
                <div className="flex items-center gap-3">
                  {isManager && (
                    <Button
                      data-ocid="projects.primary_button"
                      onClick={() => {
                        setEditProject(null);
                        setProjectModalOpen(true);
                      }}
                      className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add Project
                    </Button>
                  )}
                </div>
              </div>

              {projectsLoading ? (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  data-ocid="projects.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-2xl" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 card-surface rounded-2xl"
                  data-ocid="projects.empty_state"
                >
                  <FolderEmpty className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No projects yet
                  </p>
                  {isManager && (
                    <Button
                      onClick={() => setProjectModalOpen(true)}
                      className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Create first project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedProjects.map((project, i) => (
                    <motion.div
                      key={project.id.toString()}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <ProjectCard
                        project={project}
                        gradientClass={gradients[i % gradients.length]}
                        index={i + 1}
                        onClick={() => setDetailProject(project)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Tasks Section */}
          {(activeView === "dashboard" || activeView === "tasks") && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Upcoming Tasks
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Track and manage your work
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {canAddTask && (
                    <Button
                      data-ocid="tasks.primary_button"
                      onClick={() => {
                        setEditTask(null);
                        setTaskModalOpen(true);
                      }}
                      className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add Task
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-5">
                {/* Tasks table */}
                <div className="flex-1 min-w-0">
                  <div className="card-surface rounded-2xl overflow-hidden shadow-card">
                    {tasksLoading ? (
                      <div
                        className="p-5 space-y-3"
                        data-ocid="tasks.loading_state"
                      >
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 rounded-xl" />
                        ))}
                      </div>
                    ) : tasks.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center py-16"
                        data-ocid="tasks.empty_state"
                      >
                        <ListTodo className="w-10 h-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground text-sm">
                          No tasks yet
                        </p>
                        {canAddTask && (
                          <Button
                            onClick={() => setTaskModalOpen(true)}
                            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Create first task
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Table header */}
                        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <div className="w-5" />
                          <div>Title / Progress</div>
                          <div className="hidden lg:block w-32">Assignees</div>
                          <div className="hidden sm:block w-20">Priority</div>
                          <div className="hidden md:block w-20">Due</div>
                          {canAddTask && <div className="w-8" />}
                        </div>
                        {displayedTasks.map((task, i) => {
                          const pCfg = priorityConfig[task.priority];
                          const isSelected = selectedTask?.id === task.id;
                          const progress =
                            projectProgressMap[task.projectId.toString()];
                          const progressPct = progress
                            ? Math.round(
                                (progress.completed / progress.total) * 100,
                              )
                            : 0;

                          return (
                            <button
                              type="button"
                              key={task.id.toString()}
                              data-ocid={`tasks.item.${i + 1}`}
                              onClick={() =>
                                setSelectedTask(isSelected ? null : task)
                              }
                              className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-5 py-3 border-b border-border/60 last:border-0 w-full text-left cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/5"
                                  : "hover:bg-accent/30"
                              } ${task.completed ? "opacity-60" : ""}`}
                            >
                              <Checkbox
                                data-ocid={`tasks.checkbox.${i + 1}`}
                                checked={task.completed}
                                disabled={!canToggleTask}
                                onCheckedChange={() => handleToggleTask(task)}
                                onClick={(e) => e.stopPropagation()}
                                className="border-border"
                              />

                              {/* Title + progress */}
                              <div className="min-w-0">
                                <span
                                  className={`text-sm font-medium block truncate ${
                                    task.completed
                                      ? "line-through text-muted-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {progress && progress.total > 0 && (
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <Progress
                                      value={progressPct}
                                      className="h-1 flex-1 bg-border"
                                    />
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                      {progress.completed}/{progress.total}{" "}
                                      subtasks
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Assignee chips */}
                              <div className="hidden lg:flex flex-col gap-1 w-32">
                                {task.assignedToLeader ? (
                                  <AssigneeChip
                                    profile={task.assignedToLeader}
                                  />
                                ) : null}
                                {task.assignedTo ? (
                                  <AssigneeChip profile={task.assignedTo} />
                                ) : null}
                                {!task.assignedToLeader && !task.assignedTo && (
                                  <span className="text-xs text-muted-foreground">
                                    Unassigned
                                  </span>
                                )}
                              </div>

                              <span
                                className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-20 justify-center"
                                style={{
                                  color: pCfg.color,
                                  background: pCfg.bg,
                                }}
                              >
                                {pCfg.label}
                              </span>
                              <span className="hidden md:block text-xs text-muted-foreground w-20">
                                {formatDate(task.dueDate)}
                              </span>
                              {canAddTask && (
                                <button
                                  type="button"
                                  data-ocid={`tasks.edit_button.${i + 1}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickAssignUser(null);
                                    setEditTask(task);
                                    setTaskModalOpen(true);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <EditIcon />
                                </button>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Assign Panel */}
                {showQuickAssign && (
                  <div className="w-64 flex-shrink-0">
                    <QuickAssignPanel
                      users={allUsersWithPrincipals}
                      selectedTask={selectedTask}
                      callerRole={userProfile.role || UserRole.intern}
                      onAssignUser={handleQuickAssign}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Team View */}
          {activeView === "team" && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-5">
                Team Members
              </h2>
              {allUsers.length === 0 ? (
                <div
                  className="card-surface rounded-2xl flex flex-col items-center justify-center py-16"
                  data-ocid="team.empty_state"
                >
                  <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No team members registered yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allUsers.map((user, i) => (
                    <div
                      key={user.displayName}
                      data-ocid={`team.item.${i + 1}`}
                      className="card-surface rounded-2xl p-5 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {user.avatarInitials ||
                          user.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {user.displayName}
                        </p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.bio}
                          </p>
                        )}
                        {user.role && (
                          <span className="text-xs font-medium text-primary capitalize">
                            {user.role.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Settings View */}
          {activeView === "settings" && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-5">
                Settings
              </h2>
              <div className="card-surface rounded-2xl p-6 max-w-md">
                <p className="text-sm text-muted-foreground">
                  Update your profile from the sidebar profile panel. More
                  settings coming soon.
                </p>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditProject(null);
        }}
        project={editProject}
        userRole={userProfile.role}
        allUsers={allUsers}
      />

      <ProjectDetailModal
        open={!!detailProject}
        onClose={() => setDetailProject(null)}
        project={detailProject}
        userRole={userProfile.role}
        gradientClass={
          detailProject
            ? gradients[projects.indexOf(detailProject) % gradients.length]
            : gradients[0]
        }
        onEdit={() => {
          setEditProject(detailProject);
          setDetailProject(null);
          setProjectModalOpen(true);
        }}
      />

      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditTask(null);
          setQuickAssignUser(null);
        }}
        task={editTask}
        projects={projects}
        callerRole={userProfile.role}
        allUsersWithPrincipals={allUsersWithPrincipals}
        quickAssignUser={quickAssignUser}
      />
    </div>
  );
}

function FolderEmpty({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Empty folder"
      role="img"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <title>Empty folder</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      aria-label="Edit"
      role="img"
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <title>Edit</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}
