import { auth } from "@/auth";
import SidebarContent from "@/components/sidebar-content";

export async function SidebarDesktop() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return <SidebarContent userId={session.user.id} />;
}
