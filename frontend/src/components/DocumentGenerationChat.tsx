'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  PaperAirplaneIcon, 
  DocumentTextIcon, 
  QuestionMarkCircleIcon,
  SparklesIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { Project } from '@/types'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  fieldSuggestions?: Array<{
    field: string
    value: string
    label: string
  }>
}

interface DocumentGenerationChatProps {
  projectId: string
  documentType: string
  documentData: Record<string, any>
  onFieldUpdate: (key: string, value: any) => void
  project: Project
}

export default function DocumentGenerationChat({ 
  projectId, 
  documentType, 
  documentData, 
  onFieldUpdate,
  project 
}: DocumentGenerationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [documentType, project])

  const getWelcomeMessage = () => {
    const docTypeNames: Record<string, string> = {
      environmental_impact_assessment: 'Environmental Impact Assessment',
      interconnection_request: 'Interconnection Request',
      land_use_permit: 'Land Use Permit',
      construction_permit: 'Construction Permit',
      electrical_safety_certification: 'Electrical Safety Certification'
    }

    const docName = docTypeNames[documentType] || 'document'

    return `¡Hola! I'm your AI assistant for generating the **${docName}** document for **${project.name}**.

I can see you already have some project information:
${project.capacity_mw ? `• Capacity: ${project.capacity_mw} MW` : ''}
${project.voltage_level ? `• Voltage Level: ${project.voltage_level}` : ''}
${project.technology_type ? `• Technology: ${project.technology_type.replace('_', ' ')}` : ''}
${project.project_developer ? `• Developer: ${project.project_developer}` : ''}

I'll help you fill in any missing information needed for this document. Feel free to ask me questions about:
• What information is required for this document type
• Chilean regulations and requirements
• Help filling specific fields
• Suggestions based on your project details

What would you like to know or work on first?`
  }

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
      // Simulate AI response with context awareness
      const response = await generateAIResponse(inputMessage, documentType, documentData, project)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        fieldSuggestions: response.fieldSuggestions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error. Please try asking your question again or be more specific about what information you need.',
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

  const handleFieldSuggestion = (field: string, value: string) => {
    onFieldUpdate(field, value)
    
    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `✅ Great! I've filled in that information for you. The field "${field}" has been updated.`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const getQuickQuestions = () => {
    const questions: Record<string, string[]> = {
      environmental_impact_assessment: [
        'What environmental information do I need for this document?',
        'Help me describe the project location and surroundings',
        'What are the key environmental risks for BESS projects?',
        'Suggest content for environmental baseline data'
      ],
      interconnection_request: [
        'What technical specifications are required?',
        'Help me with protection systems description',
        'What connection point details should I include?',
        'Suggest communication systems information'
      ],
      land_use_permit: [
        'What property information is required?',
        'Help me describe current land use',
        'What zoning information do I need?',
        'Suggest access roads description'
      ],
      construction_permit: [
        'What construction phases should I describe?',
        'Help me with safety protocols',
        'What equipment specifications are needed?',
        'Suggest construction timeline details'
      ],
      electrical_safety_certification: [
        'What safety standards apply to BESS in Chile?',
        'Help me with equipment certifications',
        'What testing procedures are required?',
        'Suggest maintenance protocols'
      ]
    }
    
    return questions[documentType] || [
      'What information is required for this document?',
      'Help me fill in the required fields',
      'What are the Chilean regulations for this?',
      'Suggest content based on my project'
    ]
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Document Generation Assistant
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ask me anything about generating this document</p>
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
                  ? 'bg-primary-600 dark:bg-primary-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {message.fieldSuggestions && message.fieldSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium opacity-90">💡 I can fill these for you:</p>
                  {message.fieldSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleFieldSuggestion(suggestion.field, suggestion.value)}
                      className="block w-full text-left p-2 bg-white bg-opacity-20 dark:bg-gray-700 dark:bg-opacity-50 rounded border border-white border-opacity-30 dark:border-gray-600 dark:border-opacity-50 hover:bg-opacity-30 dark:hover:bg-opacity-70 transition-colors"
                    >
                      <p className="text-xs font-medium">{suggestion.label}</p>
                      <p className="text-xs opacity-75 truncate">{suggestion.value}</p>
                    </button>
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
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <LightBulbIcon className="h-3 w-3 mr-1" />
            Quick questions:
          </p>
          <div className="space-y-1">
            {getQuickQuestions().map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-xs text-left w-full p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 rounded transition-colors"
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
            placeholder="Ask me about required information, Chilean regulations, or help with specific fields..."
            className="flex-1 resize-none input text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 min-h-[40px] max-h-[120px]"
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

// AI Response Generation with context awareness
async function generateAIResponse(
  message: string, 
  documentType: string, 
  documentData: Record<string, any>,
  project: Project
): Promise<{ content: string; fieldSuggestions?: Array<{ field: string; value: string; label: string }> }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const lowerMessage = message.toLowerCase()
  
  // Environmental Impact Assessment responses
  if (documentType === 'environmental_impact_assessment') {
    if (lowerMessage.includes('environmental') && lowerMessage.includes('information')) {
      return {
        content: `For the Environmental Impact Assessment in Chile, you need to include:

**Required Information:**
1. **Project Location Description** - Detailed description of the project site and surrounding area
2. **Environmental Baseline** - Current environmental conditions (air, water, soil, noise levels)
3. **Impact Assessment** - How the BESS will affect the environment
4. **Mitigation Measures** - Plans to minimize negative impacts
5. **Monitoring Plan** - How you'll track environmental effects

**Chilean Specific Requirements:**
• Compliance with DS 40/2012 (Environmental Impact Assessment System)
• Consideration of protected areas within 10km radius
• Water resource impact assessment if applicable
• Flora and fauna species inventory

Would you like me to help fill in any specific section?`,
        fieldSuggestions: project.latitude && project.longitude ? [{
          field: 'project_location_description',
          value: `The project is located at coordinates ${project.latitude}°S, ${project.longitude}°W in Chile. The site is designated for industrial/energy infrastructure development, with good access to existing electrical grid infrastructure through the ${project.substation_name || 'nearby substation'}.`,
          label: 'Project Location Description'
        }] : undefined
      }
    }

    if (lowerMessage.includes('location') || lowerMessage.includes('describe') && lowerMessage.includes('project')) {
      const locationSuggestion = project.latitude && project.longitude 
        ? `The ${project.name} BESS project is strategically located at coordinates ${project.latitude}°S, ${project.longitude}°W in Chile. The ${project.capacity_mw || 'XX'} MW facility will be situated on industrial land suitable for energy infrastructure. The site provides optimal access to the electrical grid through connection to ${project.substation_name || 'the local substation'}, ensuring efficient energy storage and dispatch operations. The location was selected considering proximity to grid infrastructure, environmental sensitivity, and local zoning regulations.`
        : `Please provide the project coordinates so I can help create a comprehensive location description that includes geographic context, land use classification, and grid connection details.`

      return {
        content: `I can help you describe the project location. Based on your project information:

**Key elements to include:**
• Geographic coordinates and administrative location
• Land use classification and zoning
• Proximity to existing infrastructure
• Environmental context and surroundings
• Access routes and connectivity

Would you like me to suggest content based on your project coordinates?`,
        fieldSuggestions: project.latitude && project.longitude ? [{
          field: 'project_location_description',
          value: locationSuggestion,
          label: 'Project Location Description'
        }] : undefined
      }
    }

    if (lowerMessage.includes('baseline') || lowerMessage.includes('environmental baseline')) {
      return {
        content: `Environmental baseline data is crucial for your EIA. For a BESS project in Chile, you should include:

**Air Quality:**
• PM10 and PM2.5 concentrations
• Atmospheric conditions and meteorology
• Background noise levels

**Water Resources:**
• Surface and groundwater quality
• Hydrological patterns
• Water usage in the area

**Soil and Geology:**
• Soil composition and contamination levels
• Geological stability
• Seismic considerations

**Biodiversity:**
• Flora and fauna species inventory
• Habitat characterization
• Protected or endangered species

**Socioeconomic:**
• Local community characteristics
• Economic activities
• Cultural heritage sites

Would you like me to suggest baseline content based on your project location?`,
        fieldSuggestions: [{
          field: 'environmental_baseline',
          value: `Environmental baseline studies conducted for the ${project.name} project site reveal typical conditions for the region. Air quality measurements show compliance with Chilean standards (DS 59/1998). The area is characterized by [industrial/agricultural/mixed] land use with moderate existing infrastructure. Noise levels are within acceptable ranges for industrial zones. No significant water bodies are directly affected by the project footprint. Soil studies indicate stable geological conditions suitable for BESS infrastructure. Biodiversity assessment shows [common regional species] with no critical habitat identified within the immediate project area. Socioeconomic baseline reflects [local community characteristics]. All baseline studies follow Chilean environmental assessment guidelines and will be updated during detailed design phase.`,
          label: 'Environmental Baseline Data'
        }]
      }
    }
  }

  // Interconnection Request responses
  if (documentType === 'interconnection_request') {
    if (lowerMessage.includes('technical') && lowerMessage.includes('specification')) {
      return {
        content: `For the Interconnection Request, you need these technical specifications:

**Power Characteristics:**
• Maximum injection power (MW)
• Maximum consumption power (MW) 
• Power factor range
• Voltage regulation capability

**Connection Details:**
• Connection voltage level (${project.voltage_level || 'specify voltage'})
• Connection point coordinates
• Distance to connection point
• Substation modifications required

**Protection Systems:**
• Overcurrent protection
• Voltage protection (over/under)
• Frequency protection
• Ground fault protection
• Anti-islanding protection

**Control & Communication:**
• SCADA integration
• Remote monitoring capabilities
• Communication protocols
• Response time requirements

Based on your project (${project.capacity_mw || 'XX'} MW), I can suggest specific values.`,
        fieldSuggestions: project.capacity_mw ? [
          {
            field: 'max_injection_power',
            value: project.capacity_mw.toString(),
            label: 'Maximum Injection Power (MW)'
          },
          {
            field: 'max_consumption_power', 
            value: project.capacity_mw.toString(),
            label: 'Maximum Consumption Power (MW)'
          }
        ] : undefined
      }
    }

    if (lowerMessage.includes('protection') && lowerMessage.includes('system')) {
      return {
        content: `Protection systems are critical for BESS interconnection in Chile. Here's what you need:

**Primary Protection:**
• Differential protection for transformers
• Overcurrent protection (50/51)
• Voltage protection (27/59)
• Frequency protection (81U/81O)

**Secondary Protection:**
• Anti-islanding protection (required by Chilean grid code)
• Ground fault protection
• Arc flash protection
• Battery management system integration

**Chilean Grid Code Compliance:**
• NTSyCS requirements
• Fault ride-through capability
• Power quality standards (IEEE 519)
• Grid support functions

Would you like me to create a detailed protection systems description?`,
        fieldSuggestions: [{
          field: 'protection_systems',
          value: `The ${project.name} BESS will implement comprehensive protection systems complying with Chilean grid codes and NTSyCS requirements. Primary protection includes differential protection for the step-up transformer, overcurrent protection (ANSI 50/51) with time-coordinated curves, voltage protection (27/59) for under/over voltage conditions, and frequency protection (81) for grid stability. Anti-islanding protection prevents unintended island operation per Chilean regulations. The Battery Management System (BMS) provides cell-level protection and thermal management. All protection settings will be coordinated with ${project.substation_name || 'the connection substation'} existing protection scheme. Communication with the grid control center uses DNP3 protocol over fiber optic links. Protection system design follows IEC 61850 standards for seamless integration with existing grid infrastructure.`,
          label: 'Protection Systems Description'
        }]
      }
    }
  }

  // General responses for all document types
  if (lowerMessage.includes('help') && lowerMessage.includes('fill')) {
    const missingFields = getMissingFields(documentType, documentData)
    return {
      content: `I can help you fill the required information! Looking at your current progress:

**Completed:** ${Object.keys(documentData).length} fields
**Still needed:** ${missingFields.join(', ')}

Which field would you like help with? I can:
• Provide examples and suggestions
• Explain Chilean regulatory requirements  
• Use your existing project data to suggest content
• Guide you through step by step

Just ask about a specific field or say "help me with [field name]"`
    }
  }

  if (lowerMessage.includes('regulation') || lowerMessage.includes('chile')) {
    return {
      content: `For ${getDocumentTypeName(documentType)} in Chile, key regulations include:

**Primary Regulations:**
• Ley 19.300 (Environmental Framework Law) 
• DS 40/2012 (Environmental Impact Assessment System)
• NTSyCS (Grid Code) for electrical connections
• Ley General de Electricidad for power sector

**Key Requirements:**
• Environmental impact assessment if capacity > 3MW
• Grid connection studies for systems > 9MW  
• Local municipal permits for construction
• SEIA approval for environmental permits

**Timeline Considerations:**
• Environmental review: 120-180 days
• Grid connection approval: 60-90 days
• Construction permits: 30-60 days

Would you like specific information about any of these regulations?`
    }
  }

  // Default helpful response
  return {
    content: `I understand you're asking about "${message}". Let me help you with that specific information for your ${getDocumentTypeName(documentType)}.

To provide the most accurate guidance, could you be more specific about:
• Which field or section you need help with?
• What type of information you're looking for?
• Whether you need examples or explanations?

I have access to:
✅ Your project details (${project.name}, ${project.capacity_mw || 'XX'} MW)
✅ Chilean regulatory requirements
✅ Document templates and examples
✅ Field-specific suggestions

Just let me know what specific aspect you'd like to work on!`
  }
}

function getMissingFields(documentType: string, documentData: Record<string, any>): string[] {
  // This would check which required fields are missing
  const allFields = ['project_location_description', 'environmental_baseline', 'technical_specifications']
  return allFields.filter(field => !documentData[field])
}

function getDocumentTypeName(documentType: string): string {
  const names: Record<string, string> = {
    environmental_impact_assessment: 'Environmental Impact Assessment',
    interconnection_request: 'Interconnection Request',
    land_use_permit: 'Land Use Permit', 
    construction_permit: 'Construction Permit',
    electrical_safety_certification: 'Electrical Safety Certification'
  }
  return names[documentType] || 'document'
}