import { auth } from '@/auth'
import { getSubscribers } from '@/lib/helpers/global-toggle/toggle-subscribers'

export async function isGlobalToggleEnabledForUser(
  globalToggleName: string
): Promise<boolean> {
  const session = await auth()

  if (!session || !session.user || !session.user.email) {
    return false
  }

  const toggleSubscribers = getSubscribers(globalToggleName)

  if (toggleSubscribers === null) {
    return false
  }

  return toggleSubscribers.includes(session.user?.email)
}
