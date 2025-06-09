import React from 'react'
import {
  AlertCircle, 
  BarChart3,
  Building2,
  CheckCheck, 
  Clock, 
  FileText, 
  Globe, 
  Lightbulb,
  MapPin, 
  Search, 
  Target, 
  Zap
} from 'lucide-react'

type BenefitsPanelProps = {
  currentStep: number
}

export default function BenefitsPanel({ currentStep }: BenefitsPanelProps) {
  switch(currentStep) {
    case 0: // Personal Information
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Clock className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">30x Faster Campaign Creation</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4">
              Traditional campaign setup takes 30+ minutes. Reeply AI does it all automatically in seconds.
            </p>
            <div className="flex items-center justify-between bg-[#151925] p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="text-gray-400">Traditional:</div>
                <div className="text-white font-medium">30+ min</div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="text-gray-400">Reeply AI:</div>
                <div className="text-[#4BF29C] font-semibold">60 sec</div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#151925] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="w-3 h-3 sm:w-4 sm:h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-white italic text-xs sm:text-sm mb-3 sm:mb-4">
              &ldquo;We now generate 80% of our leads through campaigns managed with Reeply AI. Thanks to the consistently excellent support, we look forward to planning and executing more projects with Max and Reeply AI in the future.&rdquo;
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/Christian.png" alt="Christian Schmitt" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
              <div>
                <div className="text-white text-xs sm:text-sm font-medium">Christian Schmitt</div>
                <div className="text-gray-400 text-[10px] sm:text-xs">Business owner at Boldbrands</div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 1: // Website Analysis
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Search className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Smart Website Analysis</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Reeply AI scans your website URL to understand your business, audience, and products—automatically selecting the perfect campaign type for your goals.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Zap className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Instant Brand Analysis</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Our AI instantly analyzes your website&apos;s colors, fonts, and content to understand your brand identity and create perfectly matched ads.
            </p>
          </div>
        </div>
      );
      
    case 2: // Company Type
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Building2 className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Tailored Marketing Strategy</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              We customize your marketing approach based on your company size and type, optimizing campaigns for your specific business category.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <BarChart3 className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Industry-Specific Performance</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Your company type helps our AI select the most effective advertising approaches that have been proven to work for similar businesses in your industry.
            </p>
          </div>
        </div>
      );
    
    case 3: // Company Information
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <FileText className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">AI-Generated Ad Copy</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Based on your company description, our AI writes compelling ad text that resonates with your audience and highlights your unique value proposition.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Lightbulb className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Value Proposition Detection</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Our AI identifies what makes your business special from your description and emphasizes these unique selling points in your ad campaigns.
            </p>
          </div>
        </div>
      );
      
    case 4: // Website Details
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Streamlined Process</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">1</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Website Link</div>
                  <div className="text-gray-400 text-xs sm:text-sm">You provide your website</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">2</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Smart Analysis</div>
                  <div className="text-gray-400 text-xs sm:text-sm">AI analyzes your website</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">3</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Ad Creation</div>
                  <div className="text-gray-400 text-xs sm:text-sm">AI creates your ad campaign</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">4</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Lead Generation</div>
                  <div className="text-gray-400 text-xs sm:text-sm">You get leads immediately</div>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <div className="text-gray-400">Traditional:</div>
                <div className="text-white">30-60+ min</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-400">Reeply AI:</div>
                <div className="text-[#4BF29C] font-semibold">Under 60 sec</div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 5: // Preferences
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Globe className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Intelligent Geo-Targeting</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Reeply AI determines optimal geolocation targeting from your website and profile preferences, ensuring your ads reach the right audience in the right locations.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Target className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Advanced Audience Targeting</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Our AI agent researches the best potential filters on Meta Ads to target your ideal audience, finding hidden opportunities other marketers might miss.
            </p>
          </div>
        </div>
      );

    case 6: // Locations
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <MapPin className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Targeted Local Advertising</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              By setting your preferred locations, you help our AI target your campaigns more effectively to the regions that matter most to your business.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Benefits of Location Targeting</h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-[#4BF29C] text-xs sm:text-base">✓</div>
                <div className="text-gray-300 text-xs sm:text-sm">Higher conversion rates from local audiences</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-[#4BF29C] text-xs sm:text-base">✓</div>
                <div className="text-gray-300 text-xs sm:text-sm">Reduced ad spend wastage on irrelevant regions</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-[#4BF29C] text-xs sm:text-base">✓</div>
                <div className="text-gray-300 text-xs sm:text-sm">More relevant messaging for specific geographic areas</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 7: // Confirmation
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-[#4BF29C]/30 p-4 sm:p-6">
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#4BF29C]/20 flex items-center justify-center">
                <CheckCheck className="size-6 sm:size-8 text-[#4BF29C]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">Your Profile is Ready!</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                You&apos;re all set to create your first AI-powered campaign in 60 seconds.
              </p>
            </div>
            
            <div className="bg-[#151925] rounded-lg p-3 sm:p-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="w-3 h-3 sm:w-4 sm:h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-white italic text-xs sm:text-sm my-2 sm:my-3">
                &ldquo;I loved working with the Reeply team - dedicated, patient, professional. They are experienced and were able to jump in to problem solve, no matter how big or small the problem. I enjoyed using the Reeply platform to help me get started on my Meta ads journey. It&apos;s simple and easy to use. They helped me to launch my very first lead generation, awareness, and conversion ads. It was easy to see all my campaign results in one handy interface. I managed to gain half a million views on one of my videos in just a few days. I also gained a lot of insights on what kind of ads worked, and what didn&apos;t work. Thank you Reeply.&rdquo;
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <img src="/lin.png" alt="Lin Loke" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
                <div>
                  <div className="text-white text-xs sm:text-sm font-medium">Lin Loke</div>
                  <div className="text-gray-400 text-[10px] sm:text-xs">Founder of Nuwa Wellness</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      
    default:
      return null;
  }
}