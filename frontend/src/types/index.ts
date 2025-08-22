export interface Project {
  id: string
  name: string
  substation_id: string
  substation_name?: string
  description?: string
  language: string
  status: string
  latitude?: number
  longitude?: number
  voltage_level?: string
  capacity_mw?: number
  technology_type?: string
  grid_connection_type?: string
  project_developer?: string
  created_at: string
  updated_at: string
  // Soft-delete fields
  deleted_at?: string | null
  deleted_by?: string | null
  delete_reason?: string | null
}

export interface Document {
  id: string
  project_id: string
  doc_type: string
  title: string
  version: number
  status: string
  quality_score?: number
  placeholders?: string[]
  origin?: string
  content?: string
  created_at: string
  updated_at: string
  // Soft-delete fields
  deleted_at?: string | null
  deleted_by?: string | null
  delete_reason?: string | null
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  author_id: string
  author_name: string
  author_email?: string
  origin: string
  change_summary?: string
  created_at: string
}

export interface DocumentVersionContent {
  id: string
  version_number: number
  content: string
  author: {
    id: string
    name: string
    email?: string
  }
  origin: string
  change_summary?: string
  created_at: string
}

export interface DocumentReview {
  id: string
  document_id: string
  reviewer_type: string
  reviewer_name?: string
  status: string
  score?: number
  feedback?: string
  missing_elements?: string[]
  recommendations?: string[]
  created_at: string
}

export interface KPIMetric {
  metric_name: string
  metric_value: number
  metric_type: string
  calculated_at: string
}

export interface AgentTrace {
  id: string
  agent_name: string
  task_type: string
  model_used: string
  execution_time: number
  success: boolean
  created_at: string
}

export interface AgentTraceDetail extends AgentTrace {
  input_data: any
  output_data: any
  reasoning: string
  error_message?: string
}

export interface FileUpload {
  file: File
  project_id: string
}

export interface CreateProjectData {
  name: string
  substation_id: string
  substation_name?: string
  description?: string
  language?: string
  latitude?: number | null
  longitude?: number | null
  voltage_level?: string
  capacity_mw?: number | null
  technology_type?: string
  grid_connection_type?: string
  project_developer?: string
}

// Project deletion types
export interface DeleteProjectRequest {
  projectId: string
  actorId: string
  reason?: string
}

export interface DeleteProjectResponse {
  success: boolean
  message: string
  deletedAt: string
  childCounts: {
    documents: number
    files: number
    tasks: number
    traces: number
  }
}

export interface ProjectDeletionSafety {
  canDelete: boolean
  blockingReasons: string[]
  inFlightJobs: {
    id: string
    type: string
    status: string
    estimatedCompletion?: string
  }[]
  warnings: string[]
}

export interface RestoreProjectRequest {
  projectId: string
  actorId: string
  reason?: string
}

// User permissions
export interface UserPermissions {
  userId: string
  projectId?: string
  permissions: string[]
  role: 'owner' | 'admin' | 'collaborator' | 'viewer'
}

// Audit event types
export interface ProjectDeletedEvent {
  type: 'project.deleted'
  projectId: string
  projectName: string
  actorId: string
  timestamp: string
  childCounts: {
    documents: number
    files: number
    tasks: number
    traces: number
  }
  deleteReason?: string
  metadata: Record<string, any>
}

export interface ProjectRestoredEvent {
  type: 'project.restored'
  projectId: string
  projectName: string
  actorId: string
  timestamp: string
  metadata: Record<string, any>
}