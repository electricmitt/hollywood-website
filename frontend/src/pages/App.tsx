import { Navigation } from "components/Navigation";
import { Hero } from "components/Hero";
import { ShowcaseSection } from "components/ShowcaseSection";
import { WelcomeSection } from "components/WelcomeSection";
import { Footer } from "components/Footer";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // Set the document title
    document.title = "CoGaSoC";
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Hero />
      <ShowcaseSection />
      <WelcomeSection />
      <Footer />
    </main>
  );
}
