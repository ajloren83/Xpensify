import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthSelectorProps {
  onMonthChange: (startDate: Date, endDate: Date) => void;
  initialMonth?: Date;
}

export function MonthSelector({ onMonthChange, initialMonth = new Date() }: MonthSelectorProps) {
  const [currentDate, setCurrentDate] = useState(initialMonth);
  const [months, setMonths] = useState<Date[]>([]);

  useEffect(() => {
    // Generate 12 months before and after the current month
    const generateMonths = () => {
      const result: Date[] = [];
      for (let i = -12; i <= 12; i++) {
        result.push(addMonths(currentDate, i));
      }
      return result;
    };

    setMonths(generateMonths());
  }, [currentDate]);

  const handleMonthClick = (date: Date) => {
    setCurrentDate(date);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);
    onMonthChange(startDate, endDate);
  };

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    const startDate = startOfMonth(newDate);
    const endDate = endOfMonth(newDate);
    onMonthChange(startDate, endDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    const startDate = startOfMonth(newDate);
    const endDate = endOfMonth(newDate);
    onMonthChange(startDate, endDate);
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex overflow-x-auto py-2 px-1 space-x-2 scrollbar-hide">
        {months.map((date, index) => (
          <Button
            key={index}
            variant={
              format(date, "yyyy-MM") === format(currentDate, "yyyy-MM")
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => handleMonthClick(date)}
            className="whitespace-nowrap"
          >
            {format(date, "MMM yyyy")}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 