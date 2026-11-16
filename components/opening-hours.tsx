"use client";

import { useState } from "react";
import { ChevronDown, Clock3 } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function OpeningHours() {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  return <div className="opening-hours" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setHovered(false); setPinned(false); } }} onKeyDown={event => { if (event.key === "Escape") { setHovered(false); setPinned(false); } }}>
    <button type="button" aria-expanded={open} aria-controls="weekly-opening-hours" onClick={() => { setPinned(!pinned); setHovered(false); }}><Clock3 size={14}/>Open Daily 8 AM–10 PM<ChevronDown size={12}/></button>
    <div id="weekly-opening-hours" className="opening-hours-panel" hidden={!open}>
      <strong>Weekly opening hours</strong>
      <dl>{days.map(day => <div key={day}><dt>{day}</dt><dd>8:00 AM – 10:00 PM</dd></div>)}</dl>
      <p>Open every day, Monday to Sunday.</p>
    </div>
  </div>;
}
