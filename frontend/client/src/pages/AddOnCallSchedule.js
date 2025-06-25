import React, { useState, useEffect } from "react";
import { userApi, onCallApi } from "../services/api";

function AddOnCallSchedule({ onSuccess }) {
  const [team, setTeam] = useState("");
  const [rotationType, setRotationType] = useState("weekly");
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([
    { userId: "", startDate: "", endDate: "" },
  ]);

  useEffect(() => {
    userApi
      .get("/")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error loading users", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCallApi.post("/oncall-schedules", {
        name: `${team} Rotation`,
        team,
        rotationType,
        users: entries,
      });
      if (onSuccess) onSuccess(); // refresh parent if passed
      alert("✅ Schedule created!");
    } catch (err) {
      console.error("Failed to create schedule", err);
      alert("❌ Failed to create schedule");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-gray-800 rounded shadow-md">
      <h2 className="text-lg font-bold">➕ Create On-Call Schedule</h2>

      <input
        type="text"
        placeholder="Team Name"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />

      <select
        value={rotationType}
        onChange={(e) => setRotationType(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="weekly">Weekly</option>
        <option value="daily">Daily</option>
      </select>

      {entries.map((entry, index) => (
        <div key={index} className="flex gap-2 items-center">
          <select
            value={entry.userId}
            onChange={(e) => {
              const newEntries = [...entries];
              newEntries[index].userId = e.target.value;
              setEntries(newEntries);
            }}
            className="p-2 border rounded flex-1"
            required
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={entry.startDate}
            onChange={(e) => {
              const newEntries = [...entries];
              newEntries[index].startDate = e.target.value;
              setEntries(newEntries);
            }}
            className="p-2 border rounded"
            required
          />

          <input
            type="date"
            value={entry.endDate}
            onChange={(e) => {
              const newEntries = [...entries];
              newEntries[index].endDate = e.target.value;
              setEntries(newEntries);
            }}
            className="p-2 border rounded"
            required
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setEntries([...entries, { userId: "", startDate: "", endDate: "" }])
        }
        className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
      >
        ➕ Add another user
      </button>

      <div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ✅ Create Schedule
        </button>
      </div>
    </form>
  );
}

export default AddOnCallSchedule;
