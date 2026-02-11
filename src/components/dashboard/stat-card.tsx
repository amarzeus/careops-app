import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: "up" | "down" | "neutral";
    alert?: boolean;
}

export function StatCard({ title, value, icon: Icon, description, trend, alert }: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden transition-all hover:shadow-md", alert && "border-red-200 bg-red-50")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={cn("h-4 w-4", alert ? "text-red-500" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", alert && "text-red-700")}>{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
