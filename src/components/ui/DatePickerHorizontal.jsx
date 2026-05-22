import React, { useRef, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay, isBefore, startOfDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DatePickerHorizontal - Professional Horizontal Date Scroller
 * 
 * Features:
 * - Horizontal scrolling layout (Netflix-style for dates)
 * - Two-row display: Day Name (Mon) / Day Number (12)
 * - Range selection visualization
 * - Auto-scroll to selected date
 * - Touch-friendly drag interactions
 */
const DatePickerHorizontal = ({ 
  selected, 
  onSelect, 
  minDate = new Date(), 
  maxDate = addDays(new Date(), 365), 
  className,
  rangeStart = null,
  rangeEnd = null,
  isRangeEnd = false // If true, highlights the range from rangeStart to this date
}) => {
  const scrollRef = useRef(null);
  
  // Generate array of dates using useMemo to avoid regeneration on every render
  // Note: If minDate/maxDate are new objects on every render, this will still regenerate, 
  // but it ensures hook stability.
  const days = useMemo(() => {
    const dates = [];
    let iterDate = startOfDay(minDate);
    const lastDate = startOfDay(maxDate);

    while (iterDate <= lastDate) {
      dates.push(new Date(iterDate));
      iterDate = addDays(iterDate, 1);
    }
    return dates;
  }, [minDate, maxDate]);

  // Auto-scroll to selected date on mount/change
  useEffect(() => {
    if (selected && scrollRef.current) {
      const selectedIndex = days.findIndex(d => isSameDay(d, selected));
      if (selectedIndex !== -1) {
        // Calculate position to center the selected element
        const itemWidth = 64; // Approx width of item + gap
        const containerWidth = scrollRef.current.clientWidth;
        const scrollPos = (selectedIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
        
        scrollRef.current.scrollTo({
          left: Math.max(0, scrollPos),
          behavior: 'smooth'
        });
      }
    }
  }, [selected, days]); 

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const isDateDisabled = (date) => {
    return isBefore(date, startOfDay(minDate)) || (rangeStart && isRangeEnd && isBefore(date, rangeStart));
  };

  const isDateInRange = (date) => {
    if (!rangeStart || !selected) return false;
    // If we are selecting the end date, range is start -> selected(hover/current)
    if (isRangeEnd) {
      return isAfter(date, rangeStart) && isBefore(date, selected);
    }
    return false;
  };

  return (
    <div className={cn("relative group w-full", className)}>
      {/* Navigation Buttons (visible on desktop hover) */}
      <button 
        onClick={() => handleScroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md border rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 -ml-3 hidden md:block"
        type="button"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <button 
        onClick={() => handleScroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md border rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 -mr-3 hidden md:block"
        type="button"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>

      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-2 pb-2 pt-1 px-1 snap-x hide-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((date) => {
          const isSelected = selected && isSameDay(date, selected);
          const isDisabled = isDateDisabled(date);
          const inRange = isDateInRange(date);
          const isStart = rangeStart && isSameDay(date, rangeStart);
          
          return (
            <motion.button
              key={date.toISOString()}
              whileTap={{ scale: 0.95 }}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(date)}
              type="button"
              className={cn(
                "flex flex-col items-center justify-center min-w-[4rem] h-16 rounded-xl border transition-all snap-start",
                "hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200",
                isSelected 
                  ? "bg-blue-900 text-white border-blue-900 shadow-lg scale-105 z-10" 
                  : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50",
                inRange && !isSelected && "bg-blue-50 border-blue-100 text-blue-700",
                isStart && !isRangeEnd && "bg-blue-100 border-blue-300 text-blue-900", // Visual marker for start date when picking end date
                isDisabled && "opacity-30 cursor-not-allowed bg-gray-50"
              )}
            >
              <span className={cn(
                "text-xs font-medium uppercase mb-0.5", 
                isSelected ? "text-blue-200" : "text-gray-400"
              )}>
                {format(date, 'EEE', { locale: es })}
              </span>
              <span className={cn(
                "text-xl font-bold leading-none",
                isSelected ? "text-white" : "text-gray-900"
              )}>
                {format(date, 'd')}
              </span>
              {isSelected && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="w-1 h-1 bg-white rounded-full mt-1" 
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DatePickerHorizontal;