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
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                        <CheckCircle2 className="w-8 h-8 mb-2 text-green-500" />
                        <p className="text-sm">All systems operational.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Executive Attention Needed
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                        <div className={`mt-0.5 w-2 h-2 rounded-full ${insight.priority === 'high' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{insight.message}</p>
                            <p className="text-xs text-muted-foreground">{insight.category}</p>
                        </div>
                        {insight.link && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(insight.link!)}>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
