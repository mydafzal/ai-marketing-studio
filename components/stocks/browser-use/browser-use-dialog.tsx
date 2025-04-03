"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Maximize2 } from "lucide-react"
import { BrowserUse } from "./browser-use"

interface BrowserUseDialogProps {
  defaultPrompt?: string
}

export function BrowserUseDialog({ defaultPrompt = "" }: BrowserUseDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center space-x-1 text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
        >
          <Maximize2 className="h-4 w-4" />
          <span>Expand View</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] h-[90vh] overflow-hidden bg-container-bg border-border-dark">
        <DialogHeader>
          <DialogTitle className="text-text-white text-[20px] font-bold">AI Browser Research</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-2">
          <BrowserUse defaultPrompt={defaultPrompt} isInDialog={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}