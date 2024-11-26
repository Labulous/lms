import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, User, FileText, Camera } from 'lucide-react';
import CaseProgress from './CaseProgress';
import PhotoUpload from './PhotoUpload';
import CaseComments from './CaseComments';
import QRCodeScanner from './QRCodeScanner';
import { getCaseById, Case } from '../../data/mockCasesData';

const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseDetail, setCaseDetail] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) {
      // Simulate API call
      setTimeout(() => {
        const fetchedCase = getCaseById(caseId);
        if (fetchedCase) {
          setCaseDetail(fetchedCase);
          setLoading(false);
        } else {
          setError('Case not found');
          setLoading(false);
        }
      }, 500);
    }
  }, [caseId]);

  const handleCompleteStage = async (stageName: string) => {
    // Implement stage completion logic here
    console.log(`Completing stage: ${stageName}`);
  };

  const handlePhotoUpload = async (file: File) => {
    // Implement photo upload logic here
    console.log(`Uploading photo: ${file.name}`);
  };

  if (loading) {
    return <div className="text-center py-4">Loading case details...</div>;
  }

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error!</strong>
      <span className="block sm:inline"> {error}</span>
    </div>;
  }

  if (!caseDetail) return <div>Case not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Case Details: {caseDetail.clientName}</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Case Information</h2>
            <p><strong>Patient:</strong> {caseDetail.patientName}</p>
            <p><strong>Due Date:</strong> {new Date(caseDetail.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {caseDetail.caseStatus}</p>
            <p><strong>Case Type:</strong> {caseDetail.caseType}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Progress</h2>
            <CaseProgress progress={50} /> {/* You might want to calculate this based on completed stages */}
          </div>
        </div>
      </div>

      {/* Add more sections for stages, photo upload, comments, etc. */}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
        <PhotoUpload onUpload={handlePhotoUpload} isLoading={false} />
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">QR Code Scanner</h2>
        <QRCodeScanner onScan={(result) => console.log('QR Code scanned:', result)} />
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Case Comments</h2>
        <CaseComments caseId={caseId || ''} />
      </div>
    </div>
  );
};

export default CaseDetails;