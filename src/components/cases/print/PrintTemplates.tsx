import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '@/lib/formatedDate';
import { PAPER_SIZES } from './PrintHandler';

interface PrintTemplateProps {
  caseData: {
    id: string;
    patient_name: string;
    case_number: string;
    qr_code?: string;
    client?: {
      client_name: string;
      phone: string;
    };
    doctor?: {
      name: string;
    };
    created_at: string;
    due_date?: string;
    tag?: {
      name: string;
    };
  };
  paperSize: keyof typeof PAPER_SIZES;
}

// Helper function to get QR code size based on paper size
const getQRCodeSize = (paperSize: keyof typeof PAPER_SIZES, type: 'large' | 'medium' | 'small') => {
  const sizes = {
    LETTER: { large: 120, medium: 80, small: 40 },
    LEGAL: { large: 140, medium: 100, small: 50 },
    HALF: { large: 100, medium: 70, small: 35 },
  };
  return sizes[paperSize][type];
};

export const QRCodeTemplate: React.FC<PrintTemplateProps> = ({ caseData, paperSize }) => (
  <div className="p-2 flex items-start">
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <QRCodeSVG
          value={caseData.qr_code || `https://app.labulous.com/cases/${caseData.id}`}
          size={getQRCodeSize(paperSize, 'large')}
          level="H"
          includeMargin={false}
        />
        <div className="text-center mt-1 text-xs font-mono">
          {caseData.case_number}
        </div>
      </div>
      <div className="flex flex-col text-base">
        <div className="font-semibold">{caseData.client?.client_name || 'No Client'}</div>
        <div>{caseData.patient_name}</div>
        <div>{formatDate(caseData.created_at)}</div>
        <div>{caseData.tag?.name || 'No Tag'}</div>
      </div>
    </div>
  </div>
);

export const LabSlipTemplate: React.FC<PrintTemplateProps> = ({ caseData, paperSize }) => (
  <div className="h-full p-8">
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lab Slip</h1>
          <p className="text-gray-600">Case #: {caseData.case_number}</p>
          <p className="text-gray-600">Date: {formatDate(caseData.created_at)}</p>
        </div>
        <div>
          <QRCodeSVG
            value={caseData.qr_code || `https://app.labulous.com/cases/${caseData.id}`}
            size={getQRCodeSize(paperSize, 'medium')}
            level="H"
            includeMargin={true}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">Patient Information</h2>
          <p className="text-lg">{caseData.patient_name}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-3">Doctor Information</h2>
          <p className="text-lg">{caseData.doctor?.name || 'N/A'}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Lab Details</h2>
        <p className="text-lg">Due Date: {caseData.due_date ? formatDate(caseData.due_date) : 'Not specified'}</p>
      </div>
    </div>
  </div>
);

export const AddressLabelTemplate: React.FC<PrintTemplateProps> = ({ caseData, paperSize }) => (
  <div className="h-full flex items-center justify-center p-4">
    <div className="border border-gray-300 p-6 rounded-lg w-full max-w-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xl font-bold mb-1">{caseData.client?.client_name}</p>
          <p className="text-lg mb-2">{caseData.client?.phone}</p>
          <p className="text-lg mb-1">Case #: {caseData.case_number}</p>
          <p className="text-lg">Patient: {caseData.patient_name}</p>
        </div>
        <div>
          <QRCodeSVG
            value={caseData.qr_code || `https://app.labulous.com/cases/${caseData.id}`}
            size={getQRCodeSize(paperSize, 'small')}
            level="H"
            includeMargin={true}
          />
        </div>
      </div>
    </div>
  </div>
);

export const PatientLabelTemplate: React.FC<PrintTemplateProps> = ({ caseData, paperSize }) => (
  <div className="h-full flex items-center justify-center p-4">
    <div className="border border-gray-300 p-6 rounded-lg text-center w-full max-w-sm">
      <h2 className="text-2xl font-bold mb-2">{caseData.patient_name}</h2>
      <p className="text-xl mb-4">Case #: {caseData.case_number}</p>
      <div className="flex justify-center mb-2">
        <QRCodeSVG
          value={caseData.qr_code || `https://app.labulous.com/cases/${caseData.id}`}
          size={getQRCodeSize(paperSize, 'medium')}
          level="H"
          includeMargin={true}
        />
      </div>
    </div>
  </div>
);
