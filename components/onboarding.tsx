'use client'

import React, { SetStateAction } from 'react'
import * as Dialog from "@radix-ui/react-dialog"
import { type User } from '@/lib/types'
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Details = {
  first_name: string | null
  last_name: string | null
  company_name: string | null
  company_description: string | null
  website_link: string | null
  preferred_language: string | null
  goal: string | null
}

type InputErrors = {
  first_name: string | null
  last_name: string | null
  company_name: string | null
  company_description: string | null
  website_link: string | null
  preferred_language: string | null
  goal: string | null
}

type OnboardingProps = {
  userDetails: User | undefined
  open: boolean
  setOpen: React.Dispatch<SetStateAction<boolean>>
  updateOnboardingDetails: (email: string, details: {
    first_name: string
    last_name: string,
    company_name: string
    company_description: string
    website_link: string
    preferred_language: string
    goal: string
  }) => Promise<any>
}

function Onboarding({
  userDetails,
  open,
  setOpen,
  updateOnboardingDetails
}: OnboardingProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [inputError, setInputError] = React.useState<InputErrors>({
    first_name: "",
    last_name: "",
    company_name: "",
    company_description: "",
    website_link: "",
    preferred_language: "",
    goal: "",
  })

  const [firstName, setFirstName] = React.useState<string>(userDetails?.first_name || "")
  const [lastName, setLastName] = React.useState<string>(userDetails?.last_name || "")
  const [companyName, setCompanyName] = React.useState<string>(userDetails?.company_name || "")
  const [companyDescription, setCompanyDescription] = React.useState<string>(userDetails?.company_description || "")
  const [websiteLink, setWebsiteLink] = React.useState<string>(userDetails?.website_link || "")
  const [preferredLanguage, setPreferredLanguage] = React.useState<string>(userDetails?.preferred_language || "en")
  const [goal, setGoal] = React.useState<string>(userDetails?.goal || "customers")

  const [dbChangeRequested, setDbChangeRequested] = React.useState(false)
  const [showSuccesMessage, setShowSuccessMessage] = React.useState(false)

  const handleSave = async () => {
    if (userDetails) {
      const details = {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        company_description: companyDescription,
        website_link: websiteLink,
        preferred_language: preferredLanguage,
        goal: goal
      }

      const getEmptyKeys = (obj: Details): string[] => {
        return Object.keys(obj).filter(key => obj[key as keyof Details] === null || obj[key as keyof Details] === "")
      }

      const emptyKeys: string[] = getEmptyKeys(details)

      if (emptyKeys.length > 0) {
        let errors = {
          first_name: "",
          last_name: "",
          company_name: "",
          company_description: "",
          website_link: "",
          preferred_language: "",
          goal: "",
        }
        for (let i = 0; i < emptyKeys.length; i++) {
          errors = { ...errors, [emptyKeys[i]]: "This field is required" }
        }
        setInputError(errors)
        return
      }
      setOpen(false)
      setDbChangeRequested(true)

      const resp = await updateOnboardingDetails(userDetails?.email, details)
      if (resp.success) {
        setDbChangeRequested(false)
        setShowSuccessMessage(true)
      } else {
        setError(resp.message)
      }
    }
  }

  React.useEffect(() => {
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 5000)
  }, [showSuccesMessage])

  return (
    <>
      {showSuccesMessage && (
        <div className={cn(
          "my-4 flex items-center gap-2 p-4 text-sm rounded-lg",
          "bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-400",
          "border border-green-200 dark:border-green-900/50",
          "animate-in fade-in-0 duration-300"
        )}>
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Your profile has been updated successfully</span>
        </div>
      )}

      {!open && dbChangeRequested && (
        <div className={cn(
          "my-4 flex items-center gap-2 p-4 text-sm rounded-lg",
          "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400",
          "border border-yellow-200 dark:border-yellow-900/50",
          "animate-in fade-in-0 duration-300"
        )}>
          <Loader2 className="size-4 shrink-0 animate-spin" />
          <span>Updating your profile. This may take a few seconds...</span>
        </div>
      )}

      <Dialog.Root open={open} onOpenChange={() => setOpen(!open)}>
        <Dialog.Trigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <UserIcon className="size-4" />
            Profile
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay 
            className={cn(
              "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )} 
          />
          <Dialog.Content 
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2",
              "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800",
              "p-6 shadow-lg overflow-y-auto",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
              "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
            )}
          >
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Welcome! Let&apos;s Get Started
                </h2>
                {error && (
                  <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                )}
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                      First Name
                    </label>
                    <input 
                      type="text" 
                      id="first_name" 
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm transition-colors",
                        "bg-white dark:bg-zinc-800 border",
                        inputError?.first_name
                          ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                          : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900",
                      )}
                      placeholder="Enter your first name" 
                      value={firstName}
                      onChange={(e) => {
                        if(e.target.value.length>0){
                          setInputError({...inputError,first_name:""})
                        } else {
                          setInputError({...inputError,first_name:"This field is required"})
                        }
                        setFirstName(e.target.value)
                      }}
                    />
                    {inputError?.first_name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {inputError.first_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="last_name" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                      Last Name
                    </label>
                    <input 
                      type="text" 
                      id="last_name" 
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm transition-colors",
                        "bg-white dark:bg-zinc-800 border",
                        inputError?.last_name
                          ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                          : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900",
                      )}
                      placeholder="Enter your last name" 
                      value={lastName}
                      onChange={(e) => {
                        if(e.target.value.length>0){
                          setInputError({...inputError,last_name:""})
                        } else {
                          setInputError({...inputError,last_name:"This field is required"})
                        }
                        setLastName(e.target.value)
                      }}
                    />
                    {inputError?.last_name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {inputError.last_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="company_name" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    Company Name
                  </label>
                  <input 
                    type="text" 
                    id="company_name" 
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      "bg-white dark:bg-zinc-800 border",
                      inputError?.company_name
                        ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                        : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900",
                    )}
                    placeholder="Enter your company name" 
                    value={companyName}
                    onChange={(e) => {
                      if(e.target.value.length>0){
                        setInputError({...inputError,company_name:""})
                      } else {
                        setInputError({...inputError,company_name:"This field is required"})
                      }
                      setCompanyName(e.target.value)
                    }}
                  />
                  {inputError?.company_name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {inputError.company_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="company_description" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    Company Description
                  </label>
                  <textarea 
                    id="company_description" 
                    rows={4} 
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      "bg-white dark:bg-zinc-800 border",
                      inputError?.company_description
                        ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                        : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900",
                      "resize-none"
                    )}
                    placeholder="Please share your companies advertising goals and any unique details about your company that our AI might not be able to gather from your website."
                    value={companyDescription}
                    onChange={(e) => {
                      if(e.target.value.length>0){
                        setInputError({...inputError,company_description:""})
                      } else {
                        setInputError({...inputError,company_description:"This field is required"})
                      }
                      setCompanyDescription(e.target.value)
                    }}
                  />
                  {inputError?.company_description && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {inputError.company_description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="website_link" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Website Link
                  </label>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Our AI will analyze your website to better understand your company and provide more relevant suggestions.
                  </p>
                  <input 
                    type="text" 
                    id="website_link" 
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      "bg-white dark:bg-zinc-800 border",
                      inputError?.website_link
                        ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                        : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900",
                    )}
                    placeholder="https://yourwebsite.com" 
                    value={websiteLink}
                    onChange={(e) => {
                      if(e.target.value.length>0){
                        setInputError({...inputError,website_link:""})
                      } else {
                        setInputError({...inputError,website_link:"This field is required"})
                      }
                      setWebsiteLink(e.target.value)
                    }}
                  />
                  {inputError?.website_link && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {inputError.website_link}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="languages" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                      Preferred Language
                    </label>
                    <select 
                      id="languages" 
                      value={preferredLanguage}
                      onChange={(e) => {
                        if(e.target.value.length>0){
                          setInputError({...inputError,preferred_language:""})
                        } else {
                          setInputError({...inputError,preferred_language:"This field is required"})
                        }
                        setPreferredLanguage(e.target.value)
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm transition-colors",
                        "bg-white dark:bg-zinc-800 border",
                        inputError?.preferred_language
                          ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                          : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900",
                      )}
                    >
                      <option value="en">English</option>
                      <option value="nl">Dutch</option>
                      <option value="de">German</option>
                      <option value="es">Spanish</option>
                      <option value="it">Italian</option>
                      <option value="fr">French</option>
                    </select>
                    {inputError?.preferred_language && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {inputError.preferred_language}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="goal" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                      What is your goal?
                    </label>
                    <select 
                      id="goal" 
                      value={goal}
                      onChange={(e) => {
                        if(e.target.value.length>0){
                          setInputError({...inputError,goal:""})
                        } else {
                          setInputError({...inputError,goal:"This field is required"})
                        }
                        setGoal(e.target.value)
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm transition-colors",
                        "bg-white dark:bg-zinc-800 border",
                        inputError?.goal
                          ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                          : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900",
                      )}
                    >
                      <option value="customers">I want to attract more customers</option>
                      <option value="employees">I want to recruit employees</option>
                    </select>
                    {inputError?.goal && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {inputError.goal}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                onClick={() => setOpen(false)}
                className={cn(
                  "absolute right-4 top-4 rounded-full p-2 opacity-70 transition-all",
                  "hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  "focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
                  "dark:focus:ring-zinc-200 dark:ring-offset-zinc-900",
                )}
              >
                <Cross2Icon className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export default Onboarding;