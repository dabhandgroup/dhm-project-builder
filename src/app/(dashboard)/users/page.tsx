import { getProfiles } from "@/lib/queries/users";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const profiles = await getProfiles();

  return <UsersClient initialProfiles={profiles} />;
}
