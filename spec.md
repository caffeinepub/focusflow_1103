# FocusFlow

## Current State
- Full role-based app with manager/team_leader/team_member/intern roles
- Projects and tasks with assignment, priority, due date
- Task has a single `assignedTo` field (team member)
- QuickAssignPanel shows users but only shows a toast -- does not actually assign
- Project progress tracked via getProjectProgress (completed tasks / total tasks)
- TaskModal has no assignment fields -- assignedTo is preserved from existing value

## Requested Changes (Diff)

### Add
- `assignedToLeader: ?Principal` field on Task (backend + frontend types)
- Two assignment fields in TaskModal: one for team leader, one for team member
- Quick Assign panel wired to actually perform immediate assignment: clicking a user name assigns them to the selected task (leader or member field based on their role) via updateTask
- Progress bar on each task row showing the project's completion % (completed tasks / total tasks for that project)
- Show assigned leader and member names on task rows

### Modify
- Backend `createTask` signature: add `assignedToLeader: ?Principal` param
- Backend `updateTask` signature: add `assignedToLeader: ?Principal` param
- Backend permission logic: managers can assign both leaders and members; team leaders can assign members and interns only
- `useCreateTask` and `useUpdateTask` hooks to include `assignedToLeader`
- `QuickAssignPanel`: receive `onAssign` callback and `callerRole`, filter users by role, actually invoke updateTask on click
- `Dashboard`: pass `allUsers`, `callerRole`, and task update handler to QuickAssignPanel; show progress bar and assignee names in task rows
- `TaskModal`: add leader dropdown (team_leader users only), member dropdown (team_member/intern users), filtered by caller role permissions

### Remove
- Toast-only behavior in QuickAssignPanel

## Implementation Plan
1. Regenerate Motoko backend with `assignedToLeader` on Task and updated createTask/updateTask signatures
2. Update `backend.d.ts` with new Task shape and method signatures
3. Update `useQueries.ts` hooks for `assignedToLeader`
4. Rewrite `QuickAssignPanel` to accept task, users, callerRole, onAssign; filter users by role; call updateTask on click
5. Rewrite `TaskModal` with leader/member dropdowns filtered by caller role
6. Update `Dashboard` to: compute per-project progress map; show progress bar + assignees in task rows; pass required props to QuickAssignPanel
