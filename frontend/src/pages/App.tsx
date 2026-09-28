import { Hero } from "components/Hero";
import { ShowcaseSection } from "components/ShowcaseSection";
import { WelcomeSection } from "components/WelcomeSection";

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <ShowcaseSection />
      <WelcomeSection />
    </main>
  );
}
