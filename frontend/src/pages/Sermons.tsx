import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "app";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GetSermonsSermons } from "types";
import { Separator } from "@/components/ui/separator";
import { Search, Calendar, User, Clock } from "lucide-react";


const Sermons: React.FC = () => {
  const [sermons, setSermons] = useState<GetSermonsSermons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSermons = async () => {
      try {
        const response = await apiClient.get_sermons({ playlistId: "PLWhvmoWRu4XChoV6s-rmq4QbhL9O9QwXO" });
        const data = await response.json();
        // Sort sermons by published date, newest first
        data.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
        setSermons(data);
      } catch (err) {
        setError("Failed to fetch sermons. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSermons();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading sermons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

    // Identify featured sermons (for example, first one)
  const featuredSermon = sermons.length > 0 ? sermons[0] : null;
  const regularSermons = sermons.length > 0 ? sermons.slice(1) : [];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 -z-10" />
      
      <div className="container px-4 md:px-6 mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">Sermons</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Explore our collection of messages that inspire, challenge, and deepen your faith.
          </p>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="relative mb-12 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="search" 
              placeholder="Search sermons..." 
              className="h-10 w-full rounded-md border border-input bg-card px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">All Speakers</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">All Dates</option>
            </select>
          </div>
        </div>
        
        {/* Featured Sermon - Large Format */}
        {featuredSermon && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Message</h2>
            <div className="bg-card rounded-lg overflow-hidden shadow-lg">
              <div className="grid md:grid-cols-2">
                <div className="relative w-full aspect-video">
                  <img 
                    src={featuredSermon.title === "Watch My Back" ? "https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/WATCH%20MY%20BACK.png" : featuredSermon.thumbnail_url || ""} 
                    alt={featuredSermon.title || ""}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:hidden">
                    <h3 className="text-white font-bold text-xl mb-1">{featuredSermon.title}</h3>
                  </div>
                </div>
                <div className="p-6 flex flex-col">
                  <div className="hidden md:block">
                    <h3 className="text-2xl font-bold mb-2">{featuredSermon.title}</h3>
                  </div>
                  <div className="flex flex-col space-y-3 mb-4">
                    <div className="flex items-center text-muted-foreground">
                      <User size={16} className="mr-2" />
                      <span>{featuredSermon.speaker}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar size={16} className="mr-2" />
                      <span>{new Date(featuredSermon.published_at || "").toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock size={16} className="mr-2" />
                      <span>{featuredSermon.duration} min</span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <p className="text-muted-foreground mb-6 flex-grow">{featuredSermon.description}</p>
                  <div className="flex gap-3 mt-auto">
                    <Button className="flex-1" onClick={() => navigate(`/sermon-detail?videoId=${featuredSermon.video_id}`)}>
                      Watch Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent Sermons Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Messages</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularSermons.map((sermon) => (
              <Card key={sermon.video_id} className="overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={sermon.title === "Watch My Back" ? "https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/WATCH%20MY%20BACK.png" : sermon.thumbnail_url || ""} 
                    alt={sermon.title || ""}
                    className="object-cover w-full h-full transition-all hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 text-xs rounded">
                    {sermon.duration} min
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold mb-1 line-clamp-2">{sermon.title}</h3>
                  
                  <div className="flex justify-between mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User size={14} className="mr-1" />
                      <span className="truncate">{sermon.speaker}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>{new Date(sermon.published_at || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground mb-4 line-clamp-2 flex-grow">{sermon.description}</p>
                  
                  <Button className="w-full mt-auto" onClick={() => navigate(`/sermon-detail?videoId=${sermon.video_id}`)}>
                    Watch Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Load More Button */}
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg">
            Load More Sermons
          </Button>
        </div>
        
        {/* Subscribe Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-900 to-indigo-800 rounded-lg p-8 shadow-lg text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Never Miss a Message</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Subscribe to receive notifications when new sermons are posted. Stay connected 
              and grow in your faith journey with weekly inspirational content.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="h-10 rounded-md border border-input bg-white/10 px-4 py-2 text-white placeholder:text-white/70 flex-grow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-900"
              />
              <Button className="bg-white text-purple-900 hover:bg-white/90">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sermons;
