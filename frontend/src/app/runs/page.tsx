"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  FileText, 
  ExternalLink, 
  Download, 
  Copy, 
  Trash2, 
  Search,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface RunEntry {
  runId: string
  projectName?: string
  title?: string
  createdAt: string
  size: number
  status: 'completed' | 'failed'
}

interface RunsListResponse {
  runs: RunEntry[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export default function RunsPage() {
  const [runs, setRuns] = useState<RunEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadRuns = async (search?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
        ...(search && { project: search })
      })
      
      const response = await fetch(`/api/runs/list?${params}`)
      if (!response.ok) throw new Error('Failed to load runs')
      
      const data: RunsListResponse = await response.json()
      setRuns(data.runs)
    } catch (error) {
      console.error('Failed to load runs:', error)
      toast.error('Failed to load runs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRuns()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadRuns(searchQuery.trim() || undefined)
  }

  const handleDelete = async (runId: string) => {
    if (!confirm('Are you sure you want to delete this run? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(runId)
      const response = await fetch('/api/runs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      })

      if (!response.ok) throw new Error('Failed to delete run')

      toast.success('Run deleted successfully')
      await loadRuns(searchQuery.trim() || undefined)
    } catch (error) {
      toast.error('Failed to delete run')
    } finally {
      setDeleting(null)
    }
  }

  const copyShareLink = async (runId: string) => {
    try {
      const response = await fetch('/api/runs/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      })

      if (!response.ok) throw new Error('Failed to create share link')

      const data = await response.json()
      await navigator.clipboard.writeText(data.shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      toast.error('Failed to create share link')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Run History</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage your document generation runs
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search by project name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
            {searchQuery && (
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  setSearchQuery('')
                  loadRuns()
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Runs List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading runs...</p>
            </CardContent>
          </Card>
        ) : runs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No runs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No runs match your search criteria.' : 'You haven\'t generated any documents yet.'}
              </p>
              <Button asChild>
                <Link href="/projects">Generate Your First Document</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          runs.map((run) => (
            <Card key={run.runId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-lg">{run.title || 'Untitled Document'}</h3>
                      <p className="text-sm text-muted-foreground font-normal">
                        {run.projectName || 'Unknown Project'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={run.status === 'completed' ? 'default' : 'destructive'}>
                    {run.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(run.createdAt)}
                    </div>
                    <div>Size: {formatSize(run.size)}</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {run.runId.slice(0, 8)}...
                    </code>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/runs/${run.runId}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyShareLink(run.runId)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleting === run.runId}
                      onClick={() => handleDelete(run.runId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting === run.runId ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {runs.length >= 20 && (
        <Card>
          <CardContent className="p-4 text-center">
            <Button variant="outline" onClick={() => loadRuns(searchQuery.trim() || undefined)}>
              Load More Runs
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}