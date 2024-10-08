'use client'

import { useState, useRef } from 'react';
import { nanoid } from 'nanoid';
import { BotCard } from '@/components/stocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Field {
  id: string;
  type: 'text' | 'select';
  label: string;
  options?: string[];
}

export default function FormBuilder() {
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState<Field[]>([
    { id: 'field-name', type: 'text', label: 'Name' },
    { id: 'field-email', type: 'text', label: 'Email' },
    { id: 'field-phone', type: 'text', label: 'Phone Number' },
  ]);
  const [currentFieldType, setCurrentFieldType] = useState<'text' | 'select'>('text');
  const [showModal, setShowModal] = useState(false);
  const [modalFieldLabel, setModalFieldLabel] = useState('');
  const [optionList, setOptionList] = useState<string[]>([]);
  const [engagementText, setEngagementText] = useState('');
  const [thankyouText, setThankyouText] = useState('');
  const [privacyLink, setPrivacyLink] = useState('');

  const modalOptionInput = useRef<HTMLInputElement>(null);

  const openFieldModal = (type: 'text' | 'select') => {
    setCurrentFieldType(type);
    setShowModal(true);
    setModalFieldLabel('');
    setOptionList([]);
  };

  const addOption = () => {
    if (modalOptionInput.current) {
      const optionValue = modalOptionInput.current.value.trim();
      if (optionValue) {
        setOptionList([...optionList, optionValue]);
        modalOptionInput.current.value = '';
      }
    }
  };

  const removeOption = (index: number) => {
    setOptionList(optionList.filter((_, i) => i !== index));
  };

  const saveField = () => {
    if (!modalFieldLabel) {
      alert('Please enter a field label.');
      return;
    }
    if (currentFieldType === 'select' && optionList.length === 0) {
      alert('Please add at least one option.');
      return;
    }

    const newField: Field = {
      id: `field-${nanoid()}`,
      type: currentFieldType,
      label: modalFieldLabel,
      options: currentFieldType === 'select' ? optionList : undefined,
    };

    setFields([...fields, newField]);
    setShowModal(false);
  };

  const handleSubmit = () => {
    console.log('Engagement Text:', engagementText);
    console.log('Fields:', fields);
    console.log('Privacy Policy Link:', privacyLink);
    console.log('Thank You Text:', thankyouText);
    alert('Lead form created successfully!');
  };

  return (
    <BotCard>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Simplified Lead Form Builder</h1>
        
        <div className={step === 1 ? 'block' : 'hidden'}>
          <div className="flex gap-4">
            <div className="flex-1 p-4 border border-gray-200 min-h-[400px] bg-gray-100 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Add Fields</h2>
              <Button onClick={() => openFieldModal('text')} className="w-full mb-2">Add Text Field</Button>
              <Button onClick={() => openFieldModal('select')} className="w-full">Add Select Field</Button>
            </div>
            <div className="flex-1 p-4 border border-gray-200 min-h-[400px] bg-white rounded-lg">
              <h2 className="text-xl font-bold mb-4">Form Preview</h2>
              <div className="space-y-4">
                {fields.map(field => (
                  <div key={field.id} className="bg-gray-50 border border-gray-200 p-4 mb-4 rounded-lg">
                    <Label>{field.label}</Label>
                    {field.type === 'text' ? (
                      <Input disabled placeholder={field.label} />
                    ) : (
                      <Select disabled>
                        {field.options?.map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 text-right">
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>

        <div className={step === 2 ? 'block' : 'hidden'}>
          <div className="mb-6">
            <Label htmlFor="engagement-text">Engaging Text:</Label>
            <Textarea
              id="engagement-text"
              value={engagementText}
              onChange={(e) => setEngagementText(e.target.value)}
              placeholder="Enter engaging text here..."
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="thankyou-text">Thank You Text:</Label>
            <Textarea
              id="thankyou-text"
              value={thankyouText}
              onChange={(e) => setThankyouText(e.target.value)}
              placeholder="Enter thank you message here..."
            />
          </div>
          <div className="mt-6 text-right">
            <Button onClick={() => setStep(1)} className="mr-2">Previous</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {currentFieldType === 'text' ? 'Add Text Field' : 'Add Select Field'}
            </h3>
            <div className="mb-4">
              <Label>Field Label:</Label>
              <Input
                value={modalFieldLabel}
                onChange={(e) => setModalFieldLabel(e.target.value)}
                placeholder="Enter field label"
              />
            </div>
            {currentFieldType === 'select' && (
              <div className="mb-4">
                <Label>Options:</Label>
                <div className="flex mb-2">
                  <Input ref={modalOptionInput} placeholder="Enter option" />
                  <Button onClick={addOption}><i className="fas fa-plus"></i></Button>
                </div>
                <div className="space-y-2">
                  {optionList.map((option, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                      <span>{option}</span>
                      <Button onClick={() => removeOption(index)} variant="ghost"><i className="fas fa-times"></i></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-right">
              <Button onClick={() => setShowModal(false)} className="mr-2">Cancel</Button>
              <Button onClick={saveField}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </BotCard>
  );
}