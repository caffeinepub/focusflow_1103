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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project, UserProfile, UserRole } from "../backend";
import { useCreateProject, useUpdateProject } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  userRole?: UserRole;
  allUsers: UserProfile[];
}

export default function ProjectModal({
  open,
  onClose,
  project,
  userRole: _userRole,
  allUsers: _allUsers,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isPending = createProject.isPending || updateProject.isPending;

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      const d = new Date(Number(project.completionDate / 1_000_000n));
      setCompletionDate(d.toISOString().split("T")[0]);
    } else {
      setTitle("");
      setDescription("");
      setCompletionDate("");
    }
  }, [project]);

  const handleSubmit = async () => {
    if (!title.trim() || !completionDate) return;
    const dateMs = new Date(completionDate).getTime();
    const dateNs = BigInt(dateMs) * 1_000_000n;
    try {
      if (project) {
        await updateProject.mutateAsync({
          id: project.id,
          title: title.trim(),
          description: description.trim(),
          completionDate: dateNs,
          assignedTo: null,
        });
        toast.success("Project updated!");
      } else {
        await createProject.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          completionDate: dateNs,
          assignedTo: null,
        });
        toast.success("Project created!");
      }
      onClose();
    } catch {
      toast.error("Failed to save project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border rounded-2xl shadow-modal max-w-md"
        data-ocid="project.modal"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {project ? "Edit Project" : "Add Project"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Title *</Label>
            <Input
              data-ocid="project.input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Description</Label>
            <Textarea
              data-ocid="project.textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Completion Date *</Label>
            <Input
              data-ocid="project.input"
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="bg-secondary/40 border-border text-foreground rounded-xl"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="project.cancel_button"
            variant="outline"
            onClick={onClose}
            className="border-border rounded-xl"
          >
            Cancel
          </Button>
          <Button
            data-ocid="project.submit_button"
            onClick={handleSubmit}
            disabled={!title.trim() || !completionDate || isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : project ? (
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
