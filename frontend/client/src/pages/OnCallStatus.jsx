import React, { useEffect, useState } from "react";
import { userApi, onCallApi } from "../services/api";

const OnCallStatus = () => {
  const [teams, setTeams] = useState([]);
  const [onCall, setOnCall] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamsAndOnCall = async () => {
      setLoading(true);
      try {
        const res = await userApi.get("/teams");
        setTeams(res.data);
        const onCallMap = {};
        for (const team of res.data) {
          try {
            const ocRes = await onCallApi.get(`/current?team=${team._id}`);
            onCallMap[team._id] = ocRes.data;
          } catch (err) {
            onCallMap[team._id] = null;
          }
        }
        setOnCall(onCallMap);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchTeamsAndOnCall();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading on-call status...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
      <h2 className="text-2xl font-bold mb-6">Current On-Call Status</h2>
      <table className="min-w-full table-auto rounded-2xl overflow-hidden mb-6">
        <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2 text-left">Team</th>
            <th className="px-4 py-2 text-left">Current On-Call</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team._id}>
              <td className="px-4 py-2">{team.name}</td>
              <td className="px-4 py-2">
                {onCall[team._id]
                  ? `${onCall[team._id].name || onCall[team._id].email}`
                  : <span className="text-gray-400">No on-call user</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OnCallStatus; 