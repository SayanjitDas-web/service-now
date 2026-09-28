'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ChevronUp,
  ChevronDown,
  X,
  Sliders,
} from 'lucide-react';

interface SlushbucketModalProps {
  tableName: string;
  availableColumns: { name: string; label: string }[];
  selectedColumns: string[];
  onSave: (newSelected: string[]) => void;
  onClose: () => void;
}

export default function SlushbucketModal({
  tableName,
  availableColumns,
  selectedColumns: initialSelected,
  onSave,
  onClose,
}: SlushbucketModalProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [activeAvailable, setActiveAvailable] = useState<string | null>(null);
  const [activeSelected, setActiveSelected] = useState<string | null>(null);

  // Available are all columns that are not currently selected
  const available = availableColumns.filter((col) => !selected.includes(col.name));

  const handleAdd = () => {
    if (activeAvailable && !selected.includes(activeAvailable)) {
      setSelected([...selected, activeAvailable]);
      setActiveAvailable(null);
    }
  };

  const handleRemove = () => {
    if (activeSelected) {
      setSelected(selected.filter((s) => s !== activeSelected));
      setActiveSelected(null);
    }
  };

  const handleAddAll = () => {
    setSelected(availableColumns.map((c) => c.name));
  };

  const handleRemoveAll = () => {
    // Keep at least the first column (number or name)
    if (availableColumns.length > 0) {
      setSelected([availableColumns[0].name]);
    } else {
      setSelected([]);
    }
  };

  const handleMoveUp = () => {
    if (!activeSelected) return;
    const idx = selected.indexOf(activeSelected);
    if (idx > 0) {
      const copy = [...selected];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      setSelected(copy);
    }
  };

  const handleMoveDown = () => {
    if (!activeSelected) return;
    const idx = selected.indexOf(activeSelected);
    if (idx >= 0 && idx < selected.length - 1) {
      const copy = [...selected];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      setSelected(copy);
    }
  };

  const getLabel = (name: string) => {
    const col = availableColumns.find((c) => c.name === name);
    return col ? col.label : name;
  };

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sn-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={17} color="#00a389" />
            <span>Personalize List Columns — {tableName}</span>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <div className="sn-modal-body">
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginBottom: '16px' }}>
            Move fields between Available and Selected to customize the columns and sequence displayed on this list view.
          </p>

          <div className="sn-slushbucket-container" style={{ justifyContent: 'center' }}>
            {/* Left box: Available */}
            <div className="sn-slushbucket-box">
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                Available ({available.length})
              </span>
              <div className="sn-slushbucket-list">
                {available.map((col) => (
                  <div
                    key={col.name}
                    className={`sn-slushbucket-item ${activeAvailable === col.name ? 'selected' : ''}`}
                    onClick={() => setActiveAvailable(col.name)}
                    onDoubleClick={handleAdd}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Middle controls: Transfer */}
            <div className="sn-slushbucket-controls">
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '4px 8px' }}
                onClick={handleAdd}
                disabled={!activeAvailable}
                title="Add selected"
              >
                <ChevronRight size={14} />
              </button>
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '4px 8px' }}
                onClick={handleRemove}
                disabled={!activeSelected}
                title="Remove selected"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '4px 8px' }}
                onClick={handleAddAll}
                title="Add all"
              >
                <ChevronsRight size={14} />
              </button>
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '4px 8px' }}
                onClick={handleRemoveAll}
                title="Remove all"
              >
                <ChevronsLeft size={14} />
              </button>
            </div>

            {/* Right box: Selected */}
            <div className="sn-slushbucket-box">
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                Selected ({selected.length})
              </span>
              <div className="sn-slushbucket-list">
                {selected.map((colName) => (
                  <div
                    key={colName}
                    className={`sn-slushbucket-item ${activeSelected === colName ? 'selected' : ''}`}
                    onClick={() => setActiveSelected(colName)}
                    onDoubleClick={handleRemove}
                  >
                    {getLabel(colName)}
                  </div>
                ))}
              </div>
            </div>

            {/* Right re-order controls: Up / Down */}
            <div className="sn-slushbucket-controls">
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '6px 8px' }}
                onClick={handleMoveUp}
                disabled={!activeSelected}
                title="Move Up in order"
              >
                <ChevronUp size={14} />
              </button>
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '6px 8px' }}
                onClick={handleMoveDown}
                disabled={!activeSelected}
                title="Move Down in order"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn sn-btn-default" onClick={onClose}>
            Cancel
          </button>
          <button
            className="sn-btn sn-btn-primary"
            onClick={() => {
              onSave(selected);
              onClose();
            }}
          >
            Save Layout
          </button>
        </div>
      </div>
    </div>
  );
}
