import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../services/templateService';
import { db } from '../../services/db';
import type { EventTemplate, EventType } from '../../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateModal = ({ isOpen, onClose }: TemplateModalProps) => {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'point' as EventType,
    defaultDuration: 60,
    defaultTags: [] as string[],
    defaultDescription: '',
  });

  const templates = useLiveQuery(() => getAllTemplates(), []);
  const tags = useLiveQuery(() => db.tags.toArray(), []);

  useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setEditingTemplate(null);
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'point',
      defaultDuration: 60,
      defaultTags: [],
      defaultDescription: '',
    });
  };

  const handleCreate = () => {
    setMode('create');
    resetForm();
  };

  const handleEdit = (template: EventTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      defaultDuration: template.defaultDuration || 60,
      defaultTags: template.defaultTags,
      defaultDescription: template.defaultDescription || '',
    });
    setMode('edit');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      if (mode === 'create') {
        await createTemplate({
          name: formData.name.trim(),
          type: formData.type,
          defaultDuration: formData.type === 'duration' ? formData.defaultDuration : undefined,
          defaultTags: formData.defaultTags,
          defaultDescription: formData.defaultDescription.trim() || undefined,
        });
      } else if (mode === 'edit' && editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: formData.name.trim(),
          type: formData.type,
          defaultDuration: formData.type === 'duration' ? formData.defaultDuration : undefined,
          defaultTags: formData.defaultTags,
          defaultDescription: formData.defaultDescription.trim() || undefined,
        });
      }

      setMode('list');
      resetForm();
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const handleCancel = () => {
    setMode('list');
    resetForm();
    setEditingTemplate(null);
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultTags: prev.defaultTags.includes(tagId)
        ? prev.defaultTags.filter(id => id !== tagId)
        : [...prev.defaultTags, tagId]
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 600,
          maxHeight: '85vh',
          background: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {mode === 'list' ? 'Event Templates' : mode === 'create' ? 'Create Template' : 'Edit Template'}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {mode === 'list' ? (
            <>
              {/* Create button */}
              <button
                onClick={handleCreate}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  marginBottom: 20,
                  borderRadius: 8,
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                <span>Create New Template</span>
              </button>

              {/* Template list */}
              {templates && templates.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: 14,
                  }}
                >
                  <FileText style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
                  <p>No templates yet. Create one to get started!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {templates?.map((template) => {
                    const templateTags = tags?.filter(t => template.defaultTags.includes(t.id)) || [];
                    
                    return (
                      <div
                        key={template.id}
                        style={{
                          padding: 16,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 8,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <h3
                              style={{
                                margin: '0 0 4px 0',
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: "'DM Sans', sans-serif",
                                color: 'rgba(255, 255, 255, 0.9)',
                              }}
                            >
                              {template.name}
                            </h3>
                            <div
                              style={{
                                fontSize: 12,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: 'rgba(255, 255, 255, 0.4)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {template.type}
                              {template.type === 'duration' && template.defaultDuration && (
                                <> • {template.defaultDuration} min</>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => handleEdit(template)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                borderRadius: 4,
                                border: 'none',
                                background: 'transparent',
                                color: 'rgba(255, 255, 255, 0.4)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                                e.currentTarget.style.color = '#60a5fa';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                              }}
                            >
                              <Edit2 style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                borderRadius: 4,
                                border: 'none',
                                background: 'transparent',
                                color: 'rgba(255, 255, 255, 0.4)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.color = '#f87171';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                              }}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        {templateTags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {templateTags.map((tag) => (
                              <span
                                key={tag.id}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  fontFamily: "'DM Sans', sans-serif",
                                  background: `${tag.color}20`,
                                  color: tag.color,
                                  border: `1px solid ${tag.color}40`,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        {template.defaultDescription && (
                          <p
                            style={{
                              margin: '12px 0 0 0',
                              fontSize: 13,
                              lineHeight: 1.5,
                              color: 'rgba(255, 255, 255, 0.5)',
                            }}
                          >
                            {template.defaultDescription}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Create/Edit form */
            <form onSubmit={handleSubmit}>
              {/* Template name */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="template-name"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Template Name *
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Team Meeting"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                />
              </div>

              {/* Event type */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Event Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(['point', 'duration', 'milestone', 'recurring'] as EventType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      style={{
                        padding: '10px',
                        borderRadius: 6,
                        border: formData.type === type ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: formData.type === type ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: formData.type === type ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (formData.type !== type) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.type !== type) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                        }
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration (for duration events) */}
              {formData.type === 'duration' && (
                <div style={{ marginBottom: 20 }}>
                  <label
                    htmlFor="duration"
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    Default Duration (minutes)
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.defaultDuration}
                    onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 60 })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: 14,
                      fontFamily: "'DM Sans', sans-serif",
                      outline: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  />
                </div>
              )}

              {/* Tags */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Default Tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tags?.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: formData.defaultTags.includes(tag.id) 
                          ? `2px solid ${tag.color}` 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        background: formData.defaultTags.includes(tag.id)
                          ? `${tag.color}20`
                          : 'rgba(255, 255, 255, 0.03)',
                        color: formData.defaultTags.includes(tag.id) ? tag.color : 'rgba(255, 255, 255, 0.6)',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 24 }}>
                <label
                  htmlFor="description"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Default Description
                </label>
                <textarea
                  id="description"
                  value={formData.defaultDescription}
                  onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
                  placeholder="Optional description for events created from this template..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3b82f6';
                  }}
                >
                  {mode === 'create' ? 'Create Template' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};
