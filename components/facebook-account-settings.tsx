"use client"
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { usePathname } from 'next/navigation';

import FacebookConnect from "@/components/facebook-connect";
import FBAccountDropdown from "./fb-account-dropdown";
import Onboarding from "./onboarding"
import {isFeatureToggleEnabled} from "@/lib/helpers/feature-toggle/feature-toggle-manager";


import {type User} from '@/lib/types'


type Account = {
    name:string;
    id:string;
}

type FacebookAccountSettingsProps= {
	userDetails:User | undefined;
	getFacebookBusinessAccounts: (encryptedAccessToken:string)=>Promise<any>;
	getFacebookAdAccounts: (encryptedAccessToken:string,business_acc_id:string )=>Promise<any>;
	updateFbBusinessAcc: (email:string,accountId:string )=>Promise<any>;
	updateFbAccountId: (email:string,fbAccountId:string )=>Promise<any>;
	disconnectFacebook: (email:string)=>Promise<any>;
	updateOnboardingDetails:(email:string, details:{first_name:string; last_name:string,company_name:string; company_description:string; website_link:string; preferred_language:string; goal:string})=>Promise<any>
}

const FacebookAccountSettings = ({
	userDetails,
	getFacebookBusinessAccounts,
	getFacebookAdAccounts,
	updateFbBusinessAcc,
	updateFbAccountId,
	disconnectFacebook,
	updateOnboardingDetails,
}:FacebookAccountSettingsProps) => {

	const pathname = usePathname();
 	const isAdminPath = pathname === "/admin"; 
	

	const [error, setError]  = React.useState<string|null>(null);
	const [selectedFbBusinessAcc, setSelectedFbBusinessAcc] = React.useState<Account | undefined>();
	const [fbBusinessAccs, setFbBusinessAccs] = React.useState<Account[] | undefined>(undefined);
	
	const [selectedFbAdAcc, setSelectedFbAdAcc] = React.useState<Account | undefined>(undefined);
	const [fbAdAccs, setFbAdAccs] = React.useState<Account[] | undefined>(undefined);

	const [facebookConnected, setFacebookConnected] = React.useState(userDetails?.fbMarketingApiKey?true:false);
	const [adAccountSelected, setAdAccountSelected] =  React.useState(userDetails?.fbAccountId?true:false);

	const [step, setStep] = React.useState<number>(facebookConnected&&adAccountSelected?2:1);
	const [open, setOpen] = React.useState<boolean>(
		isFeatureToggleEnabled("enforceUserApiKey")?
		!(facebookConnected&&adAccountSelected):
		!(adAccountSelected)
	)
	

	function handleClose(){
	if(isFeatureToggleEnabled("enforceUserApiKey")){
		if(facebookConnected){
			if(adAccountSelected){
					setOpen(false)
				}else{
					setError("Please complete Add Account selection before proceeding")
				}
			}else{
				setError("Please link your account before proceeding")
			}
	}
	else{
		if(adAccountSelected){
			setOpen(false)
		}else{
			setError("Please complete Add Account selection before proceeding")
		}
	}
		
	}


	async function getBusinessAPICall(){
		if(userDetails?.fbMarketingApiKey){
			const data = await getFacebookBusinessAccounts(userDetails?.fbMarketingApiKey);
			setFbBusinessAccs(data);
		}
	}

	
	async function getAdAccAPICall(){
		if(userDetails?.fbMarketingApiKey && selectedFbBusinessAcc){
			const data = await getFacebookAdAccounts(userDetails?.fbMarketingApiKey, selectedFbBusinessAcc.id);
			setFbAdAccs(data);
		}
	}

	async function selectBusinessAccount(id:string){
		if(fbBusinessAccs && userDetails){
			setSelectedFbBusinessAcc(fbBusinessAccs.find((acc)=>acc.id===id));
			await updateFbBusinessAcc(userDetails?.email,id)
		}
	}

	async function selectAdAccount(id:string){
		if(fbAdAccs && userDetails){
			setSelectedFbAdAcc(fbAdAccs.find((acc)=>acc.id===id));
			await updateFbAccountId(userDetails?.email,id)
			setAdAccountSelected(true)
		}
	}

	async function handleDisconnectFacebook(){
		if(userDetails){
			await disconnectFacebook(userDetails?.email)
			window.location.reload();
		}
	}

	React.useEffect(()=>{
		getBusinessAPICall();
	}, [])

	React.useEffect(()=>{
		if(userDetails?.fbBusinessAccId && fbBusinessAccs){
			setSelectedFbBusinessAcc(fbBusinessAccs.find((acc)=>acc.id===`${userDetails?.fbBusinessAccId}`))
		}
		if(userDetails?.fbAccountId){
			setSelectedFbAdAcc({
				id:	userDetails?.fbAccountId,
				name:userDetails?.fbAccountId.split("act_")[1]
			})
		}
	},[fbBusinessAccs])

	React.useEffect(()=>{
		setTimeout(()=>{
			setError(null);
		},5000) 	},[error])

	React.useEffect(()=>{
		getAdAccAPICall()
	}, [selectedFbBusinessAcc])

	if(isAdminPath){
		return;
	}

	return <>
		{
			step==2?(<Onboarding
			userDetails={userDetails}
			open={open}
			setOpen={setOpen}
			setStep={setStep}
			updateOnboardingDetails={updateOnboardingDetails}
			/>):
	(<Dialog.Root modal={true} open={open} onOpenChange={()=>null}>
		<Dialog.Trigger asChild>
			<button 
			onClick={()=>setOpen(true)}
			className="inline-flex h-[35px] items-center justify-center rounded bg-white px-[5px] font-medium leading-none text-violet11 focus:outline-none">
				Adjust Account 
			</button>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="z-[100] fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow" />
			<Dialog.Content className="z-[100] fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none data-[state=open]:animate-contentShow">
				
				<div className="flex justify-center mb-3 py-4">
					<span className="text-3xl font-bold">Reeply.AI</span>
				</div>
				<p className="text-center text-red-600">{error}</p>
				<Dialog.Title className="m-0 text-lg font-semi-bold text-mauve12">
					{facebookConnected?"Manage  Facebook Account":"Connect Facebook Account"}
				</Dialog.Title>
				<Dialog.Description className="mb-5 mt-2.5 text-sm leading-normal text-gray-600">
				{facebookConnected?"You can change your active Adds account or disconnect facebook account":"Link your Facebook account to manage ads seamlessly from Reply.ai."}
				</Dialog.Description>
				{/* <fieldset className="mb-[15px] flex items-center gap-5">
					<label
						className="w-[90px] text-right text-[15px] text-violet11"
						htmlFor="name"
					>
						Name
					</label>
					<input
						className="inline-flex h-[35px] w-full flex-1 items-center justify-center rounded px-2.5 text-[15px] leading-none text-violet11 shadow-[0_0_0_1px] shadow-violet7 outline-none focus:shadow-[0_0_0_2px] focus:shadow-violet8"
						id="name"
						defaultValue="Pedro Duarte"
					/>
				</fieldset>
				<fieldset className="mb-[15px] flex items-center gap-5">
					<label
						className="w-[90px] text-right text-[15px] text-violet11"
						htmlFor="username"
					>
						Username
					</label>
					<input
						className="inline-flex h-[35px] w-full flex-1 items-center justify-center rounded px-2.5 text-[15px] leading-none text-violet11 shadow-[0_0_0_1px] shadow-violet7 outline-none focus:shadow-[0_0_0_2px] focus:shadow-violet8"
						id="username"
						defaultValue="@peduarte"
					/>
				</fieldset> */}

				{userDetails?.fbMarketingApiKey&&
					<div className="flex gap-2">
						<FBAccountDropdown
							title="Select Business Account"
							selectedAcccount={selectedFbBusinessAcc}
							accounts={fbBusinessAccs}
							handleAccountChange={selectBusinessAccount}
						/>
						<FBAccountDropdown
							title="Select Ad Account"
							selectedAcccount={selectedFbAdAcc}
							accounts={fbAdAccs}
							handleAccountChange={selectAdAccount}
						/>
					</div>
				}

				

				

				<div className="flex justify-center">
				{facebookConnected?<button 
					// onClick={unlinkFacebook}
					className="h-10 px-4 flex items-center justify-center bg-red-600 text-white rounded-md shadow-md transition-transform transform hover:scale-105 active:scale-100 focus:outline-none"
					onClick={handleDisconnectFacebook}
					>
					Disconnect Facebook
					</button>
					:<FacebookConnect/>}
				
				</div>

				{
					facebookConnected&&adAccountSelected&&
					<div className="flex justify-end">
						<button 
						// onClick={unlinkFacebook}
						className="h-10 px-4 flex items-center justify-center bg-gray-700 hover:bg-gray-900 text-white rounded-md shadow-md transition-transform transform hover:scale-105 active:scale-100 focus:outline-none"
						onClick={()=>setStep(2)}
						>
						Next
						</button>
					</div>
				}

				{/* <div className="mt-[25px] flex justify-end">
					<Dialog.Close asChild>
						<button className="inline-flex h-[35px] items-center justify-center rounded bg-green4 px-[15px] font-medium leading-none text-green11 hover:bg-green5 focus:shadow-[0_0_0_2px] focus:shadow-green7 focus:outline-none">
							Save changes
						</button>
					</Dialog.Close>
				</div>
				 */}
				 
				<Dialog.Close asChild>
					<button
						onClick={handleClose}
						className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full text-violet11 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 focus:outline-none"
						aria-label="Close"
					>
						<Cross2Icon />
					</button>
				</Dialog.Close>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>)
	}
	</>
};

export default FacebookAccountSettings;
