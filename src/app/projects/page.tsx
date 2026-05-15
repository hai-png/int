'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useExperienceStore } from '@/store/experience-store'

interface ProjectListItem {
  id: string
  name: string
  updatedAt: string
  thumbnail: string | null
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const { importProject } = useExperienceStore()

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const loadProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      const data = await res.json()
      if (data?.data) {
        importProject(data.data)
        router.push('/')
      }
    } catch (e) {
      console.error('Failed to load project:', e)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Projects</h1>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}
          >
            New Project
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.6 }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.6 }}>
            <p style={{ fontSize: 18, marginBottom: 16 }}>No projects yet</p>
            <button onClick={() => router.push('/')} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Create your first project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map(project => (
              <div key={project.id} onClick={() => loadProject(project.id)} style={{ background: '#1e293b', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', border: '1px solid #334155' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{project.name}</div>
                <div style={{ fontSize: 13, opacity: 0.6 }}>Last modified: {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
