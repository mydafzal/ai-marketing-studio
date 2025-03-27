import { formatNumber } from '@/lib/utils'
import { CheckCircle, XCircle, DollarSign, Calendar, Target } from 'lucide-react'

export interface IPurchasingUiProp {
  success: boolean
  budget: number
  campaignName: string
  days: number
  totalBudget: number
}

export const PurchasingUi = ({
  success,
  budget,
  campaignName,
  days,
  totalBudget
}: IPurchasingUiProp) => {
  return (
    <div className="rounded-xl border border-[#2A2E3A] p-6 bg-[#1A1D29]">
      <div className="flex items-start gap-4">
        {success ? (
          <CheckCircle className="size-6 shrink-0 text-[#4BF29C] mt-1" />
        ) : (
          <XCircle className="size-6 shrink-0 text-red-500 mt-1" />
        )}
        
        <div className="flex-1">
          <h3 className={`text-xl font-semibold mb-4 ${success ? 'text-[#4BF29C]' : 'text-red-400'}`}>
            {success ? 'Budget Successfully Set' : 'Budget Setting Failed'}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Target className="size-4 text-[#8A8F99]" />
              <span className="text-[#8A8F99]">Campaign:</span>
              <span className="font-medium">{campaignName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-white">
              <DollarSign className="size-4 text-[#8A8F99]" />
              <span className="text-[#8A8F99]">Daily Budget:</span>
              <span className="font-medium">{formatNumber(budget)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-white">
              <Calendar className="size-4 text-[#8A8F99]" />
              <span className="text-[#8A8F99]">One Month:</span>
              <span className="font-medium">{days} days</span>
            </div>
            
            <div className="pt-3 mt-3 border-t border-[#2A2E3A]">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="size-4 text-[#8A8F99]" />
                <span className="text-[#8A8F99]">Total Budget in One Month:</span>
                <span className="font-medium text-[#4BF29C]">{formatNumber(totalBudget)}</span>
              </div>
            </div>
          </div>

          {!success && (
            <div className="mt-4 text-sm text-red-400">
              Please try again later or contact support if the issue persists.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}