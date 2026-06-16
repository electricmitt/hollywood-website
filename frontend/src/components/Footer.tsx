import { Mail, MapPin, Youtube, Facebook, Book } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 md:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Events</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Give</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Visit Us</a>
              </li>
            </ul>
          </div>

          {/* Ministries */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ministries</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Sermons</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Music</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Community</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Prayer</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Literature</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground transition-colors">Volunteer</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:hollywoodtabernacle1@gmail.com" 
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Us</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://maps.google.com/?q=4931+SW+20th+Street+West+Park,+FL+33023" 
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
              href="https://www.youtube.com/@hollywoodtabernacle" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="YouTube"
            >
              <Youtube className="h-5 w-5" />
              <span className="sr-only">YouTube</span>
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=100070361948296" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Facebook"
            >
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </a>
            <a 
              href="https://www.bible.com/organizations/28dd611b-8c4e-4622-9d13-2d2d5777be88" 
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
