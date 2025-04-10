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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [visibleMonths, setVisibleMonths] = useState(12);
  
  // Scroll to current month on initial render
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentMonthButton = scrollContainerRef.current.querySelector('[data-current="true"]');
      if (currentMonthButton) {
        currentMonthButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, []);
  
  const handlePreviousMonth = () => {
    const prevDate = subMonths(currentDate, 1);
    onChange(prevDate.getMonth(), prevDate.getFullYear());
  };
  
  const handleNextMonth = () => {
    const nextDate = addMonths(currentDate, 1);
    onChange(nextDate.getMonth(), nextDate.getFullYear());
  };
  
  const handleMonthClick = (month: number, year: number) => {
    onChange(month, year);
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

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (scrollContainerRef.current) {
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (scrollContainerRef.current) {
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  return (
    <div className="flex items-center w-full">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-8 w-8 flex-shrink-0"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-hidden cursor-grab active:cursor-grabbing mx-2"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {months.map((item, index) => (
          <Button
            key={`${item.year}-${item.month}`}
            variant={item.isCurrent ? "default" : "ghost"}
            size="sm"
            data-current={item.isCurrent}
            className={`mx-1 min-w-[100px] flex-shrink-0 ${
              item.isCurrent ? "bg-primary text-primary-foreground" : ""
            }`}
            onClick={() => handleMonthClick(item.month, item.year)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8 flex-shrink-0"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
} 