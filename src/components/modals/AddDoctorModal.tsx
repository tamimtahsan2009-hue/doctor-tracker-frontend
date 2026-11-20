'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_BANGLADESH_SPECIALIZATIONS } from '@/lib/specializations';
import { Stethoscope, X, User, Building2, Phone, Mail, Check, MapPin, Camera, Upload } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDoctorModal({ isOpen, onClose }: AddDoctorModalProps) {
  const { addDoctor, doctors } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    hospital: '',
    phone: '',
    email: '',
    address: '',
    avatar: '',
  });

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
        // Crop & scale to crisp passport square dimensions
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const [showHospDropdown, setShowHospDropdown] = useState(false);

  // Suggestions combining the complete 180 Bangladesh doctor specializations list + any custom ones
  const suggestedSpecializations = useMemo(() => {
    const set = new Set<string>(ALL_BANGLADESH_SPECIALIZATIONS);
    doctors.forEach((d) => {
      if (d.specialization?.trim()) set.add(d.specialization.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  // Hospital suggestions derived from registered doctors
  const suggestedHospitals = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.hospital?.trim()) set.add(d.hospital.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  // Filtered specialization suggestions as user types
  const filteredSpecializations = useMemo(() => {
    const q = formData.specialization.toLowerCase().trim();
    if (!q) return suggestedSpecializations.slice(0, 12);
    return suggestedSpecializations
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 15);
  }, [formData.specialization, suggestedSpecializations]);

  // Filtered hospital suggestions as user types
  const filteredHospitals = useMemo(() => {
    const q = formData.hospital.toLowerCase().trim();
    if (!q) return suggestedHospitals.slice(0, 8);
    return suggestedHospitals
      .filter((h) => h.toLowerCase().includes(q))
      .slice(0, 10);
  }, [formData.hospital, suggestedHospitals]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Doctor name is required';
    if (!formData.specialization.trim()) newErrors.specialization = 'Medical specialization is required';
    if (!formData.hospital.trim()) newErrors.hospital = 'Hospital affiliation is required';
    
    // 11-digit phone number validation
    let cleanPhone = formData.phone.trim().replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('+88')) cleanPhone = cleanPhone.slice(3);
    else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = cleanPhone.slice(2);

    if (!cleanPhone) {
      newErrors.phone = 'Contact phone number is required';
    } else if (!/^01\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 11-digit mobile number (e.g. 01712345678)';
    }

    // Official email validation (Optional)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = formData.email.trim();
    if (cleanEmail && !emailRegex.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address (e.g. doctor@hospital.edu.bd)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Ensure "Dr." prefix
      let cleanName = formData.name.trim();
      if (!cleanName.startsWith('Dr.')) {
        cleanName = `Dr. ${cleanName}`;
      }

      let cleanPhone = formData.phone.trim().replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.startsWith('+88')) cleanPhone = cleanPhone.slice(3);
      else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = cleanPhone.slice(2);

      await addDoctor({
        name: cleanName,
        specialization: formData.specialization.trim(),
        hospital: formData.hospital.trim(),
        phone: cleanPhone,
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : undefined,
        address: formData.address.trim() || undefined,
        avatar: formData.avatar || undefined,
      });

      setIsSubmitting(false);
      onClose();
      setFormData({
        name: '',
        specialization: '',
        hospital: '',
        phone: '',
        email: '',
        address: '',
        avatar: '',
      });
      setShowSpecDropdown(false);
      setShowHospDropdown(false);
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
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#253746] leading-tight">
                  Register New Doctor
                </h3>
                <p className="text-xs text-[#718096] mt-0.5">
                  Add an authorized clinician to the medical provider directory
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Doctor Passport Size Photo (Optional) */}
          <div className="flex items-center gap-4 p-3.5 bg-[#F5F7F5] rounded-2xl border border-[#E2E8E5]">
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-24 rounded-xl border-2 border-dashed border-[#C7DFD9] overflow-hidden bg-white flex flex-col items-center justify-center text-center shadow-subtle group-hover:border-[#176B60] transition-colors cursor-pointer relative"
              >
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Doctor Passport Photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-[#718096] group-hover:text-[#176B60] transition-colors">
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Photo</span>
                    <span className="text-[9px] text-[#718096]">Passport</span>
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
                <label className="text-xs font-bold text-[#253746]">
                  Passport Size Photo
                </label>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#EAF2EE] border border-[#C7DFD9] text-[#176B60] rounded">
                  Optional
                </span>
              </div>
              <p className="text-[11px] text-[#718096] mt-0.5">
                Upload formal doctor photograph (JPG, PNG, WebP up to 5MB).
              </p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#176B60] bg-white border border-[#C7DFD9] rounded-lg hover:bg-[#EAF2EE] transition-colors shadow-subtle"
                >
                  <Upload className="w-3 h-3 text-[#176B60]" />
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

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Doctor Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Dr. Rafiqul Islam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Specialization Writing Input with Clean White Autocomplete Dropdown (NO BLACK BOX) */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Medical Specialization <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-brand-700 font-medium bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                180+ Bangladesh Specialties
              </span>
            </div>

            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <input
                type="text"
                autoComplete="off"
                placeholder="Type or select specialization (e.g. Cardiology, Neurology)..."
                value={formData.specialization}
                onFocus={() => setShowSpecDropdown(true)}
                onBlur={() => setTimeout(() => setShowSpecDropdown(false), 250)}
                onChange={(e) => {
                  setFormData({ ...formData, specialization: e.target.value });
                  setShowSpecDropdown(true);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 font-medium shadow-none"
              />
            </div>

            {/* Clean White Floating Suggestions Dropdown */}
            {showSpecDropdown && filteredSpecializations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-elevated max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Bangladesh Medical Directory</span>
                  <span>{filteredSpecializations.length} suggestions</span>
                </div>
                {filteredSpecializations.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFormData((prev) => ({ ...prev, specialization: spec }));
                      setShowSpecDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-between transition-colors font-medium bg-white"
                  >
                    <span className="flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      <span>{spec}</span>
                    </span>
                    {formData.specialization.toLowerCase() === spec.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {errors.specialization && (
              <p className="text-xs text-red-500 mt-1">{errors.specialization}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Start typing to pick from Bangladesh specializations, or enter a custom one.
            </p>
          </div>

          {/* Hospital Affiliation Writing Input with Clean White Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital Affiliation <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <input
                type="text"
                autoComplete="off"
                placeholder="Write hospital name (e.g. Dhaka Medical College, BSMMU, Apollo)..."
                value={formData.hospital}
                onFocus={() => setShowHospDropdown(true)}
                onBlur={() => setTimeout(() => setShowHospDropdown(false), 250)}
                onChange={(e) => {
                  setFormData({ ...formData, hospital: e.target.value });
                  setShowHospDropdown(true);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>

            {/* Floating Suggestions for previously registered hospitals */}
            {showHospDropdown && filteredHospitals.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-elevated max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Existing Hospitals in System
                </div>
                {filteredHospitals.map((hosp) => (
                  <button
                    key={hosp}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFormData((prev) => ({ ...prev, hospital: hosp }));
                      setShowHospDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-between transition-colors font-medium bg-white"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{hosp}</span>
                    </span>
                    {formData.hospital.toLowerCase() === hosp.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {errors.hospital && <p className="text-xs text-red-500 mt-1">{errors.hospital}</p>}
          </div>

          {/* Phone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                11 Digits (e.g. 01712345678)
              </span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                maxLength={14}
                placeholder="01712345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Email (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="doctor@hospital.edu.bd"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
          </div>

          {/* Chamber / Practice Address (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chamber / Practice Address (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Chamber 402, Green Life Hospital, Green Road, Dhaka"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
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
                  <span>Register Doctor</span>
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
