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

  return <div className="container mx-auto p-6"> home 1 $</div>;
};

export default Home1;
