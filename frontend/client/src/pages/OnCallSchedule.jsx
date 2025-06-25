import React, { useEffect, useState } from "react";
import { onCallApi, userApi } from "../services/api";

function OnCallSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await onCallApi.get("/oncall-schedules");
      setSchedules(res.data);
    } catch (err) {
      console.error("Failed to fetch schedules", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async (id) => {
    try {
      await onCallApi.patch(`/oncall-schedules/${id}/rotate`);
      await fetchSchedules();
    } catch (err) {
      console.error("Failed to rotate schedule", err);
    }
  };

  if (loading) return <p className="text-center">Loading schedules...</p>;

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold mb-4">📆 On-Call Schedules</h2>

      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4 hover:bg-green-700"
      >
        ➕ Create Schedule
      </button>

      {schedules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-left">Current On-Call</th>
                <th className="p-3 text-left">Rotation</th>
                <th className="p-3 text-left">Next Up</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => {
                const current = s.users[s.currentOnCallIndex];
                const next =
                  s.users[(s.currentOnCallIndex + 1) % s.users.length];

                return (
                  <tr key={s._id} className="border-t border-gray-200">
                    <td className="p-3">{s.team}</td>
                    <td className="p-3">{current?.userId?.email}</td>
                    <td className="p-3 capitalize">{s.rotationType}</td>
                    <td className="p-3">{next?.userId?.email}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleRotate(s._id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                      >
                        🔁 Rotate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onCreated={fetchSchedules}
        />
      )}
    </div>
  );
}

function CreateScheduleModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [rotationType, setRotationType] = useState("weekly");
  const [users, setUsers] = useState([
    { userId: "", startDate: "", endDate: "" },
  ]);
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userApi.get("/");
        setUserList(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
  };

  const addUserRow = () => {
    setUsers([...users, { userId: "", startDate: "", endDate: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCallApi.post("/oncall-schedules", {
        name,
        team,
        rotationType,
        users,
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create schedule", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-[90%] max-w-lg"
      >
        <h3 className="text-xl font-bold mb-4">Create On-Call Schedule</h3>

        <label className="block mb-2">
          Schedule Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </label>

        <label className="block mb-2">
          Team
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            required
            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </label>

        <label className="block mb-2">
          Rotation Type
          <select
            value={rotationType}
            onChange={(e) => setRotationType(e.target.value)}
            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Rotation Users</h4>
          {users.map((u, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <select
                value={u.userId}
                onChange={(e) => handleChange(index, "userId", e.target.value)}
                className="w-1/3 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select User</option>
                {userList.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={u.startDate}
                onChange={(e) =>
                  handleChange(index, "startDate", e.target.value)
                }
                className="w-1/3 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="date"
                value={u.endDate}
                onChange={(e) =>
                  handleChange(index, "endDate", e.target.value)
                }
                className="w-1/3 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addUserRow}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add User
          </button>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

export default OnCallSchedule;
