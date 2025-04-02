# Create Campaign Screen Component

This directory contains a modular implementation of the Create Campaign Screen for the Reeply AI application.

## Directory Structure

```
create-campaign-screen/
├── README.md                   # This documentation
├── index.ts                    # Export main component
├── CreateCampaignScreen.tsx    # Main component
├── types.ts                    # Shared types
├── utils.ts                    # Utility functions
├── server/                     # Server components 
│   └── index.tsx               # Server component that renders CreateCampaignScreen
├── hooks/                      # Custom hooks
│   └── useMediaUpload.tsx      # Media upload functionality
└── components/                 # Sub-components
    ├── AudienceSettings.tsx    # Audience settings component
    ├── BudgetSettings.tsx      # Budget settings component
    ├── CampaignSettingsContent.tsx # Settings content component
    ├── CampaignSettingsModal.tsx  # Modal component
    ├── CreateCampaignForm.tsx  # Main form component
    ├── CreateTab.tsx           # Create tab component
    ├── CreativeSettings.tsx    # Creative settings component
    ├── Header.tsx              # Tab headers component
    ├── LoadingScreen.tsx       # Loading screen component
    ├── ObjectiveSettings.tsx   # Objective settings component
    ├── PlacementSettings.tsx   # Placement settings component
    └── ReviewScreen.tsx        # Review tab component
```

## Component Hierarchy

- **CreateCampaignScreen**: Top-level component that integrates with the application's side panel
  - **CreateCampaignForm**: Main component that manages state and renders sub-components
    - **Header**: Renders the tab navigation
    - **CreateTab**: Renders the campaign creation form
    - **LoadingScreen**: Displays loading animation with steps
    - **ReviewScreen**: Renders the campaign review screen
      - **CampaignSettingsContent**: Displays campaign settings in a readable format
    - **CampaignSettingsModal**: Modal for editing campaign settings
      - **ObjectiveSettings**: Campaign objective selector
      - **AudienceSettings**: Audience targeting settings
      - **PlacementSettings**: Ad placement settings
      - **BudgetSettings**: Budget configuration
      - **CreativeSettings**: Creative content settings

## Hooks

- **useMediaUpload**: Manages media upload functionality, including file selection, progress tracking, and preview generation

## Types

The `types.ts` file defines TypeScript types used throughout the components:

- **AspectRatio**: Possible aspect ratios for media items
- **MediaItem**: Structure for uploaded media
- **EditSection**: Types of editable sections
- **Gender**: Gender selection options
- **CampaignTab**: Tab selection for the main component
- **PreviewTab**: Tab selection for the review screen

## Server Components

- **server/index.tsx**: Server component that renders the CreateCampaignScreen within a BotCard

## Usage

To use the CreateCampaignScreen component:

```jsx
import { CreateCampaignScreen } from '@/components/stocks/create-campaign-screen';

function MyComponent() {
  return <CreateCampaignScreen />;
}
```

For server components:

```jsx
import showCreateCampaignScreen from '@/components/stocks/create-campaign-screen/server';

// Use with server actions or in server components
```

## Expanding Functionality

When implementing real functionality:

1. Update the useMediaUpload hook to perform actual file uploads
2. Connect form submissions to API endpoints
3. Implement validation and error handling
4. Add real user feedback mechanisms
5. Integrate with analytics tracking

Each component is designed to be extensible with minimal changes to the overall architecture.