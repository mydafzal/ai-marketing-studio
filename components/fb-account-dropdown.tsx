import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	CheckIcon,
	ChevronDownIcon,
} from "@radix-ui/react-icons";

type Account = {
    name:string;
    id:string;
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
            <p>{title}</p>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        className="min-h-[55px] flex min-w-[220px] border px-2 py-1 items-center justify-between rounded bg-white text-violet11 outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black"
                        aria-label="Customise options"
                    >
                        {selectedAcccount ? <div className="flex-1 text-left">
                            <p className="text-lg">{selectedAcccount.name}</p>
                            <p className="text-xs">{selectedAcccount.id}</p>
                        </div>:"Select Account"}
                        <ChevronDownIcon/>
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="z-[100] min-w-[220px] p-2 flex flex-col bg-white gap-2 rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
                        sideOffset={5}
                    >
                        {
                            accounts?accounts.map((account, index) => (
                                    <div key={index}>
                                        <DropdownMenu.Item 
                                            onSelect={()=>handleSelect(account.id)}
                                            className="mb-1 py-1 group bg-white relative flex select-none items-center rounded px-2 text-xs leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1">
                                                <div className="flex-1">
                                                    <p className="text-lg">{account.name}</p>
                                                    <p>{account.id}</p>
                                                </div>
                                                {account.id==selectedAcccount?.id &&<CheckIcon className="h-4 w-4"/>}
                                        </DropdownMenu.Item>
                                        <div className="border-b border-[#e7e7e7]"></div>
                                    </div>
                                )
                            ):"No account found"
                        }
                        
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>

        </div>

	);
};

export default FBAccountDropdown;
