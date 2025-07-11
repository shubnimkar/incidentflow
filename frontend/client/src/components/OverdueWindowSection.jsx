import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { incidentApi } from "../services/api";

const PRIORITIES = ["P1", "P2", "P3", "P4", "P5"];
const PRIORITY_COLORS = {
  P1: "text-red-600 dark:text-red-400",
  P2: "text-orange-500 dark:text-orange-300",
  P3: "text-yellow-500 dark:text-yellow-300",
  P4: "text-blue-500 dark:text-blue-300",
  P5: "text-green-600 dark:text-green-400",
};
const DEFAULTS = { P1: 24, P2: 48, P3: 72, P4: 120, P5: 168 };

export default function OverdueWindowSection() {
  const [overdueWindow, setOverdueWindow] = useState(DEFAULTS);
  const [overdueInput, setOverdueInput] = useState(DEFAULTS);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [overdueEdit, setOverdueEdit] = useState(false);
  // Placeholder for last updated info
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  const fetchOverdueWindow = useCallback(async () => {
    setOverdueLoading(true);
    try {
      const res = await incidentApi.get('/incidents/settings/overdue-window');
      setOverdueWindow(res.data.overdueWindowHours);
      setOverdueInput(res.data.overdueWindowHours);
      setLastUpdated(res.data.lastUpdated || null);
      setUpdatedBy(res.data.updatedBy || null);
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
      setLastUpdated(res.data.lastUpdated || null);
      setUpdatedBy(res.data.updatedBy || null);
      toast.success('Overdue window updated');
    } catch (err) {
      toast.error('Failed to update overdue window');
    } finally {
      setOverdueLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setOverdueInput(DEFAULTS);
    toast('Reset to default values (not saved yet)');
  };

  return (
    <div className="mb-8 w-full bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-8 flex flex-col gap-6">
      <div className="mb-2">
        <div className="font-semibold text-gray-800 dark:text-white text-lg flex items-center gap-2">
          Overdue Window (hours) per Priority
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Set the maximum allowed time (in hours) for each incident priority before it is considered overdue. Lower priorities can have longer windows.
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">
          {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : 'Last updated: —'}<br/>
          {updatedBy ? `Updated by: ${updatedBy}` : 'Updated by: —'}
        </div>
        <div className="flex gap-2">
          {overdueEdit && (
            <button
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium hover:bg-gray-300 border border-gray-300"
              onClick={handleResetDefaults}
              disabled={overdueLoading}
            >Reset to Defaults</button>
          )}
          {!overdueEdit && (
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              onClick={() => setOverdueEdit(true)}
              disabled={overdueLoading}
            >Edit</button>
          )}
        </div>
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
              <td className={`py-1 font-medium ${PRIORITY_COLORS[p]}`}>{p}</td>
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