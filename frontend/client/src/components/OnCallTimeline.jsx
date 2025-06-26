import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { onCallApi } from "../services/api";
import { useAuth } from "../context/AuthContext"; // For role checking
import toast from "react-hot-toast";

const teamColors = {
  blue: "#3B82F6",
  green: "#10B981",
  purple: "#8B5CF6",
  pink: "#EC4899",
  yellow: "#F59E0B",
  red: "#EF4444",
};

const colorClasses = Object.keys(teamColors);

function OnCallTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await onCallApi.get("/oncall-schedules");
      const schedules = res.data;
      let colorIndex = 0;
      const colorMap = {};

      const allEvents = schedules.flatMap((schedule) => {
        if (!colorMap[schedule.team]) {
          colorMap[schedule.team] = colorClasses[colorIndex % colorClasses.length];
          colorIndex++;
        }

        const colorHex = teamColors[colorMap[schedule.team]];

        return schedule.users.map((u) => ({
          id: u._id,
          title: `${u.userId?.name || u.userId?.email} (${schedule.team})`,
          start: u.startDate,
          end: u.endDate,
          allDay: true,
          backgroundColor: colorHex,
          borderColor: colorHex,
          extendedProps: {
            user: u.userId?.name || u.userId?.email,
            team: schedule.team,
            start: u.startDate,
            end: u.endDate,
            scheduleId: schedule._id,
          },
        }));
      });

      setEvents(allEvents);
    } catch (err) {
      console.error("Error fetching schedules", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps);
  };

  const handleEventDrop = async (info) => {
    if (!isAdmin) {
      toast.error("Only admins can move events.");
      info.revert();
      return;
    }

    const event = info.event;
    const { scheduleId } = event.extendedProps;

    try {
      await onCallApi.put(`/oncall-schedules/${scheduleId}/update-user-date`, {
        userId: event.id,
        startDate: event.start,
        endDate: event.end,
      });
      toast.success("Schedule updated.");
    } catch (err) {
      toast.error("Failed to update. Reverting.");
      console.error(err);
      info.revert();
    }
  };

  return (
    <div className="p-6 dark:text-white min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          🗓️ On-Call Calendar View
        </h2>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-center py-20 animate-pulse">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                Loading calendar...
              </p>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              editable={isAdmin}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              height="auto"
            />
          )}
        </div>

        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[90%] max-w-md shadow-lg">
              <h3 className="text-xl font-bold mb-2">
                👤 {selectedEvent.user}
              </h3>
              <p className="mb-1">
                <strong>Team:</strong> {selectedEvent.team}
              </p>
              <p className="mb-1">
                <strong>Start:</strong>{" "}
                {new Date(selectedEvent.start).toLocaleString()}
              </p>
              <p className="mb-4">
                <strong>End:</strong>{" "}
                {new Date(selectedEvent.end).toLocaleString()}
              </p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnCallTimeline;
