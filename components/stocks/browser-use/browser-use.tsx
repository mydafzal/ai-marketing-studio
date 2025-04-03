"use client"

import React, { useState, useEffect, useRef } from "react"

// Add type declaration for window.taskStepsCache
declare global {
  interface Window {
    taskStepsCache?: {
      [taskId: string]: Array<{
        id: string;
        step: number;
        evaluation_previous_goal?: string;
        next_goal?: string;
      }>;
    };
  }
}

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Brain, Globe, Pause, Play, StopCircle, RefreshCw, Share2 } from "lucide-react"
import { useActions } from 'ai/rsc'

// Task status types from Browser Use API
type TaskStatus = 'created' | 'running' | 'finished' | 'stopped' | 'paused' | 'failed'

// Main component for Browser Use
interface BrowserUseProps {
  defaultPrompt?: string
  isInDialog?: boolean
}

export function BrowserUse({ defaultPrompt = "", isInDialog = false }: BrowserUseProps) {
  // The user prompt to be sent to the Browser Use API
  const [task, setTask] = useState(defaultPrompt)
  const [isSubmittable, setIsSubmittable] = useState(!!defaultPrompt.trim())
  
  // Task management state
  const [isTaskRunning, setIsTaskRunning] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [taskResult, setTaskResult] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enhancedInstructions, setEnhancedInstructions] = useState<string | null>(null)
  const [originalQuery, setOriginalQuery] = useState<string>("")
  
  // For polling task status
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // For sending results back to chat
  const { submitUserMessage } = useActions()

  // Validate task input
  useEffect(() => {
    setIsSubmittable(!!task.trim())
    
    // Reset enhanced instructions when the user changes the task
    if (task !== originalQuery && originalQuery !== "") {
      setEnhancedInstructions(null);
      setOriginalQuery("");
    }
  }, [task, originalQuery])
  
  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])
  
  // Handle creating a new browser task
  const handleRunTask = async () => {
    if (!isSubmittable) return
    
    setIsTaskRunning(true)
    setTaskId(null)
    setTaskStatus(null)
    setTaskResult(null)
    setLiveUrl(null)
    setError(null)
    
    try {
      // Save the original query
      setOriginalQuery(task);
      
      // First, enhance the user query into detailed instructions
      const { enhanceBrowserInstructions } = await import("@/app/actions/enhance-browser-instructions");
      
      // Show loading state while generating enhanced instructions
      toast.loading("Preparing detailed research instructions...");
      
      // Get enhanced instructions
      const instructionsText = await enhanceBrowserInstructions(task);
      
      // Save the enhanced instructions
      setEnhancedInstructions(instructionsText);
      
      // Log the enhanced instructions for debugging
      console.log("Enhanced instructions:", instructionsText);
      
      // Dismiss loading toast
      toast.dismiss();
      
      // Show a success toast with the first few words of the enhanced instructions
      const previewText = instructionsText.split(' ').slice(0, 10).join(' ') + '...';
      toast.success(`Instructions enhanced: ${previewText}`);
      
      // Now send the enhanced instructions to the browser agent
      const response = await fetch('/api/browser-use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: instructionsText,
          save_browser_data: true,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start browser task')
      }
      
      const data = await response.json()
      setTaskId(data.id)
      
      // Start polling for task status
      startPolling(data.id)
      
      toast.success("Browser agent started!")
    } catch (error: any) {
      console.error('Error running browser task:', error)
      setError(error.message || 'Failed to start browser task')
      setIsTaskRunning(false)
      toast.error(error.message || 'Failed to start browser task')
    }
  }
  
  // Poll for task status updates
  const startPolling = (id: string) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    // Create new polling interval
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/browser-use?task_id=${id}`, {
          method: 'GET',
        })
        
        if (!response.ok) {
          throw new Error('Failed to get task status')
        }
        
        const data = await response.json()
        setTaskStatus(data.status)
        setLiveUrl(data.live_url)
        
        // If task is finished or failed, stop polling and update UI
        if (data.status === 'finished' || data.status === 'failed') {
          setTaskResult(data.output)
          setIsTaskRunning(false)
          
          if (data.status === 'finished') {
            toast.success("Browser task completed!")
            // Send the result back to the chat
            submitBrowserResultToChat(data.output)
          } else {
            toast.error("Browser task failed")
          }
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error('Error polling task status:', error)
      }
    }, 5000) // Poll every 5 seconds
  }
  
  // Task control functions (pause, resume, stop)
  const handleControlTask = async (action: 'pause' | 'resume' | 'stop') => {
    if (!taskId) return
    
    try {
      const response = await fetch(`/api/browser-use?task_id=${taskId}&action=${action}`, {
        method: 'PUT',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} browser task`)
      }
      
      // Update task status based on action
      if (action === 'stop') {
        setTaskStatus('stopped')
        setIsTaskRunning(false)
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      } else if (action === 'pause') {
        setTaskStatus('paused')
      } else if (action === 'resume') {
        setTaskStatus('running')
      }
      
      toast.success(`Browser task ${action}d!`)
    } catch (error: any) {
      console.error(`Error ${action}ing browser task:`, error)
      toast.error(error.message || `Failed to ${action} browser task`)
    }
  }
  
  // Submit the browser task result back to the main chat through an AI-formatted message
  const submitBrowserResultToChat = async (result: string) => {
    try {
      // Use the original query and enhanced instructions if available
      const researchQuery = originalQuery || task || "your topic";
      
      // Use the formatter just like the ad creative results
      const { formatBrowserResearch } = await import("@/app/actions/format-browser-research");
      
      // Format the message using our new action
      // Pass both the original query and the enhanced instructions for context
      const formattedMessage = await formatBrowserResearch(
        researchQuery, 
        result,
        enhancedInstructions || undefined
      );
      
      // Submit the message to chat using submitUserMessage (exactly like in campaignresultsnew)
      const resp = await submitUserMessage(formattedMessage, [], true);
      
      // Update the AI state to maintain compatibility with other code
      const { nanoid } = await import("@/lib/utils");
      const { getMutableAIState } = await import("ai/rsc");
      const aiState = getMutableAIState();
      
      // Add the message to the AI state
      aiState.update({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: 'assistant',
            content: formattedMessage,
            timestamp: new Date().toISOString()
          }
        ]
      });
      
      toast.success("Results sent to chat!")
    } catch (error) {
      console.error('Error submitting browser result to chat:', error)
      toast.error("Failed to send results to chat")
    }
  }
  
  // Get status color based on task status
  const getStatusColor = () => {
    switch (taskStatus) {
      case 'running':
        return 'text-blue-500'
      case 'finished':
        return 'text-green-500'
      case 'stopped':
      case 'failed':
        return 'text-red-500'
      case 'paused':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }
  
  // Format task status text
  const getStatusText = () => {
    switch (taskStatus) {
      case 'created':
        return 'Task created, waiting to start...'
      case 'running':
        return 'Browser agent is working...'
      case 'finished':
        return 'Task completed successfully'
      case 'stopped':
        return 'Task stopped by user'
      case 'paused':
        return 'Task paused'
      case 'failed':
        return 'Task failed'
      default:
        return 'Ready to start'
    }
  }
  
  return (
    <div className="space-y-6 py-4">
      <Card className="bg-white dark:bg-container-bg border border-border-dark rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <CardHeader className="border-b border-border-dark px-6 py-5">
          <CardTitle className="text-gray-900 dark:text-text-white text-[20px] font-bold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            AI Browser Research
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-text-light-gray text-[14px] mt-1">
            Let an AI agent browse the web to research your query
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Task input */}
          <div className="space-y-3">
            <h3 className="text-[18px] font-bold text-text-white">
              What would you like the AI to research?
            </h3>
            <Textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Research competitors for a coffee shop business in Berlin, including their pricing, offerings, and reviews"
              disabled={isTaskRunning}
              className="w-full min-h-[100px] border-border-dark bg-dark-bg text-text-white placeholder:text-text-light-gray focus:ring-primary-green focus:border-primary-green rounded-lg text-[15px] leading-relaxed transition-all duration-200"
            />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-900/30 text-red-500 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Enhanced Instructions Display */}
          {enhancedInstructions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-medium text-text-white">
                  Enhanced Research Instructions
                </h3>
                <div className="text-xs text-text-light-gray">
                  Original query: &ldquo;{originalQuery}&rdquo;
                </div>
              </div>
              <div className="bg-[#151925] p-3 rounded-lg border border-[#2A2E3A] text-sm text-text-white overflow-y-auto max-h-[200px]">
                {enhancedInstructions}
              </div>
            </div>
          )}
          
          {/* Task status */}
          {taskStatus && (
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${taskStatus === 'running' ? 'animate-pulse' : ''} ${getStatusColor()}`} />
              <span className={`text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          )}
          
          {/* Browser Live View */}
          {liveUrl && (
            <div className="space-y-3">
              <h3 className="text-[18px] font-bold text-text-white flex items-center justify-between">
                <span>Live Browser View</span>
                <div className="flex space-x-2">
                  {/* Show expand button only when not already in dialog */}
                  {!isInDialog && liveUrl && (
                    <Button
                      onClick={() => {
                        // Create modal element
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4';
                        
                        // Get steps from task data if available
                        const steps = (taskId && window.taskStepsCache && window.taskStepsCache[taskId]) || [];
                        const stepsHtml = steps.map(step => {
                          return `
                            <div class="mb-3 p-3 bg-[#151925] rounded-lg border border-[#2A2E3A]">
                              <div class="flex items-center mb-2">
                                <div class="w-2 h-2 rounded-full bg-[#4BF29C] mr-2"></div>
                                <span class="text-[#4BF29C] text-sm font-medium">Step ${step.step}</span>
                              </div>
                              <p class="text-[#ADB0B8] text-sm">${step.next_goal || ''}</p>
                              <p class="text-white text-sm mt-1">${step.evaluation_previous_goal || ''}</p>
                            </div>
                          `;
                        }).join('');
                        
                        modal.innerHTML = `
                          <div class="bg-container-bg max-w-6xl w-full h-[90vh] rounded-lg shadow-lg overflow-hidden flex flex-col">
                            <div class="flex items-center justify-between p-4 border-b border-border-dark">
                              <h2 class="text-xl font-bold text-text-white">AI Browser Research</h2>
                              <button id="close-browser-modal" class="text-gray-400 hover:text-white">&times;</button>
                            </div>
                            <div class="flex-1 flex overflow-hidden">
                              <!-- Browser Panel (Left) -->
                              <div class="w-3/5 p-4 overflow-hidden border-r border-border-dark">
                                <h3 class="text-white text-lg mb-2">Browser View</h3>
                                <div class="h-[calc(90vh-130px)] bg-black rounded-lg overflow-hidden">
                                  <iframe src="${liveUrl}" class="w-full h-full border-0"></iframe>
                                </div>
                              </div>
                              
                              <!-- AI Thought Process (Right) -->
                              <div class="w-2/5 p-4 overflow-y-auto">
                                <h3 class="text-white text-lg mb-2">AI Thought Process</h3>
                                <div class="space-y-3">
                                  <div id="steps-container" class="space-y-2">
                                    ${stepsHtml || `<p class="text-[#ADB0B8] text-sm">The AI agent will show its thought process here as it works through your research request.</p>`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        `;
                        
                        // Create a global steps cache if it doesn't exist
                        if (!window.taskStepsCache) {
                          window.taskStepsCache = {};
                        }
                        
                        // Setup polling for steps updates
                        if (taskId) {
                          const updateSteps = async () => {
                            try {
                              const response = await fetch(`/api/browser-use?task_id=${taskId}`);
                              if (response.ok) {
                                const data = await response.json();
                                if (data.steps && data.steps.length > 0) {
                                  // Cache steps for future modal opens
                                  window.taskStepsCache && (window.taskStepsCache[taskId] = data.steps);
                                  
                                  // Update steps in the modal if it's open
                                  const stepsContainer = document.getElementById('steps-container');
                                  if (stepsContainer) {
                                    const updatedStepsHtml = data.steps.map((step: any) => {
                                      return `
                                        <div class="mb-3 p-3 bg-[#151925] rounded-lg border border-[#2A2E3A]">
                                          <div class="flex items-center mb-2">
                                            <div class="w-2 h-2 rounded-full bg-[#4BF29C] mr-2"></div>
                                            <span class="text-[#4BF29C] text-sm font-medium">Step ${step.step}</span>
                                          </div>
                                          <p class="text-[#ADB0B8] text-sm">${step.next_goal || ''}</p>
                                          <p class="text-white text-sm mt-1">${step.evaluation_previous_goal || ''}</p>
                                        </div>
                                      `;
                                    }).join('');
                                    stepsContainer.innerHTML = updatedStepsHtml;
                                  }
                                }
                                
                                // Keep polling if task is still running
                                if (data.status === 'running' || data.status === 'created') {
                                  setTimeout(updateSteps, 5000);
                                }
                              }
                            } catch (err) {
                              console.error('Error updating steps:', err);
                            }
                          };
                          
                          // Start polling
                          updateSteps();
                        }
                        
                        // Add to document
                        document.body.appendChild(modal);
                        
                        // Add close handler
                        document.getElementById('close-browser-modal')?.addEventListener('click', () => {
                          document.body.removeChild(modal);
                        });
                      }}
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-1 text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-2 h-4 w-4 mr-1">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                      <span>Expand View</span>
                    </Button>
                  )}
                  
                  {taskStatus === 'running' && (
                    <>
                      {taskStatus === 'running' ? (
                        <Button
                          onClick={() => handleControlTask('pause')}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                        >
                          <Pause className="h-4 w-4" />
                          <span>Pause</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleControlTask('resume')}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
                        >
                          <Play className="h-4 w-4" />
                          <span>Resume</span>
                        </Button>
                      )}
                      <Button
                        onClick={() => handleControlTask('stop')}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                      >
                        <StopCircle className="h-4 w-4" />
                        <span>Stop</span>
                      </Button>
                    </>
                  )}
                </div>
              </h3>
              <div className="relative w-full bg-black rounded-lg overflow-hidden border border-border-dark">
                {/* Adjust height based on whether it's in the sidebar or dialog */}
                <div className={isInDialog ? "w-full h-[500px]" : "aspect-video w-full"}>
                  <iframe
                    src={liveUrl}
                    width="100%"
                    height="100%"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          )}
          
          {/* Task result */}
          {taskResult && (
            <div className="space-y-3">
              <h3 className="text-[18px] font-bold text-text-white flex items-center justify-between">
                <span>Research Results</span>
                <Button
                  onClick={() => submitBrowserResultToChat(taskResult)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Send to Chat</span>
                </Button>
              </h3>
              <div className="bg-dark-bg border border-border-dark rounded-lg p-4 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                {taskResult}
              </div>
            </div>
          )}
          
          {/* Control buttons */}
          <div className="flex justify-between space-x-4">
            {!isTaskRunning ? (
              <Button
                onClick={handleRunTask}
                disabled={!isSubmittable}
                className="flex-1 bg-primary-green hover:bg-primary-green/90 text-deep-black font-bold text-[16px] rounded-lg transition-all duration-200 transform hover:scale-[1.02] h-12"
              >
                <Brain className="mr-2 h-5 w-5" />
                Start Browser Research
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (taskId) {
                    handleControlTask('stop')
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[16px] rounded-lg transition-all duration-200 h-12"
              >
                <StopCircle className="mr-2 h-5 w-5" />
                Stop Research
              </Button>
            )}
            
            {taskId && !isTaskRunning && (
              <Button
                onClick={() => {
                  // Reset all state and start a new task with the same query
                  handleRunTask()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[16px] rounded-lg transition-all duration-200 h-12"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}