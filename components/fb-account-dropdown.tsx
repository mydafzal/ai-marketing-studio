import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	CheckIcon,
	ChevronDownIcon,
} from "@radix-ui/react-icons";

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
}

const FBAccountDropdown = ({title,selectedAcccount,accounts,handleAccountChange}:FBAccountDropdownProps) => {

    function handleSelect(id:string){
        handleAccountChange(id)
    }

	return (
        <div className="mb-4">
            <p className="text-black dark:text-white mb-1">{title}</p>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        className="min-h-[55px] flex min-w-[220px] border px-2 py-1 items-center justify-between rounded bg-white text-black outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black dark:text-black"
                        aria-label="Customise options"
                    >
                        {selectedAcccount ? <div className="flex-1 text-left flex items-center gap-2">
                            {selectedAcccount.profile_picture_url && (
                              <img 
                                src={selectedAcccount.profile_picture_url} 
                                alt={selectedAcccount.name} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="text-lg text-black">{selectedAcccount.name}</p>
                              <p className="text-xs text-black">{selectedAcccount.id}</p>
                            </div>
                        </div>:<span className="text-black">Click to Select</span>}
                        <ChevronDownIcon className="text-black"/>
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="z-[100] min-w-[220px] p-2 flex flex-col bg-white gap-2 rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
                        sideOffset={5}
                    >
                        <div 
                            className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400" 
                            onWheel={(e) => {
                                e.stopPropagation();
                                const container = e.currentTarget;
                                container.scrollTop += e.deltaY;
                            }}
                        >
                            {
                                accounts?accounts.map((account, index) => (
                                        <div key={index}>
                                            <DropdownMenu.Item 
                                                onSelect={()=>handleSelect(account.id)}
                                                className="mb-1 py-1 group bg-white relative flex select-none items-center rounded px-2 text-xs leading-none text-black outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-black data-[highlighted]:text-white">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        {account.profile_picture_url && (
                                                          <img 
                                                            src={account.profile_picture_url} 
                                                            alt={account.name} 
                                                            className="w-6 h-6 rounded-full object-cover"
                                                          />
                                                        )}
                                                        <div>
                                                          <p className="text-lg text-black data-[highlighted]:text-white">{account.name}</p>
                                                          <p className="text-black data-[highlighted]:text-white">{account.id}</p>
                                                        </div>
                                                    </div>
                                                    {account.id==selectedAcccount?.id &&<CheckIcon className="h-4 w-4 text-black"/>}
                                            </DropdownMenu.Item>
                                            <div className="border-b border-[#e7e7e7]"></div>
                                        </div>
                                    )
                                ):<span className="text-black p-2">No account found</span>
                            }
                        </div>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>

        </div>

	);
};

export default FBAccountDropdown;
