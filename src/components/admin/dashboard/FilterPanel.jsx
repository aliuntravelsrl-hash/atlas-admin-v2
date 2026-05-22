import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const FilterPanel = ({ dateRange, setDateRange, onApply }) => {
  return (
    <div className="flex items-center gap-2 mb-4">
       <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd", { locale: es })} -{" "}
                  {format(dateRange.to, "LLL dd", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "LLL dd", { locale: es })
              )
            ) : (
              <span>Filtrar por Fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      
      <Button variant="secondary" onClick={onApply}>
        <Filter className="w-4 h-4 mr-2" />
        Aplicar Filtros
      </Button>
    </div>
  );
};

export default FilterPanel;