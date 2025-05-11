export interface LeadFormQuestion {
  label: string;
  type: string;
}

export interface LeadForm {
  id: string;
  name: string;
  display_name: string;
  formatted_date: string;
  question_count: number;
  questions_preview?: LeadFormQuestion[];
  collects?: string;
  status?: string;
  page_id?: string;
}

// Type for storing lead form in local storage
export interface StoredLeadForm {
  formId: string;
  pageId: string;
  formName: string;
  displayName: string;
  formattedDate: string;
  questionCount: number;
  collects?: string;
}

// Local storage key
export const STORED_LEAD_FORM_KEY = 'reeply_selected_lead_form';