import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Project,
  TaskPriority,
  TaskResponse,
  UserProfile,
  UserRole,
} from "../backend";
import type { UserWithPrincipal } from "../types";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetAllProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<TaskResponse[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUsersWithPrincipals() {
  const { actor, isFetching } = useActor();
  return useQuery<UserWithPrincipal[]>({
    queryKey: ["allUsersWithPrincipals"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (actor as any).getAllUsersWithPrincipals;
      if (typeof fn === "function") {
        return fn.call(actor) as Promise<UserWithPrincipal[]>;
      }
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProjectProgress(projectId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, bigint]>({
    queryKey: ["projectProgress", projectId.toString()],
    queryFn: async () => {
      if (!actor) return [0n, 0n];
      return actor.getProjectProgress(projectId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetUserRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (role: UserRole) => {
      if (!actor) throw new Error("Not connected");
      return actor.setUserRole(role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      displayName: string;
      bio: string;
      avatarInitials: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProfile(
        params.displayName,
        params.bio,
        params.avatarInitials,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      completionDate: bigint;
      assignedTo: Principal | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createProject(
        params.title,
        params.description,
        params.completionDate,
        params.assignedTo,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      title: string;
      description: string;
      completionDate: bigint;
      assignedTo: Principal | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProject(
        params.id,
        params.title,
        params.description,
        params.completionDate,
        params.assignedTo,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      priority: TaskPriority;
      projectId: bigint;
      assignedTo: Principal | null;
      assignedToLeader: Principal | null;
      dueDate: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTask(
        params.title,
        params.priority,
        params.projectId,
        params.assignedTo,
        params.assignedToLeader,
        params.dueDate,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      title: string;
      priority: TaskPriority;
      assignedTo: Principal | null;
      assignedToLeader: Principal | null;
      dueDate: bigint;
      completed: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTask(
        params.id,
        params.title,
        params.priority,
        params.assignedTo,
        params.assignedToLeader,
        params.dueDate,
        params.completed,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
