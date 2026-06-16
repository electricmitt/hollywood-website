import { useNavigate } from "react-router-dom";
import { Navigation } from "components/Navigation";
import { Footer } from "components/Footer";
import { Button } from "@/components/ui/button";

export default function OutreachMissionsMinistry() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24 mt-16">
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/ministries")}>
            &larr; Back to Ministries
          </Button>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-6 text-center">
          Outreach & Missions Ministry
        </h1>
        <div className="prose prose-invert max-w-3xl mx-auto text-lg text-center">
          <p>
            Welcome to the Outreach & Missions Ministry page. Learn about our efforts in extending compassion and support to our local community and global missions. Full details will be posted shortly.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}