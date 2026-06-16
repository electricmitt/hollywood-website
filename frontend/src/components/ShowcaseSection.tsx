import { Slideshow } from "components/Slideshow";

export function ShowcaseSection() {
  return (
    <section className="relative bg-background py-12 md:py-24 pb-32 md:pb-48 flex flex-col items-center">
      <div className="max-w-3xl w-full text-center px-4 md:px-6 mb-12">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Our Community
        </h2>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Experience the vibrant spirit of our congregation through moments of worship, fellowship, and service.
        </p>
      </div>
      <div className="mt-24 w-full flex justify-center"> {/* Ensured slideshow wrapper is also full width and centers its content */}
        <Slideshow />
      </div>
    </section>
  );
}
