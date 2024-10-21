import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CaseList from '../components/cases/CaseList';
import CaseDetails from '../components/cases/CaseDetails';

const Cases: React.FC = () => {
  console.log('Rendering Cases component');
  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route index element={<CaseList />} />
        <Route path=":caseId" element={<CaseDetails />} />
      </Routes>
    </div>
  );
};

export default Cases;