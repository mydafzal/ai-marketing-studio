import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { IconEye, IconMessageCircle } from '@/components/ui/icons'
import { paletteActions, PaletteAction } from '@/data/palette-actions-list'

interface TaskPaletteProps {
  isOpen: boolean
  onClose: () => void
  onShowMe: (prompt: string) => void
}

export function TaskPalette({ isOpen, onClose, onShowMe }: TaskPaletteProps) {
  const [visibleMessages, setVisibleMessages] = useState<{ [key: string]: boolean }>({})

  const toggleMessageVisibility = (action: string) => {
    setVisibleMessages(prev => ({ ...prev, [action]: !prev[action] }))
  }

  const handleShowMe = (prompt: string) => {
    onShowMe(prompt)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Things to ask Reeply AI</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Explanation</TableHead>
              <TableHead>Example Message</TableHead>
              <TableHead>Show Me</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paletteActions.map((action: PaletteAction) => (
              <TableRow key={action.action}>
                <TableCell>{action.action}</TableCell>
                <TableCell>{action.explanation}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMessageVisibility(action.action)}
                  >
                    <IconEye className={visibleMessages[action.action] ? 'text-primary' : 'text-muted-foreground'} />
                  </Button>
                  {visibleMessages[action.action] && <span className="ml-2">{action.exampleMessage}</span>}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowMe(action.exampleMessage)}
                  >
                    <IconMessageCircle />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
