import { CHURCH, SERVICE_TIMES, emailLink } from "../constants/church";

export function WelcomeSection() {
  return (
    <section className="relative bg-background pt-48 pb-24">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Join In With Us</h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              For praise and worship in the beauty of holiness.
              "My house shall be called an house of prayer for all people." St. Matt 23:13
            </p>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-semibold">Time</h3>
              {SERVICE_TIMES.map(s => (
                <p key={s.label} className="text-muted-foreground">{s.label}: {s.time}</p>
              ))}
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-semibold">Virtually</h3>
              <p className="text-muted-foreground">Join us on Zoom:</p>
              <a href={emailLink("Zoom link for services")} className="text-primary hover:underline">
                Email us for the Zoom link
              </a>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-semibold">Location</h3>
              <p className="text-muted-foreground">{CHURCH.addressLine1}</p>
              <p className="text-muted-foreground">{CHURCH.addressLine2}</p>
              <a href={CHURCH.directionsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                Get directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
