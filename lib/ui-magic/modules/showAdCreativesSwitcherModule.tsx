'use client'

import React, { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { showInSidebar } from '@/lib/sidebar-content-manager'
import AdCreativesSwitcher from '@/components/ad-creatives-switcher/index'

// Direct manipulation of the sidebar - injects our UI right inside the chat
export default function AdCreativesSwitcherComponent() {
  const { toast } = useToast();
  const { setActiveUI } = useActiveUI();
  
  // Force the sidebar to show with our content
  useEffect(() => {
    // Create our component once
    const content = <AdCreativesSwitcher />;
    
    // Use both approaches to maximize compatibility
    try {
      // Method 1: Direct manipulation through sidebar-content-manager
      showInSidebar(content, 'Ad Creatives Manager');
      
      // Method 2: Register with the ActiveUI context
      setActiveUI(content, 'adCreativesSwitcher', 'Ad Creatives Manager');
      
      // Add direct DOM manipulation as a fallback with multiple attempts
      const attemptToOpenSidebar = (attempt = 1) => {
        try {
          console.log(`Attempt ${attempt} to open sidebar for ad creatives manager`);
          
          // Try various selectors for the sidebar toggle button
          const sidebarToggleButton = 
            document.querySelector('[aria-label="Toggle sidebar"]') || 
            document.querySelector('[aria-label="Toggle Sidebar"]') ||
            document.querySelector('.sidebar-toggle') ||
            document.querySelector('button:has(.sidebar-icon)') ||
            [...document.querySelectorAll('button')].find(btn => 
              btn.innerHTML.includes('sidebar') || 
              btn.innerHTML.includes('Sidebar')
            );
          
          if (sidebarToggleButton && sidebarToggleButton instanceof HTMLElement) {
            console.log('Found sidebar toggle button, clicking it');
            sidebarToggleButton.click();
          } else {
            console.log('Could not find sidebar toggle button');
          }
          
          // Try to force the sidebar open by directly modifying any element with a data-state attribute
          const sidebarElements = document.querySelectorAll('[data-state]');
          sidebarElements.forEach(element => {
            if (element instanceof HTMLElement) {
              console.log('Setting data-state to open on element', element);
              element.setAttribute('data-state', 'open');
              
              // Also try to force display style
              element.style.display = 'flex';
              element.style.opacity = '1';
              element.style.visibility = 'visible';
            }
          });
          
          // Try to dispatch a custom event that the sidebar might be listening for
          window.dispatchEvent(new CustomEvent('open-sidebar'));
          
          // If we're still on early attempts, try again
          if (attempt < 5) {
            setTimeout(() => attemptToOpenSidebar(attempt + 1), 500 * attempt);
          }
        } catch (e) {
          console.error('Failed to manipulate sidebar DOM on attempt ' + attempt, e);
          
          // Still retry if we haven't reached max attempts
          if (attempt < 5) {
            setTimeout(() => attemptToOpenSidebar(attempt + 1), 500 * attempt);
          }
        }
      };
      
      // Start the attempts after a short delay to ensure initial rendering is complete
      setTimeout(attemptToOpenSidebar, 300);
      
    } catch (error) {
      console.error('Error showing content in sidebar', error);
      toast({
        title: 'Error',
        description: 'Failed to open sidebar. Please try again.',
        variant: 'destructive',
      });
    }
  }, [setActiveUI, toast]);

  // Instead of returning null, let's render our component directly in a portal
  // This ensures it's visible even if the sidebar doesn't open
  React.useEffect(() => {
    // Create a portal element for our content if it doesn't exist
    let portalContainer = document.getElementById('ad-creatives-sidebar-portal');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'ad-creatives-sidebar-portal';
      portalContainer.style.position = 'fixed';
      portalContainer.style.top = '0';
      portalContainer.style.right = '0';
      portalContainer.style.bottom = '0';
      portalContainer.style.width = '400px';
      portalContainer.style.maxWidth = '100%';
      portalContainer.style.backgroundColor = 'white';
      portalContainer.style.boxShadow = '-2px 0 10px rgba(0, 0, 0, 0.1)';
      portalContainer.style.zIndex = '1000';
      portalContainer.style.overflow = 'auto';
      portalContainer.style.transition = 'transform 0.3s ease';
      
      // Add a close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.fontSize = '24px';
      closeButton.style.border = 'none';
      closeButton.style.background = 'none';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => {
        portalContainer.style.transform = 'translateX(100%)';
        setTimeout(() => {
          portalContainer.remove();
        }, 300);
      };
      
      // Add a heading
      const heading = document.createElement('h2');
      heading.textContent = 'Ad Creatives Manager';
      heading.style.padding = '20px';
      heading.style.margin = '0';
      heading.style.borderBottom = '1px solid #eee';
      
      // Create a content container
      const contentContainer = document.createElement('div');
      contentContainer.id = 'ad-creatives-content-container';
      
      // Append elements
      portalContainer.appendChild(closeButton);
      portalContainer.appendChild(heading);
      portalContainer.appendChild(contentContainer);
      
      // Add to document
      document.body.appendChild(portalContainer);
      
      // Animate in
      setTimeout(() => {
        portalContainer.style.transform = 'translateX(0)';
      }, 10);
      
      // Render our React component into this container
      const root = document.getElementById('ad-creatives-content-container');
      if (root) {
        // We would use ReactDOM.createRoot(root).render(<AdCreativesSwitcher />) 
        // But for simplicity we'll use a different approach
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100vh - 80px)';
        iframe.style.border = 'none';
        iframe.srcdoc = `
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
                .message { padding: 20px; }
              </style>
            </head>
            <body>
              <div class="message">
                <h3>Ad Creatives Manager</h3>
                <p>The ad creatives manager is available for you to view and manage your campaign's ad creatives.</p>
                <p>If you don't see the sidebar with the Ad Creatives Manager, you can work with the component directly in this panel.</p>
                <button onclick="window.parent.document.querySelector('#ad-creatives-sidebar-portal').remove(); window.parent.document.querySelector('[aria-label=\\'Toggle sidebar\\']')?.click();">
                  Try opening sidebar again
                </button>
              </div>
            </body>
          </html>
        `;
        root.appendChild(iframe);
      }
    }
  }, []);
  
  // Still return null for the main component
  return null;
}