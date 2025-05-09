export const validateUrl = (url: string): { isValid: boolean; error: string } => {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required' }
  }

  try {
    const urlObj = new URL(url)
    if (!urlObj.protocol.startsWith('https')) {
      return { isValid: false, error: 'URL must start with https://' }
    }
    return { isValid: true, error: '' }
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' }
  }
}

export const validatePersonaForm = (formData: {
  name?: string
  companyName: string
  websiteLink: string
  privacyPolicyLink: string
  language: string
}) => {
  const errors = {
    name: '',
    companyName: '',
    websiteLink: '',
    privacyPolicyLink: '',
    language: '',
    locations: ''
  }
  let hasErrors = false

  // Profile name validation (optional - will be auto-populated if empty)
  
  // Company name validation
  if (!formData.companyName.trim()) {
    errors.companyName = 'Company name is required'
    hasErrors = true
  }

  // Website URL validation
  const websiteValidation = validateUrl(formData.websiteLink)
  if (!websiteValidation.isValid) {
    errors.websiteLink = websiteValidation.error
    hasErrors = true
  }

  // Privacy policy URL validation
  const privacyValidation = validateUrl(formData.privacyPolicyLink)
  if (!privacyValidation.isValid) {
    errors.privacyPolicyLink = privacyValidation.error
    hasErrors = true
  }

  // Language validation
  if (!formData.language) {
    errors.language = 'Language selection is required'
    hasErrors = true
  }

  return { errors, hasErrors }
} 