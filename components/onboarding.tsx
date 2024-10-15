import React, { SetStateAction } from 'react'
import * as Dialog from "@radix-ui/react-dialog";
import {type User} from '@/lib/types'
import { Cross2Icon } from "@radix-ui/react-icons";


type Details ={
	first_name: string | null;
	last_name: string | null;
	company_name: string | null;
	company_description: string | null;
	website_link: string | null;
	preferred_language: string | null;
	goal: string | null;
  }

type InputErrors = {
	first_name: string | null;
	last_name: string | null;
	company_name: string | null;
	company_description: string | null;
	website_link: string | null;
	preferred_language: string | null;
	goal: string | null;
}
  
type OnboardingProps= {
	userDetails:User | undefined;
	setStep:React.Dispatch<SetStateAction<number>>;
	open:boolean;
	setOpen:React.Dispatch<SetStateAction<boolean>>;
	updateOnboardingDetails:(email:string, details:{first_name:string; last_name:string,company_name:string; company_description:string; website_link:string; preferred_language:string; goal:string})=>Promise<any>
}




export default function Onboarding({userDetails,open, setOpen, setStep, updateOnboardingDetails}:OnboardingProps) {
	const [error, setError]  = React.useState<string|null>(null);
	const [inputError, setInputError]  = React.useState<InputErrors>({
		first_name: "",
		last_name: "",
		company_name: "",
		company_description: "",
		website_link: "",
		preferred_language: "",
		goal: "",
	});
	const [firstName, setFirstName] = React.useState<string>(userDetails?.first_name || "");
	const [lastName, setLastName] = React.useState<string>(userDetails?.last_name || "");
	const [companyName, setCompanyName] = React.useState<string>(userDetails?.company_name || "");
	const [companyDescription, setCompanyDescription] = React.useState<string>(userDetails?.company_description || "");
	const [websiteLink, setWebsiteLink] = React.useState<string>(userDetails?.website_link || "");
	const [preferredLanguage, setPreferredLanguage] = React.useState<string>(userDetails?.preferred_language || "en");
	const [goal, setGoal] = React.useState<string>(userDetails?.goal || "customers");


	const handleSave = async ()=>{
		if(userDetails){
			const details = {
				first_name:firstName,
				last_name:lastName,
				company_name:companyName,
				company_description:companyDescription,
				website_link:websiteLink,
				preferred_language:preferredLanguage,
				goal:goal
			}

			const getEmptyKeys = (obj: Details): string[] => {
				return Object.keys(obj).filter(key => obj[key as keyof Details] === null || obj[key as keyof Details] === "");
			};
			  
			  // Usage
			const emptyKeys: string[] = getEmptyKeys(details);
			  
			if (emptyKeys.length > 0) {
				let errors = {
					first_name: "",
					last_name: "",
					company_name: "",
					company_description: "",
					website_link: "",
					preferred_language: "",
					goal: "",
				};
				for(let i= 0; i<emptyKeys.length;i++){
					errors = {...errors,[emptyKeys[i]]:"This field is required"}
				}
				setInputError(errors)
				return;
			}
			const resp = await updateOnboardingDetails(userDetails?.email, details);
			if(resp.success){
				setOpen(false)
			}
			else{
				setError(resp.message)
			}
		}
	}

  return (
    <Dialog.Root modal={true} open={open} onOpenChange={()=>null}>
		<Dialog.Trigger asChild>
			<button 
			onClick={()=>setOpen(true)}
			className="inline-flex h-[35px] items-center justify-center rounded bg-white px-[5px] font-medium leading-none text-violet11 focus:outline-none">
				Adjust Account 
			</button>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="z-[100] fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow" />
			<Dialog.Content className="z-[100] fixed left-1/2 top-1/2 max-h-[85vh] overflow-y-auto w-[90vw] max-w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none data-[state=open]:animate-contentShow">
				
				<div className="flex justify-center mb-3 py-4">
					<span className="text-3xl font-bold">Welcome! Let&apos;s Get Started</span>
				</div>
				<p className="text-center text-red-600">{error}</p>
				{/* <Dialog.Title className="m-0 text-lg font-semi-bold text-mauve12">
            Welcome! Let's Get Started
				</Dialog.Title> */}
				{/* <Dialog.Description className="mb-5 mt-2.5 text-sm leading-normal text-gray-600">
				{facebookConnected?"You can change your active Adds account or disconnect facebook account":"Link your Facebook account to manage ads seamlessly from Reply.ai."}
				</Dialog.Description>
			 */}
			 <div className='flex flex-col gap-3 mb-5'>

				<div>
					<label htmlFor="first_name"  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
					<input 
					  type="text" 
					  id="first_name" 
					  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
					  placeholder="First Name" 
					  value={firstName}
					  onChange={(e)=>{
						if(e.target.value.length>0){
							setInputError({...inputError,first_name:""})
						}
						else{
							setInputError({...inputError,first_name:"This field is required"})
						}
						setFirstName(e.target.value)
					}}
					  required 
					/>
					{
						inputError?.first_name &&	<p className='text-red-500'>{inputError?.first_name}</p>
					}
										
				</div>

				<div>
					<label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
					<input 
					  type="text" 
					  id="last_name" 
					  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
					  placeholder="Last Name" 
					  value={lastName}
					  onChange={(e)=>{
						if(e.target.value.length>0){
							setInputError({...inputError,last_name:""})
						}
						else{
							setInputError({...inputError,last_name:"This field is required"})
						}
						setLastName(e.target.value)
					}}
					  required 
					/>
					{
						inputError?.last_name &&	<p className='text-red-500'>{inputError?.last_name}</p>
					}
				</div>

				<div>
					<label htmlFor="company_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Company Name</label>
					<input 
					  type="text" 
					  id="company_name" 
					  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
					  placeholder="Company Name" 
					  value={companyName}
					  onChange={(e)=>{
						if(e.target.value.length>0){
							setInputError({...inputError,company_name:""})
						}
						else{
							setInputError({...inputError,company_name:"This field is required"})
						}
						setCompanyName(e.target.value)
					}}
					  required 
					/>
					{
						inputError?.company_name &&	<p className='text-red-500'>{inputError?.company_name}</p>
					}
				</div>

				<div>
					<label htmlFor="company_description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Company Description</label>
					<textarea 
					  id="company_description" 
					  rows={4} 
					  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
					  placeholder="Describe your company"
					  value={companyDescription} 
					  onChange={(e)=>{
						if(e.target.value.length>0){
							setInputError({...inputError,company_description:""})
						}
						else{
							setInputError({...inputError,company_description:"This field is required"})
						}
						setCompanyDescription(e.target.value)
					}}
					></textarea>
					{
						inputError?.company_description &&	<p className='text-red-500'>{inputError?.company_description}</p>
					}
				</div>

				<div>
					<label htmlFor="website_link" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Website Link</label>
					<input 
					  type="text" 
					  id="webciste_link" 
					  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
					  placeholder="https://yourwebsite.com" 
					  value={websiteLink} 
					  onChange={(e)=>{
						if(e.target.value.length>0){
							setInputError({...inputError,website_link:""})
						}
						else{
							setInputError({...inputError,website_link:"This field is required"})
						}
						setWebsiteLink(e.target.value)
					}}
					  required 
					/>
					{
						inputError?.website_link &&	<p className='text-red-500'>{inputError?.website_link}</p>
					}
				</div>

				<div>
					<label htmlFor="languages" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select an option</label>
					<select id="languages" value={preferredLanguage} onChange={(e)=>{
						if(e.target.value.length>0){
							setInputError({...inputError,preferred_language:""})
						}
						else{
							setInputError({...inputError,preferred_language:"This field is required"})
						}
						setPreferredLanguage(e.target.value)
					}} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
						<option value="en" selected data-flag="fi-us">English</option>
						<option value="nl" data-flag="fi-nl">Dutch</option>
						<option value="de" data-flag="fi-de">German</option>
						<option value="es" data-flag="fi-es">Spanish</option>
						<option value="it" data-flag="fi-it">Italian</option>
						<option value="fr" data-flag="fi-fr">French</option>
					</select>
					{
						inputError?.preferred_language &&	<p className='text-red-500'>{inputError?.preferred_language}</p>
					}
				</div>

				<div>
					<label htmlFor="goal"  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">What is your goal?</label>
					<select id="goal" value={goal} onChange={(e)=>{
						if(e.target.value.length>0){
							setInputError({...inputError,goal:""})
						}
						else{
							setInputError({...inputError,goal:"This field is required"})
						}
						setGoal(e.target.value)
					}} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
						<option value="customers">I want to attract more customers</option>
						<option value="employees">I want to recruit employees</option>
					</select>
					{
						inputError?.goal &&	<p className='text-red-500'>{inputError?.goal}</p>
					}
				</div>
				<div className="flex justify-between">
					<button 
						// onClick={unlinkFacebook}
						className="h-10 px-4 flex items-center justify-center bg-gray-700 hover:bg-gray-900 text-white rounded-md shadow-md transition-transform transform hover:scale-105 active:scale-100 focus:outline-none"
						onClick={()=>setStep(1)}
						>
						Back
					</button>
					<button 
						// onClick={unlinkFacebook}
						className="h-10 px-4 flex items-center justify-center bg-blue-700 hover:bg-blue-900 text-white rounded-md shadow-md transition-transform transform hover:scale-105 active:scale-100 focus:outline-none"
						onClick={handleSave}
					>
						Save
					</button>
				</div>
			</div>


					

				 
				<Dialog.Close asChild>
					<button
						onClick={()=> setOpen(false)}
						className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full text-violet11 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 focus:outline-none"
						aria-label="Close"
					>
						<Cross2Icon />
					</button>
				</Dialog.Close>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
  )
}
