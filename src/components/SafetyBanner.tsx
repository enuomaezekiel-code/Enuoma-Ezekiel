import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, Info } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-950">
      <div className="max-w-6xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 mr-1.5">TaskNaija Trust & Safety Pilot:</span>
            <span className="text-amber-800">
              Never pay registration or recruitment fees to get hired. Never share bank PINs, OTPs, or passwords.
              Payment is arranged directly between clients and workers for this pilot version.
            </span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-amber-700 hover:bg-amber-100 transition shrink-0"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
