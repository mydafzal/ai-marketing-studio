'use client'

import { type Session } from '@/lib/types'
import { useT } from '@/lib/i18n/context'
import { handleSignOut } from '@/app/auth-actions'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export interface UserMenuProps {
  user: Session['user']
}

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useT()

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0 text-white hover:bg-[#212534]">
            <div className="flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-[#1A1D29] text-xs font-medium uppercase text-[#ADB0B8] border border-[#2A2E3A]">
              {getUserInitials(user.email)}
            </div>
            <span className="ml-2 hidden md:block">{user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-fit bg-[#1A1D29] border border-[#2A2E3A] text-white">
          <DropdownMenuItem className="flex-col items-start hover:bg-[#212534] text-white">
            <div className="text-xs text-[#ADB0B8]">{user.email}</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#2A2E3A]" />
          <form action={handleSignOut}>
            <button className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors text-white hover:bg-red-500 hover:text-white focus:bg-[#212534] focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              {t('navigation.signOut')}
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
