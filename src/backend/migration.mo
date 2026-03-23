import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type TaskPriority = {
    #high;
    #medium;
    #low;
  };

  type UserRole = {
    #manager;
    #team_leader;
    #team_member;
    #intern;
  };

  type UserProfile = {
    displayName : Text;
    bio : Text;
    role : ?UserRole;
    avatarInitials : Text;
  };

  type Project = {
    id : Nat;
    title : Text;
    description : Text;
    completionDate : Time.Time;
    assignedTo : ?Principal;
    owner : Principal;
  };

  // Old task type without assignedToLeader field
  type OldTask = {
    id : Nat;
    title : Text;
    priority : TaskPriority;
    projectId : Nat;
    assignedTo : ?Principal;
    owner : Principal;
    completed : Bool;
    dueDate : Time.Time;
  };

  // New task type with assignedToLeader field
  type NewTask = {
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

  // Old actor type
  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    projects : Map.Map<Nat, Project>;
    tasks : Map.Map<Nat, OldTask>;
    nextProjectId : Nat;
    nextTaskId : Nat;
  };

  // New actor type
  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    projects : Map.Map<Nat, Project>;
    tasks : Map.Map<Nat, NewTask>;
    nextProjectId : Nat;
    nextTaskId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newTasks = old.tasks.map<Nat, OldTask, NewTask>(
      func(_id, oldTask) {
        { oldTask with assignedToLeader = null };
      }
    );
    {
      old with
      tasks = newTasks;
    };
  };
};
