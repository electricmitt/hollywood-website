import { useNavigate } from "react-router-dom";
import { Navigation } from "components/Navigation";
import { Footer } from "components/Footer";
import { Button } from "@/components/ui/button";

export default function MusicMinistryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24 mt-16">
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/ministries")}>
            &larr; Back to Ministries
          </Button>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">
          Music Ministry
        </h1>
        <div className="prose prose-invert max-w-3xl mx-auto text-lg text-center mb-8">
          <p>
            Welcome to the Music Ministry page. Discover how we enrich our worship experience through choir, acappella singing, and worship leadership. More details coming soon!
          </p>
        </div>
        <div className="mb-12 flex justify-center">
          <img 
            src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/musicmin.jpg" 
            alt="Music Ministry Team" 
            className="rounded-lg shadow-lg object-cover w-full md:w-2/3 lg:w-1/2 max-h-[600px]"
          />
        </div>

        {/* Music Ministry Leaders Section */}
        <section className="my-12">
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Meet Our Music Leaders</h2>
          <div className="flex flex-col items-center space-y-8">
            {/* Row 1: 1 card */}
            <div className="flex justify-center w-full">
              <div className="w-full max-w-sm bg-card p-6 rounded-lg shadow-md text-center">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Photo</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">St. Gregory Stewart</h3>
                <p className="text-muted-foreground">Tabernacle Chorister</p>
                <p className="mt-2 text-sm">Brief bio placeholder. This leader contributes significantly to our music ministry.</p>
              </div>
            </div>

            {/* Row 2: 2 cards */}
            <div className="flex flex-wrap justify-center gap-8 w-full">
              <div className="w-full max-w-sm bg-card p-6 rounded-lg shadow-md text-center">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Photo</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">St. Robert Harrison, III</h3>
                <p className="text-muted-foreground">General Singers' Superintendent</p>
                <p className="mt-2 text-sm">Another dedicated member of our music leadership team. More details soon.</p>
              </div>
              <div className="w-full max-w-sm bg-card p-6 rounded-lg shadow-md text-center">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Photo</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">St. Henrietta Harrison</h3>
                <p className="text-muted-foreground">Chorister</p>
                <p className="mt-2 text-sm">Leading our congregation in joyful praise through music.</p>
              </div>
            </div>

            {/* Row 3: 2 cards */}
            <div className="flex flex-wrap justify-center gap-8 w-full">
              <div className="w-full max-w-sm bg-card p-6 rounded-lg shadow-md text-center">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Photo</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">St. Jordan Drummonds</h3>
                <p className="text-muted-foreground">Tabernacle Shepherd</p>
                <p className="mt-2 text-sm">Dedicated to enriching our worship experience with their talents.</p>
              </div>
              <div className="w-full max-w-sm bg-card p-6 rounded-lg shadow-md text-center">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Photo</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">St. Ryan Hay</h3>
                <p className="text-muted-foreground">District Shepherd</p>
                <p className="mt-2 text-sm">A valued member of our music team, bringing passion and skill.</p>
              </div>
            </div>

            {/* Row 4: 1 card */}
            <div className="flex justify-center w-full">
              <div className="w-full max-w-sm bg-card p-6 rounded-lg shadow-md text-center">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Photo</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">St. Elijah Anderson</h3>
                <p className="text-muted-foreground">Singers' Superintendent</p>
                <p className="mt-2 text-sm">Helping to lead our congregation in song and worship.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Videos Section */}
        <section className="my-12">
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Watch Our Performances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placeholder Video Embed 1 */}
            <div className="bg-card p-4 rounded-lg shadow-md">
              <div className="aspect-video bg-muted flex items-center justify-center rounded mb-2">
                <span className="text-muted-foreground">Video Placeholder</span>
              </div>
              <h3 className="text-lg font-semibold">Performance Title 1</h3>
              <p className="text-sm text-muted-foreground">Date or Event</p>
            </div>
            {/* Placeholder Video Embed 2 */}
            <div className="bg-card p-4 rounded-lg shadow-md">
              <div className="aspect-video bg-muted flex items-center justify-center rounded mb-2">
                <span className="text-muted-foreground">Video Placeholder</span>
              </div>
              <h3 className="text-lg font-semibold">Performance Title 2</h3>
              <p className="text-sm text-muted-foreground">Date or Event</p>
            </div>
          </div>
        </section>

        {/* Audio Section */}
        <section className="my-12">
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Listen to Our Music</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-center md:text-left">Stream Now</h3>
              {/* Placeholder Audio Player 1 */}
              <div className="bg-card p-4 rounded-lg shadow-md mb-4">
                <p className="font-medium">Song Title 1</p>
                <div className="h-12 bg-muted rounded flex items-center justify-center mt-2">
                  <span className="text-muted-foreground">Audio Player Placeholder</span>
                </div>
              </div>
              {/* Placeholder Audio Player 2 */}
              <div className="bg-card p-4 rounded-lg shadow-md">
                <p className="font-medium">Song Title 2</p>
                <div className="h-12 bg-muted rounded flex items-center justify-center mt-2">
                  <span className="text-muted-foreground">Audio Player Placeholder</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-center md:text-left">Downloadable Tracks</h3>
              {/* Placeholder Download Link 1 */}
              <div className="bg-card p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
                <p className="font-medium">Song Title 1 (MP3)</p>
                <Button variant="outline">Download</Button>
              </div>
              {/* Placeholder Download Link 2 */}
              <div className="bg-card p-4 rounded-lg shadow-md flex justify-between items-center">
                <p className="font-medium">Song Title 2 (WAV)</p>
                <Button variant="outline">Download</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Song of Zion Section */}
        <section className="my-12">
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Song of Zion</h2>
          <div 
            className="bg-card p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer max-w-2xl mx-auto text-center"
            onClick={() => navigate("/songbook")}
            onKeyPress={(e) => e.key === 'Enter' && navigate("/songbook")}
            role="button"
            tabIndex={0}
          >
            <h3 className="text-2xl font-semibold mb-3">Explore Our Digital Songbook</h3>
            <p className="text-muted-foreground text-lg">
              Search for song titles, discover lyrics, and learn about composers. Dive into the heart of our worship music.
            </p>
            <Button variant="link" className="mt-4 text-lg">
              Go to Songbook &rarr;
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
