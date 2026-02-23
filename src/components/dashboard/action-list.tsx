import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Insight {
  priority: "high" | "medium" | "low";
  category: string;
  message: string;
  action?: string;
  link?: string;
}

interface ActionListProps {
  insights: Insight[];
}

/**
 *
 * @param root0
 * @param root0.insights
 */
export function ActionList({ insights }: ActionListProps) {
  const router = useRouter();

  if (!insights.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Executive Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm">All systems operational.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="text-primary h-5 w-5" />
          Executive Attention Needed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="bg-card hover:bg-accent flex items-start gap-3 rounded-lg border p-3 transition-colors"
          >
            <div
              className={`mt-0.5 h-2 w-2 rounded-full ${insight.priority === "high" ? "animate-pulse bg-red-500" : "bg-yellow-500"}`}
            />
            <div className="flex-1 space-y-1">
              <p className="text-sm leading-none font-medium">{insight.message}</p>
              <p className="text-muted-foreground text-xs">{insight.category}</p>
            </div>
            {insight.link && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push(insight.link!)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
