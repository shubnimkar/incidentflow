import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { onCallApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const teamColors = {
  blue: "#3B82F6",
  green: "#10B981",
  purple: "#8B5CF6",
  pink: "#EC4899",
  yellow: "#F59E0B",
  red: "#EF4444",
};

const colorNames = Object.keys(teamColors);

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function OnCallTimeline() {
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [visibleTeams, setVisibleTeams] = useState(new Set());

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
      const teamSet = new Set();

      const all = schedules.flatMap((schedule) => {
        teamSet.add(schedule.team);
        if (!colorMap[schedule.team]) {
          colorMap[schedule.team] = colorNames[colorIndex % colorNames.length];
          colorIndex++;
        }
        const colorHex = teamColors[colorMap[schedule.team]] || stringToColor(schedule.team);

        return schedule.users.map((u) => ({
          id: u._id,
          title: `${u.userId?.name || u.userId?.email} (${schedule.team})`,
          start: u.startDate,
          end: u.endDate,
          allDay: true,
          backgroundColor: colorHex,
          borderColor: colorHex,
          textColor: "#fff",
          classNames: ["hoverable-event"],
          extendedProps: {
            user: u.userId?.name || u.userId?.email,
            email: u.userId?.email,
            team: schedule.team,
            contact: u.userId?.phone || "Not Available",
            start: u.startDate,
            end: u.endDate,
            scheduleId: schedule._id,
            color: colorHex,
            initials: getInitials(u.userId?.name || u.userId?.email),
          },
        }));
      });

      setAllEvents(all);
      setEvents(all); // initially show all
      setTeams([...teamSet]);
      setVisibleTeams(new Set(teamSet));
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

  const toggleTeam = (team) => {
    const updated = new Set(visibleTeams);
    if (visibleTeams.has(team)) {
      updated.delete(team);
    } else {
      updated.add(team);
    }
    setVisibleTeams(updated);
    const filtered = allEvents.filter((e) => updated.has(e.extendedProps.team));
    setEvents(filtered);
  };

  // Custom event content
  function renderEventContent(eventInfo) {
    const { user, team, color, initials } = eventInfo.event.extendedProps;
    // Helper to determine if text should be white or dark for contrast
    function isColorDark(hex) {
      if (!hex) return false;
      const c = hex.substring(1); // strip #
      const rgb = parseInt(c, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      // Perceived brightness
      return (r * 0.299 + g * 0.587 + b * 0.114) < 186;
    }
    const textColor = isColorDark(color) ? 'text-white' : 'text-gray-900';
    return (
      <div
        className={`flex items-center gap-2 group cursor-pointer px-3 py-1 rounded-full border border-blue-200 shadow-sm hover:opacity-90 transition-all w-full ${textColor}`}
        style={{ background: color }}
        title={`${user} (${team})`}
      >
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white/30 border border-blue-300 ${textColor}`}
        >
          {initials}
        </span>
        <span className="text-xs font-semibold">
          {user}
        </span>
        <span className="ml-1 text-xs font-medium opacity-80">({team})</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-6">
      <div className="w-full max-w-full mx-auto px-2 sm:px-6 md:px-12">
        {/* Heading */}
        <div className="flex flex-col gap-1 mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">On-Call Timeline</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 ml-12 mt-0.5">Visualize and filter on-call coverage across your teams.</p>
          <div className="h-0.5 w-32 bg-blue-100 dark:bg-gray-700 rounded-full mt-2 ml-12" />
        </div>
        {/* Team Filters - horizontal, left-aligned */}
        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 justify-start">
          {teams.map((team) => {
            const color = teamColors[colorNames[teams.indexOf(team) % colorNames.length]] || stringToColor(team);
            const isActive = visibleTeams.has(team);
            return (
              <button
                key={team}
                onClick={() => toggleTeam(team)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium shadow-sm transition-all ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }}></span>
                {team}
              </button>
            );
          })}
        </div>
        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-1 sm:p-3 shadow border border-gray-200 dark:border-gray-700 w-full min-h-[80vh] flex flex-col justify-center">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin w-10 h-10 border-t-2 border-b-2 border-blue-600 rounded-full" />
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
              eventContent={renderEventContent}
              height="auto"
              className="rounded-lg"
            />
          )}
        </div>
        {/* Modal as Profile Card */}
        {selectedEvent && (
          <div
            onClick={() => setSelectedEvent(null)}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-2"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8 rounded-xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center"
            >
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold bg-blue-100 text-blue-700 border border-blue-200 mb-4"
              >
                {selectedEvent.initials}
              </span>
              <h3 className="text-xl font-bold mb-1 text-center">
                {selectedEvent.user}
              </h3>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-2">
                {selectedEvent.team}
              </span>
              <div className="w-full flex flex-col gap-1 mb-2 mt-2">
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Email:</strong> {selectedEvent.email}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Contact:</strong> {selectedEvent.contact}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Start:</strong> {selectedEvent.start ? new Date(selectedEvent.start).toLocaleString() : '-'}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>End:</strong> {selectedEvent.end ? new Date(selectedEvent.end).toLocaleString() : '-'}</p>
                {selectedEvent.scheduleId && (
                  <p className="text-xs text-gray-400 mt-1"><strong>Schedule ID:</strong> {selectedEvent.scheduleId}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 mt-4 shadow-sm transition"
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
