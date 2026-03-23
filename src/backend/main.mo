import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  type Project = {
    id : Nat;
    title : Text;
    description : Text;
    completionDate : Time.Time;
    assignedTo : ?Principal;
    owner : Principal;
  };

  module Project {
    public func compare(project1 : Project, project2 : Project) : Order.Order {
      Nat.compare(project1.id, project2.id);
    };
  };

  type TaskPriority = {
    #high;
    #medium;
    #low;
  };

  module TaskPriority {
    public func toText(priority : TaskPriority) : Text {
      switch (priority) {
        case (#high) { "High" };
        case (#medium) { "Medium" };
        case (#low) { "Low" };
      };
    };

    public func compare(priority1 : TaskPriority, priority2 : TaskPriority) : Order.Order {
      switch (priority1, priority2) {
        case (#high, #medium) { #less };
        case (#high, #low) { #less };
        case (#medium, #high) { #greater };
        case (#medium, #low) { #less };
        case (#low, #high) { #greater };
        case (#low, #medium) { #greater };
        case (_) { #equal };
      };
    };
  };

  type UserRole = {
    #manager;
    #team_leader;
    #team_member;
    #intern;
  };

  module UserRole {
    public func compare(role1 : UserRole, role2 : UserRole) : Order.Order {
      switch (role1, role2) {
        case (#manager, #team_leader) { #less };
        case (#manager, #team_member) { #less };
        case (#manager, #intern) { #less };
        case (#team_leader, #manager) { #greater };
        case (#team_leader, #team_member) { #less };
        case (#team_leader, #intern) { #less };
        case (#team_member, #manager) { #greater };
        case (#team_member, #team_leader) { #greater };
        case (#team_member, #intern) { #less };
        case (#intern, #manager) { #greater };
        case (#intern, #team_leader) { #greater };
        case (#intern, #team_member) { #greater };
        case (_) { #equal };
      };
    };

    public func toText(role : UserRole) : Text {
      switch (role) {
        case (#manager) { "Manager" };
        case (#team_leader) { "Team Leader" };
        case (#team_member) { "Team Member" };
        case (#intern) { "Intern" };
      };
    };
  };

  type UserProfile = {
    displayName : Text;
    bio : Text;
    role : ?UserRole;
    avatarInitials : Text;
  };

  type UserWithPrincipal = {
    principal : Principal;
    profile : UserProfile;
  };

  type Task = {
    id : Nat;
    title : Text;
    priority : TaskPriority;
    projectId : Nat;
    assignedTo : ?Principal;
    assignedToLeader : ?Principal;
    owner : Principal;
    completed : Bool;
    dueDate : Time.Time;
  };

  type TaskResponse = {
    id : Nat;
    title : Text;
    priority : TaskPriority;
    projectId : Nat;
    assignedTo : ?UserProfile;
    assignedToLeader : ?UserProfile;
    owner : UserProfile;
    completed : Bool;
    dueDate : Time.Time;
  };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Nat.compare(task1.id, task2.id);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let projects = Map.empty<Nat, Project>();
  let tasks = Map.empty<Nat, Task>();

  var nextProjectId = 1;
  var nextTaskId = 1;

  // Authorization system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper: require caller is not anonymous
  private func requireAuthenticated(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be authenticated");
    };
  };

  private func isManager(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.role) {
          case (?#manager) { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  private func isTeamLeader(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.role) {
          case (?#team_leader) { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  private func getCallerRole(caller : Principal) : ?UserRole {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.role };
      case (null) { null };
    };
  };

  private func getUserRole(user : Principal) : ?UserRole {
    switch (userProfiles.get(user)) {
      case (?profile) { profile.role };
      case (null) { null };
    };
  };

  private func toTaskResponse(task : Task) : TaskResponse {
    let owner = switch (userProfiles.get(task.owner)) {
      case (?profile) { profile };
      case (null) { { displayName = ""; bio = ""; role = null; avatarInitials = "" } };
    };
    let assignedToProfile = switch (task.assignedTo) {
      case (?p) { userProfiles.get(p) };
      case (null) { null };
    };
    let assignedToLeaderProfile = switch (task.assignedToLeader) {
      case (?p) { userProfiles.get(p) };
      case (null) { null };
    };
    {
      id = task.id;
      title = task.title;
      priority = task.priority;
      projectId = task.projectId;
      assignedTo = assignedToProfile;
      assignedToLeader = assignedToLeaderProfile;
      owner;
      completed = task.completed;
      dueDate = task.dueDate;
    };
  };

  // Profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuthenticated(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func updateProfile(displayName : Text, bio : Text, avatarInitials : Text) : async () {
    requireAuthenticated(caller);
    let role = switch (userProfiles.get(caller)) {
      case (?existingProfile) { existingProfile.role };
      case (null) { null };
    };
    userProfiles.add(caller, { displayName; bio; role; avatarInitials });
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireAuthenticated(caller);
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuthenticated(caller);
    let existingRole = switch (userProfiles.get(caller)) {
      case (?existingProfile) { existingProfile.role };
      case (null) { null };
    };
    userProfiles.add(caller, {
      displayName = profile.displayName;
      bio = profile.bio;
      role = existingRole;
      avatarInitials = profile.avatarInitials;
    });
  };

  public shared ({ caller }) func setUserRole(role : UserRole) : async () {
    requireAuthenticated(caller);
    let profile = switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        if (existingProfile.role != null) {
          Runtime.trap("Role already set. Cannot change role.");
        };
        existingProfile;
      };
      case (null) { { displayName = ""; bio = ""; role = null; avatarInitials = "" } };
    };
    userProfiles.add(caller, {
      displayName = profile.displayName;
      bio = profile.bio;
      role = ?role;
      avatarInitials = profile.avatarInitials;
    });
  };

  public query ({ caller }) func getUser(user : Principal) : async ?UserProfile {
    requireAuthenticated(caller);
    userProfiles.get(user);
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    requireAuthenticated(caller);
    userProfiles.values().toArray();
  };

  public query ({ caller }) func getAllUsersWithPrincipals() : async [UserWithPrincipal] {
    requireAuthenticated(caller);
    let list = List.empty<UserWithPrincipal>();
    userProfiles.forEach(func(p, profile) {
      list.add({ principal = p; profile });
    });
    list.toArray();
  };

  // Project management
  public shared ({ caller }) func createProject(title : Text, description : Text, completionDate : Time.Time, assignedTo : ?Principal) : async Nat {
    requireAuthenticated(caller);
    if (not isManager(caller)) {
      Runtime.trap("Unauthorized: Only managers can create projects");
    };
    let project : Project = {
      id = nextProjectId; title; description; completionDate; assignedTo; owner = caller;
    };
    projects.add(nextProjectId, project);
    nextProjectId += 1;
    project.id;
  };

  public shared ({ caller }) func updateProject(id : Nat, title : Text, description : Text, completionDate : Time.Time, assignedTo : ?Principal) : async () {
    requireAuthenticated(caller);
    let project = switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?existingProject) { existingProject };
    };
    let isOwnerManager = caller == project.owner and isManager(caller);
    let isAssignedLeader = switch (project.assignedTo) {
      case (?assigned) { assigned == caller and isTeamLeader(caller) };
      case (null) { false };
    };
    if (not (isOwnerManager or isAssignedLeader)) {
      Runtime.trap("Unauthorized: Only project owner (manager) or assigned team leader can update project");
    };
    projects.add(id, { id; title; description; completionDate; assignedTo; owner = project.owner });
  };

  public query ({ caller }) func getAllProjects() : async [Project] {
    requireAuthenticated(caller);
    if (isManager(caller)) {
      return projects.values().toArray();
    };
    let projectsList = List.empty<Project>();
    projects.forEach(func(_id, project) {
      if (project.owner == caller or (project.assignedTo == ?caller)) {
        projectsList.add(project);
      };
    });
    projectsList.toArray();
  };

  public query ({ caller }) func getProjectProgress(projectId : Nat) : async (Nat, Nat) {
    requireAuthenticated(caller);
    var totalTasks = 0;
    var completedTasks = 0;
    tasks.forEach(func(_id, task) {
      if (task.projectId == projectId) {
        totalTasks += 1;
        if (task.completed) { completedTasks += 1 };
      };
    });
    (completedTasks, totalTasks);
  };

  // Task management
  public shared ({ caller }) func createTask(title : Text, priority : TaskPriority, projectId : Nat, assignedTo : ?Principal, assignedToLeader : ?Principal, dueDate : Time.Time) : async () {
    requireAuthenticated(caller);
    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };
    let hasAccess = isManager(caller) or project.owner == caller or project.assignedTo == ?caller;
    if (not hasAccess) {
      Runtime.trap("Unauthorized: Can only create tasks for projects you own or are assigned to");
    };
    tasks.add(nextTaskId, {
      id = nextTaskId; title; priority; projectId;
      assignedTo; assignedToLeader; owner = caller; completed = false; dueDate;
    });
    nextTaskId += 1;
  };

  public shared ({ caller }) func updateTask(id : Nat, title : Text, priority : TaskPriority, assignedTo : ?Principal, assignedToLeader : ?Principal, dueDate : Time.Time, completed : Bool) : async () {
    requireAuthenticated(caller);
    let task = switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTask) { existingTask };
    };
    let callerRole = getCallerRole(caller);

    if (isManager(caller)) {
      tasks.add(id, { id; title; priority; projectId = task.projectId; assignedTo; assignedToLeader; owner = task.owner; completed; dueDate });
      return;
    };

    if (isTeamLeader(caller)) {
      let onlyAssignmentChanged = title == task.title and priority == task.priority and dueDate == task.dueDate and completed == task.completed;
      if (onlyAssignmentChanged) {
        let assignedToValid = switch (assignedTo) {
          case (?p) { switch (getUserRole(p)) { case (?#team_member) { true }; case (?#intern) { true }; case (_) { false } } };
          case (null) { true };
        };
        let assignedToLeaderValid = switch (assignedToLeader) {
          case (?p) { switch (getUserRole(p)) { case (?#team_member) { true }; case (?#intern) { true }; case (_) { false } } };
          case (null) { true };
        };
        if (assignedToValid and assignedToLeaderValid) {
          tasks.add(id, { id; title; priority; projectId = task.projectId; assignedTo; assignedToLeader; owner = task.owner; completed; dueDate });
          return;
        } else {
          Runtime.trap("Unauthorized: Team leaders can only assign to team_member or intern roles");
        };
      };
    };

    switch (callerRole) {
      case (?#team_member) {
        if (task.assignedTo == ?caller and title == task.title and priority == task.priority and assignedTo == task.assignedTo and assignedToLeader == task.assignedToLeader and dueDate == task.dueDate) {
          tasks.add(id, { id; title; priority; projectId = task.projectId; assignedTo; assignedToLeader; owner = task.owner; completed; dueDate });
          return;
        };
      };
      case (_) {};
    };

    Runtime.trap("Unauthorized: Insufficient permissions to update this task");
  };

  public query ({ caller }) func getTasks() : async [TaskResponse] {
    requireAuthenticated(caller);
    if (isManager(caller)) {
      return tasks.values().toArray().map<Task, TaskResponse>(toTaskResponse);
    };
    let tasksList = List.empty<TaskResponse>();
    tasks.forEach(func(_id, task) {
      if (task.owner == caller or task.assignedTo == ?caller or task.assignedToLeader == ?caller) {
        tasksList.add(toTaskResponse(task));
      };
    });
    tasksList.toArray();
  };
};
