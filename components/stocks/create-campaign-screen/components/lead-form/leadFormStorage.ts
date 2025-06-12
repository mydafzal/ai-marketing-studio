import { LeadForm, StoredLeadForm, STORED_LEAD_FORM_KEY } from './leadFormTypes';

// Function to save the selected lead form to local storage
export const saveLeadFormToLocalStorage = (form: LeadForm, pageId: string) => {
  if (!form || !pageId) return;
  
  const storedForm: StoredLeadForm = {
    formId: form.id,
    pageId: pageId,
    formName: form.name,
    displayName: form.display_name,
    formattedDate: form.formatted_date,
    questionCount: form.question_count,
    collects: form.collects
  };
  
  try {
    localStorage.setItem(STORED_LEAD_FORM_KEY, JSON.stringify(storedForm));
  } catch (error) {
    console.error('Error saving lead form to local storage:', error);
  }
};

// Function to get the previously selected lead form from local storage
export const getStoredLeadForm = (pageId: string): StoredLeadForm | null => {
  try {
    const storedFormJson = localStorage.getItem(STORED_LEAD_FORM_KEY);
    if (!storedFormJson) return null;
    
    const storedForm: StoredLeadForm = JSON.parse(storedFormJson);
    
    // Only return if the page ID matches
    if (storedForm.pageId === pageId) {
      return storedForm;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving lead form from local storage:', error);
    return null;
  }
};