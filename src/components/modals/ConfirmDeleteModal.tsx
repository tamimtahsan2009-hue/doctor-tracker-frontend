'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#102B2A]/70 backdrop-blur-sm animate-in fade-in-20">
        <div 
          className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-[#E2E8E5] overflow-hidden animate-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#253746] leading-tight">
                  {title}
                </h3>
                <p className="text-sm text-[#718096] mt-1.5 leading-relaxed">
                  {message}
                </p>
                {itemName && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#F5F7F5] border border-[#E2E8E5] text-xs font-semibold text-[#253746] break-words">
                    Target: {itemName}
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                disabled={isDeleting}
                className="p-1 text-[#718096] hover:text-[#253746] rounded-lg hover:bg-[#F5F7F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#F5F7F5] border-t border-[#E2E8E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-[#253746] bg-white border border-[#E2E8E5] rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm Deletion</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
