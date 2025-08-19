'use client'

import { useState } from 'react'
import { useTranslation } from '@/contexts/LanguageContext'
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, BoltIcon, BuildingOfficeIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { sampleProjects, generateSubstationId, chileanLocations, chileanCompanies, getRandomSample } from '@/lib/sampleData'

interface SetupData {
  name: string
  substation_id: string
  substation_name: string
  latitude: number | null
  longitude: number | null
  voltage_level: string
  capacity_mw: number | null
  technology_type: string
  grid_connection_type: string
  project_developer: string
  description: string
  language: string
}

interface ProjectSetupWizardProps {
  onComplete: (data: SetupData) => void
  onCancel: () => void
}

const STEPS = [
  { id: 'basic', title: 'Basic Information', icon: BuildingOfficeIcon },
  { id: 'location', title: 'Location Details', icon: MapPinIcon },
  { id: 'technical', title: 'Technical Specifications', icon: BoltIcon },
]

export default function ProjectSetupWizard({ onComplete, onCancel }: ProjectSetupWizardProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<SetupData>({
    name: '',
    substation_id: '',
    substation_name: '',
    latitude: null,
    longitude: null,
    voltage_level: '',
    capacity_mw: null,
    technology_type: '',
    grid_connection_type: '',
    project_developer: '',
    description: '',
    language: 'es'
  })
  const [showAutocomplete, setShowAutocomplete] = useState<Record<string, boolean>>({})

  const handleChange = (field: keyof SetupData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-generate substation ID when substation name or voltage changes
      if (field === 'substation_name' || field === 'voltage_level') {
        if (updated.substation_name && updated.voltage_level) {
          updated.substation_id = generateSubstationId(updated.substation_name, updated.voltage_level)
        }
      }
      return updated
    })
  }

  const fillSampleData = () => {
    const sample = getRandomSample()
    setFormData({
      ...formData,
      name: sample.name,
      substation_name: sample.substation_name,
      project_developer: sample.project_developer,
      description: sample.description,
      latitude: sample.latitude,
      longitude: sample.longitude,
      capacity_mw: sample.capacity_mw,
      voltage_level: sample.voltage_level,
      technology_type: sample.technology_type,
      substation_id: generateSubstationId(sample.substation_name, sample.voltage_level)
    })
  }

  const toggleAutocomplete = (field: string) => {
    setShowAutocomplete(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const selectSuggestion = (field: keyof SetupData, value: any) => {
    handleChange(field, value)
    setShowAutocomplete(prev => ({ ...prev, [field]: false }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic
        return formData.name.trim() && formData.substation_name.trim() // Only require name and substation name
      case 1: // Location
        return true // All optional
      case 2: // Technical
        return true // All optional
      default:
        return true
    }
  }

  const handleComplete = () => {
    // Ensure substation_id is generated if not already set
    const finalData = { ...formData }
    if (!finalData.substation_id && finalData.substation_name && finalData.voltage_level) {
      finalData.substation_id = generateSubstationId(finalData.substation_name, finalData.voltage_level)
    }
    // If still no substation_id, generate a simple one
    if (!finalData.substation_id && finalData.substation_name) {
      finalData.substation_id = generateSubstationId(finalData.substation_name, finalData.voltage_level || '220kV')
    }
    onComplete(finalData)
  }

  const renderBasicStep = () => (
    <div className="space-y-6">
      {/* Quick Fill Sample Data */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">Quick Testing</h3>
            <p className="text-sm text-purple-800 dark:text-purple-200">Fill with realistic sample data for faster testing</p>
          </div>
          <button
            type="button"
            onClick={fillSampleData}
            className="bg-purple-600 dark:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 dark:hover:bg-purple-500 flex items-center"
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Fill Sample Data
          </button>
        </div>
      </div>

      <div className="relative">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onFocus={() => toggleAutocomplete('name')}
          className="input w-full text-gray-900 dark:text-gray-100"
          placeholder="e.g. BESS Los Andes 50MW"
          required
        />
        {showAutocomplete.name && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {sampleProjects.map((project, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                onClick={() => selectSuggestion('name', project.name)}
              >
                {project.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <label htmlFor="substation_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Substation Name *
        </label>
        <input
          type="text"
          id="substation_name"
          value={formData.substation_name}
          onChange={(e) => handleChange('substation_name', e.target.value)}
          onFocus={() => toggleAutocomplete('substation_name')}
          className="input w-full text-gray-900 dark:text-gray-100"
          placeholder="e.g. Los Andes 220kV Substation"
          required
        />
        {showAutocomplete.substation_name && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {sampleProjects.map((project, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                onClick={() => selectSuggestion('substation_name', project.substation_name)}
              >
                {project.substation_name}
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Human-readable name of the substation
        </p>
      </div>

      {/* Auto-generated Substation ID - Read-only display */}
      {formData.substation_name && formData.voltage_level && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generated Substation ID
          </label>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
            {formData.substation_id || 'Will be generated automatically'}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automatically generated from substation name and voltage level
          </p>
        </div>
      )}

      <div className="relative">
        <label htmlFor="project_developer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Project Developer
        </label>
        <input
          type="text"
          id="project_developer"
          value={formData.project_developer}
          onChange={(e) => handleChange('project_developer', e.target.value)}
          onFocus={() => toggleAutocomplete('project_developer')}
          className="input w-full text-gray-900 dark:text-gray-100"
          placeholder="e.g. Empresa Eléctrica XYZ"
        />
        {showAutocomplete.project_developer && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {chileanCompanies.map((company, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                onClick={() => selectSuggestion('project_developer', company)}
              >
                {company}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Project Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="input w-full resize-none text-gray-900 dark:text-gray-100"
          placeholder="Brief description of the BESS project, its purpose, and key features"
        />
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Document Language
        </label>
        <select
          id="language"
          value={formData.language}
          onChange={(e) => handleChange('language', e.target.value)}
          className="input w-full text-gray-900 dark:text-gray-100"
        >
          <option value="es">Spanish (recommended for Chile)</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  )

  const renderLocationStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Location Information</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Providing location details helps generate more accurate environmental and regulatory documents. 
          You can skip any fields you don't have information for.
        </p>
      </div>

      {/* Location Quick Select */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">Quick Location Select</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {chileanLocations.map((location) => (
            <button
              key={location.city}
              type="button"
              onClick={() => {
                handleChange('latitude', location.latitude)
                handleChange('longitude', location.longitude)
              }}
              className="px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded hover:bg-green-100 dark:hover:bg-green-800/30 text-green-800 dark:text-green-200"
            >
              {location.city}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Latitude
          </label>
          <input
            type="number"
            id="latitude"
            step="any"
            value={formData.latitude || ''}
            onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
            className="input w-full text-gray-900 dark:text-gray-100"
            placeholder="e.g. -33.4489"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Decimal degrees (negative for south)
          </p>
        </div>

        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Longitude
          </label>
          <input
            type="number"
            id="longitude"
            step="any"
            value={formData.longitude || ''}
            onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
            className="input w-full text-gray-900 dark:text-gray-100"
            placeholder="e.g. -70.6693"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Decimal degrees (negative for west)
          </p>
        </div>
      </div>

      {formData.latitude && formData.longitude && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            📍 Location: {formData.latitude}°, {formData.longitude}°
          </p>
        </div>
      )}
    </div>
  )

  const renderTechnicalStep = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">Technical Specifications</h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          These details help generate accurate technical documents and equipment specifications. 
          Provide what you know and skip the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="capacity_mw" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Capacity (MW)
          </label>
          <input
            type="number"
            id="capacity_mw"
            step="0.1"
            value={formData.capacity_mw || ''}
            onChange={(e) => handleChange('capacity_mw', e.target.value ? parseFloat(e.target.value) : null)}
            className="input w-full text-gray-900 dark:text-gray-100"
            placeholder="e.g. 50"
          />
        </div>

        <div>
          <label htmlFor="voltage_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voltage Level
          </label>
          <select
            id="voltage_level"
            value={formData.voltage_level}
            onChange={(e) => handleChange('voltage_level', e.target.value)}
            className="input w-full text-gray-900 dark:text-gray-100"
          >
            <option value="">Select voltage level</option>
            <option value="12kV">12 kV</option>
            <option value="23kV">23 kV</option>
            <option value="110kV">110 kV</option>
            <option value="220kV">220 kV</option>
            <option value="500kV">500 kV</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="technology_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Battery Technology
        </label>
        <select
          id="technology_type"
          value={formData.technology_type}
          onChange={(e) => handleChange('technology_type', e.target.value)}
          className="input w-full text-gray-900 dark:text-gray-100"
        >
          <option value="">Select technology</option>
          <option value="lithium_ion">Lithium-ion</option>
          <option value="vanadium_flow">Vanadium Flow Battery</option>
          <option value="sodium_sulfur">Sodium Sulfur</option>
          <option value="compressed_air">Compressed Air Energy Storage</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="grid_connection_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Grid Connection Type
        </label>
        <select
          id="grid_connection_type"
          value={formData.grid_connection_type}
          onChange={(e) => handleChange('grid_connection_type', e.target.value)}
          className="input w-full text-gray-900 dark:text-gray-100"
        >
          <option value="">Select connection type</option>
          <option value="transmission">Transmission Level</option>
          <option value="subtransmission">Subtransmission Level</option>
          <option value="distribution">Distribution Level</option>
        </select>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicStep()
      case 1: return renderLocationStep()
      case 2: return renderTechnicalStep()
      default: return renderBasicStep()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Setup Wizard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Let's gather the key information for your BESS project. You can skip any questions you don't have answers for right now.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center space-x-8">
            {STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500 text-white' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 ml-8" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="card mb-8">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="btn-secondary flex items-center"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Project
            </button>
          )}
        </div>
      </div>
    </div>
  )
}