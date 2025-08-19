'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, DocumentTextIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/api'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  documents?: Array<{
    id: string
    title: string
    type: string
  }>
}

interface ProjectChatProps {
  projectId: string
  projectName: string
}

export default function ProjectChat({ projectId, projectName }: ProjectChatProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI assistant for the ${projectName} project. I can help you with:\n\n• Answering questions about your project\n• Finding and explaining documents\n• Generating new documents\n• Providing guidance on permitting requirements\n\nWhat would you like to know?`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Call the real backend API
      const response = await apiClient.sendChatMessage(projectId, inputMessage)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        documents: response.documents || []
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or be more specific about what you need.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = [
    'What documents do I need for this project?',
    'Show me environmental impact documents',
    'What is the current project status?',
    'Generate interconnection request document',
    'What permits are still missing?'
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Project Assistant
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{projectName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {message.documents && message.documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                        message.type === 'user'
                          ? 'bg-white bg-opacity-20 border-white border-opacity-30 hover:bg-opacity-30'
                          : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                      }`}
                    >
                      <DocumentTextIcon className={`h-4 w-4 mr-2 ${
                        message.type === 'user' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${
                          message.type === 'user' ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                        }`}>{doc.title}</p>
                        <p className={`text-xs opacity-75 ${
                          message.type === 'user' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                        }`}>{doc.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs opacity-75 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quick questions:</p>
          <div className="space-y-1">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-xs text-left w-full p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
              >
                • {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your project..."
            className="flex-1 resize-none input text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 min-h-[40px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Simulate AI response - in real implementation, this would be replaced with actual API call
async function simulateAIResponse(message: string, projectId: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('document') && lowerMessage.includes('need')) {
    return {
      content: `For your BESS project, you typically need these key documents:

1. Environmental Impact Assessment
2. Interconnection Request
3. Land Use Permit
4. Construction Permit
5. Electrical Safety Certification

I can help generate any of these documents. Which one would you like to start with?`,
      documents: []
    }
  }

  if (lowerMessage.includes('environmental')) {
    return {
      content: `I found environmental documents for your project:`,
      documents: [
        {
          id: '1',
          title: 'Environmental Impact Assessment - Draft',
          type: 'environmental_impact_assessment'
        }
      ]
    }
  }

  if (lowerMessage.includes('status')) {
    return {
      content: `Your project is currently in the setup phase. Here's what I can see:

✅ Basic project information completed
⏳ Document generation in progress
❌ Environmental permits pending

Would you like me to help with any specific aspect?`
    }
  }

  if (lowerMessage.includes('generate') || lowerMessage.includes('create')) {
    return {
      content: `I can help generate documents for your project. To ensure accuracy and compliance with Chilean regulations, I'll need to gather some specific information from you.

What type of document would you like to generate? I can create:
• Environmental Impact Assessment
• Interconnection Request  
• Technical Specifications
• Compliance Reports

Please specify which document type you need, and I'll guide you through providing the necessary details. I never make assumptions about missing information - I'll always ask for clarification to ensure the document meets your exact requirements.`
    }
  }

  // Default response
  return {
    content: `I understand you're asking about "${message}". To provide you with the most accurate and helpful information, I need to better understand what you're looking for.

I can help you with:
• Finding and explaining project documents
• Generating new permit documents
• Answering questions about Chilean BESS requirements
• Providing project status updates
• Guiding you through missing information for document generation

Could you please clarify specifically what you'd like to know or accomplish? The more details you provide, the better I can assist you. I always ask for clarification rather than making assumptions about your needs.`
  }
}