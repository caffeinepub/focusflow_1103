import type { Principal } from "@icp-sdk/core/principal";
import type { UserProfile } from "./backend";

export interface UserWithPrincipal {
  principal: Principal;
  profile: UserProfile;
}
