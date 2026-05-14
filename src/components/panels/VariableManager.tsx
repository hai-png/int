'use client'

import React, { useState } from 'react'
import { useExperienceStore, type Variable } from '@/store/experience-store'
import {
  Variable as VariableIcon,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Type,
  Hash,
  ToggleLeft,
} from 'lucide-react'

export function VariableManager() {
  const { variables, addVariable, updateVariable, removeVariable } = useExperienceStore()
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'string' | 'number' | 'boolean'>('string')

  const handleAdd = () => {
    if (!newName.trim()) return
    const id = `var_${Date.now()}`
    const defaultValue = newType === 'string' ? '' : newType === 'number' ? 0 : false
    addVariable({ id, name: newName.trim(), value: defaultValue })
    setNewName('')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Variables
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {variables.length === 0 ? (
          <div className="p-4 text-center">
            <VariableIcon size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 mb-3">No variables defined</p>
            <p className="text-[10px] text-slate-600">
              Variables store state that behaviors can read and update
            </p>
          </div>
        ) : (
          <div className="py-1">
            {variables.map((v) => (
              <VariableItem key={v.id} variable={v} />
            ))}
          </div>
        )}
      </div>

      {/* Add variable */}
      <div className="border-t border-white/5 p-3 space-y-2">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Variable name"
            className="flex-1 px-2 py-1.5 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'string' | 'number' | 'boolean')}
            className="px-2 py-1.5 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={12} /> Add Variable
        </button>
      </div>
    </div>
  )
}

function VariableItem({ variable }: { variable: Variable }) {
  const { updateVariable, removeVariable } = useExperienceStore()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(variable.name)

  const typeIcon = typeof variable.value === 'boolean'
    ? <ToggleLeft size={12} className="text-purple-400" />
    : typeof variable.value === 'number'
    ? <Hash size={12} className="text-blue-400" />
    : <Type size={12} className="text-green-400" />

  return (
    <div className="px-3 py-2 hover:bg-white/5 group transition-colors">
      <div className="flex items-center gap-2">
        {typeIcon}
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-1.5 py-0.5 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateVariable(variable.id, { name: editName })
                setEditing(false)
              }
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        ) : (
          <span
            className="flex-1 text-xs font-medium text-slate-300 cursor-pointer hover:text-emerald-400"
            onDoubleClick={() => { setEditing(true); setEditName(variable.name) }}
          >
            {variable.name}
          </span>
        )}
        <button
          onClick={() => removeVariable(variable.id)}
          className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div className="ml-5 mt-1">
        {typeof variable.value === 'boolean' ? (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={variable.value}
              onChange={(e) => updateVariable(variable.id, { value: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-500">
              {variable.value ? 'true' : 'false'}
            </span>
          </label>
        ) : typeof variable.value === 'number' ? (
          <input
            type="number"
            value={variable.value}
            onChange={(e) => updateVariable(variable.id, { value: parseFloat(e.target.value) || 0 })}
            className="w-full px-1.5 py-0.5 text-[10px] bg-slate-800/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
          />
        ) : (
          <input
            type="text"
            value={variable.value}
            onChange={(e) => updateVariable(variable.id, { value: e.target.value })}
            className="w-full px-1.5 py-0.5 text-[10px] bg-slate-800/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
          />
        )}
      </div>
    </div>
  )
}
