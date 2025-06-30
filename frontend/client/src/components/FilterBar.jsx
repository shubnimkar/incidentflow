import React from "react";

const FilterBar = ({
  teams = [],
  roles = [],
  selectedTeam,
  setSelectedTeam,
  selectedRole,
  setSelectedRole,
  dateRange,
  setDateRange,
  search,
  setSearch,
  children // for bulk actions or extra controls
}) => (
  <div className="flex gap-2 items-center flex-wrap mb-4">
    <select
      className="rounded-xl bg-[#f0f2f5] px-4 py-2 text-[#111418] text-sm font-medium"
      value={selectedTeam}
      onChange={e => setSelectedTeam(e.target.value)}
    >
      <option value="">Team</option>
      {teams.map(team => (
        <option key={team} value={team}>{team}</option>
      ))}
    </select>
    <select
      className="rounded-xl bg-[#f0f2f5] px-4 py-2 text-[#111418] text-sm font-medium"
      value={selectedRole}
      onChange={e => setSelectedRole(e.target.value)}
    >
      <option value="">Role</option>
      {roles.map(role => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
    <input
      type="date"
      className="rounded-xl bg-[#f0f2f5] px-2 py-2 text-[#111418] text-sm font-medium"
      value={dateRange.start}
      onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
      placeholder="Start Date"
      title="Start Date"
    />
    <input
      type="date"
      className="rounded-xl bg-[#f0f2f5] px-2 py-2 text-[#111418] text-sm font-medium"
      value={dateRange.end}
      onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
      placeholder="End Date"
      title="End Date"
    />
    <input
      className="form-input rounded-xl bg-[#f0f2f5] px-4 py-2 text-[#111418] text-base ml-2"
      placeholder="Search"
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
    {children}
  </div>
);

export default FilterBar; 