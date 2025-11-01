import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Copy, User } from "lucide-react";

interface AnalysisResultsProps {
  aiScore: number;
  humanScore: number;
  plagiarismScore: number;
  highlightedText?: Array<{ text: string; type: "ai" | "plagiarism" | "normal" }>;
}

export const AnalysisResults = ({ aiScore, humanScore, plagiarismScore, highlightedText }: AnalysisResultsProps) => {
  const getScoreColor = (score: number) => {
    if (score < 30) return "text-success";
    if (score < 70) return "text-warning";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score < 30) return "bg-success/10";
    if (score < 70) return "bg-warning/10";
    return "bg-destructive/10";
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Detection</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{aiScore.toFixed(1)}%</div>
            <Progress value={aiScore} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {aiScore > 70 ? "Likely AI-generated" : aiScore > 30 ? "Possibly AI-assisted" : "Likely human-written"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Score</CardTitle>
            <User className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{humanScore.toFixed(1)}%</div>
            <Progress value={humanScore} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {humanScore > 70 ? "Strong human characteristics" : humanScore > 30 ? "Mixed characteristics" : "Weak human indicators"}
            </p>
          </CardContent>
        </Card>

        <Card className={`${getScoreBg(plagiarismScore)} hover:shadow-lg transition-shadow`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plagiarism</CardTitle>
            <Copy className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-2 ${getScoreColor(plagiarismScore)}`}>
              {plagiarismScore.toFixed(1)}%
            </div>
            <Progress value={plagiarismScore} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {plagiarismScore < 10 ? "Original content" : plagiarismScore < 30 ? "Minor similarities found" : "Significant matches detected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {highlightedText && highlightedText.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Highlighted Analysis
              <div className="flex gap-2 text-xs font-normal">
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-950">AI-like</Badge>
                <Badge variant="outline" className="bg-red-100 dark:bg-red-950">Plagiarized</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-secondary/50 rounded-lg whitespace-pre-wrap leading-relaxed">
              {highlightedText.map((segment, index) => (
                <span
                  key={index}
                  className={
                    segment.type === "ai"
                      ? "bg-blue-200 dark:bg-blue-900/50 px-1 rounded"
                      : segment.type === "plagiarism"
                      ? "bg-red-200 dark:bg-red-900/50 px-1 rounded"
                      : ""
                  }
                >
                  {segment.text}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};