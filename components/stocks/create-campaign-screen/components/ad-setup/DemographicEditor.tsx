import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MasterFlowResponse, Gender } from '../../types';

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
  const [minAge, setMinAge] = useState<number>(masterFlowData?.suggested_age_min || ageRange[0]);
  const [maxAge, setMaxAge] = useState<number>(masterFlowData?.suggested_age_max || ageRange[1]);
  const [includeMale, setIncludeMale] = useState<boolean>(masterFlowData?.include_male_gender ?? true);
  const [includeFemale, setIncludeFemale] = useState<boolean>(masterFlowData?.include_female_gender ?? true);

  const handleSave = () => {
    if (onSave) {
      onSave({ minAge, maxAge, includeMale, includeFemale });
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
            <div className="mb-2 mt-2">
              <label className="block text-sm text-text-light-gray mb-1">Age Range</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  min="18" 
                  max="65" 
                  value={minAge} 
                  onChange={(e) => setMinAge(Math.min(parseInt(e.target.value) || 18, maxAge))} 
                  className="w-16 bg-dark-bg border border-border-dark rounded px-2 py-1"
                />
                <span className="text-text-light-gray">to</span>
                <input 
                  type="number" 
                  min="18" 
                  max="65" 
                  value={maxAge} 
                  onChange={(e) => setMaxAge(Math.max(parseInt(e.target.value) || 18, minAge))} 
                  className="w-16 bg-dark-bg border border-border-dark rounded px-2 py-1"
                />
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
                    onChange={(e) => setIncludeMale(e.target.checked)}
                  />
                  <span className="text-text-light-gray">Male</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 mr-2 accent-coral"
                    checked={includeFemale}
                    onChange={(e) => setIncludeFemale(e.target.checked)}
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