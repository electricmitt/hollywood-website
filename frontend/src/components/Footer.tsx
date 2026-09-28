import { Link } from "react-router-dom";
import { Mail, MapPin, Youtube, Facebook, Book } from "lucide-react";
import { CHURCH, emailLink } from "../constants/church";

const linkClass = "text-muted-foreground hover:text-foreground transition-colors";

type FooterLink = { label: string; to?: string; href?: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Quick Links",
    links: [
      { label: "About", to: "/about" },
      { label: "Events", to: "/events" },
      { label: "Calendar", to: "/calendarpage" },
      { label: "Give", to: "/give" },
      { label: "Visit Us", to: "/visit" },
    ],
  },
  {
    title: "Ministries",
    links: [
      { label: "Sermons", to: "/sermons" },
      { label: "Music", to: "/music-ministry-page" },
      { label: "Community", to: "/outreach-missions-ministry" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Prayer", to: "/prayer-ministry-page" },
      { label: "Literature", href: CHURCH.youversionUrl },
      { label: "Volunteer", href: emailLink("Volunteering") },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 md:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {COLUMNS.map(col => (
            <div key={col.title} className="space-y-4">
              <h3 className="text-lg font-semibold">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className={linkClass}>{l.label}</Link>
                    ) : (
                      <a
                        href={l.href}
                        className={linkClass}
                        {...(l.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href={emailLink()} 
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Us</span>
                </a>
              </li>
              <li>
                <a 
                  href={CHURCH.mapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Find Us</span>
                </a>
              </li>
            </ul>
          </div>
        </div>



        {/* Social Links & Copyright */}
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex space-x-4">
            <a 
              href={CHURCH.youtubeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="YouTube"
            >
              <Youtube className="h-5 w-5" />
              <span className="sr-only">YouTube</span>
            </a>
            <a 
              href={CHURCH.facebookUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Facebook"
            >
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </a>
            <a 
              href={CHURCH.youversionUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="YouVersion"
            >
              <Book className="h-5 w-5" />
              <span className="sr-only">YouVersion</span>
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Church of God and Saints of Christ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
