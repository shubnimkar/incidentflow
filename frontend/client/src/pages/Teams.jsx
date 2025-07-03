import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { userApi } from "../services/api";

const getInitials = (nameOrEmail) => {
  const name = nameOrEmail.split("@")[0];
  return name
    .split(".")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamLoading, setEditTeamLoading] = useState(false);
  const [editTeamError, setEditTeamError] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [addMembers, setAddMembers] = useState([]);
  const [removeMemberId, setRemoveMemberId] = useState(null);

  const token = localStorage.getItem("token");
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userRole = decodedToken?.role;

  const fetchTeams = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await userApi.get("/teams");
      setTeams(res.data);
    } catch (err) {
      // ignore
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userApi.get("/");
      setUsers(res.data);
    } catch (err) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, [fetchTeams, fetchUsers]);

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Teams</h2>
        </div>
        <div className="h-0.5 w-32 bg-blue-100 dark:bg-gray-700 rounded-full mt-2 ml-12" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="max-w-xs w-full">
          <input
            type="text"
            placeholder="Search teams..."
            value={teamSearch}
            onChange={e => setTeamSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {userRole === 'admin' && (
          <Dialog.Root open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
            <Dialog.Trigger asChild>
              <button className="bg-blue-600 text-white px-4 py-1 rounded shadow hover:bg-blue-700 transition">Create Team</button>
            </Dialog.Trigger>
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-xs sm:max-w-sm z-50 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
              <h4 className="text-lg font-bold mb-4">Create New Team</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setTeamLoading(true);
                  setTeamError("");
                  try {
                    await userApi.post("/teams", { name: teamName, description: teamDesc });
                    setTeamName("");
                    setTeamDesc("");
                    fetchTeams();
                    setCreateTeamOpen(false);
                    toast.success("Team created");
                  } catch (err) {
                    setTeamError(err.response?.data?.message || "Failed to create team");
                    toast.error(err.response?.data?.message || "Failed to create team");
                  } finally {
                    setTeamLoading(false);
                  }
                }}
                className="flex flex-col gap-3 w-full"
              >
                <input
                  type="text"
                  placeholder="Team name"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="border px-2 py-1 rounded w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={teamDesc}
                  onChange={e => setTeamDesc(e.target.value)}
                  className="border px-2 py-1 rounded w-full"
                />
                {teamError && <div className="text-red-600 text-sm mb-2">{teamError}</div>}
                <div className="flex gap-2 justify-end mt-2">
                  <button type="button" className="bg-gray-200 text-gray-700 px-4 py-1 rounded" onClick={() => setCreateTeamOpen(false)}>Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={teamLoading}>{teamLoading ? "Adding..." : "Add Team"}</button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        )}
      </div>
      {teamLoading ? (
        <div className="py-8 text-center text-gray-400">Loading teams...</div>
      ) : filteredTeams.length === 0 ? (
        <div className="py-8 text-center text-gray-400">No teams found. Create your first team!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {filteredTeams.map((team) => (
            <div key={team._id} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-semibold text-lg">{team.name}</span>
                </div>
                <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{team.members?.length || 0} members</span>
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">{team.description || <span className="italic text-gray-400">No description</span>}</div>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {team.members && team.members.length > 0 ? (
                  team.members.slice(0, 5).map((m) => (
                    <span key={m._id} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-xs border-2 border-white dark:border-gray-800" title={m.name || m.email}>
                      {getInitials(m.name || m.email)}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No members</span>
                )}
                {team.members && team.members.length > 5 && (
                  <span className="text-xs text-gray-500 ml-2">+{team.members.length - 5} more</span>
                )}
              </div>
              {userRole === 'admin' && (
                <div className="flex gap-2 mt-auto">
                  <button className="bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-600 transition" onClick={() => setSelectedTeam(team)}>Manage Members</button>
                  <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-semibold border border-gray-300 hover:bg-gray-200 transition" onClick={() => {
                    setEditTeam(team);
                    setEditTeamName(team.name);
                    setEditTeamDesc(team.description || "");
                  }}>Edit</button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-600 transition" onClick={async () => {
                    if (window.confirm("Delete this team?")) {
                      await userApi.delete(`/teams/${team._id}`);
                      fetchTeams();
                      toast.success("Team deleted");
                    }
                  }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Manage Members Dialog */}
      {selectedTeam && (
        <Dialog.Root open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-xs sm:max-w-sm z-50 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
            <h4 className="text-lg font-bold mb-4">Manage Members for {selectedTeam.name}</h4>
            {memberLoading ? (
              <div className="py-4 text-center text-gray-400">Updating members...</div>
            ) : (
              <>
                <ul className="mb-4 w-full">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((m) => (
                      <li key={m._id} className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-xs border-2 border-white dark:border-gray-800" title={m.name || m.email}>
                            {getInitials(m.name || m.email)}
                          </span>
                          <span className="text-sm">{m.name || m.email}</span>
                        </div>
                        <button
                          className="bg-red-400 text-white px-2 py-0.5 rounded text-xs"
                          onClick={() => setRemoveMemberId(m._id)}
                        >Remove</button>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">No members</li>
                  )}
                </ul>
                {/* Multi-select for adding members */}
                <div className="w-full mb-2">
                  <label className="block text-xs font-semibold mb-1">Add members</label>
                  <select
                    multiple
                    className="w-full border px-2 py-1 rounded h-24"
                    value={addMembers}
                    onChange={e => setAddMembers(Array.from(e.target.selectedOptions, o => o.value))}
                  >
                    {users.filter(u => !(selectedTeam.members || []).some(m => m._id === u._id)).map(u => (
                      <option key={u._id} value={u._id}>{u.name || u.email}</option>
                    ))}
                  </select>
                  <button
                    className="mt-2 bg-blue-600 text-white px-4 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition w-full"
                    disabled={addMembers.length === 0 || memberLoading}
                    onClick={async () => {
                      setMemberLoading(true);
                      setMemberError("");
                      try {
                        for (const userId of addMembers) {
                          await userApi.post(`/teams/${selectedTeam._id}/add-member`, { userId });
                        }
                        const updatedTeam = await userApi.get(`/teams/${selectedTeam._id}`);
                        setSelectedTeam(updatedTeam.data);
                        fetchTeams();
                        setAddMembers([]);
                        toast.success("Members added");
                      } catch (err) {
                        setMemberError("Failed to add members");
                      } finally {
                        setMemberLoading(false);
                      }
                    }}
                  >Add Selected</button>
                  {memberError && <div className="text-red-600 text-xs mt-1">{memberError}</div>}
                </div>
              </>
            )}
            <button className="mt-2 px-4 py-1 bg-gray-300 rounded" onClick={() => setSelectedTeam(null)}>Close</button>
            {/* Remove Member Confirmation Dialog */}
            <Dialog.Root open={!!removeMemberId} onOpenChange={() => setRemoveMemberId(null)}>
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-xs z-50 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                <h4 className="text-lg font-bold mb-4">Remove Member?</h4>
                <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">Are you sure you want to remove this member from the team?</p>
                <div className="flex gap-2 justify-end w-full">
                  <button className="bg-gray-200 text-gray-700 px-4 py-1 rounded" onClick={() => setRemoveMemberId(null)}>Cancel</button>
                  <button className="bg-red-500 text-white px-4 py-1 rounded" onClick={async () => {
                    setMemberLoading(true);
                    try {
                      await userApi.post(`/teams/${selectedTeam._id}/remove-member`, { userId: removeMemberId });
                      const updatedTeam = await userApi.get(`/teams/${selectedTeam._id}`);
                      setSelectedTeam(updatedTeam.data);
                      fetchTeams();
                      setRemoveMemberId(null);
                      toast.success("Member removed");
                    } catch {
                      toast.error("Failed to remove member");
                      setRemoveMemberId(null);
                    } finally {
                      setMemberLoading(false);
                    }
                  }}>Remove</button>
                </div>
              </Dialog.Content>
            </Dialog.Root>
          </Dialog.Content>
        </Dialog.Root>
      )}
      {/* Edit Team Modal */}
      <Dialog.Root open={!!editTeam} onOpenChange={() => setEditTeam(null)}>
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-xs sm:max-w-sm z-50 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <h4 className="text-lg font-bold mb-4">Edit Team</h4>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setEditTeamLoading(true);
              setEditTeamError("");
              try {
                await userApi.patch(`/teams/${editTeam._id}`, { name: editTeamName, description: editTeamDesc });
                fetchTeams();
                setEditTeam(null);
                toast.success("Team updated");
              } catch (err) {
                setEditTeamError(err.response?.data?.message || "Failed to update team");
                toast.error(err.response?.data?.message || "Failed to update team");
              } finally {
                setEditTeamLoading(false);
              }
            }}
            className="flex flex-col gap-3 w-full"
          >
            <input
              type="text"
              placeholder="Team name"
              value={editTeamName}
              onChange={e => setEditTeamName(e.target.value)}
              className="border px-2 py-1 rounded w-full"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={editTeamDesc}
              onChange={e => setEditTeamDesc(e.target.value)}
              className="border px-2 py-1 rounded w-full"
            />
            {editTeamError && <div className="text-red-600 text-sm mb-2">{editTeamError}</div>}
            <div className="flex gap-2 justify-end mt-2">
              <button type="button" className="bg-gray-200 text-gray-700 px-4 py-1 rounded" onClick={() => setEditTeam(null)}>Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={editTeamLoading}>{editTeamLoading ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default Teams; 