import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	CheckIcon,
	ChevronDownIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

type Account = {
    name: string;
    id: string;
    profile_picture_url?: string;
}

type FBAccountDropdownProps ={
    title:string;
    selectedAcccount:Account | undefined
    accounts: Account[] | undefined
    handleAccountChange:(id:string)=>void;
    compact?: boolean;
    darkMode?: boolean;
}

const FBAccountDropdown = ({
    title, 
    selectedAcccount, 
    accounts, 
    handleAccountChange, 
    compact = false,
    darkMode = false
}:FBAccountDropdownProps) => {

    function handleSelect(id:string){
        handleAccountChange(id)
    }

	return (
        <div className={cn(compact ? "mb-0" : "mb-4")}>
            {!compact && title && <p className="text-black dark:text-white mb-1">{title}</p>}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        className={cn(
                            "flex items-center justify-between outline-none rounded-full border",
                            darkMode 
                                ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]" 
                                : "bg-white border-gray-200 text-black hover:bg-gray-100/80",
                            compact 
                                ? "min-h-[32px] min-w-[140px] px-3 py-0.5 text-xs" 
                                : "min-h-[48px] min-w-[220px] px-4 py-1"
                        )}
                        aria-label="Select account"
                    >
                        {selectedAcccount ? 
                            <div className="flex-1 text-left flex items-center gap-2">
                                {selectedAcccount.profile_picture_url && (
                                  <img 
                                    src={selectedAcccount.profile_picture_url} 
                                    alt={selectedAcccount.name} 
                                    className={cn(compact ? "w-5 h-5" : "w-7 h-7", "rounded-full object-cover")}
                                  />
                                )}
                                <div>
                                  <p className={cn(
                                    compact ? "text-xs" : "text-sm", 
                                    "truncate max-w-[100px]",
                                    darkMode ? "text-white" : "text-black"
                                  )}>
                                    {selectedAcccount.name}
                                  </p>
                                  {!compact && 
                                    <p className={cn(
                                        "text-xs opacity-60", 
                                        darkMode ? "text-zinc-400" : "text-zinc-600"
                                    )}>
                                        {selectedAcccount.id}
                                    </p>
                                  }
                                </div>
                            </div>
                            : <span className={cn(
                                compact ? "text-xs" : "text-sm", 
                                darkMode ? "text-zinc-300" : "text-zinc-600",
                                "relative font-medium"
                              )}>
                                Select
                                <span className="absolute inset-0 animate-pulse-green rounded-full ring-3 ring-[#4BF29C] shadow-[0_0_8px_2px_rgba(75,242,156,0.7)] ring-offset-1 ring-offset-[#1a1a1a]"></span>
                              </span>
                        }
                        <ChevronDownIcon className={cn(
                            "ml-1",
                            darkMode ? "text-zinc-400" : "text-zinc-600"
                        )} />
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className={cn(
                            "z-[100] min-w-[220px] p-2 flex flex-col gap-1 rounded-lg shadow-lg will-change-[opacity,transform]",
                            "data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade",
                            "data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade",
                            darkMode 
                                ? "bg-[#1a1a1a] border border-[#2a2a2a]" 
                                : "bg-white border border-gray-200"
                        )}
                        sideOffset={5}
                    >
                        <div 
                            className={cn(
                                "max-h-[240px] overflow-y-auto scrollbar-thin",
                                darkMode 
                                    ? "scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600" 
                                    : "scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
                            )}
                            onWheel={(e) => {
                                e.stopPropagation();
                                const container = e.currentTarget;
                                container.scrollTop += e.deltaY;
                            }}
                        >
                            {accounts && accounts.length > 0 ? (
                                accounts.map((account, index) => (
                                    <div key={index}>
                                        <DropdownMenu.Item 
                                            onSelect={()=>handleSelect(account.id)}
                                            className={cn(
                                                "mb-1 py-2 group relative flex select-none items-center rounded-md px-3 text-xs leading-none outline-none",
                                                "data-[disabled]:pointer-events-none",
                                                darkMode
                                                    ? "text-white data-[highlighted]:bg-zinc-800"
                                                    : "text-black data-[highlighted]:bg-zinc-100"
                                            )}>
                                                <div className="flex-1 flex items-center gap-2">
                                                    {account.profile_picture_url && (
                                                      <img 
                                                        src={account.profile_picture_url} 
                                                        alt={account.name} 
                                                        className="w-6 h-6 rounded-full object-cover"
                                                      />
                                                    )}
                                                    <div>
                                                      <p className={cn(
                                                        "text-sm", 
                                                        darkMode ? "text-white" : "text-black"
                                                      )}>
                                                        {account.name}
                                                      </p>
                                                      <p className={cn(
                                                        "text-xs", 
                                                        darkMode ? "text-zinc-400" : "text-zinc-600"
                                                      )}>
                                                        {account.id}
                                                      </p>
                                                    </div>
                                                </div>
                                                {account.id==selectedAcccount?.id && 
                                                  <CheckIcon className={cn(
                                                    "h-4 w-4",
                                                    darkMode ? "text-green-500" : "text-green-600"
                                                  )}/>
                                                }
                                        </DropdownMenu.Item>
                                        {index < accounts.length - 1 && (
                                            <div className={cn(
                                                "border-b mx-2",
                                                darkMode ? "border-zinc-800" : "border-zinc-100"
                                            )}></div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <span className={cn(
                                    "p-3 text-center block",
                                    darkMode ? "text-zinc-400" : "text-zinc-600"
                                )}>
                                    No accounts found
                                </span>
                            )}
                        </div>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
	);
};

export default FBAccountDropdown;
