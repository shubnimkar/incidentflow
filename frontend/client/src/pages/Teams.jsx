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
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [editTeam, setEditTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamLoading, setEditTeamLoading] = useState(false);
  const [editTeamError, setEditTeamError] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [addMembers, setAddMembers] = useState([]);
  const [removeMemberId, setRemoveMemberId] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(null); // member object or null
  const [addMemberId, setAddMemberId] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");
  const [editMemberRole, setEditMemberRole] = useState("");
  const [editMemberLoading, setEditMemberLoading] = useState(false);
  const [editMemberError, setEditMemberError] = useState("");
  const [editTeamOpen, setEditTeamOpen] = useState(false);

  const token = localStorage.getItem("token");
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userRole = decodedToken?.role;

  const fetchTeams = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await userApi.get("/teams");
      setTeams(res.data);
      // Auto-select first team if none selected
      if (!selectedTeam && res.data.length > 0) setSelectedTeam(res.data[0]);
    } catch (err) {
      setTeamError("Failed to load teams");
    } finally {
      setTeamLoading(false);
    }
  }, [selectedTeam]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userApi.get("/");
      setUsers(res.data);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, [fetchTeams, fetchUsers]);

  // Sidebar team click
  const handleSelectTeam = (team) => setSelectedTeam(team);

  // Add Member logic
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberId) return;
    setAddMemberLoading(true);
    setAddMemberError("");
    try {
      await userApi.post(`/teams/${selectedTeam._id}/add-member`, { userId: addMemberId });
      const updatedTeam = await userApi.get(`/teams/${selectedTeam._id}`);
      setSelectedTeam(updatedTeam.data);
      fetchTeams();
      setAddMemberId("");
      setShowAddMember(false);
      toast.success("Member added");
    } catch (err) {
      setAddMemberError("Failed to add member");
    } finally {
      setAddMemberLoading(false);
    }
  };

  // Edit Member logic (role only)
  const handleEditMember = async (e) => {
    e.preventDefault();
    if (!showEditMember) return;
    setEditMemberLoading(true);
    setEditMemberError("");
    try {
      await userApi.patch(`/teams/${selectedTeam._id}/edit-member`, { userId: showEditMember._id, role: editMemberRole });
      const updatedTeam = await userApi.get(`/teams/${selectedTeam._id}`);
      setSelectedTeam(updatedTeam.data);
      fetchTeams();
      setShowEditMember(null);
      toast.success("Member updated");
    } catch (err) {
      setEditMemberError("Failed to update member");
    } finally {
      setEditMemberLoading(false);
    }
  };

  // Remove Member logic
  const handleRemoveMember = async (userId) => {
    setMemberLoading(true);
    try {
      await userApi.post(`/teams/${selectedTeam._id}/remove-member`, { userId });
      const updatedTeam = await userApi.get(`/teams/${selectedTeam._id}`);
      setSelectedTeam(updatedTeam.data);
      fetchTeams();
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member");
    } finally {
      setMemberLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: 'Inter, Noto Sans, sans-serif' }}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#eaedf1] px-10 py-3 bg-white">
        <div className="flex items-center gap-4 text-[#101518]">
          <div className="size-4">
            {/* Logo SVG */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6"><path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor"></path></svg>
        </div>
          <h2 className="text-[#101518] text-lg font-bold leading-tight tracking-[-0.015em]">TeamUp</h2>
        </div>
        {/* (Optional: Add nav links, bell, profile pic, etc.) */}
      </header>
      <div className="flex flex-1 gap-1 px-6 py-5">
        {/* Sidebar */}
        <aside className="flex flex-col w-80 pr-6">
          <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Teams</h2>
          <div className="flex flex-col gap-2">
            {teams.map(team => (
              <button
                key={team._id}
                className={`flex items-center gap-4 bg-gray-50 px-4 min-h-14 rounded-lg mb-1 border border-transparent hover:border-blue-400 transition ${selectedTeam && selectedTeam._id === team._id ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => handleSelectTeam(team)}
              >
                <span className="text-[#101518] flex items-center justify-center rounded-lg bg-[#eaedf1] shrink-0 size-10">
                  {/* Team icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path></svg>
                </span>
                <span className="text-[#101518] text-base font-normal leading-normal flex-1 truncate">{team.name}</span>
              </button>
            ))}
            {/* New Team Button and Modal */}
          <Dialog.Root open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
            <Dialog.Trigger asChild>
                <div className="mx-4 mt-2">
                  <button
                    className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#eaedf1] text-[#101518] text-sm font-bold leading-normal tracking-[0.015em]"
                  >
                    New Team
                  </button>
                </div>
            </Dialog.Trigger>
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs z-50 border border-gray-200 flex flex-col items-center">
              <h4 className="text-lg font-bold mb-4">Create New Team</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setTeamLoading(true);
                  setTeamError("");
                  try {
                      const res = await userApi.post("/teams", { name: teamName, description: teamDesc });
                    setTeamName("");
                    setTeamDesc("");
                      await fetchTeams();
                      // Select the new team
                      if (res.data && res.data._id) {
                        setSelectedTeam(res.data);
                      }
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
      </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 max-w-[960px]">
          {selectedTeam ? (
            <>
              <div className="flex flex-wrap justify-between gap-3 p-4">
                <div className="flex min-w-72 flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[#101518] tracking-light text-[32px] font-bold leading-tight mb-0">{selectedTeam.name}</p>
                    <button
                      className="text-[#49739c] hover:bg-[#e7edf4] px-2 py-1 rounded text-sm font-medium transition"
                      onClick={() => {
                        setEditTeamName(selectedTeam.name);
                        setEditTeamDesc(selectedTeam.description || "");
                        setEditTeamOpen(true);
                      }}
                    >Edit</button>
                  </div>
                <div className="flex items-center gap-2">
                    <p className="text-[#5c748a] text-sm font-normal leading-normal mb-0">{selectedTeam.description || 'Manage your team members and their roles'}</p>
                  </div>
                </div>
              </div>
      {/* Edit Team Modal */}
              <Dialog.Root open={editTeamOpen} onOpenChange={setEditTeamOpen}>
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs z-50 border border-gray-200 flex flex-col items-center">
          <h4 className="text-lg font-bold mb-4">Edit Team</h4>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setEditTeamLoading(true);
              setEditTeamError("");
              try {
                        await userApi.patch(`/teams/${selectedTeam._id}`, { name: editTeamName, description: editTeamDesc });
                        await fetchTeams();
                        setSelectedTeam({ ...selectedTeam, name: editTeamName, description: editTeamDesc });
                        setEditTeamOpen(false);
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
                      <button type="button" className="bg-gray-200 text-gray-700 px-4 py-1 rounded" onClick={() => setEditTeamOpen(false)}>Cancel</button>
                      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={editTeamLoading}>{editTeamLoading ? "Saving..." : "Save"}</button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Root>
              <h3 className="text-[#101518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Team Members</h3>
              <div className="px-4 py-3">
                <div className="flex overflow-hidden rounded-xl border border-[#d4dce2] bg-gray-50">
                  <table className="flex-1 w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-[#101518] w-[400px] text-sm font-medium leading-normal">Name</th>
                        <th className="px-4 py-3 text-left text-[#101518] w-[400px] text-sm font-medium leading-normal">Role</th>
                        <th className="px-4 py-3 text-left text-[#101518] w-[400px] text-sm font-medium leading-normal">Contact</th>
                        <th className="px-4 py-3 text-left text-[#101518] w-60 text-[#5c748a] text-sm font-medium leading-normal">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTeam.members && selectedTeam.members.length > 0 ? (
                        selectedTeam.members.map((m) => (
                          <tr key={m._id} className="border-t border-t-[#d4dce2]">
                            <td className="h-[72px] px-4 py-2 w-[400px] text-[#101518] text-sm font-normal leading-normal">{m.name || m.email}</td>
                            <td className="h-[72px] px-4 py-2 w-[400px] text-[#5c748a] text-sm font-normal leading-normal">{m.role || ''}</td>
                            <td className="h-[72px] px-4 py-2 w-[400px] text-[#5c748a] text-sm font-normal leading-normal">{m.email}</td>
                            <td className="h-[72px] px-4 py-2 w-60 text-[#5c748a] text-sm font-bold leading-normal tracking-[0.015em] flex gap-2 items-center">
                              <button className="text-[#b94a48] hover:bg-[#fbeaea] px-2 py-1 rounded text-sm font-medium transition" onClick={() => handleRemoveMember(m._id)}>Remove</button>
                            </td>
                          </tr>
                  ))
                ) : (
                        <tr><td colSpan={4} className="text-center text-gray-400 py-6">No members</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex px-4 py-3 justify-start">
                        <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#eaedf1] text-[#101518] text-sm font-bold leading-normal tracking-[0.015em]"
                    onClick={() => setShowAddMember(true)}
                  >
                    Add Member
                  </button>
                </div>
              </div>
              {/* Add Member Modal */}
              <Dialog.Root open={showAddMember} onOpenChange={setShowAddMember}>
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs z-50 border border-gray-200 flex flex-col items-center">
                  <h4 className="text-lg font-bold mb-4">Add Member</h4>
                  <form onSubmit={handleAddMember} className="flex flex-col gap-3 w-full">
                    <select
                      className="border px-2 py-1 rounded w-full"
                      value={addMemberId}
                      onChange={e => setAddMemberId(e.target.value)}
                      required
                    >
                      <option value="">Select user...</option>
                    {users.filter(u => !(selectedTeam.members || []).some(m => m._id === u._id)).map(u => (
                      <option key={u._id} value={u._id}>{u.name || u.email}</option>
                    ))}
                  </select>
                    {addMemberError && <div className="text-red-600 text-sm mb-2">{addMemberError}</div>}
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="button" className="bg-gray-200 text-gray-700 px-4 py-1 rounded" onClick={() => setShowAddMember(false)}>Cancel</button>
                      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={addMemberLoading}>{addMemberLoading ? "Adding..." : "Add"}</button>
                </div>
                  </form>
              </Dialog.Content>
            </Dialog.Root>
              {/* Edit Member Modal */}
              <Dialog.Root open={!!showEditMember} onOpenChange={v => { if (!v) setShowEditMember(null); }}>
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs z-50 border border-gray-200 flex flex-col items-center">
                  <h4 className="text-lg font-bold mb-4">Edit Member</h4>
                  <form onSubmit={handleEditMember} className="flex flex-col gap-3 w-full">
            <input
              type="text"
                      className="border px-2 py-1 rounded w-full bg-gray-100"
                      value={showEditMember?.name || showEditMember?.email || ''}
                      disabled
            />
            <input
              type="text"
              className="border px-2 py-1 rounded w-full"
                      placeholder="Role"
                      value={editMemberRole}
                      onChange={e => setEditMemberRole(e.target.value)}
            />
                    {editMemberError && <div className="text-red-600 text-sm mb-2">{editMemberError}</div>}
            <div className="flex gap-2 justify-end mt-2">
                      <button type="button" className="bg-gray-200 text-gray-700 px-4 py-1 rounded" onClick={() => setShowEditMember(null)}>Cancel</button>
                      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={editMemberLoading}>{editMemberLoading ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
            </>
          ) : (
            <div className="p-8 text-center text-gray-400">Select a team to view details.</div>
          )}
        </main>
      </div>
      {/* Create/Edit dialogs and member management dialogs would go here, reusing your existing logic */}
    </div>
  );
};

export default Teams; 