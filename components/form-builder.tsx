'use client'

import { useState, useRef } from 'react';
import { readStreamableValue } from 'ai/rsc'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Cross1Icon, Pencil1Icon } from '@radix-ui/react-icons';
import { QuestionOption, LeadgenFrom } from '@/lib/types';
import { useActions, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/actions'
import { IconSpinner } from '@/components/ui/icons'
import { leadGenFormFieldTypes, leadGenFormLocales } from '@/data'
import { getUserDetail } from '@/app/actions'

interface Field {
  id: string;
  type: string;
  label?: string;
  options?: string[];
}

interface FormBuilderUiProps {
  formBuilder: LeadgenFrom;
  success: boolean;
}

interface FormBuilderProps {
  formBuilderUiProps?: FormBuilderUiProps;
  toolCallId: string;
  isReadOnly?: boolean;
}

export default function FormBuilder({
  formBuilderUiProps,
  toolCallId,
  isReadOnly
}: FormBuilderProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { formBuilder } = formBuilderUiProps || {};
  const [formData, setFormData] = useState<LeadgenFrom | undefined>(formBuilder);
  const { confirmCreateLeadgenForm } = useActions();
  const [_, setMessages] = useUIState<typeof AI>();

  const [fields, setFields] = useState<Field[]>(
    formData?.questions.map(field => ({
      id: field.key,
      type: field.type,
      ...(field.type === 'CUSTOM' ? { label: field.label } : {})
    })) || [
      { id: 'name', type: 'FULL_NAME' },
      { id: 'email', type: 'EMAIL' },
      { id: 'phone', type: 'PHONE' }
    ]
  );
  
  const [showModal, setShowModal] = useState(false);
  const [currentInputType, setCurrentInputType] = useState<'text' | 'select'>('text');
  const [currentFieldType, setCurrentFieldType] = useState('CUSTOM');
  const [modalFieldLabel, setModalFieldLabel] = useState('');
  const [modalFieldId, setModalFieldId] = useState('');
  const [optionList, setOptionList] = useState<string[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [engagementTitle, setEngagementTitle] = useState(formData?.context_card?.title || '');
  const [engagementText, setEngagementText] = useState(formData?.context_card?.content || '');
  const [thankyouText, setThankyouText] = useState(formData?.thank_you_page?.body || '');
  const [privacyLink, setPrivacyLink] = useState(formData?.privacy_policy?.url || '');
  const [locale, setLocale] = useState(formData?.locale || 'en_US');

  const modalOptionInput = useRef<HTMLInputElement>(null);

  const openFieldModal = (inputType: 'text' | 'select', fieldId?: string) => {
    setCurrentInputType(inputType);
    setCurrentFieldType('CUSTOM');
    setShowModal(true);
    setModalFieldLabel('');
    setModalFieldId('');
    setOptionList([]);
    setErrorMessage(null);
    if (fieldId) {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        setCurrentInputType(field.options?.length ? 'select' : 'text');
        setCurrentFieldType(field.type);
        setModalFieldLabel(field.label || '');
        setModalFieldId(field.id);
        setOptionList(field.options || []);
        setEditingFieldId(fieldId);
      }
    } else {
      setEditingFieldId(null);
    }
  };

  const handleFieldTypeChange = (value: string) => {
    setCurrentFieldType(value);
    setModalFieldId(value.toLowerCase());
    if (value !== 'CUSTOM') {
      setModalFieldLabel('');
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
      setErrorMessage('Please enter field name.');
      return;
    }
    if (fields.some(f => f.id === modalFieldId && f.id !== editingFieldId)) {
      setErrorMessage('A field with this key already exists. Please use a unique key.');
      return;
    }
    if (currentFieldType === 'CUSTOM' && !modalFieldLabel) {
      setErrorMessage('Please enter a field label for custom fields.');
      return;
    }
    if (currentFieldType === 'select' && optionList.length === 0) {
      setErrorMessage('Please add at least one option.');
      return;
    }

    const newField: Field = {
      id: modalFieldId,
      type: currentFieldType,
      ...(currentFieldType === 'CUSTOM' && { label: modalFieldLabel }),
      ...(currentInputType === 'select' && { options: optionList }),
    };

    setFields(prev =>
      editingFieldId
        ? prev.map(f => f.id === editingFieldId ? newField : f)
        : [...prev, newField]
    );

    setShowModal(false);
    setErrorMessage(null);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {

    const userDetail = await getUserDetail();
    
    setIsSubmitting(true);
    const id = Date.now();
    let pageId = userDetail?.user?.fbPageId || "119021011189054";
    if (typeof pageId !== "string") {
        pageId = String(pageId);
    }
    const payload = {
      page_id: pageId as string,
      name: "Lead Form " + id,
      questions: fields.map(field => ({
        key: field.id,
        label: field.label,
        type: field.type,
        ...(field.options?.length && { options: field.options?.map((option, idx) => ({ key: idx, label: option, value: option })) as QuestionOption[] })
      })),
      privacy_policy: {
        url: privacyLink, // Make this required in UI. sometime get passed to backend as ""
        link_text: "Privacy Policy"
      },
      context_card: {
        title: engagementTitle,
        style: "PARAGRAPH_STYLE",
        content: engagementText
      },
      follow_up_action_url: "https://www.example.com", // TODO need to investigate this
      thank_you_page: {
        title: "Thank You",
        button_type: 'NONE',
        body: thankyouText
      },
      tracking_parameters: {},
      legal_content_id: "",
      locale: locale,
      status: "ACTIVE"
    };
    const response = await confirmCreateLeadgenForm(toolCallId, payload);
    setMessages(currentMessages => [...currentMessages, response.newMessage]);
    for await (const updatedForm of readStreamableValue<LeadgenFrom>(
      response.response
    )) {
      if (updatedForm) {
        setFormData(updatedForm);
      }
    }
    setIsSubmitting(false);
  };

  const renderFieldPreview = (field: Field) => (
    <div 
      key={field.id} 
      className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 mb-4 rounded-lg relative hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex justify-between items-center mb-2">
        <Label className="text-zinc-800 dark:text-zinc-200 font-medium">
          {field.type === 'CUSTOM' ? field.label : leadGenFormFieldTypes.find(t => t.value === field.type)?.label}
        </Label>
        {field.type !== 'EMAIL' && (
          <div className="flex gap-2">
            <Button
              disabled={isReadOnly}
              onClick={() => openFieldModal(field.options?.length ? 'select' : 'text', field.id)}
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <Pencil1Icon className="h-4 w-4" />
            </Button>
            <Button
              disabled={isReadOnly}
              onClick={() => removeField(field.id)}
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <Cross1Icon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {field.options?.length ? (
        <Select disabled>
          <SelectTrigger className="w-full bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600">
            <SelectValue placeholder={field.options[0]} />
          </SelectTrigger>
        </Select>
      ) : (
        <Input 
          disabled 
          placeholder={field.type === 'CUSTOM' ? field.label : leadGenFormFieldTypes.find(t => t.value === field.type)?.label} 
          className="bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600"
        />
      )}
    </div>
  );

  return (
    <div className="mx-auto dark:bg-zinc-900 p-6 rounded-xl">
      {step === 1 ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 p-6 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-white">Add Fields</h2>
            <div className="space-y-4">
              <Button 
                disabled={isReadOnly} 
                onClick={() => openFieldModal('text')} 
                className="w-full bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
              >
                Add Text Field
              </Button>
              <Button 
                disabled={isReadOnly} 
                onClick={() => openFieldModal('select')} 
                className="w-full bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
              >
                Add Select Field
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2 p-6 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-white">Form Preview</h2>
            <div className="space-y-4">
              {fields.map(renderFieldPreview)}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <Label htmlFor="engagement-title" className="text-zinc-800 dark:text-white">Form Title</Label>
            <Input
              id="engagement-title"
              value={engagementTitle}
              disabled={isReadOnly}
              onChange={(e) => setEngagementTitle(e.target.value)}
              placeholder="Type a relevant and captivating title for your form..."
              className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="engagement-text" className="text-zinc-800 dark:text-white">Engaging Text</Label>
            <Textarea
              id="engagement-text"
              value={engagementText}
              disabled={isReadOnly}
              onChange={(e) => setEngagementText(e.target.value)}
              placeholder="This is the main text people will see. Capture their attention..."
              className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thankyou-text" className="text-zinc-800 dark:text-white">Thank You Page Text</Label>
            <Textarea
              id="thankyou-text"
              disabled={isReadOnly}
              value={thankyouText}
              onChange={(e) => setThankyouText(e.target.value)}
              placeholder="Enter thank you message here..."
              className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="privacy-link" className="text-zinc-800 dark:text-white">Privacy Policy Link</Label>
            <Input
              id="privacy-link"
              disabled={isReadOnly}
              value={privacyLink}
              onChange={(e) => setPrivacyLink(e.target.value)}
              placeholder="Enter privacy policy URL"
              className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              required={true}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale" className="text-zinc-800 dark:text-white">Language</Label>
            <Select
              value={locale}
              onValueChange={(value) => setLocale(value)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="w-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" id="locale">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {leadGenFormLocales.map((localeOption) => (
                  <SelectItem key={localeOption.value} value={localeOption.value}>
                    {localeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    <div className="mt-6 flex items-center justify-end gap-4">
        {step === 1 ? (
          <Button 
            onClick={() => setStep(2)}
            className="bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white px-6"
          >
            Next
          </Button>
        ) : (
          <>
            <Button 
              onClick={() => setStep(1)} 
              variant="outline"
              className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Previous
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isReadOnly}
              className="bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white px-6"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <IconSpinner className="h-4 w-4" />
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit'
              )}
            </Button>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-white">
              {editingFieldId ? 'Edit' : 'Add'} {currentInputType === 'select' ? 'Select' : 'Text'} Field
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-800 dark:text-zinc-200">Field Type</Label>
                <Select value={currentFieldType} onValueChange={handleFieldTypeChange}>
                  <SelectTrigger className="w-full bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadGenFormFieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-800 dark:text-zinc-200">Field Name</Label>
                <Input
                  value={modalFieldId}
                  onChange={(e) => setModalFieldId(e.target.value)}
                  placeholder="Enter field name"
                  className="bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600"
                />
              </div>

              {currentFieldType === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label className="text-zinc-800 dark:text-zinc-200">Field Label</Label>
                  <Input
                    value={modalFieldLabel}
                    onChange={(e) => setModalFieldLabel(e.target.value)}
                    placeholder="Enter field label"
                    className="bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600"
                  />
                </div>
              )}

              {currentFieldType === 'CUSTOM' && currentInputType === 'select' && (
                <div className="space-y-2">
                  <Label className="text-zinc-800 dark:text-zinc-200">Options</Label>
                  <div className="flex gap-2">
                    <Input 
                      ref={modalOptionInput}
                      placeholder="Enter option"
                      className="bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600"
                    />
                    <Button 
                      onClick={addOption}
                      className="px-4 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    {optionList.map((option, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-700 rounded-lg"
                      >
                        <span className="text-zinc-800 dark:text-zinc-200">{option}</span>
                        <Button
                          onClick={() => removeOption(index)}
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                        >
                          <Cross1Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setErrorMessage(null);
                  }}
                  variant="outline"
                  className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveField}
                  className="bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}