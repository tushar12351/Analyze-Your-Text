import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2 } from "lucide-react";
import { AnalysisResults } from "./AnalysisResults";

export const TextAnalyzer = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const validTypes = ["text/plain", "application/pdf"];
    if (!validTypes.includes(uploadedFile.type)) {
      toast.error("Please upload a .txt or .pdf file");
      return;
    }

    if (uploadedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setFile(uploadedFile);
    
    if (uploadedFile.type === "text/plain") {
      const content = await uploadedFile.text();
      setText(content);
    } else {
      toast.info("PDF uploaded. Click Analyze to process.");
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !file) {
      toast.error("Please enter text or upload a file");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-text", {
        body: { text: text.trim() },
      });

      if (error) throw error;

      setResults(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze text");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Text Analysis
          </CardTitle>
          <CardDescription>
            Paste your text or upload a file to analyze for AI-generated content and plagiarism
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text Content</Label>
            <Textarea
              id="text-input"
              placeholder="Paste your text here for analysis..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Or Upload a File</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("file-upload")?.click()}
                type="button"
              >
                <Upload className="w-4 h-4 mr-2" />
                {file ? file.name : "Choose File (.txt, .pdf)"}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={loading || (!text.trim() && !file)}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Text"
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <AnalysisResults
          aiScore={results.ai_score}
          humanScore={results.human_score}
          plagiarismScore={results.plagiarism_score}
          highlightedText={results.highlighted_text}
        />
      )}
    </div>
  );
};