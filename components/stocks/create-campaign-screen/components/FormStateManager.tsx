/**
 * Campaign Form State Manager UI Component
 * 
 * Allows users to save and load campaign form states
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '../../../../components/ui/dialog';
import { 
  Button
} from '../../../../components/ui/button';
import {
  Input
} from '../../../../components/ui/input';
import {
  useCampaignFormState,
  CampaignFormStateList
} from '../../../../lib/campaign-form-state';
import { extractFormState } from '../../../../lib/campaign-form-state/form-extractor';
import { toast } from '../../../../components/ui/use-toast';

interface FormStateManagerProps {
  // Current form data
  formData: any;
  
  // Function to load saved form data
  onLoadFormState: (formState: any) => void;
}

export function FormStateManager({ formData, onLoadFormState }: FormStateManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveFormName, setSaveFormName] = useState('');
  const [savedForms, setSavedForms] = useState<CampaignFormStateList>({ items: [] });
  
  const { 
    loading,
    error,
    saveFormState,
    listFormStates,
    getFormState,
    deleteFormState 
  } = useCampaignFormState();
  
  // Load the list of saved forms when opening the load dialog
  useEffect(() => {
    if (showLoadDialog) {
      loadSavedFormsList();
    }
  }, [showLoadDialog]);
  
  // Load the list of saved forms
  const loadSavedFormsList = async () => {
    try {
      const formStates = await listFormStates();
      setSavedForms(formStates);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load saved forms',
        variant: 'destructive'
      });
    }
  };
  
  // Handle saving the current form state
  const handleSaveFormState = async () => {
    try {
      const input = extractFormState({
        ...formData,
        name: saveFormName || `Campaign - ${new Date().toLocaleString()}`
      });
      
      await saveFormState(input);
      
      toast({
        title: 'Success',
        description: 'Form state saved successfully'
      });
      
      setShowSaveDialog(false);
      setSaveFormName('');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save form state',
        variant: 'destructive'
      });
    }
  };
  
  // Handle loading a form state
  const handleLoadFormState = async (id: string) => {
    try {
      const formState = await getFormState(id);
      
      if (formState) {
        onLoadFormState(formState);
        
        toast({
          title: 'Success',
          description: 'Form state loaded successfully'
        });
        
        setShowLoadDialog(false);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load form state',
        variant: 'destructive'
      });
    }
  };
  
  // Handle deleting a form state
  const handleDeleteFormState = async (id: string) => {
    try {
      await deleteFormState(id);
      
      toast({
        title: 'Success',
        description: 'Form state deleted successfully'
      });
      
      // Refresh the list
      loadSavedFormsList();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete form state',
        variant: 'destructive'
      });
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="flex items-center space-x-2">
      {/* Save Button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowSaveDialog(true)}
      >
        Save Template
      </Button>
      
      {/* Load Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowLoadDialog(true)}
      >
        Load Template
      </Button>
      
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-container-bg border border-border-dark text-text-white">
          <DialogHeader>
            <DialogTitle>Save Campaign Template</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <label 
              htmlFor="formName" 
              className="block text-sm font-medium text-text-light-gray mb-1"
            >
              Template Name
            </label>
            <Input
              id="formName"
              value={saveFormName}
              onChange={(e) => setSaveFormName(e.target.value)}
              placeholder="My Campaign Template"
              className="bg-deep-black border-border-dark text-text-white"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFormState}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="bg-container-bg border border-border-dark text-text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Campaign Template</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {savedForms.items.length === 0 ? (
              <p className="text-center text-text-light-gray py-8">
                No saved templates found.
              </p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {savedForms.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-dark hover:bg-deep-black transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-text-white">
                        {item.name || 'Unnamed Template'}
                      </h3>
                      <p className="text-sm text-text-light-gray">
                        {formatDate(item.savedAt)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoadFormState(item.id)}
                        disabled={loading}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFormState(item.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLoadDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}