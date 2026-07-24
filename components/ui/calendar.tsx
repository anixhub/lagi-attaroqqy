"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface CalendarProps {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  className?: string;
  mode?: string; // accepted for signature compatibility
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    return selected?.from ? new Date(selected.from.getFullYear(), selected.from.getMonth(), 1) : new Date();
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Indonesian Months
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    // 1. Maksimal hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return true;

    // 2. Maksimal 30 hari rentang
    if (selected?.from) {
      const fromMidnight = new Date(selected.from);
      fromMidnight.setHours(0, 0, 0, 0);

      const isSameDay = (d1: Date, d2: Date) => {
        return d1.getTime() === d2.getTime();
      };

      const hasRange = selected.to && !isSameDay(fromMidnight, new Date(selected.to));

      if (!hasRange) {
        const diffTime = Math.abs(date.getTime() - fromMidnight.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 30) return true;
      } else {
        const toMidnight = new Date(selected.to!);
        toMidnight.setHours(0, 0, 0, 0);

        if (isSameDay(fromMidnight, date) || isSameDay(toMidnight, date)) {
          return false;
        }

        if (date < fromMidnight) {
          const diffTime = Math.abs(toMidnight.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) return true;
        } else {
          const diffTime = Math.abs(date.getTime() - fromMidnight.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) return true;
        }
      }
    }

    return false;
  };

  const handleDayClick = (day: number) => {
    if (isDateDisabled(day)) return;
    
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0);

    const isSameDay = (d1: Date, d2: Date) => {
      const t1 = new Date(d1);
      t1.setHours(0,0,0,0);
      const t2 = new Date(d2);
      t2.setHours(0,0,0,0);
      return t1.getTime() === t2.getTime();
    };

    if (!selected || !selected.from) {
      // Rule 1: jika user hanya klik satu titik tanggal maka itu artinya titik awal dan akhirnya tanggal itu
      onSelect({ from: clickedDate, to: clickedDate });
      return;
    }

    const fromDate = new Date(selected.from);
    fromDate.setHours(0, 0, 0, 0);

    const hasRange = selected.to && !isSameDay(fromDate, new Date(selected.to));

    if (!hasRange) {
      if (isSameDay(fromDate, clickedDate)) {
        onSelect({ from: clickedDate, to: clickedDate });
      } else if (clickedDate < fromDate) {
        onSelect({ from: clickedDate, to: fromDate });
      } else {
        onSelect({ from: fromDate, to: clickedDate });
      }
    } else {
      const toDate = new Date(selected.to!);
      toDate.setHours(0, 0, 0, 0);

      // Rule 2: jika sudah ada dua titik di klik maka ketika klik salah satu titik itu maka membatalkan titik yang lain
      if (isSameDay(fromDate, clickedDate)) {
        onSelect({ from: fromDate, to: fromDate });
      } else if (isSameDay(toDate, clickedDate)) {
        onSelect({ from: toDate, to: toDate });
      } else {
        // Rule 3: jika klik tanggal 2 dan tanggal 7 misalnya lalu klik tanggal 1 atau sebelumnya maka titik awalnya menjadi tanggal 1 atau sebelumnya.
        // tapi jika klik tanggal 3 keatas maka titik akhirnya yang berpindah.
        if (clickedDate < fromDate) {
          onSelect({ from: clickedDate, to: toDate });
        } else {
          onSelect({ from: fromDate, to: clickedDate });
        }
      }
    }
  };

  // Helper to check if a date is selected/in range
  const isSelected = (day: number) => {
    if (!selected?.from) return false;
    const date = new Date(year, month, day);
    
    if (selected.to) {
      return date >= selected.from && date <= selected.to;
    }
    
    return date.toDateString() === selected.from.toDateString();
  };

  const isStart = (day: number) => {
    if (!selected?.from) return false;
    const date = new Date(year, month, day);
    return date.toDateString() === selected.from.toDateString();
  };

  const isEnd = (day: number) => {
    if (!selected?.to) return false;
    const date = new Date(year, month, day);
    return date.toDateString() === selected.to.toDateString();
  };

  const isToday = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Render month days
  const days = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const isSel = isSelected(d);
    const isS = isStart(d);
    const isE = isEnd(d);
    const isT = isToday(d);
    const isDisabled = isDateDisabled(d);

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => handleDayClick(d)}
        className={cn(
          "h-8 w-8 text-xs font-semibold rounded-lg transition-colors relative flex items-center justify-center cursor-pointer pb-1",
          isSel && "bg-emerald-50 text-emerald-950",
          (isS || isE) && "bg-emerald-600 text-white font-bold hover:bg-emerald-700",
          !isSel && !isS && !isE && "hover:bg-slate-100 text-slate-700",
          isT && !isS && !isE && "border border-emerald-500 text-emerald-700",
          isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent text-slate-300 select-none pointer-events-none"
        )}
      >
        <span>{d}</span>
        {isT && (
          <span
            className={cn(
              "absolute bottom-1 w-1 h-1 rounded-full",
              isS || isE ? "bg-white" : "bg-emerald-600"
            )}
          />
        )}
      </button>
    );
  }

  return (
    <div className={cn("p-2 w-64 bg-white", className)}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-slate-800">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {dayNames.map((name) => (
          <div key={name} className="text-[10px] font-bold text-slate-400">
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";
