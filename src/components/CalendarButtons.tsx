import {track} from '@/lib/analytics';
import { CalendarPlus } from "lucide-react";
import { buildIcs, googleCalendarUrl, office365CalendarUrl, roomLine, resolveRoom, type Session } from "@/lib/event";
import { useI18n } from "@/lib/i18n";

export function CalendarButtons({ session, date }: { session: Session; date: string }) {
  const { t } = useI18n();
  const { floor } = resolveRoom(session);
  const roomText = roomLine(session, t("cal.room"), floor ? t(`floor.${floor}`) : null);

  const downloadIcs = () => {
    track('calendar_add_clicked', { session_id: session.id, provider: 'ics' });
    const blob = new Blob([buildIcs(session, date, roomText)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genai-days-${session.id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const linkClass =
    "flex items-center justify-center rounded-full border-2 border-primary px-3 py-2 text-sm font-semibold";

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={downloadIcs}
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <CalendarPlus className="size-4" /> {t("cal.add")}
      </button>
      <a onClick={() => track('calendar_add_clicked', { session_id: session.id, provider: 'google' })} href={googleCalendarUrl(session, date, roomText)} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t("cal.google")}
      </a>
      <a
        onClick={() => track('calendar_add_clicked', { session_id: session.id, provider: 'office365' })}
        href={office365CalendarUrl(session, date, roomText)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkClass} col-span-2`}
      >
        {t("cal.office")}
      </a>
    </div>
  );
}
