import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlameIcon } from "lucide-react";
import { format } from "date-fns";

interface ExpenseStreakProps {
  currentStreak: number;
  longestStreak: number;
  lastRecordedDate: string | null;
  isLoading?: boolean;
}

export function ExpenseStreak({
  currentStreak,
  longestStreak,
  lastRecordedDate,
  isLoading = false,
}: ExpenseStreakProps) {
  const formattedLastDate = lastRecordedDate
    ? format(new Date(lastRecordedDate), "MMM d, yyyy")
    : "Never";

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expense Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
            <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Expense Streak</CardTitle>
        <FlameIcon className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{currentStreak} days</div>
          <div className="text-xs text-muted-foreground">
            Longest: {longestStreak} days • Last recorded: {formattedLastDate}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 