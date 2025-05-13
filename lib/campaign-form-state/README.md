# Campaign Form State Module

This module provides a set of tools for managing campaign form state. It allows for saving, loading, and restoring form state to a KV database.

## Components

- **Schema**: Type definitions for campaign form state data
- **Storage Manager**: Backend service for interacting with the KV store
- **Form Extractor**: Utilities for extracting form data from UI components
- **Client Hook**: React hook for interacting with the API

## Usage

### Server-side Storage

```typescript
import { CampaignFormStateManager } from '../lib/campaign-form-state';

// Save a form state
const result = await CampaignFormStateManager.saveFormState(userId, formStateData);

// Get a form state
const formState = await CampaignFormStateManager.getFormState(userId, formStateId);

// List all form states for a user
const formStates = await CampaignFormStateManager.listFormStates(userId);

// Delete a form state
const result = await CampaignFormStateManager.deleteFormState(userId, formStateId);
```

### Client-side Integration

```tsx
// In your form component
import { useFormStateManager } from '../hooks/useFormStateManager';
import { FormStateManager } from './FormStateManager';

function MyFormComponent() {
  // State declarations...
  
  // Setup form state manager
  const formStateManager = useFormStateManager({
    // Pass all state setters and current values
    // ...
  });
  
  return (
    <div>
      {/* Form State Manager UI */}
      <FormStateManager 
        formData={formStateManager.getCurrentFormData()}
        onLoadFormState={formStateManager.loadFormState}
      />
      
      {/* Rest of your form */}
    </div>
  );
}
```

## API Endpoints

- `POST /api/campaign-form-state` - Save a form state
- `GET /api/campaign-form-state` - List all form states for the current user
- `GET /api/campaign-form-state/[id]` - Get a specific form state
- `PUT /api/campaign-form-state/[id]` - Update a form state
- `DELETE /api/campaign-form-state/[id]` - Delete a form state