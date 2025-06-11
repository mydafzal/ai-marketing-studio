import React from 'react'
import { Loader2 } from 'lucide-react'

interface DeletePersonaModalProps {
  isOpen: boolean
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeletePersonaModal({
  isOpen,
  isDeleting,
  onClose,
  onConfirm
}: DeletePersonaModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1A1D29] p-8 rounded-xl border border-gray-700 shadow-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-red-400">Delete Customer Profile?</h2>
        <p className="mb-6 text-gray-300">
          Are you sure you want to delete this customer profile? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#232736] text-gray-300 hover:bg-[#2C3142] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 