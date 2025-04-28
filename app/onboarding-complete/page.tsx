import { kv } from '@vercel/kv'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserDetail } from '@/app/actions'
import { SidebarDesktop } from '@/components/sidebar-desktop'
import Link from 'next/link'
import VideoCarousel from '@/components/video-carousel'
import SupportCalendarButton from '@/components/support-calendar-button'

export const metadata = {
  title: 'Reeply - Start Your Journey'
}

export default async function OnboardingCompletePage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  const userEmail = session?.user?.email
  
  if (!userEmail) {
    redirect('/login')
  }
  
  // Get user details
  const userDetail = await getUserDetail()
  const user = userDetail.user
  
  if (!user) {
    redirect('/login')
  }
  
  // If user is already subscribed, redirect to main app
  if (user.sub_status === 'active' || user.sub_status === 'trialing') {
    redirect('/')
  }
  
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      <SidebarDesktop />
      <div className="group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative overflow-auto bg-[#0F1117] dark:bg-[#0F1117] text-white dark:text-white flex flex-col items-center">
        <div className="w-full max-w-5xl mx-auto py-6 sm:py-12 px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-[28px] sm:text-[40px] font-bold text-white dark:text-white px-2">
              Ready to <span className="text-[#4BF29C] dark:text-[#4BF29C]">Transform</span> Your Marketing?
            </h1>
            <p className="mt-3 sm:mt-4 text-[#ADB0B8] dark:text-[#ADB0B8] text-[16px] sm:text-[18px] leading-[22px] sm:leading-[26px] max-w-3xl mx-auto px-2">
              You&apos;re all set up! Watch the videos below to see what Reeply can do for you, then start your free trial.
            </p>
            <p className="mt-2 sm:mt-3 text-[#ADB0B8] dark:text-[#ADB0B8] text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] max-w-2xl mx-auto px-2">
              You can cancel anytime during the trial with no charges. After your trial, the subscription can be cancelled on a monthly basis.
            </p>
            
            <Link href="/subscription" className="mt-6 sm:mt-8 inline-block bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors text-base sm:text-lg">
              Start Your Free 7-Day Trial
            </Link>
          </div>
          
          {/* Video Explainers Section with Carousel */}
          <div className="mt-10 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-5 sm:mb-8 px-2">See Reeply AI in Action</h2>
            {/* Import the client-side component for carousel */}
            <VideoCarousel videos={[
              {
                src: "https://player.vimeo.com/video/1079288024?h=785842b52d&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&muted=1",
                title: "Campaign Creation",
                description: "Create AI-powered campaigns in minutes",
                thumbnail: "https://i.vimeocdn.com/video/1526060493-9e7f5e2c6730f6301c5d89aa1ec7a70e53e30a4c2dad6dc04af67c9bada42a63-d_640"
              },
              {
                src: "https://player.vimeo.com/video/1079288295?h=3fabaef17b&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
                title: "Text to Image + Inpainting",
                description: "Generate and edit images with AI",
                thumbnail: "https://i.vimeocdn.com/video/1526060706-1dd6d13af8c6f629e0a9a9dfe99fd3e7ddfeb77e68c75a54bc0adc2a3a0fba8f-d_640"
              },
              {
                src: "https://player.vimeo.com/video/1079288203?h=b1f3022395&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
                title: "Image to Video",
                description: "Transform images into engaging video content",
                thumbnail: "https://i.vimeocdn.com/video/1526060493-9e7f5e2c6730f6301c5d89aa1ec7a70e53e30a4c2dad6dc04af67c9bada42a63-d_640"
              }
            ]} />
          </div>
          
          {/* FAQ Section */}
          <div className="mt-10 sm:mt-16 mb-8 sm:mb-12 px-1 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-5 sm:mb-8">FAQ — Getting Started with Reeply</h2>
            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded-lg divide-y divide-[#2A2E3A]">
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">Is Reeply really free to start?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">Yes. You get a 7-day free trial to test all features. You can cancel anytime during the trial with no charges.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">What happens after I sign up?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">You get immediate access to all features including AI-powered ad campaign creation, AI image generation, video creation, and campaign analysis. You can start creating immediately.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">Can I cancel anytime?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">Yes. You&apos;re fully in control. You can cancel whenever you want—no strings attached.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">What if I need help getting started?</h3>
                <div className="text-[#ADB0B8] text-sm sm:text-base">
                  <p className="mb-3">We offer two ways to get support:</p>
                  
                  <ol className="space-y-3 ml-2">
                    <li className="flex items-start">
                      <span className="text-[#4BF29C] mr-2">1.</span>
                      <span>Text us through our support chat which we read personally and respond to ASAP.</span>
                    </li>
                    
                    <li className="flex items-start">
                      <span className="text-[#4BF29C] mr-2">2.</span>
                      <span>Book a 15-minute demo training session by asking our AI to &quot;Get support&quot; or &quot;Open the support interface&quot;.</span>
                    </li>
                  </ol>
                  
                  <SupportCalendarButton />
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">Is my data safe?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">Absolutely. We follow strict standards. Your account and campaigns are private and secure.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">How fast can I launch my first campaign?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">In under 5 minutes. Reeply is built to be fast and simple, even if you&apos;ve never run ads before.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">Who is Reeply for?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">Small businesses, startups, marketing agencies, and marketers who want to add 10x productivity to their work. Our AI creates campaigns in under a minute (instead of 30+ minutes) and generates 10 image variations from a single example in seconds (saving hours of editing work).</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6 sm:mt-10 mb-8 sm:mb-0">
            <Link href="/subscription" className="inline-block bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors text-base sm:text-lg">
              Start Your Free 7-Day Trial Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}