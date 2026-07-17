import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '24rem' }}>
        <div className="modal-body">
          <div className="flex items-center mb-4">
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', marginRight: '1rem', flexShrink: 0 }}>
              <ShieldAlert size={24} />
            </div>
            <h3 className="modal-title">
              {title}
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
              }}
              className="btn btn-primary"
              style={{ background: 'var(--color-danger)' }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
