'use client';

import React, { useState } from 'react';
import { MessageSquare, Lock, Send, Clock } from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { ActivityLog } from '@/lib/types';

interface ActivityStreamProps {
  tableName: string;
  recordId: string;
  draftWorkNotes?: string;
  onWorkNotesChange?: (val: string) => void;
  draftComments?: string;
  onCommentsChange?: (val: string) => void;
  recordData?: Record<string, any>;
  onSaveWorkNoteImmediate?: (text: string) => void;
  onSaveCommentImmediate?: (text: string) => void;
}

export default function ActivityStream({
  tableName,
  recordId,
  draftWorkNotes,
  onWorkNotesChange,
  draftComments,
  onCommentsChange,
  recordData,
  onSaveWorkNoteImmediate,
  onSaveCommentImmediate,
}: ActivityStreamProps) {
  const { activityLogs, addActivityLog, currentUser } = usePlatform();

  const [localWorkNotes, setLocalWorkNotes] = useState('');
  const [localComments, setLocalComments] = useState('');
  const [activeInputType, setActiveInputType] = useState<'work_notes' | 'comments'>('work_notes');

  const workNotesValue = draftWorkNotes !== undefined ? draftWorkNotes : localWorkNotes;
  const setWorkNotesValue = (val: string) => {
    if (onWorkNotesChange) onWorkNotesChange(val);
    else setLocalWorkNotes(val);
  };

  const commentsValue = draftComments !== undefined ? draftComments : localComments;
  const setCommentsValue = (val: string) => {
    if (onCommentsChange) onCommentsChange(val);
    else setLocalComments(val);
  };

  // Helper to strip timestamp headers like [2026-10-05 04:16:54 - Sayanjit Das (Work notes)]
  const cleanJournalText = (text: string): string => {
    if (!text) return '';
    return text.replace(/\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}[^\]]*\]\s*/g, '').trim();
  };

  // Match logs by record ID or record sys_id / number
  const matchedLogs = activityLogs.filter(
    (l) =>
      l.table_name === tableName &&
      (l.record_id === recordId ||
        (recordData?.sys_id && l.record_id === recordData.sys_id) ||
        (recordData?.number && l.record_id === recordData.number))
  );

  // Deduplicate matched logs: if multiple logs have identical cleaned text and type, keep only one
  const uniqueLogs: ActivityLog[] = [];
  const seenContent = new Set<string>();

  matchedLogs.forEach((l) => {
    const raw = l.text || l.new_value || '';
    const clean = cleanJournalText(raw);
    const key = `${l.type}_${clean}`;
    if (!seenContent.has(key)) {
      seenContent.add(key);
      uniqueLogs.push({ ...l, text: clean || l.text });
    }
  });

  // Only synthesize if matchedLogs has NO entries of this type at all
  const hasWorkNotes = uniqueLogs.some((l) => l.type === 'work_notes');
  if (!hasWorkNotes && recordData?.work_notes && typeof recordData.work_notes === 'string') {
    const raw = cleanJournalText(recordData.work_notes);
    if (raw && !seenContent.has(`work_notes_${raw}`)) {
      seenContent.add(`work_notes_${raw}`);
      uniqueLogs.push({
        sys_id: `synth_wn_${recordData.sys_id || 'record'}`,
        table_name: tableName,
        record_id: recordId,
        user_name: recordData.sys_created_by || currentUser.name,
        user_id: recordData.caller_id || currentUser.sys_id,
        type: 'work_notes',
        text: raw,
        created_at: recordData.sys_updated_on || recordData.sys_created_on || new Date().toISOString().substring(0, 19),
      });
    }
  }

  const hasComments = uniqueLogs.some((l) => l.type === 'comments');
  if (!hasComments && recordData?.comments && typeof recordData.comments === 'string') {
    const raw = cleanJournalText(recordData.comments);
    if (raw && !seenContent.has(`comments_${raw}`)) {
      seenContent.add(`comments_${raw}`);
      uniqueLogs.push({
        sys_id: `synth_cm_${recordData.sys_id || 'record'}`,
        table_name: tableName,
        record_id: recordId,
        user_name: recordData.sys_created_by || currentUser.name,
        user_id: recordData.caller_id || currentUser.sys_id,
        type: 'comments',
        text: raw,
        created_at: recordData.sys_updated_on || recordData.sys_created_on || new Date().toISOString().substring(0, 19),
      });
    }
  }

  const logs = uniqueLogs;

  const handlePost = () => {
    if (activeInputType === 'work_notes' && workNotesValue.trim()) {
      const text = cleanJournalText(workNotesValue.trim());
      if (!text) return;

      if (onSaveWorkNoteImmediate) {
        onSaveWorkNoteImmediate(text);
      } else {
        addActivityLog({
          table_name: tableName,
          record_id: recordId,
          user_name: currentUser.name,
          user_id: currentUser.sys_id,
          type: 'work_notes',
          text,
        });
      }
      setWorkNotesValue('');
    } else if (activeInputType === 'comments' && commentsValue.trim()) {
      const text = cleanJournalText(commentsValue.trim());
      if (!text) return;

      if (onSaveCommentImmediate) {
        onSaveCommentImmediate(text);
      } else {
        addActivityLog({
          table_name: tableName,
          record_id: recordId,
          user_name: currentUser.name,
          user_id: currentUser.sys_id,
          type: 'comments',
          text,
        });
      }
      setCommentsValue('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Journal Input Toggle Header */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className={`sn-btn ${activeInputType === 'work_notes' ? 'sn-btn-primary' : 'sn-btn-default'}`}
          style={{
            background: activeInputType === 'work_notes' ? '#ca8a04' : undefined,
            borderColor: activeInputType === 'work_notes' ? '#a16207' : undefined,
            color: activeInputType === 'work_notes' ? '#ffffff' : undefined,
          }}
          onClick={() => setActiveInputType('work_notes')}
        >
          <Lock size={13} />
          <span>Work notes (Internal)</span>
        </button>

        <button
          type="button"
          className={`sn-btn ${activeInputType === 'comments' ? 'sn-btn-primary' : 'sn-btn-default'}`}
          style={{
            background: activeInputType === 'comments' ? '#9333ea' : undefined,
            borderColor: activeInputType === 'comments' ? '#7e22ce' : undefined,
            color: activeInputType === 'comments' ? '#ffffff' : undefined,
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
            value={workNotesValue}
            onChange={(e) => setWorkNotesValue(e.target.value)}
            style={{ background: '#fefce8', border: '1px solid #fde047' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              className="sn-btn sn-btn-primary"
              style={{ background: '#ca8a04', border: '1px solid #a16207', color: '#fff' }}
              onClick={handlePost}
              disabled={!workNotesValue.trim()}
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
            placeholder="Type customer comments here (will trigger notifications to caller)..."
            value={commentsValue}
            onChange={(e) => setCommentsValue(e.target.value)}
            style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              className="sn-btn sn-btn-primary"
              style={{ background: '#9333ea', border: '1px solid #7e22ce', color: '#fff' }}
              onClick={handlePost}
              disabled={!commentsValue.trim()}
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
          <div style={{ fontSize: '12px', color: 'var(--now-text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
            No journal activities recorded for this record yet. Any internal work notes added will appear here and persist.
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

                <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'var(--now-text-main)', whiteSpace: 'pre-wrap' }}>
                  {log.text ? (
                    cleanJournalText(log.text)
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
