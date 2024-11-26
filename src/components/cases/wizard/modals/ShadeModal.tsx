import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface ShadeData {
  type: '1' | '2' | '3';
  shades: {
    occlusal?: string;
    middle?: string;
    gingival?: string;
  };
}

interface ShadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shadeData: ShadeData) => void;
  initialShade?: ShadeData;
}

const VITA_CLASSICAL_SHADES = [
  'A1', 'A2', 'A2.5', 'A3', 'A3.5', 'A4',
  'B1', 'B1.5', 'B2', 'B3', 'B4',
  'C1', 'C1.5', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4'
];

const ShadeModal: React.FC<ShadeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialShade
}) => {
  const [shadeType, setShadeType] = useState<'1' | '2' | '3'>(initialShade?.type || '1');
  const [shades, setShades] = useState({
    occlusal: initialShade?.shades.occlusal || '',
    middle: initialShade?.shades.middle || '',
    gingival: initialShade?.shades.gingival || ''
  });

  const handleShadeChange = (position: 'occlusal' | 'middle' | 'gingival', value: string) => {
    setShades(prev => ({
      ...prev,
      [position]: value
    }));
  };

  const handleSave = () => {
    const shadeData: ShadeData = {
      type: shadeType,
      shades: {
        ...(shadeType === '1' && { occlusal: shades.occlusal }),
        ...(shadeType === '2' && { occlusal: shades.occlusal, gingival: shades.gingival }),
        ...(shadeType === '3' && { occlusal: shades.occlusal, middle: shades.middle, gingival: shades.gingival })
      }
    };
    onSave(shadeData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Add Shade</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Shade Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shade Type
              </label>
              <div className="space-y-2">
                {(['1', '2', '3'] as const).map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      type="radio"
                      id={`type-${type}`}
                      name="shadeType"
                      value={type}
                      checked={shadeType === type}
                      onChange={(e) => setShadeType(e.target.value as '1' | '2' | '3')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor={`type-${type}`} className="ml-2 block text-sm text-gray-900">
                      {type === '1' ? 'Single Shade' : type === '2' ? 'Two Shades' : 'Three Shades'}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Shade Selection */}
            <div className="space-y-4">
              {shadeType === '1' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shade
                  </label>
                  <select
                    value={shades.occlusal}
                    onChange={(e) => handleShadeChange('occlusal', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a shade</option>
                    {VITA_CLASSICAL_SHADES.map(shade => (
                      <option key={shade} value={shade}>{shade}</option>
                    ))}
                  </select>
                </div>
              )}

              {shadeType === '2' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occlusal/Incisal
                    </label>
                    <select
                      value={shades.occlusal}
                      onChange={(e) => handleShadeChange('occlusal', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gingival/Cervical
                    </label>
                    <select
                      value={shades.gingival}
                      onChange={(e) => handleShadeChange('gingival', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {shadeType === '3' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occlusal/Incisal
                    </label>
                    <select
                      value={shades.occlusal}
                      onChange={(e) => handleShadeChange('occlusal', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle/Body Shade
                    </label>
                    <select
                      value={shades.middle}
                      onChange={(e) => handleShadeChange('middle', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gingival/Cervical
                    </label>
                    <select
                      value={shades.gingival}
                      onChange={(e) => handleShadeChange('gingival', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShadeModal;