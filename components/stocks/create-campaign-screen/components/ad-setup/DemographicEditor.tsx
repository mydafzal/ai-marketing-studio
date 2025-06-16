import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
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

  const handleSave = () => {
    // Validate age range
    const validMinAge = Math.max(18, Math.min(65, minAge));
    const validMaxAge = Math.max(validMinAge, Math.min(65, maxAge));
    
    // Ensure at least one gender is selected
    const validIncludeMale = includeMale || !includeFemale;
    const validIncludeFemale = includeFemale || !includeMale;
    
    if (onSave) {
      onSave({ 
        minAge: validMinAge, 
        maxAge: validMaxAge, 
        includeMale: validIncludeMale, 
        includeFemale: validIncludeFemale 
      });
    } else {
      // Default behavior if no onSave provided
      alert('Demographics save functionality will be implemented later');
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
                ? `${masterFlowData.include_male_gender ? 'Male ' : ''}
                   ${masterFlowData.include_female_gender ? 'Female' : ''}`
                : gender}
          </p>
        ) : (
          <>
            <div className="mb-4 mt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-text-light-gray">Age Range</label>
                <div className="text-sm text-text-light-gray">
                  {minAge} - {maxAge}
                </div>
              </div>
              
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
                <Slider.Track className="bg-dark-bg relative grow rounded-full h-1.5">
                  <Slider.Range className="absolute bg-coral rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb 
                  className="block w-5 h-5 bg-white rounded-full shadow-md hover:bg-white focus:outline-none"
                  aria-label="Minimum age"
                />
                <Slider.Thumb 
                  className="block w-5 h-5 bg-white rounded-full shadow-md hover:bg-white focus:outline-none"
                  aria-label="Maximum age"
                />
              </Slider.Root>
              
              <div className="flex justify-between mt-1 text-xs text-text-light-gray">
                <span>18</span>
                <span>65+</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm text-text-light-gray mb-1">Gender</label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 mr-2 accent-coral"
                    checked={includeMale}
                    onChange={(e) => handleGenderChange(true, e.target.checked)}
                  />
                  <span className="text-text-light-gray">Male</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 mr-2 accent-coral"
                    checked={includeFemale}
                    onChange={(e) => handleGenderChange(false, e.target.checked)}
                  />
                  <span className="text-text-light-gray">Female</span>
                </label>
              </div>
            </div>
            
            <Button 
              className="bg-coral hover:bg-coral/90 text-white px-3 py-1 rounded-md text-sm"
              onClick={handleSave}
            >
              Save Demographics
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DemographicEditor;