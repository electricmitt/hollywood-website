import { useNavigate } from "react-router-dom";
import { Navigation } from "components/Navigation";
import { Footer } from "components/Footer";
import { Button } from "@/components/ui/button";

export default function WordOfGodMinistry() {
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
        <h1 className="text-4xl font-bold tracking-tight mb-6 text-center">
          Word Of God Ministry
        </h1>
        
        {/* Ministers Section */}
        <section className="my-12">
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Meet Our Ministers</h2>
          <div className="flex flex-col items-center space-y-10">
            {/* Row 1: Lead Minister */}
            <div className="flex justify-center w-full">
              {/* Lead Minister Card */}
              <div className="w-[48rem] max-w-full bg-card rounded-2xl shadow-2xl p-12 text-center">
                <div className="w-[32rem] h-[32rem] max-w-full bg-muted rounded-lg mx-auto mb-8 flex items-center justify-center overflow-hidden">
                  <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/33f919a3-fa8b-4872-a0e1-674427338257.JPG" alt="Lead Minister" className="w-full h-full object-cover"/>
                </div>
                <h3 className="text-5xl font-bold">David Anderson</h3>
                <p className="text-3xl text-muted-foreground mt-2">Evangelist, Pastor</p>
                <p className="text-xl mt-6">
                  A flame of fire, shepherding the flock in Hollywood, FL since 2010.
                </p>
              </div>
            </div>
            
            {/* Row 2: Sub-Lead Ministers */}
            <div className="flex flex-wrap justify-center items-start gap-10 w-full">
              {/* Sub-Lead Minister Card 1 */}
              <div className="w-[28rem] bg-card rounded-xl shadow-xl p-8 text-center">
                <div className="w-72 h-72 bg-muted rounded-md mx-auto mb-6 flex items-center justify-center overflow-hidden">
                  <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/prophet.png" alt="Sub-Lead Minister 1" className="w-full h-full object-cover"/>
                </div>
                <h3 className="text-3xl font-bold">William Saunders Crowdy</h3>
                <p className="text-xl text-muted-foreground mt-1">Bishop, Prophet of God</p>
                <p className="text-lg mt-4">Our re-establisher.</p>
              </div>
              {/* Sub-Lead Minister Card 2 */}
              <div className="w-[28rem] bg-card rounded-xl shadow-xl p-8 text-center">
                <div className="w-72 h-72 bg-muted rounded-md mx-auto mb-6 flex items-center justify-center overflow-hidden">
                  <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/brd2.png" alt="Sub-Lead Minister 2" className="w-full h-full object-cover"/>
                </div>
                <h3 className="text-3xl font-bold">Robert Dennis Grant, Sr.</h3>
                <p className="text-xl text-muted-foreground mt-1">Senior Bisop, CEO</p>
                <p className="text-lg mt-4">Leading Israel on, everywhere, since 2000.</p>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex flex-wrap justify-center items-start gap-10 w-full">
                {/* Standard Minister Card 1 */}
                <div className="w-80 bg-card rounded-lg shadow-lg p-5 text-center">
                  <div className="w-64 h-64 bg-muted rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/eld smith.png" alt="Standard Minister 1" className="w-full h-full object-cover"/>
                  </div>
                  <h3 className="text-xl font-semibold">Carlington Smith</h3>
                  <p className="text-muted-foreground">Elder</p>
                  <p className="text-sm mt-2">Diesel fuels his engine.</p>
                </div>
                {/* Standard Minister Card 2 */}
                <div className="w-80 bg-card rounded-lg shadow-lg p-5 text-center">
                  <div className="w-64 h-64 bg-muted rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/98eb378c-4f90-4a33-9dc0-66ae2d57ba3d.JPG" alt="Standard Minister 2" className="w-full h-full object-cover"/>
                  </div>
                  <h3 className="text-xl font-semibold">Adrian Reynolds, Ph.D</h3>
                  <p className="text-muted-foreground">Elder</p>
                  <p className="text-sm mt-2">Life-long learner and visionary.</p>
                </div>
            </div>
            
            {/* Row 4 */}
            <div className="flex flex-wrap justify-center items-start gap-10 w-full">
                {/* Standard Minister Card 3 */}
                <div className="w-80 bg-card rounded-lg shadow-lg p-5 text-center">
                  <div className="w-64 h-64 bg-muted rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/ff551bed-8ef1-428e-a0fc-4a2110742abe.JPG" alt="Standard Minister 3" className="w-full h-full object-cover"/>
                  </div>
                  <h3 className="text-xl font-semibold">Jonathan Daley</h3>
                  <p className="text-muted-foreground">Deacon</p>
                  <p className="text-sm mt-2">Hard-working, music loving - family man.</p>
                </div>
                {/* Standard Minister Card 4 */}
                <div className="w-80 bg-card rounded-lg shadow-lg p-5 text-center">
                  <div className="w-64 h-64 bg-muted rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/deac%20all.png" alt="Standard Minister 4" className="w-full h-full object-cover"/>
                  </div>
                  <h3 className="text-xl font-semibold">Matthew Allen</h3>
                  <p className="text-muted-foreground">Deacon</p>
                  <p className="text-sm mt-2">Working for the Master.</p>
                </div>
            </div>
            
            {/* Row 5 */}
            <div className="flex justify-center w-full">
              {/* Standard Minister Card 5 */}
              <div className="w-80 bg-card rounded-lg shadow-lg p-5 text-center">
                <div className="w-64 h-64 bg-muted rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/sis%20evng.png" alt="Standard Minister 5" className="w-full h-full object-cover"/>
                </div>
                <h3 className="text-xl font-semibold">Hannah Lewis</h3>
                <p className="text-muted-foreground">Evangelist, United States Exhorting Daughter</p>
                <p className="text-sm mt-2">The word of God is her food.</p>
              </div>
            </div>
            
            {/* Row 6 */}
            <div className="flex flex-wrap justify-center items-start gap-10 w-full">
              {/* Standard Minister Card 6 */}
              <div className="w-80 bg-card rounded-lg shadow-lg p-5 text-center">
                <div className="w-64 h-64 bg-muted rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/sis%20elder%20williams.png" alt="Standard Minister 6" className="w-full h-full object-cover"/>
                </div>
                <h3 className="text-xl font-semibold">Myrna Williams</h3>
                <p className="text-muted-foreground">Sister Elder</p>
                <p className="text-sm mt-2">Kindness is her rainment.</p>
              </div>
              {/* Standard Minister Card 7 */}
              <div className="w-80 bg-card rounded-lg shadow-lg p-5 text-center">
                <div className="w-64 h-64 bg-muted rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  <img src="https://static.riff.new/public/8424000e-6d00-4f20-8818-b4c7e5723a3a/sis%20eld%20aud.png" alt="Standard Minister 7" className="w-full h-full object-cover"/>
                </div>
                <h3 className="text-xl font-semibold">Audrey Stewart</h3>
                <p className="text-muted-foreground">Sister Elder</p>
                <p className="text-sm mt-2">A mother of many.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
