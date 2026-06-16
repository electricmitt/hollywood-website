import React, { useState, useEffect } from "react";
import { apiClient } from "app";
import { GetSermonsSermons, SermonOverride } from "types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SermonManager: React.FC = () => {
  const [sermons, setSermons] = useState<GetSermonsSermons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<GetSermonsSermons | null>(null);
  const [formData, setFormData] = useState<SermonOverride>({});

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get_sermons({ playlistId: "PLWhvmoWRu4XChoV6s-rmq4QbhL9O9QwXO" });
      const data = await response.json();
      setSermons(data);
    } catch (err) {
      setError("Failed to fetch sermons. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSermons();
  }, []);

  const handleEditClick = (sermon: GetSermonsSermons) => {
    setSelectedSermon(sermon);
    setFormData({
      title: sermon.title,
      speaker: sermon.speaker,
      description: sermon.description,
      scripture: sermon.scripture,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!selectedSermon || !selectedSermon.video_id) {
      toast.error("No sermon selected or video ID is missing.");
      return;
    }

    try {
      // The API client expects the parameter to be camelCase (videoId)
      await apiClient.save_override({ videoId: selectedSermon.video_id }, formData);
      toast.success("Sermon details updated successfully!");
      setIsModalOpen(false);
      fetchSermons(); // Refresh the list
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading sermon manager...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Sermon Content Manager</h1>
      <div className="space-y-4">
        {sermons.map((sermon) => (
          <div
            key={sermon.video_id}
            className="bg-card p-4 rounded-lg shadow flex items-center justify-between"
          >
            <div>
              <h2 className="font-bold text-lg">{sermon.title}</h2>
              <p className="text-sm text-muted-foreground">{sermon.speaker}</p>
            </div>
            <Button onClick={() => handleEditClick(sermon)}>Edit</Button>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sermon Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title || ""}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speaker" className="text-right">
                Speaker
              </Label>
              <Input
                id="speaker"
                name="speaker"
                value={formData.speaker || ""}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scripture" className="text-right">
                Scripture
              </Label>
              <Input
                id="scripture"
                name="scripture"
                value={formData.scripture || ""}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleFormChange}
                className="col-span-3"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SermonManager;
