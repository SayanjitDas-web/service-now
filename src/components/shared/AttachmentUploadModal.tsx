'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, UploadCloud, X, File, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadToImageKit } from '@/lib/imagekitClient';
import { usePlatform } from '@/lib/store';

interface AttachmentUploadModalProps {
  tableName: string;
  recordId: string;
  onClose: () => void;
}

export default function AttachmentUploadModal({
  tableName,
  recordId,
  onClose,
}: AttachmentUploadModalProps) {
  const { attachments, addAttachment } = usePlatform();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSuccess, setUploadedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingAttachments = attachments.filter(
    (a) => a.table_name === tableName && a.table_sys_id === recordId
  );

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadToImageKit(file, `/servicenow/${tableName}`);
      addAttachment({
        table_name: tableName,
        table_sys_id: recordId,
        file_name: result.name,
        file_size: result.size,
        content_type: file.type || 'application/octet-stream',
        url: result.url,
        imagekit_file_id: result.fileId,
        created_by: 'admin',
      });
      setUploadedSuccess(true);
      setTimeout(() => setUploadedSuccess(false), 2000);
    } catch (err) {
      console.error('File upload error:', err);
      alert('Upload failed: ' + String(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sn-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Paperclip size={16} color="#00a389" />
            <span>Manage Attachments (ImageKit Media Engine)</span>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={17} />
          </button>
        </div>

        <div className="sn-modal-body">
          {/* Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--now-border)',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              background: 'var(--now-bg-surface-alt)',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              style={{ display: 'none' }}
            />
            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={32} className="sn-spin" color="#00a389" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Processing upload to ImageKit...</span>
              </div>
            ) : uploadedSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={32} color="#15803d" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>
                  File successfully uploaded & attached!
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={34} color="#00a389" />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#0369a1' }}>
                    Click to choose file or drag and drop
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--now-text-muted)', marginTop: '2px' }}>
                    Supports PNG, JPG, PDF, TXT, LOG up to 25 MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List of Attached files */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--now-text-muted)' }}>
              Current Attachments ({existingAttachments.length})
            </span>

            {existingAttachments.length === 0 ? (
              <div style={{ padding: '16px 0', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                No attachments uploaded for this record yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {existingAttachments.map((att) => (
                  <div
                    key={att.sys_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--now-border-light)',
                      background: 'var(--now-bg-surface-alt)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {att.content_type.startsWith('image/') ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={att.url}
                          alt={att.file_name}
                          style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <File size={22} color="#64748b" />
                      )}
                      <div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontWeight: 600, fontSize: '12.5px', color: '#0369a1' }}
                        >
                          {att.file_name}
                        </a>
                        <div style={{ fontSize: '10.5px', color: 'var(--now-text-muted)' }}>
                          {Math.round(att.file_size / 1024)} KB • Attached {att.created_at}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn sn-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
