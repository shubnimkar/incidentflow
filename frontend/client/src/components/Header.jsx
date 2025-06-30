import React from "react";

const Header = () => (
  <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-10 py-3 bg-white">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-4 text-[#111418]">
        <div className="size-4">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
          </svg>
        </div>
        <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">Incident Manager</h2>
      </div>
      <nav className="flex items-center gap-9">
        <a className="text-[#111418] text-sm font-medium leading-normal" href="#">Incidents</a>
        <a className="text-[#111418] text-sm font-medium leading-normal" href="#">On-call Schedules</a>
        <a className="text-[#111418] text-sm font-medium leading-normal" href="#">Reports</a>
        <a className="text-[#111418] text-sm font-medium leading-normal" href="#">Settings</a>
      </nav>
    </div>
    <div className="flex flex-1 justify-end gap-8">
      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/a/default-user-avatar")'}}></div>
    </div>
  </header>
);

export default Header; 