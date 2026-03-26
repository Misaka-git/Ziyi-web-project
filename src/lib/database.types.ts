export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          created_at?: string
        }
      }
      nace_competencies: {
        Row: {
          id: string
          name: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string
        }
      }
      job_competencies: {
        Row: {
          id: string
          job_id: string
          competency_id: string
          importance_level: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          competency_id: string
          importance_level?: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          competency_id?: string
          importance_level?: string
          created_at?: string
        }
      }
    }
  }
}
