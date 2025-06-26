// src/components/OnCallCalendar.jsx
import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { onCallApi } from "../services/api";

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

function OnCallCalendar() {
  const [events, setEvents] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState(new Set());
  const [teams, setTeams] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await onCallApi.get("/oncall-schedules");
        const schedules = res.data;
        const allEvents = [];
        const teamSet = new Set();
        schedules.forEach((schedule) => {
          teamSet.add(schedule.team);
          schedule.users.forEach((entry) => {
            const user = entry.userId;
            const color = stringToColor(schedule.team);
            allEvents.push({
              title: `${user.name} (${schedule.team})`,
              start: entry.startDate,
              end: entry.endDate,
              backgroundColor: color,
              borderColor: color,
              textColor: "#fff",
              extendedProps: {
                user,
                team: schedule.team,
                color,
              },
            });
          });
        });
        setEvents(allEvents);
        setTeams(Array.from(teamSet));
        setFilteredTeams(new Set(Array.from(teamSet)));
      } catch (err) {
        console.error("Failed to load calendar events", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function renderEventContent(eventInfo) {
    const { user, team, color } = eventInfo.event.extendedProps;
    return (
      <div
        onClick={() => setSelectedEvent(eventInfo.event)}
        className="flex items-center gap-2 group cursor-pointer transform hover:scale-105 transition-all duration-200 px-2 py-1 rounded-full shadow-lg bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 border border-white/30 backdrop-blur-md"
        title={`${user.name} (${team})`}
        style={{ boxShadow: `0 2px 8px 0 ${color}55` }}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow border-2 border-white"
          style={{ background: color, color: "#fff" }}
        >
          {getInitials(user.name)}
        </span>
        <span className="text-xs font-semibold text-white drop-shadow">
          {user.name}
        </span>
        <span className="ml-1 text-xs font-medium text-white/80 group-hover:text-white">({team})</span>
      </div>
    );
  }

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  const toggleTeam = (team) => {
    const newSet = new Set(filteredTeams);
    newSet.has(team) ? newSet.delete(team) : newSet.add(team);
    setFilteredTeams(newSet);
  };

  const filteredEvents = events.filter((e) => filteredTeams.has(e.extendedProps.team));

  return (
    <div className="min-h-screen p-0 sm:p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-gray-900 dark:to-black text-white transition-colors duration-700 relative overflow-x-hidden">
      {/* SVG background pattern */}
      <svg className="absolute top-0 left-0 w-full h-64 opacity-10 z-0" viewBox="0 0 1440 320"><path fill="#fff" fillOpacity="0.3" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,165.3C840,171,960,213,1080,197.3C1200,181,1320,107,1380,69.3L1440,32L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path></svg>
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Hero Heading */}
        <div className="flex flex-col items-center justify-center pt-10 pb-6">
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-pink-400 shadow-2xl animate-pulse mb-4 border-4 border-white/30">
            <svg className="w-10 h-10 text-white drop-shadow-lg animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight drop-shadow-lg text-center">
            On-Call Calendar
          </h1>
          <span className="block h-1 w-32 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full mt-4 animate-pulse" />
          <p className="text-lg text-white/80 font-light mt-4 italic text-center max-w-2xl">
            See who's on call, when, and for which team — all in one beautiful, interactive view.
          </p>
        </div>
        {/* Glass Card */}
        <div className="mt-8 bg-white/70 dark:bg-gray-900/80 rounded-3xl shadow-2xl border border-blue-200 dark:border-blue-900 backdrop-blur-xl p-6 sm:p-10 relative overflow-hidden">
          {/* Border Glow */}
          <div className="absolute -inset-1 bg-gradient-to-tr from-blue-400/30 via-purple-400/20 to-pink-400/30 rounded-3xl blur-2xl z-0 pointer-events-none" />
          <div className="relative z-10">
            {/* Team Filters */}
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
              {teams.map((team) => {
                const selected = filteredTeams.has(team);
                return (
                  <button
                    key={team}
                    onClick={() => toggleTeam(team)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                      selected
                        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-transparent scale-105 shadow-lg"
                        : "bg-white/80 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ background: stringToColor(team) }}></span>
                    {team}
                  </button>
                );
              })}
            </div>
            {/* Calendar */}
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-2 sm:p-6 shadow-inner border border-blue-100 dark:border-blue-800 backdrop-blur-md">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full" />
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  events={filteredEvents}
                  height="auto"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  eventDisplay="block"
                  eventContent={renderEventContent}
                  dayMaxEvents={3}
                  className="rounded-lg transition-all"
                />
              )}
            </div>
          </div>
        </div>
        {/* Modal as Profile Card */}
        {selectedEvent && (
          <div
            onClick={() => setSelectedEvent(null)}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-2"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-blue-200 dark:border-blue-800 flex flex-col items-center animate-fade-in"
            >
              <span
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow border-4 border-blue-400 mb-4 bg-gradient-to-tr from-blue-500 to-pink-400 text-white"
                style={{ background: selectedEvent.extendedProps.color }}
              >
                {getInitials(selectedEvent.extendedProps.user.name)}
              </span>
              <h3 className="text-2xl font-extrabold mb-1 text-center">
                {selectedEvent.extendedProps.user.name}
              </h3>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white text-xs font-semibold mb-2">
                {selectedEvent.extendedProps.team}
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 text-center">
                <strong>Email:</strong> {selectedEvent.extendedProps.user.email}
              </p>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 mt-4 shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease;
        }
      `}</style>
    </div>
  );
}

export default OnCallCalendar;
