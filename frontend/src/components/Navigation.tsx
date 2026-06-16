import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { ThemeToggle } from "components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigationItems = [
    { name: "About", path: "/about" },
    { name: "Events", path: "/events" },
    { name: "Sermons", path: "/sermons" },
    { name: "Ministries", path: "/ministries" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="container mx-auto h-16 px-4">
        <div className="grid grid-cols-3 items-center h-full">
          {/* Left - Logo/Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-xl font-bold">COGASOC</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">Church of God and Saints of Christ</span>
          </div>

          {/* Center - Main Navigation - Desktop Only */}
          <div className="hidden md:flex justify-center">
            <NavigationMenu className="mx-auto">
              <NavigationMenuList className="flex justify-center">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.path}>
                    <NavigationMenuLink
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                      onClick={() => navigate(item.path)}
                    >
                      {item.name}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right - Call to action & Mobile Menu Trigger */}
          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:block">
              <Button variant="outline" onClick={() => navigate("/give")} size="sm" className="mr-2">
                Give
              </Button>
            </div>
            
            {/* Desktop Visit Us button */}
            <Button 
              onClick={() => alert("Contact page coming soon!")} 
              size="sm"
              className="hidden sm:inline-flex"
            >
              Visit Us
            </Button>

            <ThemeToggle />
            
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="ml-1">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col gap-6 py-6">
                    {navigationItems.map((item) => (
                      <Button 
                        key={item.path}
                        variant="ghost" 
                        className="justify-start text-lg font-medium"
                        onClick={() => navigate(item.path)}
                      >
                        {item.name}
                      </Button>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="justify-start text-lg font-medium"
                      onClick={() => navigate("/give")}
                    >
                      Give
                    </Button>
                    <Button className="mt-4">
                      Visit Us
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
