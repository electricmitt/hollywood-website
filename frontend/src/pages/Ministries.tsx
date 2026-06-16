import { Navigation } from "components/Navigation";
import { Footer } from "components/Footer";
import { useNavigate } from "react-router-dom";

export default function Ministries() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 mt-16">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-center">
            Our Ministries
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto">
            Serving our community and nurturing spiritual growth through dedicated ministries
          </p>
        </div>
      </section>
      
      {/* Main Ministries List */}
      <section className="py-12 px-4">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Ministry Card 1 */}
          <div 
            className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/WordOfGodMinistry")}
          >
            <div className="h-48 bg-gradient-to-r from-blue-900 to-indigo-900 flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">The Word of God</h3>
              <p className="text-muted-foreground mb-4">
                The preaching of the gospel of Jesus Christ as the spirit gives utterance.
              </p>
              {/* <button className="text-primary font-medium hover:underline" onClick={(e) => e.preventDefault()}>Learn More</button> */}
            </div>
          </div>
          
          {/* Ministry Card 2 */}
          <div 
            className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/MusicMinistryPage")}
          >
            <div className="h-48 bg-gradient-to-r from-purple-900 to-pink-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Music Ministry</h3>
              <p className="text-muted-foreground mb-4">
                Enriching our worship experience through choir, instrumental music, and worship leadership.
              </p>
              {/* <button className="text-primary font-medium hover:underline" onClick={(e) => e.preventDefault()}>Learn More</button> */}
            </div>
          </div>
          
          {/* Ministry Card 3 */}
          <div 
            className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/OutreachMissionsMinistry")}
          >
            <div className="h-48 bg-gradient-to-r from-emerald-900 to-teal-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Outreach & Missions</h3>
              <p className="text-muted-foreground mb-4">
                Extending compassion and support to our local community and global missions through direct service.
              </p>
              {/* <button className="text-primary font-medium hover:underline" onClick={(e) => e.preventDefault()}>Learn More</button> */}
            </div>
          </div>
          
          {/* Ministry Card 4 */}
          <div 
            className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/FamilyMinistryPage")}
          >
            <div className="h-48 bg-gradient-to-r from-amber-900 to-yellow-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Family Ministry</h3>
              <p className="text-muted-foreground mb-4">
                Supporting and strengthening families through counseling, education, and community activities.
              </p>
              {/* <button className="text-primary font-medium hover:underline" onClick={(e) => e.preventDefault()}>Learn More</button> */}
            </div>
          </div>
          
          {/* Ministry Card 5 */}
          <div 
            className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/BibleStudyPage")}
          >
            <div className="h-48 bg-gradient-to-r from-red-900 to-orange-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Bible Study</h3>
              <p className="text-muted-foreground mb-4">
                Deepening our understanding of scripture through structured study groups and theological discussions.
              </p>
              {/* <button className="text-primary font-medium hover:underline" onClick={(e) => e.preventDefault()}>Learn More</button> */}
            </div>
          </div>
          
          {/* Ministry Card 6 */}
          <div 
            className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/PrayerMinistryPage")}
          >
            <div className="h-48 bg-gradient-to-r from-cyan-900 to-blue-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Prayer Ministry</h3>
              <p className="text-muted-foreground mb-4">
                Focusing on the power of prayer for healing, guidance, and spiritual growth in our community.
              </p>
              {/* <button className="text-primary font-medium hover:underline" onClick={(e) => e.preventDefault()}>Learn More</button> */}
            </div>
          </div>
          
        </div>
      </section>
      
      {/* Get Involved Section */}
      <section className="py-12 px-4 bg-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Get Involved</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            We welcome all members of our community to participate in our ministries. 
            Whether you're looking to serve, learn, or grow spiritually, there's a place for you.
          </p>
          <button className="bg-primary text-primary-foreground py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors" onClick={(e) => e.preventDefault()}>
            Contact Us About Ministries
          </button>
        </div>
      </section>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
