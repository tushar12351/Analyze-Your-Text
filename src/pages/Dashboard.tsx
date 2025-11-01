import { Header } from "@/components/Header";
import { TextAnalyzer } from "@/components/TextAnalyzer";
import { AnalysisHistory } from "@/components/AnalysisHistory";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2 animate-in fade-in-50 duration-500">
            <h2 className="text-3xl md:text-4xl font-bold">
              Analyze Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Text</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Detect AI-generated content and check for plagiarism with advanced analysis and detailed reports
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TextAnalyzer />
            </div>
            <div className="lg:col-span-1">
              <AnalysisHistory />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;