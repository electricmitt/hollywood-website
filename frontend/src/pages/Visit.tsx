import { Clock, MapPin, Video, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CHURCH, SERVICE_TIMES, emailLink } from "../constants/church";

export default function Visit() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4">Plan Your Visit</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            We'd love to worship with you. Here's everything you need to join us in person or online.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Service times */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Service Times</h2>
            <ul className="space-y-3">
              {SERVICE_TIMES.map(s => (
                <li key={s.label} className="flex justify-between gap-4 border-b border-border last:border-0 pb-3 last:pb-0">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground text-right">{s.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Join online */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> Join Online</h2>
            <p className="text-muted-foreground mb-4 flex-grow">
              Can't make it in person? Worship with us on Zoom, or catch past messages on our Sermons page.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild><a href={emailLink("Zoom link for services")}>Email us for the Zoom link</a></Button>
              <Button asChild variant="outline"><Link to="/sermons">Watch sermons</Link></Button>
            </div>
          </div>

          {/* Location + map */}
          <div className="rounded-xl border border-border bg-card overflow-hidden md:col-span-2">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Location</h2>
                <p className="text-muted-foreground">{CHURCH.addressLine1}</p>
                <p className="text-muted-foreground">{CHURCH.addressLine2}</p>
              </div>
              <Button asChild size="lg">
                <a href={CHURCH.directionsUrl} target="_blank" rel="noopener noreferrer">Get Directions</a>
              </Button>
            </div>
            <iframe
              title="Map to the church"
              src={CHURCH.mapsEmbedUrl}
              className="w-full h-72 md:h-96 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-border bg-card p-6 md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Questions?</h2>
              <p className="text-muted-foreground">We're happy to help you plan your first visit.</p>
            </div>
            <Button asChild variant="outline" size="lg"><a href={emailLink("Planning a visit")}>Email Us</a></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
