import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function About() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 -z-10" />

      <div className="container px-4 md:px-6 mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">About Us</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Learn about the Church of God and Saints of Christ, our local congregation, and our leadership.
          </p>
        </div>

        {/* Local Church History Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Our Local Church</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg mb-4">
                The Hollywood Tabernacle of the Church of God and Saints of Christ has been serving our community 
                with a commitment to biblical truth and spiritual growth. Founded on the principles of love, 
                fellowship, and authentic worship, our congregation continues to be a beacon of hope in the 
                South Florida area.
              </p>
              <p className="text-lg mb-4">
                We embrace the rich heritage of our denomination while focusing on contemporary expressions of 
                faith that speak to today's challenges. Our services combine reverent worship, biblical teaching, 
                and a warm sense of community that welcomes all visitors.
              </p>
              <p className="text-lg">
                As we grow, we remain dedicated to our founding principles while adapting to meet the changing needs 
                of our community. We invite you to join us as we worship together and serve our neighbors with the 
                love of Christ.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-800 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-center p-8 text-white">
                <p className="text-2xl font-serif italic text-center leading-relaxed">
                  "For we are laborers together with God: ye are God's husbandry, ye are God's building."
                  <span className="block mt-4 text-lg">— 1 Corinthians 3:9</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission and Values Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Our Mission & Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-bold mb-4">Mission</h3>
              <p className="text-lg">
                The Church of God and Saints of Christ exists to glorify God by making disciples who love God deeply, 
                serve others joyfully, and share Christ faithfully. We strive to be a light in our community, 
                embodying the love of Christ and proclaiming the truth of His Word.
              </p>
            </div>
            <div className="bg-card rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-bold mb-4">Core Values</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Biblical Truth:</strong> We are committed to the authority and sufficiency of Scripture.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Authentic Worship:</strong> We value sincere, Spirit-led worship that honors God.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Loving Community:</strong> We foster genuine relationships marked by love and acceptance.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Faithful Service:</strong> We serve our community as an expression of Christ's love.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Spiritual Growth:</strong> We are committed to discipleship and transformation.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Leadership Section - Three Cards */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold tracking-tight mb-12">Our Leadership</h2>
          
          {/* Local Pastor */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Our Pastor</h3>
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden hover:shadow-md transition-all">
                <div className="grid md:grid-cols-3">
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src="https://i.imgur.com/SLRlh1n.jpg"
                      alt="Evangelist David C. Anderson"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardContent className="p-6 col-span-2">
                    <h3 className="text-2xl font-bold mb-1">Evangelist David C. Anderson</h3>
                    <p className="text-primary text-lg mb-4">Pastor</p>
                    <Separator className="mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Evangelist David C. Anderson has served as the spiritual leader of our congregation with unwavering 
                      dedication and compassion. His deep knowledge of Scripture and passion for teaching have helped 
                      many in our community grow in their relationship with Christ.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      As a committed shepherd, Evangelist Anderson focuses on creating an environment where all can experience 
                      God's presence and grow in spiritual maturity. His leadership has been instrumental in the church's 
                      development and outreach initiatives.
                    </p>
                    <p className="text-muted-foreground">
                      Through his pastoral care and vision, our congregation continues to thrive as a place of worship, 
                      fellowship, and service to the community.
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Denomination Founder */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Our Founder</h3>
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden hover:shadow-md transition-all">
                <div className="grid md:grid-cols-3">
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src="https://i.imgur.com/oCLlUKy.jpg?q=80&w=500&auto=format&fit=crop"
                      alt="Prophet William Saunders Crowdy"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardContent className="p-6 col-span-2">
                    <h3 className="text-2xl font-bold mb-1">Prophet William Saunders Crowdy</h3>
                    <p className="text-primary text-lg mb-4">Founder of the Church of God and Saints of Christ</p>
                    <Separator className="mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Prophet William Saunders Crowdy (1847-1908) received divine revelation in 1892 to establish the 
                      Church of God and Saints of Christ. As a former slave and Civil War veteran, Prophet Crowdy's 
                      spiritual leadership was revolutionary during a challenging period in American history.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Under divine guidance, he established a church based on the principles of the Hebrew prophets and 
                      the teachings of Christ. His vision led to the creation of a denomination that emphasized biblical 
                      truth, justice, and community development.
                    </p>
                    <p className="text-muted-foreground">
                      The legacy of Prophet Crowdy continues to inspire our congregation as we honor his commitment to 
                      biblical teaching and community service. His prophetic leadership laid the foundation for a church 
                      that has spanned generations.
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Current CEO and Senior Bishop */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Our Leader</h3>
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden hover:shadow-md transition-all">
                <div className="grid md:grid-cols-3">
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src="https://i.imgur.com/vALu4aD.jpg?q=80&w=500&auto=format&fit=crop"
                      alt="Senior Bishop Robert D. Grant, Sr."
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardContent className="p-6 col-span-2">
                    <h3 className="text-2xl font-bold mb-1">Senior Bishop Robert D. Grant, Sr.</h3>
                    <p className="text-primary text-lg mb-4">CEO and Senior Bishop</p>
                    <Separator className="mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Senior Bishop Robert D. Grant, Sr. currently leads the Church of God and Saints of Christ as CEO 
                      and Senior Bishop. Based at the tabernacle in Cleveland, Ohio, Bishop Grant provides spiritual direction 
                      and administrative leadership for our denomination.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      With wisdom and vision, Bishop Grant has guided our church through periods of growth and transformation. 
                      His leadership emphasizes spiritual development, community service, and faithful stewardship of our 
                      prophetic heritage.
                    </p>
                    <p className="text-muted-foreground">
                      Under his guidance, the Church of God and Saints of Christ continues to impact communities across the 
                      nation through ministries that address spiritual needs and social concerns. Bishop Grant's commitment 
                      to excellence inspires our congregation to greater service.
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* What We Believe Section */}
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-6">What We Believe</h2>
          <div className="bg-card rounded-lg p-8 shadow-sm">
            <p className="text-lg mb-6">
              Our faith is centered on the teachings of the Bible as revealed through the prophets and fulfilled in Jesus Christ.
              As members of the Church of God and Saints of Christ, we hold to these core beliefs:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-3">The Bible</h3>
                <p className="text-muted-foreground mb-6">
                  We believe the Bible is the inspired, infallible Word of God, providing the final authority for faith and life.
                </p>
              
                <h3 className="text-xl font-bold mb-3">Salvation</h3>
                <p className="text-muted-foreground mb-6">
                  We believe salvation comes through faith in Jesus Christ, whose death and resurrection provides forgiveness and eternal life.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">The Church</h3>
                <p className="text-muted-foreground mb-6">
                  We believe the church is the body of Christ, called to worship, fellowship, discipleship, ministry, and evangelism.
                </p>
              
                <h3 className="text-xl font-bold mb-3">Holy Living</h3>
                <p className="text-muted-foreground">
                  We believe in living according to biblical principles, reflecting Christ's character in our daily lives through the power of the Holy Spirit.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
