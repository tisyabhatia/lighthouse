import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function NewAnalysisPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Analysis</CardTitle>
            <CardDescription>
              Submit a GitHub repository for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Analysis form will be implemented in Sprint 2
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
