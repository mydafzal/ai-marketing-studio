import React from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  headline: string;
  description: string;
  category?: string;
  importance?: 'high' | 'medium' | 'low';
}

interface EventCardProps extends Event {
  isFirst?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  headline,
  description,
  category,
  importance,
  isFirst
}) => {
  const importanceConfig = {
    high: {
      containerClass: 'bg-red-500/10 dark:bg-red-950/50 border-red-500/20 dark:border-red-900/50',
      iconClass: 'text-red-500 dark:text-red-400',
      textClass: 'text-red-900 dark:text-red-300',
      categoryClass: 'bg-red-500/10 text-red-700 dark:text-red-400',
      Icon: AlertTriangle
    },
    medium: {
      containerClass: 'bg-yellow-500/10 dark:bg-yellow-950/50 border-yellow-500/20 dark:border-yellow-900/50',
      iconClass: 'text-yellow-500 dark:text-yellow-400',
      textClass: 'text-yellow-900 dark:text-yellow-300',
      categoryClass: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      Icon: Bell
    },
    low: {
      containerClass: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700',
      iconClass: 'text-zinc-500 dark:text-zinc-400',
      textClass: 'text-zinc-900 dark:text-zinc-300',
      categoryClass: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
      Icon: Info
    }
  };

  const config = importanceConfig[importance || 'low'];
  const { Icon } = config;

  return (
    <div 
      className={cn(
        "relative flex flex-col gap-4 rounded-xl border p-6 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        config.containerClass,
        isFirst && "animate-fadeIn"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("shrink-0 p-2 rounded-full bg-white/80 dark:bg-zinc-900/80", "shadow-sm")}>
          <Icon className={cn("size-5", config.iconClass)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h3 className={cn(
              "font-semibold text-lg leading-tight",
              config.textClass
            )}>
              {headline}
            </h3>
            
            {category && (
              <span className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                config.categoryClass
              )}>
                {category}
              </span>
            )}
          </div>
          
          <p className={cn(
            "mt-2 text-sm line-clamp-3",
            "text-zinc-600 dark:text-zinc-400"
          )}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export function Events({ props: events }: { props: Event[] }) {
  return (
    <div className="space-y-4 w-full py-4">
      {events.map((event, index) => (
        <EventCard
          key={event.headline}
          {...event}
          isFirst={index === 0}
        />
      ))}
    </div>
  );
}

// Add this to your globals.css
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
`;