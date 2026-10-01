import { pageUser } from "@/lib/rbac";
import SettingsView from "./SettingsView";

export default async function SettingsPage() {
  const u = await pageUser();
  const build = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);
  return <SettingsView name={u.name} email={u.email} role={u.role} build={build} />;
}
