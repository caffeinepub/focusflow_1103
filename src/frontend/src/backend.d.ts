import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Project {
    id: bigint;
    title: string;
    completionDate: Time;
    assignedTo?: Principal;
    owner: Principal;
    description: string;
}
export interface UserProfile {
    bio: string;
    displayName: string;
    avatarInitials: string;
    role?: UserRole;
}
export interface UserWithPrincipal {
    principal: Principal;
    profile: UserProfile;
}
export interface TaskResponse {
    id: bigint;
    title: string;
    assignedToLeader?: UserProfile;
    assignedTo?: UserProfile;
    owner: UserProfile;
    completed: boolean;
    dueDate: Time;
    projectId: bigint;
    priority: TaskPriority;
}
export enum TaskPriority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum UserRole {
    manager = "manager",
    team_leader = "team_leader",
    intern = "intern",
    team_member = "team_member"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createProject(title: string, description: string, completionDate: Time, assignedTo: Principal | null): Promise<bigint>;
    createTask(title: string, priority: TaskPriority, projectId: bigint, assignedTo: Principal | null, assignedToLeader: Principal | null, dueDate: Time): Promise<void>;
    getAllProjects(): Promise<Array<Project>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAllUsersWithPrincipals(): Promise<Array<UserWithPrincipal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getProjectProgress(projectId: bigint): Promise<[bigint, bigint]>;
    getTasks(): Promise<Array<TaskResponse>>;
    getUser(user: Principal): Promise<UserProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setUserRole(role: UserRole): Promise<void>;
    updateProfile(displayName: string, bio: string, avatarInitials: string): Promise<void>;
    updateProject(id: bigint, title: string, description: string, completionDate: Time, assignedTo: Principal | null): Promise<void>;
    updateTask(id: bigint, title: string, priority: TaskPriority, assignedTo: Principal | null, assignedToLeader: Principal | null, dueDate: Time, completed: boolean): Promise<void>;
}
