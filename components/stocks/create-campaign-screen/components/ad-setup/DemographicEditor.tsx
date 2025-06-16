import React, { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MasterFlowResponse, Gender } from '../../types';
import * as Slider from '@radix-ui/react-slider';

interface DemographicEditorProps {
  masterFlowData: MasterFlowResponse | null;
  isRecruitmentCampaign: boolean;
  ageRange: [number, number];
  gender: Gender;
  onSave?: (data: { minAge: number; maxAge: number; includeMale: boolean; includeFemale: boolean }) => void;
}

const DemographicEditor: React.FC<DemographicEditorProps> = ({
  masterFlowData,
  isRecruitmentCampaign,
  ageRange,
  gender,
  onSave
}) => {
  // Local state for editing
  const [minAge, setMinAge] = useState<number>(
    Math.max(18, Math.min(65, masterFlowData?.suggested_age_min || ageRange[0]))
  );
  const [maxAge, setMaxAge] = useState<number>(
    Math.max(18, Math.min(65, masterFlowData?.suggested_age_max || ageRange[1]))
  );
  const [includeMale, setIncludeMale] = useState<boolean>(masterFlowData?.include_male_gender ?? true);
  const [includeFemale, setIncludeFemale] = useState<boolean>(masterFlowData?.include_female_gender ?? true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // We no longer need this effect because the slider component
  // enforces min <= max automatically via minStepsBetweenThumbs

  // Ensure at least one gender is always selected
  const handleGenderChange = (isMale: boolean, isSelected: boolean) => {
    if (isMale) {
      // If trying to uncheck male, make sure female is checked
      if (!isSelected && !includeFemale) {
        setIncludeFemale(true);
      }
      setIncludeMale(isSelected);
    } else {
      // If trying to uncheck female, make sure male is checked
      if (!isSelected && !includeMale) {
        setIncludeMale(true);
      }
      setIncludeFemale(isSelected);
    }
  };

  const handleSave = async () => {
    // Validate age range
    const validMinAge = Math.max(18, Math.min(65, minAge));
    const validMaxAge = Math.max(validMinAge, Math.min(65, maxAge));
    
    // Ensure at least one gender is selected
    const validIncludeMale = includeMale || !includeFemale;
    const validIncludeFemale = includeFemale || !includeMale;

    if (!masterFlowData?.campaign_flow_session_id) {
      alert('Campaign session ID is missing. Cannot save demographics.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/fasty-bot/proxy-adjust-demographics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_creation_flow_session_id: masterFlowData.campaign_flow_session_id,
          min_age: validMinAge,
          max_age: validMaxAge,
          include_male: validIncludeMale,
          include_female: validIncludeFemale
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save demographics');
      }

      const data = await response.json();
      console.log('Demographics saved successfully:', data);
      
      // Show success message
      alert('Demographics saved successfully!');
      
      // Call onSave callback if provided
      if (onSave) {
        onSave({ 
          minAge: validMinAge, 
          maxAge: validMaxAge, 
          includeMale: validIncludeMale, 
          includeFemale: validIncludeFemale 
        });
      }
    } catch (error) {
      console.error('Error saving demographics:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save demographics'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-start mb-3">
      <Users className="size-5 text-coral mr-3 mt-1" />
      <div className="w-full">
        <h4 className="font-medium text-text-white">Demographics</h4>
        {isRecruitmentCampaign ? (
          <p className="text-text-light-gray">
            Age: {masterFlowData?.suggested_age_min || ageRange[0]} -{' '}
            {masterFlowData?.suggested_age_max || ageRange[1]}
            <br />
            Gender:{' '}
            {masterFlowData
                ? (masterFlowData.include_male_gender && masterFlowData.include_female_gender 
                    ? 'Male and Female' 
                    : (masterFlowData.include_male_gender ? 'Male' : 'Female'))
                : gender}
          </p>
        ) : (
          <>
            <div className="mb-4 mt-2">
              <label className="block text-sm text-text-light-gray mb-2">Age Range</label>
              
              <div className="mb-6 relative w-3/4">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  defaultValue={[minAge, maxAge]}
                  value={[minAge, maxAge]}
                  onValueChange={([min, max]) => {
                    setMinAge(min);
                    setMaxAge(max);
                  }}
                  min={18}
                  max={65}
                  step={1}
                  minStepsBetweenThumbs={1}
                  aria-label="Age Range"
                >
                  <Slider.Track className="bg-dark-bg relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-coral rounded-full h-full" />
                  </Slider.Track>
                  
                  <Slider.Thumb 
                    className="block w-6 h-6 bg-white rounded-full shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-coral"
                    aria-label="Minimum age"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-coral px-2 py-1 rounded text-white font-medium">
                      {minAge}
                    </div>
                  </Slider.Thumb>
                  
                  <Slider.Thumb 
                    className="block w-6 h-6 bg-white rounded-full shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-coral"
                    aria-label="Maximum age"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-coral px-2 py-1 rounded text-white font-medium">
                      {maxAge}
                    </div>
                  </Slider.Thumb>
                </Slider.Root>
                
                <div className="flex justify-between mt-1 text-sm font-medium text-text-light-gray">
                  <span>18</span>
                  <span>65+</span>
                </div>
              </div>
            </div>
            
            <div className="mb-5">
              <label className="block text-sm text-text-light-gray mb-2">Gender</label>
              <div className="flex space-x-6 mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 mr-2 accent-coral"
                    checked={includeMale}
                    onChange={(e) => handleGenderChange(true, e.target.checked)}
                  />
                  <span className="text-text-light-gray text-base">Male</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 mr-2 accent-coral"
                    checked={includeFemale}
                    onChange={(e) => handleGenderChange(false, e.target.checked)}
                  />
                  <span className="text-text-light-gray text-base">Female</span>
                </label>
              </div>
              
              <Button 
                className="bg-coral hover:bg-coral/90 text-white px-6 py-2 rounded-md text-sm font-medium"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Demographics'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DemographicEditor;