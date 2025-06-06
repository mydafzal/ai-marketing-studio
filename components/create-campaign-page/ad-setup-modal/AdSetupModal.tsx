import React, { useState, useEffect, useRef } from 'react'
import { X, Pencil, Settings2, Target, Layout, FileText } from 'lucide-react'
import AudienceTargetingSelector from '@/components/stocks/create-campaign-screen/components/AudienceTargetingSelector'

// Props replicated from legacy modal but trimmed to essentials for V1
export interface NewAdSetupModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  masterFlowData: any
  adHeadline: string
  adText: string
  creatives: any[]
  adPlacements: string[]
  targetedInterests: string[]
  behavioralFilters: string[]
  demographicFilters: string[]
  onCreativesUpdated?: (creatives: any[]) => void
  onLeadFormUpdated?: (fields: any) => void
}

export const AdSetupModal: React.FC<NewAdSetupModalProps> = ({
  isOpen,
  onOpenChange,
  masterFlowData,
  adHeadline,
  adText,
  creatives,
  adPlacements,
  targetedInterests,
  behavioralFilters,
  demographicFilters,
  onCreativesUpdated,
  onLeadFormUpdated
}) => {
  const [tab, setTab] = useState<'creative' | 'placements' | 'targeting' | 'leadform'>('creative')
  const [headline, setHeadline] = useState(adHeadline)
  const [description, setDescription] = useState(adText)
  const [previewHtml, setPreviewHtml] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Fetch preview for first creative
  useEffect(() => {
    const fetchPreview = async () => {
      if (!creatives || creatives.length === 0) return
      const creativeId = creatives[0].creative_id || creatives[0].id
      if (!creativeId) return
      setIsPreviewLoading(true)
      try {
        const res = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creativeId}&ad_format=INSTAGRAM_STANDARD`)
        const json = await res.json()
        if (json.success) setPreviewHtml(json.preview_html)
      } catch (e) {
        console.error(e)
      } finally {
        setIsPreviewLoading(false)
      }
    }
    fetchPreview()
  }, [creatives])

  const saveCreativeChanges = () => {
    if (onCreativesUpdated && creatives && creatives.length > 0) {
      const updated = [...creatives]
      updated[0] = {
        ...updated[0],
        ad_creative_title: headline,
        ad_creative_description: description
      }
      onCreativesUpdated(updated)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5" /> Ad Setup
          </h3>
          <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 text-sm font-medium">
          {['creative','placements','targeting','leadform'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} className={`px-4 py-2 -mb-px border-b-2 transition-colors ${tab===t?'border-indigo-600 text-indigo-600':'border-transparent text-gray-600 hover:text-indigo-600'}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab==='creative' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Headline</label>
                    <input value={headline} onChange={e=>setHeadline(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px]" />
                  </div>
                  <button onClick={saveCreativeChanges} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    <Pencil className="w-4 h-4" /> Save Text
                  </button>
                </div>
                <div className="flex flex-col items-center">
                  <div className="border border-gray-300 rounded-md" style={{width:'313px',height:'534px'}}>
                    {isPreviewLoading ? (
                      <div className="flex items-center justify-center w-full h-full"><div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full"/></div>
                    ) : (
                      <div ref={previewRef} dangerouslySetInnerHTML={{__html: previewHtml}} className="w-full h-full" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==='placements' && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2"><Layout className="w-4 h-4"/> Ad Placements</h4>
              <div className="flex flex-wrap gap-2">
                {adPlacements.map((p,idx)=>(<span key={idx} className="px-2 py-1 bg-white border border-indigo-400 text-indigo-700 rounded-full text-xs font-medium">{p}</span>))}
              </div>
            </div>
          )}

          {tab==='targeting' && (
            <AudienceTargetingSelector 
              targetingFilters={masterFlowData?.suggested_targeting_filters || {}}
              setTargetingFilters={()=>{}}
              campaignSessionId={masterFlowData.campaign_flow_session_id}
              campaignObjective={masterFlowData.campaign_objective}
            />
          )}

          {tab==='leadform' && (
            <div className="space-y-4 text-sm text-gray-700">
              <FileText className="w-5 h-5 text-indigo-600" /> Lead form editing coming soon (all fields already visible in review screen)
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 