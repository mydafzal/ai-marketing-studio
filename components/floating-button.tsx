export interface FloatingButtonProps {
  onClick: () => void
}
export function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-[80px] right-5 bg-black text-white border-0 px-5 py-2.5 rounded cursor-pointer shadow-lg z-1150"
    >
      Things to ask Reeply AI
    </button>
  )
}
