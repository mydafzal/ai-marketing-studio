import { LeadForm } from './leadFormTypes';

// Function to format lead forms from API response
export const formatLeadForms = (formData: any[]): LeadForm[] => {
  return formData.map(form => ({
    id: form.id || form.form_id,
    name: form.name || form.form_name,
    display_name: form.display_name || form.name || 'Unnamed Form',
    formatted_date: form.formatted_date || new Date(form.created_time).toLocaleDateString(),
    question_count: form.question_count || 0,
    questions_preview: form.questions_preview || [],
    collects: form.collects || '',
    status: form.status || 'UNKNOWN',
    page_id: form.page_id || ''
  }));
};

// Search lead forms by query - client-side implementation
export const searchFormsLocally = (forms: LeadForm[], query: string): LeadForm[] => {
  if (!query.trim()) return forms;
  
  const lowercaseQuery = query.toLowerCase();
  
  return forms.filter(form => 
    form.name.toLowerCase().includes(lowercaseQuery) || 
    form.display_name.toLowerCase().includes(lowercaseQuery) || 
    form.id.toLowerCase().includes(lowercaseQuery)
  );
};

// Function to fetch all lead forms with pagination
export const fetchAllLeadForms = async (afterCursor?: string | null): Promise<{
  forms: LeadForm[],
  paginationCursor: string | null,
  hasMore: boolean
}> => {
  try {
    // Build URL with appropriate parameters
    const url = afterCursor 
      ? `/api/fasty-bot/proxy-get-facebook-lead-forms?after=${afterCursor}&paginate_till_end=true`
      : '/api/fasty-bot/proxy-get-facebook-lead-forms';
    
    const response = await fetch(url, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch lead forms');
    }
    
    const data = await response.json();
    
    // Handle the new response structure with forms and pagination
    if (!data.forms) {
      throw new Error('Invalid response format from server');
    }
    
    // Save pagination cursor for next page if available
    let nextCursor = null;
    let hasMore = false;
    
    if (data.pagination?.cursors?.after) {
      nextCursor = data.pagination.cursors.after;
      hasMore = true;
    }
    
    // Format the lead forms data
    const formattedForms = formatLeadForms(data.forms);
    
    return {
      forms: formattedForms,
      paginationCursor: nextCursor,
      hasMore: hasMore
    };
  } catch (error) {
    console.error('Error fetching lead forms:', error);
    throw error;
  }
};