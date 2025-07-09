import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { incidentApi } from "../services/api";

const PRIORITIES = ["P1", "P2", "P3", "P4", "P5"];

export default function OverdueWindowSection() {
  const [overdueWindow, setOverdueWindow] = useState({ P1: 24, P2: 48, P3: 72, P4: 120, P5: 168 });
  const [overdueInput, setOverdueInput] = useState({ P1: 24, P2: 48, P3: 72, P4: 120, P5: 168 });
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [overdueEdit, setOverdueEdit] = useState(false);

  const fetchOverdueWindow = useCallback(async () => {
    setOverdueLoading(true);
    try {
      const res = await incidentApi.get('/incidents/settings/overdue-window');
      setOverdueWindow(res.data.overdueWindowHours);
      setOverdueInput(res.data.overdueWindowHours);
    } catch (err) {
      toast.error('Failed to load overdue window setting');
    } finally {
      setOverdueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdueWindow();
  }, [fetchOverdueWindow]);

  const handleOverdueUpdate = async () => {
    for (const p of PRIORITIES) {
      const val = overdueInput[p];
      if (typeof val !== 'number' || val < 1 || val > 168) {
        toast.error(`Value for ${p} must be between 1 and 168`);
        return;
      }
    }
    setOverdueLoading(true);
    try {
      const res = await incidentApi.patch('/incidents/settings/overdue-window', {
        overdueWindowHours: overdueInput,
      });
      setOverdueWindow(res.data.overdueWindowHours);
      setOverdueEdit(false);
      toast.success('Overdue window updated');
    } catch (err) {
      toast.error('Failed to update overdue window');
    } finally {
      setOverdueLoading(false);
    }
  };

  return (
    <div className="mb-8 max-w-md bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800 dark:text-white">Overdue Window (hours) per Priority</span>
        {!overdueEdit ? (
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            onClick={() => setOverdueEdit(true)}
            disabled={overdueLoading}
          >Edit</button>
        ) : null}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-1">Priority</th>
            <th className="text-left py-1">Hours</th>
          </tr>
        </thead>
        <tbody>
          {PRIORITIES.map(p => (
            <tr key={p}>
              <td className="py-1 font-medium">{p}</td>
              <td className="py-1">
                {!overdueEdit ? (
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-300">{overdueLoading ? '...' : overdueWindow[p]}</span>
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={overdueInput[p]}
                    onChange={e => setOverdueInput({ ...overdueInput, [p]: Number(e.target.value) })}
                    className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={overdueLoading}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {overdueEdit && (
        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
            onClick={handleOverdueUpdate}
            disabled={overdueLoading}
          >Save All</button>
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm font-medium hover:bg-gray-400"
            onClick={() => { setOverdueEdit(false); setOverdueInput(overdueWindow); }}
            disabled={overdueLoading}
          >Cancel</button>
        </div>
      )}
    </div>
  );
} 