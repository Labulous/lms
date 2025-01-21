import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CaseDetails from './CaseDetails';

interface CaseDetailsDrawerProps {
  caseId: string;
  onClose?: () => void;
}

// Wrapper component to provide drawer-specific context
const CaseDetailsWrapper: React.FC<{ caseId: string; onClose?: () => void }> = ({ caseId, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Override navigation to keep it within the drawer context
  const handleNavigate = (path: string) => {
    // If it's the edit path, navigate to the actual edit page
    if (path.includes('/cases/update')) {
      navigate(path);
      if (onClose) {
        onClose();
      }
    } else {
      // For other paths, just log the attempt
      console.log('Drawer navigation attempted:', path);
    }
  };

  return (
    <div className="overflow-y-auto h-full">
      <CaseDetails drawerMode caseId={caseId} onNavigate={handleNavigate} />
    </div>
  );
};

const CaseDetailsDrawer: React.FC<CaseDetailsDrawerProps> = ({ caseId, onClose }) => {
  return <CaseDetailsWrapper caseId={caseId} onClose={onClose} />;
};

export default CaseDetailsDrawer;
