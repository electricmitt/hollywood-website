import { useNavigate } from "react-router-dom";
import { Navigation } from "components/Navigation";
import { Footer } from "components/Footer";
import { Button } from "@/components/ui/button";

export default function BibleStudyPage() {
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
          Bible Study Ministry
        </h1>
        <div className="prose prose-invert max-w-3xl mx-auto text-lg text-center">
          <p>
            Welcome to the Bible Study Ministry page. Join us in deepening our understanding of scripture through structured study groups and theological discussions. Further details will be shared soon.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}