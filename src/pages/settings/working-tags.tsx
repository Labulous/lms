import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";
import { WorkingTag } from "@/types/supabase";
import { formatDate } from "@/lib/formatedDate";
import { useLocation, useSearchParams } from "react-router-dom";

interface TagFormData {
  name: string;
  color: string;
}

const WorkingTagsSettings = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tags, setTags] = useState<WorkingTag[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<WorkingTag | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TagFormData>({
    name: "",
    color: "#000000",
  });

  const fetchTags = async () => {
    try {
      setLoading(true);
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData?.labId) {
        toast.error("Lab not found");
        return;
      }

      const { data, error } = await supabase
        .from("working_tags")
        .select("*")
        .eq("lab_id", labData.labId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTags(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user?.id]);

  useEffect(() => {
    const action = searchParams.get('action');
    const tagId = searchParams.get('tagId');
    
    if (action === 'edit' && tagId) {
      const tagToEdit = tags.find(tag => tag.id === tagId);
      if (tagToEdit) {
        handleEdit(tagToEdit);
      }
    }
  }, [searchParams, tags]);

  console.log(user, "tags");
  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);

    e.preventDefault();
    try {
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData?.labId) {
        toast.error("Lab not found");
        return;
      }

      if (editingTag) {
        const { error } = await supabase
          .from("working_tags")
          .update({
            name: formData.name,
            color: formData.color,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTag.id);

        if (error) throw error;
        toast.success("Tag updated successfully");
        setLoading(false);
      } else {
        const { error } = await supabase.from("working_tags").insert([
          {
            name: formData.name,
            color: formData.color,
            lab_id: labData.labId,
            created_by: user?.id,
          },
        ]);

        if (error) throw error;
        toast.success("Tag created successfully");
      }

      setIsDialogOpen(false);
      setEditingTag(null);
      setFormData({ name: "", color: "#000000" });
      fetchTags();
      setLoading(false);
    } catch (error) {
      console.error("Error saving tag:", error);
      toast.error("Failed to save tag");
      setLoading(false);
    }
  };

  const handleEdit = (tag: WorkingTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tag: WorkingTag) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("working_tags")
        .delete()
        .eq("id", tag.id);

      if (error) throw error;
      toast.success("Tag deleted successfully");
      fetchTags();
      setLoading(false);
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
      setLoading(false);
    }
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Working Tags</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTag(null);
                setFormData({ name: "", color: "#000000" });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTag ? "Edit Tag" : "Create New Tag"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter tag name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    placeholder="#000000"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    className="flex-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {editingTag ? loading ? "Updating Tag" :  "Update Tag" : loading ? "Creating tag" : "Create Tag"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.color}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(tag.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                      data-tag-id={tag.id}
                      className="edit-button"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WorkingTagsSettings;
