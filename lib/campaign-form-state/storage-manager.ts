/**
 * Campaign Form State Storage Manager
 * Provides methods to save, retrieve, and manage campaign form states in KV database
 */

import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';
import { 
  CampaignFormState, 
  CampaignFormStateList, 
  SaveFormStateInput, 
  FormStateResponse
} from './schema';

// KV namespace for campaign form states
const NAMESPACE = 'campaign-form-states';

// Helper to generate KV keys
const getFormStateKey = (userId: string, formStateId: string) => 
  `${NAMESPACE}:${userId}:${formStateId}`;

const getUserListKey = (userId: string) => 
  `${NAMESPACE}:${userId}:list`;

/**
 * Class to manage campaign form state storage
 */
export class CampaignFormStateManager {
  /**
   * Save a campaign form state to KV
   */
  public static async saveFormState(
    userId: string,
    input: SaveFormStateInput
  ): Promise<FormStateResponse> {
    try {
      // Generate a UUID for the form state
      const formStateId = uuidv4();
      
      // Create the form state object
      const formState: CampaignFormState = {
        ...input.formState,
        id: formStateId,
        userId,
        savedAt: Date.now(),
        name: input.name,
      };
      
      // Get the user's list of form states
      const userListKey = getUserListKey(userId);
      let list: CampaignFormStateList = await kv.get(userListKey) || { items: [] };
      
      // Add the form state to the list
      list.items.push({
        id: formStateId,
        name: input.name,
        savedAt: formState.savedAt
      });
      
      // Save the form state and update the list
      const formStateKey = getFormStateKey(userId, formStateId);
      await Promise.all([
        kv.set(formStateKey, formState),
        kv.set(userListKey, list)
      ]);
      
      return {
        success: true,
        formStateId,
        message: 'Form state saved successfully'
      };
    } catch (error) {
      console.error('Error saving form state:', error);
      return {
        success: false,
        error: 'Failed to save form state'
      };
    }
  }
  
  /**
   * Get a campaign form state by ID
   */
  public static async getFormState(
    userId: string,
    formStateId: string
  ): Promise<CampaignFormState | null> {
    try {
      const formStateKey = getFormStateKey(userId, formStateId);
      return await kv.get(formStateKey);
    } catch (error) {
      console.error('Error retrieving form state:', error);
      return null;
    }
  }
  
  /**
   * Get all campaign form states for a user
   */
  public static async listFormStates(
    userId: string
  ): Promise<CampaignFormStateList> {
    try {
      const userListKey = getUserListKey(userId);
      const list: CampaignFormStateList = await kv.get(userListKey) || { items: [] };
      
      // Sort by most recent first
      list.items.sort((a, b) => b.savedAt - a.savedAt);
      
      return list;
    } catch (error) {
      console.error('Error listing form states:', error);
      return { items: [] };
    }
  }
  
  /**
   * Delete a campaign form state
   */
  public static async deleteFormState(
    userId: string,
    formStateId: string
  ): Promise<FormStateResponse> {
    try {
      const formStateKey = getFormStateKey(userId, formStateId);
      const userListKey = getUserListKey(userId);
      
      // Get the user's list
      let list: CampaignFormStateList = await kv.get(userListKey) || { items: [] };
      
      // Remove the form state from the list
      list.items = list.items.filter(item => item.id !== formStateId);
      
      // Delete the form state and update the list
      await Promise.all([
        kv.del(formStateKey),
        kv.set(userListKey, list)
      ]);
      
      return {
        success: true,
        message: 'Form state deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting form state:', error);
      return {
        success: false,
        error: 'Failed to delete form state'
      };
    }
  }
  
  /**
   * Update a campaign form state
   */
  public static async updateFormState(
    userId: string,
    formStateId: string,
    updates: Partial<SaveFormStateInput>
  ): Promise<FormStateResponse> {
    try {
      const formStateKey = getFormStateKey(userId, formStateId);
      
      // Get the current form state
      const currentFormState: CampaignFormState | null = await kv.get(formStateKey);
      
      if (!currentFormState) {
        return {
          success: false,
          error: 'Form state not found'
        };
      }
      
      // Update the form state
      const updatedFormState: CampaignFormState = {
        ...currentFormState,
        ...updates.formState,
        name: updates.name || currentFormState.name,
      };
      
      // If the name changed, update the list too
      if (updates.name && updates.name !== currentFormState.name) {
        const userListKey = getUserListKey(userId);
        let list: CampaignFormStateList = await kv.get(userListKey) || { items: [] };
        
        // Update the name in the list
        list.items = list.items.map(item => 
          item.id === formStateId 
            ? { ...item, name: updates.name } 
            : item
        );
        
        // Save both the updated form state and list
        await Promise.all([
          kv.set(formStateKey, updatedFormState),
          kv.set(userListKey, list)
        ]);
      } else {
        // Just update the form state
        await kv.set(formStateKey, updatedFormState);
      }
      
      return {
        success: true,
        message: 'Form state updated successfully'
      };
    } catch (error) {
      console.error('Error updating form state:', error);
      return {
        success: false,
        error: 'Failed to update form state'
      };
    }
  }
}