import { Button } from "@/components/ui/button";
// import { useNavigate } from "react-router-dom";

export function Hero() {
  // const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-background/60 -z-10" />

      <div className="container relative px-4 md:px-6 z-10">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              Welcome to Church of God<br />
              and Saints of Christ
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              The Pillar and Ground of the Truth. <br />
              Named in accordance with1st Corinthians 1:1-2 and Ephesians 2:19-20.
            </p>
          </div>
          <div className="space-x-4">
            <Button size="lg" onClick={(e) => e.preventDefault()}>
              Learn More
            </Button>
            <Button size="lg" variant="outline" onClick={(e) => e.preventDefault()}>
              Plan Your Visit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}