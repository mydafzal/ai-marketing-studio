"use client"

import React, { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Brain, Globe, Pause, Play, StopCircle, RefreshCw, Share2 } from "lucide-react"
import { useActions } from 'ai/rsc'

// Task status types from Browser Use API
type TaskStatus = 'created' | 'running' | 'finished' | 'stopped' | 'paused' | 'failed'

// Main component for Browser Use
export function BrowserUse({ defaultPrompt = "" }) {
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
  
  // For polling task status
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // For sending results back to chat
  const { submitUserMessage } = useActions()

  // Validate task input
  useEffect(() => {
    setIsSubmittable(!!task.trim())
  }, [task])
  
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
      const response = await fetch('/api/browser-use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
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
  
  // Submit the browser task result back to the main chat
  const submitBrowserResultToChat = async (result: string) => {
    try {
      // Format the result nicely
      const formattedResult = `📊 **Browser Research Results**\n\n${result}`
      
      // Use the action to submit to chat (this is similar to how other components work)
      await submitUserMessage(formattedResult, [], true)
      
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
                {taskStatus === 'running' && (
                  <div className="flex space-x-2">
                    {taskStatus !== 'paused' ? (
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
                  </div>
                )}
              </h3>
              <div className="relative w-full bg-black rounded-lg overflow-hidden border border-border-dark">
                <div className="aspect-video w-full">
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