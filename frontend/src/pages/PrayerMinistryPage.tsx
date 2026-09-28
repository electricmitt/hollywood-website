import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrayerMinistryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow container mx-auto px-4 py-8 pt-24 mt-16">
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/ministries")}>
            &larr; Back to Ministries
          </Button>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-6 text-center">
          Prayer Ministry
        </h1>
        <div className="prose prose-invert max-w-3xl mx-auto text-lg text-center">
          <p>
            Welcome to the Prayer Ministry page. We focus on the power of prayer for healing, guidance, and spiritual growth in our community. More information to come.
          </p>
        </div>
      </main>
    </div>
  );
}