type EventItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  eventType: string;
};

type Props = {
  events: EventItem[];
};

export function EventFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--color-cream)]/60">
        No public events yet.
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Journey events">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-medium text-[var(--color-cream)]">
              {event.title}
            </h3>
            <time
              className="text-xs text-[var(--color-cream)]/50"
              dateTime={event.occurredAt}
            >
              {new Date(event.occurredAt).toLocaleString()}
            </time>
          </div>
          <p className="mt-1 text-sm text-[var(--color-cream)]/70">
            {event.description}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-tan)]">
            {event.eventType.replaceAll("_", " ")}
          </p>
        </li>
      ))}
    </ol>
  );
}
