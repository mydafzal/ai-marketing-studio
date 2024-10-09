'use client'

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cross1Icon, Pencil1Icon } from '@radix-ui/react-icons';
import { QuestionOption, LeadgenFrom }  from '@/lib/types'
interface Field {
  id: string;
  type: 'text' | 'select';
  label: string;
  options?: string[];
}

export default function FormBuilder() {
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState<Field[]>([
    { id: 'name', type: 'text', label: 'Name' },
    { id: 'email', type: 'text', label: 'Email' },
    { id: 'phone', type: 'text', label: 'Phone Number' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [currentFieldType, setCurrentFieldType] = useState<'text' | 'select'>('text');
  const [modalFieldLabel, setModalFieldLabel] = useState('');
  const [modalFieldId, setModalFieldId] = useState('');
  const [optionList, setOptionList] = useState<string[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [engagementText, setEngagementText] = useState('');
  const [thankyouText, setThankyouText] = useState('');
  const [privacyLink, setPrivacyLink] = useState('');
  
  const modalOptionInput = useRef<HTMLInputElement>(null);

  const openFieldModal = (type: 'text' | 'select', fieldId?: string) => {
    setCurrentFieldType(type);
    setShowModal(true);
    setModalFieldLabel('');
    setModalFieldId('');
    setOptionList([]);
    setErrorMessage(null);
    if (fieldId) {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        setModalFieldLabel(field.label);
        setModalFieldId(field.id);
        setOptionList(field.options || []);
        setEditingFieldId(fieldId);
      }
    } else {
      setEditingFieldId(null);
    }
  };

  const addOption = () => {
    if (modalOptionInput.current) {
      const optionValue = modalOptionInput.current.value.trim();
      if (optionValue) {
        setOptionList(prev => [...prev, optionValue]);
        modalOptionInput.current.value = '';
      }
    }
  };

  const removeOption = (index: number) => {
    setOptionList(prev => prev.filter((_, i) => i !== index));
  };

  const saveField = () => {
    if (!modalFieldId) {
      setErrorMessage('Please enter a field key.');
      return;
    }
    if (fields.some(f => f.id === modalFieldId && f.id !== editingFieldId)) {
      setErrorMessage('A field with this key already exists. Please use a unique key.');
      return;
    }
    if (!modalFieldLabel) {
      setErrorMessage('Please enter a field label.');
      return;
    }
    if (currentFieldType === 'select' && optionList.length === 0) {
      setErrorMessage('Please add at least one option.');
      return;
    }

    const newField: Field = {
      id: modalFieldId,
      type: currentFieldType,
      label: modalFieldLabel,
      options: currentFieldType === 'select' ? optionList : undefined,
    };

    setFields(prev => 
      editingFieldId 
        ? prev.map(f => f.id === editingFieldId ? newField : f)
        : [...prev, newField]
    );

    setShowModal(false);
    setErrorMessage(null);
  };
  const createLeadgenForm = async(data: LeadgenFrom) => {
    const url = '/api/fasty-bot/proxy-create-leadgen-form'
    const responseStream = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        page_id: "119021011189054",
        ...data,
      })
    })
    const response = await responseStream.json()
    console.log("🚀 ~ createLeadgenForm ~ response:", response)
    if (response.success && response.data.id) {
    }
  }

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    const id = Date.now();
    const payload = {
      name: "Lead Form" + id, 
      questions: fields.map(field => ({
        key: field.id,
        label: field.label,
        type: 'CUSTOM',
        ...(field.type === 'select' && field.options && { options: field.options?.map((option,idx) => ({ key: idx, label: option, value: option })) as QuestionOption[] })
      })),
      privacy_policy: {
        url: privacyLink,
        link_text: "Privacy Policy"
      },
      context_card: {
        title: "Engagement Card",
        style: "PARAGRAPH_STYLE",
        content: engagementText
      },
      thank_you_page: {
        title: "Thank You",
        button_type: 'NONE',
        body: thankyouText
      },
      tracking_parameters: {},
      follow_up_action_url: "",
      legal_content_id: "",
      locale: "en_US",
      status: "DRAFT"
    };
    await createLeadgenForm(payload);

    console.log('Payload for Facebook Lead Gen Form API:', payload);
  };

  const renderFieldPreview = (field: Field) => (
    <div key={field.id} className="bg-gray-50 border border-gray-200 p-4 mb-4 rounded-lg relative hover:shadow-md">
      <div className="flex justify-between items-center mb-2">
        <Label>{field.label}</Label>
        <div className="flex gap-2">
          <Button onClick={() => openFieldModal(field.type, field.id)} variant="ghost" className="h-8 w-8 p-0">
            <Pencil1Icon />
          </Button>
          <Button onClick={() => removeField(field.id)} variant="ghost" className="h-8 w-8 p-0">
            <Cross1Icon />
          </Button>
        </div>
      </div>
      {field.type === 'text' ? (
        <Input disabled placeholder={field.label} />
      ) : (
        <Select disabled>
          <SelectTrigger className="SelectTrigger" aria-label="Food">
            <SelectValue placeholder={field.options?.[0]} />
          </SelectTrigger>
        </Select>
      )}
    </div>
  );

  return (
    <>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Simplified Lead Form Builder</h1>
        
        {step === 1 ? (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2 p-4 border border-gray-200 bg-gray-100 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Add Fields</h2>
              <Button onClick={() => openFieldModal('text')} className="w-full mb-2">Add Text Field</Button>
              <Button onClick={() => openFieldModal('select')} className="w-full">Add Select Field</Button>
            </div>
            <div className="w-full md:w-1/2 p-4 border border-gray-200 bg-white rounded-lg">
              <h2 className="text-xl font-bold mb-4">Form Preview</h2>
              <div className="space-y-4">
                {fields.map(renderFieldPreview)}
              </div>
            </div>
          </div>
        ) : (
          <>
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
              <Label htmlFor="thankyou-text">Thank You Page Text:</Label>
              <Textarea
                id="thankyou-text"
                value={thankyouText}
                onChange={(e) => setThankyouText(e.target.value)}
                placeholder="Enter thank you message here..."
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="privacy-link">Privacy Policy Link:</Label>
              <Input
                id="privacy-link"
                value={privacyLink}
                onChange={(e) => setPrivacyLink(e.target.value)}
                placeholder="Enter privacy policy URL"
              />
            </div>
          </>
        )}

        <div className="mt-6 text-right">
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Next</Button>
          ) : (
            <>
              <Button onClick={() => setStep(1)} className="mr-2">Previous</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingFieldId ? 'Edit' : 'Add'} {currentFieldType === 'text' ? 'Text Field' : 'Select Field'}
            </h3>
            <div className="mb-4">
              <Label>Field Key:</Label>
              <Input
                value={modalFieldId}
                onChange={(e) => setModalFieldId(e.target.value)}
                placeholder="Enter field key"
              />
            </div>
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
                  <Input ref={modalOptionInput} placeholder="Enter option" className="rounded-tr-none rounded-br-none"/>
                  <Button onClick={addOption} className="rounded-tl-none rounded-bl-none">+</Button>
                </div>
                <div className="space-y-2">
                  {optionList.map((option, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                      <span>{option}</span>
                      <Button onClick={() => removeOption(index)} variant="ghost" className="h-8 w-8 p-0">
                        <Cross1Icon />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {errorMessage}
              </div>
            )}
            <div className="text-right">
              <Button onClick={() => {
                setShowModal(false);
                setErrorMessage(null);
              }} className="mr-2">Cancel</Button>
              <Button onClick={saveField}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}