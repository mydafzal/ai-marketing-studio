/**
 * Campaign Form State Hook
 * 
 * Client-side hook for interacting with campaign form state API
 */

'use client';

import { useState, useCallback } from 'react';
import { CampaignFormState, CampaignFormStateList, SaveFormStateInput } from './schema';

export function useCampaignFormState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save a new form state
   */
  const saveFormState = useCallback(async (input: SaveFormStateInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/campaign-form-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save form state');
      }
      
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * List all saved form states
   */
  const listFormStates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/campaign-form-state');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to list form states');
      }
      
      setLoading(false);
      return data.formStates as CampaignFormStateList;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Get a specific form state by ID
   */
  const getFormState = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/campaign-form-state/${id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get form state');
      }
      
      setLoading(false);
      return data.formState as CampaignFormState;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Update an existing form state
   */
  const updateFormState = useCallback(async (id: string, input: SaveFormStateInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/campaign-form-state/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update form state');
      }
      
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Delete a form state
   */
  const deleteFormState = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/campaign-form-state/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete form state');
      }
      
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    saveFormState,
    listFormStates,
    getFormState,
    updateFormState,
    deleteFormState,
  };
}