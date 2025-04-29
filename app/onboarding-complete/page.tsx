import { kv } from '@vercel/kv'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserDetail } from '@/app/actions'
import { SidebarDesktop } from '@/components/sidebar-desktop'
import Link from 'next/link'
import VideoCarousel from '@/components/video-carousel'
import SupportCalendarButton from '@/components/support-calendar-button'
import { subscriptionBypassList } from '@/app/subscription/subscription-bypass-list'

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
  
  // Define new "Start with Free Plan" button
  const StartWithFreePlanButton = () => (
    <Link href="/" className="mt-6 sm:mt-8 inline-block bg-[#151925] text-[#4BF29C] border border-[#4BF29C] px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-[#1E2336] transition-colors text-base sm:text-lg mr-4">
      Start with Free Plan
    </Link>
  );
  
  // If user is already subscribed or in the bypass list, redirect to main app
  const isInBypassList = userEmail ? subscriptionBypassList.includes(userEmail) : false;
  
  if (user.sub_status === 'active' || user.sub_status === 'trialing' || isInBypassList) {
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
              You&apos;re all set up! Watch the videos below to see what Reeply can do for you.
            </p>
            <p className="mt-2 sm:mt-3 text-[#ADB0B8] dark:text-[#ADB0B8] text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] max-w-2xl mx-auto px-2">
              You can start using our free plan right away with limited access to core features. You'll get 5 AI messages, 5 AI-generated images, 1 video, and 1 image inpainting session to explore what Reeply can do for you.
            </p>

            {/* Customer Review Images */}
            <div className="mt-6 flex justify-center">
              <a href="#testimonials" className="block relative">
                <div className="flex items-center justify-center">
                  {/* Overlapping Images */}
                  <div className="flex -space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#4BF29C] bg-[#1A1D29] overflow-hidden relative z-30">
                      <img src="/Christian.png" alt="Christian Schmitt" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#4BF29C] bg-[#1A1D29] overflow-hidden relative z-20">
                      <img src="/lin.png" alt="Lin Loke" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#4BF29C] bg-[#1A1D29] overflow-hidden relative z-10">
                      <img src="/yip.png" alt="Yip ThyDiep Ta" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#4BF29C] bg-[#1A1D29] overflow-hidden relative z-0">
                      <img src="/steffen.png" alt="Steffen Pfannebecker" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
                
                {/* Stars Rating */}
                <div className="flex justify-center mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className="w-4 h-4 sm:w-5 sm:h-5 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-[#ADB0B8] text-center mt-1 hover:text-[#4BF29C] transition-colors">
                  Read customer success stories
                </p>
              </a>
            </div>
            
            <div className="flex justify-center items-center">
              <Link href="/" className="mt-6 sm:mt-8 inline-block bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors text-lg sm:text-xl">
                Let's start!
              </Link>
            </div>
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
                <p className="text-[#ADB0B8] text-sm sm:text-base">Yes! You can use our free plan with limited features to get a feel for the platform. Our free plan includes limited access to core features. When you're ready for more, you can upgrade to a premium plan anytime.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">What happens after I sign up?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">You can start immediately with our free plan, which includes limited access to AI-powered campaign creation, image generation, and video creation. For unlimited usage, you can upgrade to our premium plan at any time.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">Can I cancel anytime?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">Yes. You&apos;re fully in control. You can cancel whenever you want—no strings attached.</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <h3 className="font-medium text-white text-base sm:text-lg mb-1.5 sm:mb-2">What are the free plan limitations?</h3>
                <p className="text-[#ADB0B8] text-sm sm:text-base">The free plan includes 5 AI messages, 5 AI-generated images, 1 video generation, and 1 image inpainting session. You'll receive an upgrade prompt when you reach these limits. You can upgrade to the premium plan anytime to get unlimited usage of all features.</p>
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
          
          {/* Testimonials Section */}
          <div id="testimonials" className="mt-16 mb-12 scroll-mt-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">Customer Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Christian's Review */}
              <div className="bg-[#1A1D29] rounded-lg border border-[#2A2E3A] p-5 sm:p-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className="w-4 h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-white italic text-sm sm:text-base my-4">
                  &ldquo;We now generate 80% of our leads through campaigns managed with Reeply AI. Thanks to the consistently excellent support, we look forward to planning and executing more projects with Max and Reeply AI in the future.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img src="/Christian.png" alt="Christian Schmitt" className="w-10 h-10 rounded-full object-cover border-2 border-[#4BF29C]" />
                  <div>
                    <div className="text-white text-sm sm:text-base font-medium">Christian Schmitt</div>
                    <div className="text-[#ADB0B8] text-xs sm:text-sm">Business owner at Boldbrands</div>
                  </div>
                </div>
              </div>

              {/* Lin's Review */}
              <div className="bg-[#1A1D29] rounded-lg border border-[#2A2E3A] p-5 sm:p-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className="w-4 h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-white italic text-sm sm:text-base my-4">
                  &ldquo;I loved working with the Reeply team - dedicated, patient, professional. They helped me to launch my very first lead generation, awareness, and conversion ads. It was easy to see all my campaign results in one handy interface. I managed to gain half a million views on one of my videos in just a few days.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img src="/lin.png" alt="Lin Loke" className="w-10 h-10 rounded-full object-cover border-2 border-[#4BF29C]" />
                  <div>
                    <div className="text-white text-sm sm:text-base font-medium">Lin Loke</div>
                    <div className="text-[#ADB0B8] text-xs sm:text-sm">Founder of Nuwa Wellness</div>
                  </div>
                </div>
              </div>

              {/* Yip's Review */}
              <div className="bg-[#1A1D29] rounded-lg border border-[#2A2E3A] p-5 sm:p-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className="w-4 h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-white italic text-sm sm:text-base my-4">
                  &ldquo;Our campaigns consistently deliver a stream of leads since using Reeply AI. The platform is intuitive, and the team at Reeply has been very supportive throughout. Highly recommended for any business looking to scale their marketing efforts without the usual overhead.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img src="/yip.png" alt="Yip ThyDiep Ta" className="w-10 h-10 rounded-full object-cover border-2 border-[#4BF29C]" />
                  <div>
                    <div className="text-white text-sm sm:text-base font-medium">Yip ThyDiep Ta</div>
                    <div className="text-[#ADB0B8] text-xs sm:text-sm">CEO at J3dAI House of Collaboration Davos</div>
                  </div>
                </div>
              </div>

              {/* Steffen's Review */}
              <div className="bg-[#1A1D29] rounded-lg border border-[#2A2E3A] p-5 sm:p-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className="w-4 h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-white italic text-sm sm:text-base my-4">
                  &ldquo;I hired 2 employees in 2 weeks thanks to Reeply. I was able to set up efficient recruiting campaigns in no time, generating numerous leads without wasting time on complex ad platforms.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img src="/steffen.png" alt="Steffen Pfannebecker" className="w-10 h-10 rounded-full object-cover border-2 border-[#4BF29C]" />
                  <div>
                    <div className="text-white text-sm sm:text-base font-medium">Steffen Pfannebecker</div>
                    <div className="text-[#ADB0B8] text-xs sm:text-sm">CEO at Digilytics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-10 mb-8 sm:mb-0 flex justify-center items-center">
            <Link href="/" className="inline-block bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors text-lg sm:text-xl">
              Let's start!
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}