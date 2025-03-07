import { getUserFbAccountId } from '@/app/actions'
import { create } from 'zustand'

interface AccountState {
  isFbAccountConnected: boolean
  checkFbAccountConnection: () => Promise<void>
}

const useAccountStore = create<AccountState>(set => ({
  isFbAccountConnected: false,

  checkFbAccountConnection: async () => {
    try {
      const fbAccountConnectionState = await getUserFbAccountId()
      if (
        fbAccountConnectionState.success &&
        fbAccountConnectionState.fbAccountId
      ) {
        set({ isFbAccountConnected: true })
      } else {
        set({ isFbAccountConnected: false })
      }
    } catch (error) {
      set({ isFbAccountConnected: false })
    }
  }
}))

export default useAccountStore
