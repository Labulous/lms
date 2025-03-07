import React from "react";
import { Routes, Route } from "react-router-dom";
import CaseList from "../components/cases/CaseList";
import CaseDetails from "../components/cases/CaseDetails";
import NewCase from "./cases/NewCase";
import { useParams } from "react-router-dom";
import UpdateCase from "./cases/updateCase";
const Cases: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-4">
      <Routes>
        <Route index element={<CaseList />} />
        <Route path="new" element={<NewCase />} />
        <Route path="update" element={<UpdateCase />} />
        <Route path=":caseId" element={<CaseDetails />} />
      </Routes>
    </div>
  );
};

export default Cases;
