import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import PatientList from "@/components/patients/PatientList";

const Patients: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-4">
      <Routes>
        <Route index element={<PatientList />} />
      </Routes>
    </div>
  );
};

export default Patients;
