import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, User, FileText, Camera } from 'lucide-react';
import CaseProgress from './CaseProgress';
import PhotoUpload from './PhotoUpload';
import CaseComments from './CaseComments';
import QRCodeScanner from './QRCodeScanner';
import { fetchCaseDetails, updateCaseStage, uploadPhoto } from '../../services/api';

interface CaseDetail {
  id: string;
  clientName: string;
  patientName: string;
  dueDate: string;
  currentStage: string;
  progress: number;
  status: 'In Progress' | 'Completed' | 'On Hold';
  assignedTechnicians: string[];
  stages: { name: string; status: 'completed' | 'in_progress' | 'pending' }[];
}

const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) {
      fetchCaseData(caseId);
    }
  }, [caseId]);

  const fetchCaseData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCaseDetails(id);
      setCaseDetail(response.data);
    } catch (err) {
      setError('Failed to load case details. Please try again later.');
      console.error('Error fetching case details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStage = async (stageName: string) => {
    if (!caseId || !caseDetail) return;
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      await updateCaseStage(caseId, stageName, 'completed');
      fetchCaseData(caseId); // Refresh case data
    } catch (err) {
      setUpdateError('Failed to update stage status. Please try again.');
      console.error('Error updating stage status:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!caseId || !caseDetail) return;
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      await uploadPhoto(caseId, file, caseDetail.currentStage);
      // Optionally, you can refresh the case data or update the UI to show the new photo
    } catch (err) {
      setUpdateError('Failed to upload photo. Please try again.');
      console.error('Error uploading photo:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!caseDetail) return <div>Case not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Case Details: {caseDetail.clientName}</h1>
      {updateError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {updateError}</span>
        </div>
      )}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Case Information</h2>
            <p><strong>Patient:</strong> {caseDetail.patientName}</p>
            <p><strong>Due Date:</strong> {new Date(caseDetail.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {caseDetail.status}</p>
            <p><strong>Current Stage:</strong> {caseDetail.currentStage}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Progress</h2>
            <CaseProgress progress={caseDetail.progress} />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Case Stages</h2>
        {caseDetail.stages.map((stage, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
            <span>{stage.name}</span>
            <button
              onClick={() => handleCompleteStage(stage.name)}
              className={`px-4 py-2 rounded ${
                stage.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : stage.status === 'in_progress'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
              disabled={stage.status === 'completed' || updateLoading}
            >
              {stage.status === 'completed' ? 'Completed' : updateLoading ? 'Updating...' : 'Mark as Complete'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Assigned Technicians</h2>
        <div className="flex flex-wrap gap-2">
          {caseDetail.assignedTechnicians.map((technician, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {technician}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
        <PhotoUpload onUpload={handlePhotoUpload} isLoading={updateLoading} />
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