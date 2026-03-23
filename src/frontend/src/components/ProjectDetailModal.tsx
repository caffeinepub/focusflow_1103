import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Calendar, Edit2 } from "lucide-react";
import { type Project, UserRole } from "../backend";
import { useGetProjectProgress } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  userRole?: UserRole;
  onEdit: () => void;
  gradientClass: string;
}

function formatDate(time: bigint) {
  return new Date(Number(time / 1_000_000n)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectDetailModal({
  open,
  onClose,
  project,
  userRole,
  onEdit,
  gradientClass,
}: Props) {
  const { data: progress } = useGetProjectProgress(project?.id ?? 0n);
  const completed = progress ? Number(progress[0]) : 0;
  const total = progress ? Number(progress[1]) : 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const canEdit =
    userRole === UserRole.manager || userRole === UserRole.team_leader;

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border rounded-2xl shadow-modal max-w-lg p-0 overflow-hidden"
        data-ocid="project_detail.modal"
      >
        <div className={`h-32 ${gradientClass}`} />
        <div className="p-6 space-y-5">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl font-bold text-foreground">
                {project.title}
              </DialogTitle>
              {canEdit && (
                <Button
                  data-ocid="project_detail.edit_button"
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="border-border rounded-lg flex-shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          {project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Due {formatDate(project.completionDate)}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">Progress</span>
              <span className="text-muted-foreground">
                {completed}/{total} tasks complete
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground">{pct}% complete</p>
          </div>

          <Button
            data-ocid="project_detail.close_button"
            variant="outline"
            onClick={onClose}
            className="w-full border-border rounded-xl"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
