import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="text-lg font-semibold tracking-tight text-slate-900">
          LiveVote
        </NavLink>

        <div className="flex items-center gap-6 text-sm font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-indigo-600"
                : "text-slate-600 transition hover:text-indigo-600"
            }
          >
            Create Poll
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "text-indigo-600"
                : "text-slate-600 transition hover:text-indigo-600"
            }
          >
            My Polls
          </NavLink>
        </div>
      </div>
    </nav>
  );
}