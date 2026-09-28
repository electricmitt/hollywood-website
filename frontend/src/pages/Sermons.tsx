import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "app";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Sermon, youtubeWatchUrl } from "utils/sermon";
import { Separator } from "@/components/ui/separator";
import { Search, Calendar, User, Clock, BookOpen, Youtube, ExternalLink } from "lucide-react";
import { CHURCH } from "../constants/church";

const PLAYLIST_ID = "PLWhvmoWRu4XChoV6s-rmq4QbhL9O9QwXO";
const PAGE_SIZE = 9;

// Custom artwork for one sermon whose YouTube thumbnail isn't used.
const CUSTOM_THUMBNAILS: Record<string, string> = {
  "Watch My Back": "https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/WATCH%20MY%20BACK.png",
};
const thumbnail = (s: Sermon) => CUSTOM_THUMBNAILS[s.title ?? ""] ?? s.thumbnail_url ?? "";
const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "");

const selectClass =
  "h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const Sermons: React.FC = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [year, setYear] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [playing, setPlaying] = useState<Sermon | null>(null);

  useEffect(() => {
    const fetchSermons = async () => {
      try {
        const response = await apiClient.get_sermons({ playlistId: PLAYLIST_ID });
        const data: Sermon[] = await response.json();
        // Newest first.
        data.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
        setSermons(data);
      } catch {
        setError("Failed to fetch sermons. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchSermons();
  }, []);

  const speakers = useMemo(
    () => [...new Set(sermons.map(s => s.speaker).filter((v): v is string => !!v))].sort(),
    [sermons],
  );
  const years = useMemo(
    () => [...new Set(sermons.map(s => (s.published_at ?? "").slice(0, 4)).filter(Boolean))].sort().reverse(),
    [sermons],
  );

  const filtering = !!(query.trim() || speaker || year);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons.filter(s =>
      (!speaker || s.speaker === speaker) &&
      (!year || (s.published_at ?? "").startsWith(year)) &&
      (!q || [s.title, s.description, s.speaker, s.scripture].some(v => (v ?? "").toLowerCase().includes(q))),
    );
  }, [sermons, query, speaker, year]);

  // Start from the first page whenever the filters change.
  useEffect(() => setVisible(PAGE_SIZE), [query, speaker, year]);

  // The newest sermon is featured only when browsing without filters.
  const featured = !filtering ? matches[0] ?? null : null;
  const list = filtering ? matches : matches.slice(1);
  const shown = list.slice(0, visible);

  const clearFilters = () => { setQuery(""); setSpeaker(""); setYear(""); };

  // Plays in the on-site player; videos with embedding disabled open on YouTube instead.
  const watchButton = (sermon: Sermon, className: string) =>
    sermon.embeddable === false ? (
      <Button asChild className={className}>
        <a href={youtubeWatchUrl(sermon.video_id)} target="_blank" rel="noopener noreferrer">
          Watch on YouTube <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    ) : (
      <Button className={className} onClick={() => setPlaying(sermon)}>Watch Now</Button>
    );

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

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
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
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search sermons..."
              aria-label="Search sermons"
              className="h-10 w-full rounded-md border border-input bg-card px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Only useful once sermons have more than one speaker (set in Sermon Manager). */}
            {speakers.length > 1 && (
              <select value={speaker} onChange={e => setSpeaker(e.target.value)} aria-label="Filter by speaker" className={selectClass}>
                <option value="">All Speakers</option>
                {speakers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <select value={year} onChange={e => setYear(e.target.value)} aria-label="Filter by year" className={selectClass}>
              <option value="">All Dates</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Featured Sermon - Large Format */}
        {featured && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Message</h2>
            <div className="bg-card rounded-lg overflow-hidden shadow-lg">
              <div className="grid md:grid-cols-2">
                <div className="relative w-full aspect-video">
                  <img src={thumbnail(featured)} alt={featured.title || ""} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:hidden">
                    <h3 className="text-white font-bold text-xl mb-1">{featured.title}</h3>
                  </div>
                </div>
                <div className="p-6 flex flex-col">
                  <div className="hidden md:block">
                    <h3 className="text-2xl font-bold mb-2">{featured.title}</h3>
                  </div>
                  <div className="flex flex-col space-y-3 mb-4">
                    <div className="flex items-center text-muted-foreground">
                      <User size={16} className="mr-2" />
                      <span>{featured.speaker}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar size={16} className="mr-2" />
                      <span>{formatDate(featured.published_at)}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock size={16} className="mr-2" />
                      <span>{featured.duration} min</span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <p className="text-muted-foreground mb-6 flex-grow line-clamp-6">{featured.description}</p>
                  <div className="flex gap-3 mt-auto">
                    {watchButton(featured, "flex-1")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sermons Grid */}
        <div>
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">
              {filtering ? `${matches.length} ${matches.length === 1 ? "result" : "results"}` : "Recent Messages"}
            </h2>
            {filtering && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>

          {shown.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="mb-4">No sermons match your search.</p>
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((sermon) => (
                <Card key={sermon.video_id} className="overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                  <div className="aspect-video relative overflow-hidden">
                    <img src={thumbnail(sermon)} alt={sermon.title || ""} className="object-cover w-full h-full transition-all hover:scale-105" />
                    <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 text-xs rounded">
                      {sermon.duration} min
                    </div>
                  </div>
                  <CardContent className="p-5 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-1 line-clamp-2">{sermon.title}</h3>
                    <div className="flex justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center min-w-0">
                        <User size={14} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{sermon.speaker}</span>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <Calendar size={14} className="mr-1" />
                        <span>{formatDate(sermon.published_at)}</span>
                      </div>
                    </div>
                    <Separator className="mb-4" />
                    <p className="text-muted-foreground mb-4 line-clamp-2 flex-grow">{sermon.description}</p>
                    {watchButton(sermon, "w-full mt-auto")}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {list.length > visible && (
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" onClick={() => setVisible(v => v + PAGE_SIZE)}>
              Load More Sermons
            </Button>
          </div>
        )}

        {/* Subscribe Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-900 to-indigo-800 rounded-lg p-8 shadow-lg text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Never Miss a Message</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Subscribe to our YouTube channel and you'll be notified whenever a new message is posted.
            </p>
            <Button asChild className="bg-white text-purple-900 hover:bg-white/90">
              <a href={`${CHURCH.youtubeUrl}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer">
                <Youtube className="mr-2 h-4 w-4" /> Subscribe on YouTube
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Sermon player */}
      <Dialog open={playing !== null} onOpenChange={o => { if (!o) setPlaying(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {playing && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{playing.title}</DialogTitle>
              </DialogHeader>
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${playing.video_id}?autoplay=1&rel=0`}
                  title={playing.title ?? "Sermon video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><User size={14} />{playing.speaker}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(playing.published_at)}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} />{playing.duration} min</span>
                {playing.scripture && <span className="flex items-center gap-1.5"><BookOpen size={14} />{playing.scripture}</span>}
              </div>
              {playing.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{playing.description}</p>
              )}
              <a
                href={youtubeWatchUrl(playing.video_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink size={14} /> Open on YouTube
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sermons;
