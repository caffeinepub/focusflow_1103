import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2 } from "lucide-react";
import type { Project } from "../backend";
import { useGetProjectProgress } from "../hooks/useQueries";

interface Props {
  project: Project;
  gradientClass: string;
  onClick: () => void;
  index: number;
}

function formatDate(time: bigint) {
  return new Date(Number(time / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProjectCardInner({ project, gradientClass, onClick, index }: Props) {
  const { data: progress } = useGetProjectProgress(project.id);
  const completed = progress ? Number(progress[0]) : 0;
  const total = progress ? Number(progress[1]) : 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <button
      type="button"
      data-ocid={`projects.item.${index}`}
      onClick={onClick}
      className="card-surface rounded-2xl overflow-hidden shadow-card cursor-pointer hover:border-primary/40 transition-all hover:shadow-modal group w-full text-left"
    >
      {/* Gradient banner */}
      <div className={`h-28 ${gradientClass} relative`}>
        <div className="absolute inset-0 flex items-end p-4">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/30 text-white backdrop-blur-sm">
            Active
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{pct}% Complete</span>
            <span className="text-muted-foreground">
              {completed}/{total} tasks
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(project.completionDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary font-medium">{completed} done</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default ProjectCardInner;
