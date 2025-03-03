export function getSubscribers(globalToggleName: string): string[] | null {
  if (globalToggleName === 'fbDemoMode') {
    return ['reeply-demo@reeply.ai']
  }

  return null
}
