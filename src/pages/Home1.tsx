import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  PauseCircle,
  Package,
  Maximize2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import DueDatesCalendar from "../components/calendar/DueDatesCalendar";
import CalendarModal from "../components/calendar/CalendarModal";
import { getCases, Case } from "../data/mockCasesData";
import { Button } from "../components/ui/button";
import { getLabIdByUserId } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesDashboard from "@/components/dashboard/SalesDashboard";
import { format } from "date-fns";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";

interface CasesDues {
  due_date: string;
  status: string;
  id: string;
  case_number: string;
  client_name: {
    client_name: string;
  };
  product_ids: { products_id: string[] };
  doctor: { name: string };
  products: any[];
  invoicesData:
    | {
        amount: number;
        due_amount: number;
        status: String;
        created_at: string;
      }[]
    | [];
}

export interface CalendarEvents {
  title: string;
  start: Date;
  end: Date;

  formattedCases: {
    case_id: string;
    client_name: string;
    doctor: { name: string };
    case_products: { name: string; product_type: { name: string } }[];
    invoicesData:
      | {
          amount: number;
          due_amount: number;
          status: String;
          created_at: string;
        }[]
      | [];
  }[];
}

const Home1: React.FC = () => {
  const navigate = useNavigate();

  const { data: caseDataa, error: caseError } = useQuery(
    supabase
      .from("cases")
      .select(
        `
          id,
          created_at,
          received_date,
          ship_date,
          status,
          patient_name,
          due_date,
          case_number,
          invoice:invoices!case_id (
            id,
            case_id,
            amount,
            status,
            due_amount,
            due_date
          ),
          client:clients!client_id (
            id,
            client_name,
            phone,
            street,
            city,
            state,
            zip_code
          )
        `
      )
      .eq("id", "27dafea6-ecf5-41ef-8b40-65ae17c1b1a1")
      .single(), // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Error handling
  if (caseError) {
    return <div>Error fetching case data: {caseError.message}</div>;
  }

  // Show loading state until the data is available
  if (!caseDataa) {
    return <div>Loading...</div>;
  }
  console.log(caseDataa, "caseDataa");
  return (
    <div className="container mx-auto p-6">
      {" "}
      home 1 ${caseDataa.case_number}
    </div>
  );
};

export default Home1;
