import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            LIGHTHOUSE
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            AI-Powered GitHub Repository Analyzer
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/analysis/new">
              <Button size="lg">Start Analysis</Button>
            </Link>
            <Link href="/api/v1/health">
              <Button variant="outline" size="lg">
                API Health
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2">File Tree Analysis</h3>
            <p className="text-muted-foreground">
              Explore repository structure with detailed metrics and statistics
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">Dependency Graphs</h3>
            <p className="text-muted-foreground">
              Visualize file and function dependencies with interactive graphs
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Summaries</h3>
            <p className="text-muted-foreground">
              Get AI-generated summaries of files, functions, and classes
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-4xl mb-4">💥</div>
            <h3 className="text-xl font-semibold mb-2">Impact Analysis</h3>
            <p className="text-muted-foreground">
              Identify critical files and understand blast radius of changes
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Onboarding Guides</h3>
            <p className="text-muted-foreground">
              Auto-generated guides to help new developers understand the codebase
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
            <p className="text-muted-foreground">
              Async processing with real-time progress updates
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Sprint 1 Foundation - More features coming soon
          </p>
        </div>
      </div>
    </main>
  );
}
