import React, { useRef, useEffect, useState } from 'react';
import { format, addDays, isSameDay, isBefore, startOfDay, isAfter, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, setMonth, setYear, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * DatePickerUniversal - Dynamic Horizontal Date Picker for All Properties
 * 
 * 1) Dynamic Context: Adapts to provided dates.
 * 2) Month Selector: Dropdown to jump between months efficiently.
 * 3) Horizontal Scroll: Netflix-style day scrolling.
 * 4) Validation: Handles min/max dates and disabled ranges.
 * 5) Visual Feedback: Clear selection states.
 */
const DatePickerUniversal = ({ 
  selected, 
  onSelect, 
  minDate = new Date(), 
  maxDate = addDays(new Date(), 365), 
  className,
  rangeStart = null,
  rangeEnd = null,
  isRangeEnd = false,
  ratesMetadata = null // Optional: Pass rates data to disable days without price if needed
}) => {
  const scrollRef = useRef(null);
  
  // State for the currently viewed month in the scroller
  // Initialize view based on selected date or minDate
  const [viewDate, setViewDate] = useState(selected || minDate);
  
  // Generate months for the dropdown (next 12 months)
  const availableMonths = [];
  let iterMonth = startOfMonth(minDate);
  const lastMonth = startOfMonth(maxDate);
  
  while (iterMonth <= lastMonth) {
    availableMonths.push(new Date(iterMonth));
    iterMonth = addMonths(iterMonth, 1);
  }

  // Generate days for the current view (buffer of prev/current/next month for smooth scrolling)
  // We'll generate a sliding window or just the selected month + buffer? 
  // Let's generate a generous buffer around the viewDate to allow scrolling.
  // Actually, for a robust horizontal scroller, let's render the specific month selected + next month
  // to keep DOM size manageable, OR render a large virtual list.
  // Given constraints, let's render current view month + next 2 months.
  
  const daysStart = startOfMonth(viewDate);
  const daysEnd = endOfMonth(addMonths(viewDate, 1)); // Show 2 months at a time
  
  const days = eachDayOfInterval({ start: daysStart, end: daysEnd });

  // Update view when selected date changes externally
  useEffect(() => {
    if (selected) {
      // Check if selected is outside current view, if so, update view
      if (isBefore(selected, daysStart) || isAfter(selected, daysEnd)) {
         setViewDate(startOfMonth(selected));
      }
    }
  }, [selected]);

  // Auto-scroll to selected date
  useEffect(() => {
    if (selected && scrollRef.current) {
      const selectedIndex = days.findIndex(d => isSameDay(d, selected));
      if (selectedIndex !== -1) {
        const itemWidth = 64; 
        const containerWidth = scrollRef.current.clientWidth;
        const scrollPos = (selectedIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
        
        scrollRef.current.scrollTo({
          left: Math.max(0, scrollPos),
          behavior: 'smooth'
        });
      }
    }
  }, [selected, viewDate]); // Re-run when view changes (days array regenerated)

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
    // Basic min/max checks
    if (isBefore(date, startOfDay(minDate))) return true;
    if (isAfter(date, startOfDay(maxDate))) return true;
    
    // Range logic: if picking end date, must be after start date
    if (rangeStart && isRangeEnd && !isAfter(date, rangeStart)) return true;

    // Rates logic: if rates provided, check if date has rate
    // (This would require ratesMetadata to be a map or set of available dates)
    // Placeholder for future rates integration:
    // if (ratesMetadata && !ratesMetadata.has(date.toISOString().split('T')[0])) return true;

    return false;
  };

  const isDateInRange = (date) => {
    if (!rangeStart || !selected) return false;
    if (isRangeEnd) {
      return isAfter(date, rangeStart) && isBefore(date, selected);
    }
    return false;
  };

  const handleMonthChange = (value) => {
     // Value is timestamp string
     const newMonth = new Date(parseInt(value));
     setViewDate(newMonth);
     // If we switch months, we might want to reset scroll to 0
     if(scrollRef.current) scrollRef.current.scrollTo({ left: 0, behavior: 'instant'});
  };

  return (
    <div className={cn("relative w-full space-y-3", className)}>
      {/* Month Selector Dropdown */}
      <div className="flex items-center justify-between px-1">
        <Select 
            value={startOfMonth(viewDate).getTime().toString()} 
            onValueChange={handleMonthChange}
        >
            <SelectTrigger className="w-[180px] h-8 text-sm font-medium bg-white border-gray-200">
                <CalendarIcon className="w-3 h-3 mr-2 text-gray-500" />
                <SelectValue>{format(viewDate, 'MMMM yyyy', { locale: es })}</SelectValue>
            </SelectTrigger>
            <SelectContent>
                {availableMonths.map((m) => (
                    <SelectItem key={m.getTime()} value={m.getTime().toString()}>
                        {format(m, 'MMMM yyyy', { locale: es })}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        
        {/* Navigation Arrows (Visual Helper) */}
        <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleScroll('left')}>
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleScroll('right')}>
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
      </div>

      {/* Scroller Container */}
      <div className="relative group">
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
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[3.5rem] md:min-w-[4rem] h-16 rounded-xl border transition-all snap-start select-none",
                    "hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200",
                    isSelected 
                      ? "bg-blue-900 text-white border-blue-900 shadow-lg scale-105 z-10" 
                      : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50",
                    inRange && !isSelected && "bg-blue-50 border-blue-100 text-blue-700",
                    isStart && !isRangeEnd && "bg-blue-100 border-blue-300 text-blue-900", 
                    isDisabled && "opacity-30 cursor-not-allowed bg-gray-50 grayscale"
                  )}
                >
                  <span className={cn(
                    "text-[0.65rem] font-medium uppercase mb-0.5", 
                    isSelected ? "text-blue-200" : "text-gray-400"
                  )}>
                    {format(date, 'EEE', { locale: es })}
                  </span>
                  <span className={cn(
                    "text-lg md:text-xl font-bold leading-none",
                    isSelected ? "text-white" : "text-gray-900"
                  )}>
                    {format(date, 'd')}
                  </span>
                  {isSelected && (
                    <motion.div 
                      layoutId="activeIndicatorUniversal"
                      className="w-1 h-1 bg-white rounded-full mt-1" 
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
      </div>
    </div>
  );
};

export default DatePickerUniversal;