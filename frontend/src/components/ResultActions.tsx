"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Archive, Upload, MessageSquare, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { DocRun } from '@/types/run'
import { FeedbackDialog } from './FeedbackDialog'

interface ResultActionsProps {
  run: DocRun
}

export function ResultActions({ run }: ResultActionsProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [isLogging, setIsLogging] = useState(false)

  const getFileUrl = (filePath: string) => {
    const params = new URLSearchParams({
      path: filePath,
      ...(run.metadata?.project_name && { project_name: run.metadata.project_name }),
      ...(run.metadata?.generated_date && { generated_date: run.metadata.generated_date }),
      ...(run.run_id && { run_id: run.run_id }),
    })
    return `/api/files/get?${params.toString()}`
  }

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadPDF = () => {
    if (!run.files?.pdf) return
    const url = getFileUrl(run.files.pdf)
    const filename = `${run.metadata?.project_name?.replace(/\s+/g, '_') || 'document'}.pdf`
    downloadFile(url, filename)
  }

  const handleDownloadMarkdown = () => {
    if (!run.markdown) return
    const blob = new Blob([run.markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const filename = `${run.metadata?.project_name?.replace(/\s+/g, '_') || 'document'}.md`
    downloadFile(url, filename)
    URL.revokeObjectURL(url)
  }

  const handleDownloadHTML = () => {
    if (!run.html) return
    const blob = new Blob([run.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const filename = `${run.metadata?.project_name?.replace(/\s+/g, '_') || 'document'}.html`
    downloadFile(url, filename)
    URL.revokeObjectURL(url)
  }

  const handleDownloadZIP = async () => {
    if (!run.files?.directory) return

    try {
      const response = await fetch('/api/files/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dir: run.files.directory,
          project_name: run.metadata?.project_name,
          generated_date: run.metadata?.generated_date,
          run_id: run.run_id,
        }),
      })

      if (!response.ok) throw new Error('Failed to create ZIP')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const filename = `${run.metadata?.project_name?.replace(/\s+/g, '_') || 'documents'}.zip`
      downloadFile(url, filename)
      URL.revokeObjectURL(url)
      toast.success('ZIP file downloaded successfully')
    } catch (error) {
      toast.error('Failed to create ZIP file')
    }
  }

  const handleLogFullResult = async () => {
    if (isLogging) return
    setIsLogging(true)

    try {
      const response = await fetch('/api/runs/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run }),
      })

      if (!response.ok) throw new Error('Failed to log result')

      toast.success('Full result logged successfully')
    } catch (error) {
      toast.error('Failed to log result')
    } finally {
      setIsLogging(false)
    }
  }

  const getPrimaryDownload = () => {
    if (run.files?.pdf) return { action: handleDownloadPDF, label: 'Download PDF' }
    if (run.markdown) return { action: handleDownloadMarkdown, label: 'Download Markdown' }
    if (run.html) return { action: handleDownloadHTML, label: 'Download HTML' }
    return null
  }

  const primary = getPrimaryDownload()

  return (
    <div className="flex items-center gap-2">
      {/* Primary Download Button */}
      {primary && (
        <Button 
          onClick={primary.action} 
          className="flex items-center gap-2"
          aria-label={`${primary.label} for ${run.metadata?.project_name || 'document'}`}
        >
          <Download className="h-4 w-4" />
          {primary.label}
        </Button>
      )}

      {/* Download Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {run.files?.pdf && (
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
          )}
          {run.markdown && (
            <DropdownMenuItem onClick={handleDownloadMarkdown}>
              <FileText className="h-4 w-4 mr-2" />
              Download Markdown
            </DropdownMenuItem>
          )}
          {run.html && (
            <DropdownMenuItem onClick={handleDownloadHTML}>
              <FileText className="h-4 w-4 mr-2" />
              Download HTML
            </DropdownMenuItem>
          )}
          {run.files?.directory && (
            <DropdownMenuItem onClick={handleDownloadZIP}>
              <Archive className="h-4 w-4 mr-2" />
              Download ZIP (all)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Secondary Actions */}
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleLogFullResult}
        disabled={isLogging}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isLogging ? 'Logging...' : 'Log Full Result'}
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setFeedbackOpen(true)}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Give Feedback
      </Button>

      <FeedbackDialog 
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        runId={run.run_id}
        project={run.metadata?.project_name}
      />
    </div>
  )
}