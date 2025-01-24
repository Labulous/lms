import React from "react";
import { Routes, Route } from "react-router-dom";
import CaseList from "../components/cases/CaseList";
import CaseDetails from "../components/cases/CaseDetails";
import NewCase from "./cases/NewCase";
import ClientNewCase from "./cases/ClientNewCase";
import { useParams } from "react-router-dom";
import UpdateCase from "./cases/updateCase";
import { useAuth } from "../contexts/AuthContext";
import ClientCaseDetails from "@/components/cases/ClientCaseDetails";
import ClientUpdateCase from "./cases/ClientUpdateCase";

const Cases: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route index element={<CaseList />} />
        <Route
          path="new"
          element={user?.role === "client" ? <ClientNewCase /> : <NewCase />}
        />
        <Route
          path="update"
          element={
            user?.role === "client" ? <ClientUpdateCase /> : <UpdateCase />
          }
        />
        <Route
          path=":caseId"
          element={
            user?.role === "client" ? <ClientCaseDetails /> : <CaseDetails />
          }
        />
      </Routes>
    </div>
  );
};

export default Cases;
