"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentTextIcon, ArrowDownTrayIcon, EyeIcon, CodeBracketIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline'
import type { DocRun } from '@/types/run'

interface AgentResultDisplayProps {
  run: DocRun
  onNewGeneration?: () => void
}

export default function AgentResultDisplay({ run, onNewGeneration }: AgentResultDisplayProps) {
  const [activeTab, setActiveTab] = useState("markdown")

  // Defensive checks
  if (!run) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No result data available</p>
      </div>
    )
  }

  const downloadMarkdown = () => {
    if (!run.markdown) return
    
    try {
      const blob = new Blob([run.markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(run.project || 'document').replace(/\s+/g, '_')}_document.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download markdown:', error)
    }
  }

  const downloadHTML = () => {
    if (!run.html) return
    
    try {
      const blob = new Blob([run.html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(run.project || 'document').replace(/\s+/g, '_')}_document.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download HTML:', error)
    }
  }

  const printHTML = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(run.html)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const copyToClipboard = (content: string, format: string) => {
    navigator.clipboard.writeText(content).then(() => {
      // You could add a toast notification here
      console.log(`${format} copied to clipboard`)
    })
  }

  const renderMarkdown = (markdown: string) => {
    // Safe markdown rendering with error handling
    try {
      const lines = markdown.split('\n')
      const elements = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const key = `line-${i}`
        
        if (line.startsWith('# ')) {
          elements.push(<h1 key={key} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>)
        } else if (line.startsWith('## ')) {
          elements.push(<h2 key={key} className="text-xl font-bold mt-5 mb-3">{line.slice(3)}</h2>)
        } else if (line.startsWith('### ')) {
          elements.push(<h3 key={key} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>)
        } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          elements.push(<p key={key} className="font-bold mb-2">{line.slice(2, -2)}</p>)
        } else if (line.startsWith('- ')) {
          elements.push(<li key={key} className="ml-4 mb-1 list-disc">{line.slice(2)}</li>)
        } else if (line.trim() === '---') {
          elements.push(<hr key={key} className="my-6 border-gray-300" />)
        } else if (line.trim() === '') {
          elements.push(<div key={key} className="mb-2"></div>)
        } else if (line.trim()) {
          elements.push(<p key={key} className="mb-2 text-gray-700 leading-relaxed">{line}</p>)
        }
      }
      
      return elements
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">{markdown}</pre>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="text-xl">{run.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Generated on {run.generatedAt} • {run.sections.length} sections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {run && run.mockMode && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Mock Mode
                </Badge>
              )}
              <Badge variant="secondary">
                Run ID: {run.id.slice(0, 8)}...
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadMarkdown} variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download Markdown
            </Button>
            <Button onClick={downloadHTML} variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button onClick={printHTML} variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-2" />
              Print Preview
            </Button>
            {onNewGeneration && (
              <Button onClick={onNewGeneration} variant="default" size="sm">
                Generate New Document
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6 pt-6">
              <TabsList>
                <TabsTrigger value="markdown" className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Markdown View
                </TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  HTML Preview
                </TabsTrigger>
                <TabsTrigger value="raw" className="flex items-center gap-2">
                  <CodeBracketIcon className="h-4 w-4" />
                  Raw HTML
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="markdown" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Rendered Markdown</h3>
                    <Button 
                      onClick={() => copyToClipboard(run.markdown, 'Markdown')}
                      variant="ghost" 
                      size="sm"
                    >
                      Copy Markdown
                    </Button>
                  </div>
                  <div className="prose max-w-none border rounded-lg p-6 bg-white">
                    {renderMarkdown(run.markdown)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="html" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">HTML Preview</h3>
                    <div className="text-sm text-gray-500">
                      Optimized for Word/PDF export
                    </div>
                  </div>
                  <div className="border rounded-lg bg-white">
                    {run.html ? (
                      <div 
                        className="p-6"
                        dangerouslySetInnerHTML={{ __html: run.html }}
                        style={{
                          fontFamily: 'Times New Roman, serif',
                          lineHeight: '1.6',
                          color: '#333'
                        }}
                      />
                    ) : (
                      <div className="p-6 text-gray-500">
                        No HTML content available
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="raw" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Raw HTML Source</h3>
                    <Button 
                      onClick={() => copyToClipboard(run.html, 'HTML')}
                      variant="ghost" 
                      size="sm"
                    >
                      Copy HTML
                    </Button>
                  </div>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border">
                    <code>{run.html || 'No HTML content available'}</code>
                  </pre>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Generation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Agent System</div>
                <div className="text-xs text-gray-500">Automated generation</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">{run.sections.length} Sections</div>
                <div className="text-xs text-gray-500">Generated content</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Multiple Formats</div>
                <div className="text-xs text-gray-500">Markdown + HTML</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}