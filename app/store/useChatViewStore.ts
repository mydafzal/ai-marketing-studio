import { create } from 'zustand'

interface ChatViewState {
  isLeadsVisible: boolean
  isSidebarVisible: boolean
  currentView: 'chat' | 'leads' | 'campaign'
  setLeadsVisible: (visible: boolean) => void
  setSidebarVisible: (visible: boolean) => void
  setCurrentView: (view: 'chat' | 'leads' | 'campaign') => void
  toggleLeadsVisibility: () => void
  toggleSidebarVisibility: () => void
}

const useChatViewStore = create<ChatViewState>((set, get) => ({
  isLeadsVisible: false,
  isSidebarVisible: true,
  currentView: 'chat',
  
  setLeadsVisible: (visible: boolean) => 
    set({ isLeadsVisible: visible }),
    
  setSidebarVisible: (visible: boolean) => 
    set({ isSidebarVisible: visible }),
    
  setCurrentView: (view: 'chat' | 'leads' | 'campaign') => 
    set({ currentView: view }),
    
  toggleLeadsVisibility: () => 
    set((state) => ({ isLeadsVisible: !state.isLeadsVisible })),
    
  toggleSidebarVisibility: () => 
    set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
}))

export default useChatViewStore 