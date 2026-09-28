'use client';

import React, { useState } from 'react';
import { MessageSquare, Lock, Send, Clock, User as UserIcon } from 'lucide-react';
import { usePlatform } from '@/lib/store';

interface ActivityStreamProps {
  tableName: string;
  recordId: string;
}

export default function ActivityStream({ tableName, recordId }: ActivityStreamProps) {
  const { activityLogs, addActivityLog, currentUser } = usePlatform();

  const [workNotesInput, setWorkNotesInput] = useState('');
  const [commentsInput, setCommentsInput] = useState('');
  const [activeInputType, setActiveInputType] = useState<'work_notes' | 'comments'>('work_notes');

  const logs = activityLogs.filter(
    (l) => l.table_name === tableName && l.record_id === recordId
  );

  const handlePost = () => {
    if (activeInputType === 'work_notes' && workNotesInput.trim()) {
      addActivityLog({
        table_name: tableName,
        record_id: recordId,
        user_name: currentUser.name,
        user_id: currentUser.sys_id,
        type: 'work_notes',
        text: workNotesInput.trim(),
      });
      setWorkNotesInput('');
    } else if (activeInputType === 'comments' && commentsInput.trim()) {
      addActivityLog({
        table_name: tableName,
        record_id: recordId,
        user_name: currentUser.name,
        user_id: currentUser.sys_id,
        type: 'comments',
        text: commentsInput.trim(),
      });
      setCommentsInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Journal Input Toggle Header */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className={`sn-btn ${activeInputType === 'work_notes' ? 'sn-btn-primary' : 'sn-btn-default'}`}
          style={{
            background: activeInputType === 'work_notes' ? '#ca8a04' : undefined,
            borderColor: activeInputType === 'work_notes' ? '#a16207' : undefined,
          }}
          onClick={() => setActiveInputType('work_notes')}
        >
          <Lock size={13} />
          <span>Work notes (Internal)</span>
        </button>

        <button
          className={`sn-btn ${activeInputType === 'comments' ? 'sn-btn-primary' : 'sn-btn-default'}`}
          style={{
            background: activeInputType === 'comments' ? '#9333ea' : undefined,
            borderColor: activeInputType === 'comments' ? '#7e22ce' : undefined,
          }}
          onClick={() => setActiveInputType('comments')}
        >
          <MessageSquare size={13} />
          <span>Additional comments (Customer visible)</span>
        </button>
      </div>

      {/* Journal Input Textarea */}
      {activeInputType === 'work_notes' ? (
        <div className="sn-journal-box-worknotes">
          <textarea
            className="sn-field-textarea"
            rows={3}
            placeholder="Type internal technical work notes here (visible to IT fulfillers only)..."
            value={workNotesInput}
            onChange={(e) => setWorkNotesInput(e.target.value)}
            style={{ background: '#fefce8', border: '1px solid #fde047' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              className="sn-btn sn-btn-primary"
              style={{ background: '#ca8a04', border: '1px solid #a16207' }}
              onClick={handlePost}
              disabled={!workNotesInput.trim()}
            >
              <Send size={13} />
              <span>Post Work Note</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="sn-journal-box-comments">
          <textarea
            className="sn-field-textarea"
            rows={3}
            placeholder="Type customer comments here (will trigger email notifications to caller)..."
            value={commentsInput}
            onChange={(e) => setCommentsInput(e.target.value)}
            style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              className="sn-btn sn-btn-primary"
              style={{ background: '#9333ea', border: '1px solid #7e22ce' }}
              onClick={handlePost}
              disabled={!commentsInput.trim()}
            >
              <Send size={13} />
              <span>Post Comment</span>
            </button>
          </div>
        </div>
      )}

      {/* Activity Timeline Stream */}
      <div className="sn-activity-stream">
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--now-text-muted)' }}>
          Activity Stream ({logs.length} entries)
        </span>

        {logs.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--now-text-muted)', fontStyle: 'italic' }}>
            No journal activities recorded for this record yet.
          </div>
        ) : (
          logs.map((log) => {
            const isWorkNote = log.type === 'work_notes';
            const isComment = log.type === 'comments';

            return (
              <div
                key={log.sys_id}
                className={`sn-activity-entry ${isWorkNote ? 'worknotes' : isComment ? 'comments' : ''}`}
              >
                <div className="sn-activity-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--now-text-main)' }}>
                      {log.user_name}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--now-text-muted)' }}>
                      • {isWorkNote ? 'Work notes (Internal)' : isComment ? 'Additional comments' : log.field_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}>
                    <Clock size={11} />
                    <span>{log.created_at}</span>
                  </div>
                </div>

                <div style={{ fontSize: '12.5px', lineHeight: 1.4, color: 'var(--now-text-main)' }}>
                  {log.text ? (
                    log.text
                  ) : (
                    <span>
                      {log.field_name}:{' '}
                      {log.old_value && <del style={{ color: '#94a3b8' }}>{log.old_value}</del>}{' '}
                      <strong>{log.new_value}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
