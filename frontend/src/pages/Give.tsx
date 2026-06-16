import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Give() {
  const handlePaymentClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 -z-10" />

      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">Give</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Support the ministry and outreach of Church of God and Saints of Christ. Your generosity helps us continue our mission.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {/* CashApp */}
          <Card className="overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-600 to-green-500 text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-banknote">
                  <rect width="20" height="12" x="2" y="6" rx="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M6 12h.01M18 12h.01"/>
                </svg>
                Cash App
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-lg font-semibold mb-1">$HOLLYWOODTAB1</p>
              <CardDescription>
                Send your contribution through Cash App to our account.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => handlePaymentClick("https://cash.app/$HOLLYWOODTAB1")}
              >
                Open Cash App
              </Button>
            </CardFooter>
          </Card>

          {/* Zelle */}
          <Card className="overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card">
                  <rect width="20" height="14" x="2" y="5" rx="2"/>
                  <line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
                Zelle
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-lg font-semibold mb-1">David Anderson</p>
              <p className="text-lg font-semibold mb-2">(954) 829-1785</p>
              <CardDescription>
                Send directly to our account using Zelle through your banking app.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handlePaymentClick("https://www.zellepay.com/")}
              >
                Visit Zelle
              </Button>
            </CardFooter>
          </Card>

          {/* PayPal */}
          <Card className="overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paypal">
                  <path d="M7 11.5a2 2 0 0 1 2 2v-8a2 2 0 0 1 2-2h7a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2"/>
                  <path d="M3.5 11.5H6"/>
                  <path d="M6 11.5A2.5 2.5 0 0 1 8.5 9H11M7 8v2.5M13 15.5h1a2 2 0 0 0 2-2v-2.5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2"/>
                </svg>
                PayPal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-lg font-semibold mb-1">HOLLYWOODTAB</p>
              <CardDescription>
                Send your donation securely through PayPal service.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={() => handlePaymentClick("https://www.paypal.com/paypalme/HOLLYWOODTAB")}
              >
                PayPal
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg">For any questions about giving, please contact the church office.</p>
          <p className="text-muted-foreground mt-2">Thank you for your generosity and faithfulness.</p>
        </div>
      </div>
    </div>
  );
}
