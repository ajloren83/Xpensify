"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { useRef, useState, useEffect } from "react";

interface MonthYearSelectorProps {
  currentMonth: number;
  currentYear: number;
  onChange: (month: number, year: number) => void;
}

export function MonthYearSelector({
  currentMonth,
  currentYear,
  onChange,
}: MonthYearSelectorProps) {
  const currentDate = new Date(currentYear, currentMonth, 1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleMonths, setVisibleMonths] = useState(12);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Scroll to current month on initial render and when month changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentMonthButton = scrollContainerRef.current.querySelector('[data-current="true"]');
      if (currentMonthButton) {
        // Use smooth scrolling behavior
        currentMonthButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }
  }, [currentMonth, currentYear]);
  
  const handlePreviousMonth = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const prevDate = subMonths(currentDate, 1);
    onChange(prevDate.getMonth(), prevDate.getFullYear());
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  const handleNextMonth = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const nextDate = addMonths(currentDate, 1);
    onChange(nextDate.getMonth(), nextDate.getFullYear());
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  const handleMonthClick = (month: number, year: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    console.log('Month clicked:', { month, year });
    onChange(month, year);
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Calculate how many months can fit in the container
  useEffect(() => {
    const updateVisibleMonths = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.offsetWidth;
        // Each month button is approximately 100px wide with margins
        const monthWidth = 100;
        const calculatedMonths = Math.floor(containerWidth / monthWidth);
        setVisibleMonths(Math.max(3, calculatedMonths));
      }
    };

    updateVisibleMonths();
    window.addEventListener('resize', updateVisibleMonths);
    return () => window.removeEventListener('resize', updateVisibleMonths);
  }, []);
  
  // Generate months based on visible count
  const months = Array.from({ length: visibleMonths * 2 + 1 }, (_, i) => {
    const date = subMonths(currentDate, visibleMonths - i);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      label: format(date, "MMM yyyy"),
      isCurrent: date.getMonth() === currentMonth && date.getFullYear() === currentYear,
    };
  });
  
  return (
    <div className="flex items-center w-full">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-8 w-8 flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        disabled={isAnimating}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-hidden mx-2 scroll-smooth"
      >
        {months.map((item, index) => (
          <Button
            key={`${item.year}-${item.month}`}
            variant={item.isCurrent ? "default" : "ghost"}
            size="sm"
            data-current={item.isCurrent}
            className={`mx-1 min-w-[100px] flex-shrink-0 transition-all duration-300 ${
              item.isCurrent 
                ? "bg-primary text-primary-foreground scale-105 shadow-md" 
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => handleMonthClick(item.month, item.year)}
            disabled={isAnimating}
          >
            {item.label}
          </Button>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8 flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        disabled={isAnimating}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
} 