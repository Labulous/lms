import { supabase } from "@/lib/supabase";

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from("your-bucket")
    .upload(`${path}/${file.name}`, file);

  if (error) throw error;
  return data;
};
