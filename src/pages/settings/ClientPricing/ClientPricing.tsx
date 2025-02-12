import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import ClientProductPricing from "./ClientProductPricing";
import ClientServicePricing from "./ClientServicePricing";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const ClientPricing = () => {
  const [activeTab, setActiveTab] = useState("products");

  const { user } = useAuth();

  const {
    data: labIdData,
    error: labError,
    isLoading: isLabLoading,
  } = useQuery(
    supabase.from("users").select("lab_id").eq("id", user?.id).single(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: specialServicePrices, error: pricesError } = useQuery(
    labIdData?.lab_id
      ? supabase
          .from("special_service_prices")
          .select(
            `
             *,
             default:services!service_id (
             price,
             name,
             material:materials!material_id (
             name
             )
             )
          `
          )
          .eq("lab_id", labIdData?.lab_id)
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 1000,
    }
  );
  const {
    data: clients,
    error: clientsError,
    isLoading: clientLoading,
  } = useQuery(
    labIdData
      ? supabase
          .from("clients")
          .select(
            `
             id, client_name            `
          )
          .eq("lab_id", labIdData.lab_id)
          .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
          .order("client_name", { ascending: true })
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  console.log(clients, "clients");
  if (clientsError) {
    return <div>Faild to fetch Clients!</div>;
  }

  return (
    <div className="container mx-auto px-4 pb-4">
      <Tabs
        defaultValue="products"
        className="space-y-4 mt-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {activeTab === "products" ? (
          <div className="space-y-4">
            <ClientProductPricing
              labIdData={labIdData}
              clients={clients}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <ClientServicePricing
              labIdData={labIdData}
              clients={clients}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default ClientPricing;
