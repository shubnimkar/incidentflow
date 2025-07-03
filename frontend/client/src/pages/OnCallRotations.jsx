import React, { useEffect, useState, useCallback } from "react";
import { userApi, onCallApi } from "../services/api";
import { toast } from "react-hot-toast";

const OnCallRotations = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [rotationLoading, setRotationLoading] = useState(false);
  const [rotationError, setRotationError] = useState("");
  const [newRotation, setNewRotation] = useState({ team: "", users: [], startDate: "", endDate: "", schedule: [] });
  const [scheduleEntry, setScheduleEntry] = useState({ user: "", start: "", end: "" });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userApi.get("/");
      setUsers(res.data);
    } catch (err) {}
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await userApi.get("/teams");
      setTeams(res.data);
    } catch (err) {}
  }, []);

  const fetchRotations = useCallback(async () => {
    setRotationLoading(true);
    try {
      const res = await onCallApi.get("/rotations");
      setRotations(res.data);
    } catch (err) {
      // ignore
    } finally {
      setRotationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    fetchRotations();
  }, [fetchUsers, fetchTeams, fetchRotations]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
      <h2 className="text-2xl font-bold mb-6">On-Call Rotations</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setRotationLoading(true);
          setRotationError("");
          try {
            await onCallApi.post("/rotations", newRotation);
            setNewRotation({ team: "", users: [], startDate: "", endDate: "", schedule: [] });
            setScheduleEntry({ user: "", start: "", end: "" });
            fetchRotations();
            toast.success("Rotation created");
          } catch (err) {
            setRotationError(err.response?.data?.message || "Failed to create rotation");
            toast.error(err.response?.data?.message || "Failed to create rotation");
          } finally {
            setRotationLoading(false);
          }
        }}
        className="flex flex-col gap-2 mb-4"
      >
        <div className="flex gap-2">
          <select
            value={newRotation.team}
            onChange={e => setNewRotation(r => ({ ...r, team: e.target.value }))}
            className="border px-2 py-1 rounded"
            required
          >
            <option value="">Select team</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>{team.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={newRotation.startDate}
            onChange={e => setNewRotation(r => ({ ...r, startDate: e.target.value }))}
            className="border px-2 py-1 rounded"
            required
          />
          <input
            type="date"
            value={newRotation.endDate}
            onChange={e => setNewRotation(r => ({ ...r, endDate: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={scheduleEntry.user}
            onChange={e => setScheduleEntry(se => ({ ...se, user: e.target.value }))}
            className="border px-2 py-1 rounded"
          >
            <option value="">Select user</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name || u.email}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={scheduleEntry.start}
            onChange={e => setScheduleEntry(se => ({ ...se, start: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
          <input
            type="datetime-local"
            value={scheduleEntry.end}
            onChange={e => setScheduleEntry(se => ({ ...se, end: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
          <button
            type="button"
            className="bg-blue-500 text-white px-2 py-1 rounded"
            onClick={() => {
              if (scheduleEntry.user && scheduleEntry.start && scheduleEntry.end) {
                setNewRotation(r => ({ ...r, schedule: [...r.schedule, { ...scheduleEntry }] }));
                setScheduleEntry({ user: "", start: "", end: "" });
              }
            }}
          >Add Shift</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {newRotation.schedule.map((s, idx) => (
            <span key={idx} className="bg-gray-200 px-2 py-1 rounded text-xs">
              {users.find(u => u._id === s.user)?.name || users.find(u => u._id === s.user)?.email}:
              {new Date(s.start).toLocaleString()} - {new Date(s.end).toLocaleString()}
              <button
                type="button"
                className="ml-2 text-red-500"
                onClick={() => setNewRotation(r => ({ ...r, schedule: r.schedule.filter((_, i) => i !== idx) }))}
              >x</button>
            </span>
          ))}
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={rotationLoading}>Create Rotation</button>
        {rotationError && <div className="text-red-600 text-sm mt-1">{rotationError}</div>}
      </form>
      <table className="min-w-full table-auto rounded-2xl overflow-hidden mb-6">
        <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2 text-left">Team</th>
            <th className="px-4 py-2 text-left">Start</th>
            <th className="px-4 py-2 text-left">End</th>
            <th className="px-4 py-2 text-left">Users</th>
            <th className="px-4 py-2 text-left">Schedule</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rotations.map((rot) => (
            <tr key={rot._id}>
              <td className="px-4 py-2">{rot.team?.name || "-"}</td>
              <td className="px-4 py-2">{rot.startDate ? new Date(rot.startDate).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-2">{rot.endDate ? new Date(rot.endDate).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-2">
                {rot.users && rot.users.length > 0 ? (
                  <ul className="list-disc ml-4">
                    {rot.users.map((u) => (
                      <li key={u._id}>{u.name || u.email}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">No users</span>
                )}
              </td>
              <td className="px-4 py-2">
                {rot.schedule && rot.schedule.length > 0 ? (
                  <ul className="list-disc ml-4">
                    {rot.schedule.map((s, idx) => (
                      <li key={idx}>
                        {users.find(u => u._id === (s.user?._id || s.user))?.name || users.find(u => u._id === (s.user?._id || s.user))?.email}
                        : {new Date(s.start).toLocaleString()} - {new Date(s.end).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">No schedule</span>
                )}
              </td>
              <td className="px-4 py-2">
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={async () => {
                    if (window.confirm("Delete this rotation?")) {
                      await onCallApi.delete(`/rotations/${rot._id}`);
                      fetchRotations();
                      toast.success("Rotation deleted");
                    }
                  }}
                >Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OnCallRotations; 