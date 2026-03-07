import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface UserWithEmail extends Profile {
  email: string;
  last_sign_in_at: string | null;
}
