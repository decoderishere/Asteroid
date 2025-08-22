"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Upload, 
  Calendar,
  Hash,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Save,
  X,
  RefreshCw
} from 'lucide-react'
import { InputRequest } from '@/lib/types/sections'
import { getSectionTemplate } from '@/lib/sectionTemplates'
import { toast } from 'sonner'
import AttachFileModal from './AttachFileModal'

interface InputRequestChipProps {
  inputRequest: InputRequest
  sectionKey: string
  onUpdate: () => void
}

export default function InputRequestChip({ inputRequest, sectionKey, onUpdate }: InputRequestChipProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentValue, setCurrentValue] = useState(inputRequest.resolvedValue || '')

  const template = getSectionTemplate(sectionKey)
  const inputDef = template?.requiredInputs.find(input => input.key === inputRequest.inputKey)

  if (!inputDef) {
    return null
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="h-4 w-4" />
      case 'date':
        return <Calendar className="h-4 w-4" />
      case 'number':
        return <Hash className="h-4 w-4" />
      case 'boolean':
        return inputRequest.resolvedValue ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />
      case 'text':
      default:
        return <Edit3 className="h-4 w-4" />
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/sections/${inputRequest.sectionId}/inputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputKey: inputRequest.inputKey,
          value: currentValue
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save input')
      }

      const result = await response.json()
      toast.success('Input saved successfully')
      setIsEditing(false)
      onUpdate()

      if (result.allInputsResolved) {
        toast.success('All required inputs completed! Section is ready to render.')
      }
    } catch (error) {
      console.error('Error saving input:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save input')
    } finally {
      setSaving(false)
    }
  }

  const handleFileAttach = async (fileId: string, fileName: string) => {
    try {
      setSaving(true)

      const response = await fetch(`/api/sections/${inputRequest.sectionId}/inputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputKey: inputRequest.inputKey,
          value: fileName,
          fileId: fileId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to attach file')
      }

      const result = await response.json()
      toast.success('File attached successfully')
      setShowFileModal(false)
      onUpdate()

      if (result.allInputsResolved) {
        toast.success('All required inputs completed! Section is ready to render.')
      }
    } catch (error) {
      console.error('Error attaching file:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to attach file')
    } finally {
      setSaving(false)
    }
  }

  const handleBooleanToggle = async () => {
    const newValue = !inputRequest.resolvedValue
    try {
      setSaving(true)

      const response = await fetch(`/api/sections/${inputRequest.sectionId}/inputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputKey: inputRequest.inputKey,
          value: newValue
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update input')
      }

      const result = await response.json()
      toast.success('Input updated successfully')
      onUpdate()

      if (result.allInputsResolved) {
        toast.success('All required inputs completed! Section is ready to render.')
      }
    } catch (error) {
      console.error('Error updating input:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update input')
    } finally {
      setSaving(false)
    }
  }

  const renderValue = () => {
    if (!inputRequest.isResolved) {
      return <span className="text-muted-foreground italic">Not provided</span>
    }

    switch (inputRequest.type) {
      case 'file':
        return (
          <span className="text-blue-600 font-medium">
            {inputRequest.resolvedValue} 📎
          </span>
        )
      case 'boolean':
        return (
          <span className={inputRequest.resolvedValue ? 'text-green-600' : 'text-red-600'}>
            {inputRequest.resolvedValue ? 'Yes' : 'No'}
          </span>
        )
      case 'date':
        return (
          <span className="font-mono text-sm">
            {new Date(inputRequest.resolvedValue).toLocaleDateString()}
          </span>
        )
      case 'number':
        return (
          <span className="font-mono text-sm">
            {inputRequest.resolvedValue}
          </span>
        )
      case 'text':
      default:
        const text = inputRequest.resolvedValue.toString()
        return (
          <span className={text.length > 100 ? 'text-sm' : ''}>
            {text.length > 100 ? `${text.substring(0, 100)}...` : text}
          </span>
        )
    }
  }

  const renderInput = () => {
    switch (inputRequest.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder={inputDef.placeholder}
            min={inputDef.validation?.min}
            max={inputDef.validation?.max}
            className="flex-1"
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className="flex-1"
          />
        )
      case 'text':
        if (inputDef.validation?.maxLength && inputDef.validation.maxLength > 200) {
          return (
            <Textarea
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder={inputDef.placeholder}
              rows={4}
              maxLength={inputDef.validation?.maxLength}
              className="flex-1 resize-none"
            />
          )
        }
        return (
          <Input
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder={inputDef.placeholder}
            maxLength={inputDef.validation?.maxLength}
            className="flex-1"
          />
        )
      default:
        return null
    }
  }

  const isRequired = inputDef.validation?.required !== false

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon(inputRequest.type)}
            <span className="font-medium text-foreground">{inputDef.label}</span>
            {isRequired && <Badge variant="outline" className="text-xs">Required</Badge>}
            {inputRequest.isResolved ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
          </div>
          
          {inputDef.description && (
            <p className="text-sm text-muted-foreground mb-2">{inputDef.description}</p>
          )}

          {/* Current Value Display */}
          {!isEditing && (
            <div className="text-sm">
              <span className="text-muted-foreground">Value: </span>
              {renderValue()}
            </div>
          )}

          {/* Input Fields (when editing) */}
          {isEditing && inputRequest.type !== 'file' && (
            <div className="flex items-center gap-2 mt-2">
              {renderInput()}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setCurrentValue(inputRequest.resolvedValue || '')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {inputRequest.type === 'file' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFileModal(true)}
              disabled={saving}
            >
              <Upload className="h-4 w-4 mr-2" />
              {inputRequest.isResolved ? 'Change File' : 'Attach File'}
            </Button>
          ) : inputRequest.type === 'boolean' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBooleanToggle}
              disabled={saving}
            >
              {inputRequest.resolvedValue ? (
                <ToggleRight className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 mr-2 text-gray-400" />
              )}
              {inputRequest.resolvedValue ? 'Yes' : 'No'}
            </Button>
          ) : !isEditing ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(true)
                setCurrentValue(inputRequest.resolvedValue || '')
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {inputRequest.isResolved ? 'Edit' : 'Add'}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Validation Info */}
      {inputDef.validation && (isEditing || !inputRequest.isResolved) && (
        <div className="text-xs text-muted-foreground space-y-1">
          {inputDef.validation.minLength && (
            <p>Minimum {inputDef.validation.minLength} characters</p>
          )}
          {inputDef.validation.maxLength && (
            <p>Maximum {inputDef.validation.maxLength} characters</p>
          )}
          {inputDef.validation.min !== undefined && (
            <p>Minimum value: {inputDef.validation.min}</p>
          )}
          {inputDef.validation.max !== undefined && (
            <p>Maximum value: {inputDef.validation.max}</p>
          )}
          {inputDef.validation.fileTypes && (
            <p>Accepted formats: {inputDef.validation.fileTypes.join(', ')}</p>
          )}
        </div>
      )}

      {/* File Modal */}
      {showFileModal && inputRequest.type === 'file' && (
        <AttachFileModal
          category={inputDef.category || 'general'}
          onAttach={handleFileAttach}
          onClose={() => setShowFileModal(false)}
          currentFileId={inputRequest.resolvedFileId}
        />
      )}
    </div>
  )
}