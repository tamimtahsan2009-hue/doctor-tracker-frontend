'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { PatientCondition } from '@/types';
import { CONDITIONS } from '@/lib/mockData';
import { Users, X, User, Phone, Mail, Stethoscope, Calendar, FileText, Check, MapPin, Camera, Upload } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDoctorId?: string;
}

export function AddPatientModal({ isOpen, onClose, defaultDoctorId }: AddPatientModalProps) {
  const { doctors, addPatient } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    condition: 'Stable' as PatientCondition,
    phone: '',
    email: '',
    address: '',
    avatar: '',
    doctorId: defaultDoctorId || (doctors[0]?.id || ''),
    admissionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, avatar: 'Please select an image file (JPG, PNG, WebP).' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Photo size should not exceed 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setFormData((prev) => ({ ...prev, avatar: dataUrl }));
          setErrors((prev) => {
            const copy = { ...prev };
            delete copy.avatar;
            return copy;
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (defaultDoctorId) {
      setFormData((prev) => ({ ...prev, doctorId: defaultDoctorId }));
    } else if (doctors.length > 0 && !formData.doctorId) {
      setFormData((prev) => ({ ...prev, doctorId: doctors[0].id }));
    }
  }, [defaultDoctorId, doctors]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Patient name is required';
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) < 0) {
      newErrors.age = 'Valid age is required';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.doctorId) newErrors.doctorId = 'Assigned doctor is required';
    if (!formData.admissionDate) newErrors.admissionDate = 'Admission date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedDoc = doctors.find((d) => d.id === formData.doctorId);

      await addPatient({
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        condition: formData.condition,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        avatar: formData.avatar || undefined,
        doctorId: formData.doctorId,
        doctorName: selectedDoc?.name || 'Assigned Doctor',
        hospital: selectedDoc?.hospital || 'Hospital',
        admissionDate: new Date(formData.admissionDate).toISOString(),
        notes: formData.notes.trim() || undefined,
      });

      setIsSubmitting(false);
      onClose();
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        condition: 'Stable',
        phone: '',
        email: '',
        address: '',
        avatar: '',
        doctorId: defaultDoctorId || (doctors[0]?.id || ''),
        admissionDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setErrors({});
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#102B2A]/70 backdrop-blur-sm animate-in fade-in-20">
        <div 
          className="w-full max-w-lg bg-white rounded-2xl shadow-elevated border border-[#E2E8E5] overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-[#E2E8E5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center text-[#176B60] shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#253746] leading-tight">
                  Register New Patient
                </h3>
                <p className="text-xs text-[#718096] mt-0.5">
                  Enroll a patient into medical monitoring and assign a physician
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#718096] hover:text-[#253746] rounded-lg hover:bg-[#F5F7F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Patient Photo (Optional) */}
            <div className="flex items-center gap-4 p-3.5 bg-[#F5F7F5] rounded-2xl border border-[#E2E8E5]">
              <div className="relative group shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-24 rounded-xl border-2 border-dashed border-[#C7DFD9] overflow-hidden bg-white flex flex-col items-center justify-center text-center shadow-subtle group-hover:border-[#176B60] transition-colors cursor-pointer relative"
                >
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Patient Portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-[#718096] group-hover:text-[#176B60] transition-colors">
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Photo</span>
                      <span className="text-[9px] text-[#718096]">Portrait</span>
                    </div>
                  )}
                </div>

              {formData.avatar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAvatar();
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110"
                  title="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800">
                  Patient Photo / Portrait
                </label>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-teal-100/70 text-teal-800 rounded">
                  Optional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload patient ID photo for clinical identification (JPG, PNG, WebP up to 5MB).
              </p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors shadow-subtle"
                >
                  <Upload className="w-3 h-3 text-teal-600" />
                  <span>{formData.avatar ? 'Change Photo' : 'Choose Photo'}</span>
                </button>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {errors.avatar && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.avatar}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Arthur Pendelton"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 45"
                min="0"
                max="125"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800"
              />
              {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 font-medium"
              >
                {CONDITIONS.filter((c) => c !== 'All Conditions').map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Physician / Doctor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} – {doc.specialization} ({doc.hospital})
                  </option>
                ))}
              </select>
            </div>
            {errors.doctorId && <p className="text-xs text-red-500 mt-1">{errors.doctorId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="patient@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Patient Address / Location (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Address / Location (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. House 12, Road 4, Dhanmondi, Dhaka"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Notes / Diagnosis Summary
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                placeholder="Enter diagnostic summary, medication protocols, or surgical notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#253746] bg-white border border-[#E2E8E5] rounded-xl hover:bg-[#F5F7F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#176B60] hover:bg-[#13564D] rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Register Patient</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

