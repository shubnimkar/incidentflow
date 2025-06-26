// src/components/OnCallCalendar.jsx
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { onCallApi } from "../services/api";

function OnCallCalendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await onCallApi.get("/oncall-schedules");
        const schedules = res.data;

        const allEvents = [];

        schedules.forEach((schedule) => {
          schedule.users.forEach((entry) => {
            const user = entry.userId;
            allEvents.push({
              title: `${user.name} (${schedule.team})`,
              start: entry.startDate,
              end: entry.endDate,
              backgroundColor: "#3b82f6",
              borderColor: "#2563eb",
              textColor: "white",
            });
          });
        });

        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to load calendar events", err);
      }
    };

    load();
  }, []);

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      <h2 className="text-xl font-bold mb-4">📆 On-Call Calendar View</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        height="auto"
      />
    </div>
  );
}

export default OnCallCalendar;
