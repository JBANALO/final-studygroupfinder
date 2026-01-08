// src/pages/admin/ManageGroups.jsx
import { useEffect, useState } from "react";
import api from "../../api";
import { io } from "socket.io-client";
import { CheckCircleIcon, XCircleIcon, UsersIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL || 'https://final-studygroup-production.up.railway.app';

export default function ManageGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    approved: false,
    declined: false,
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/group/all");
      const groupList = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      
      const mappedGroups = groupList.map(g => ({
        ...g,
        status: g.status || "pending"
      }));

      setGroups(mappedGroups);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("newPendingGroup", (newGroup) => {
      setGroups(prev => {
        if (prev.some(g => g.id === newGroup.id)) return prev;
        toast.success(`New group created: ${newGroup.group_name}`);
        return [newGroup, ...prev];
      });
    });

    socket.on("groupStatusChanged", () => {
      fetchGroups();
    });

    return () => socket.disconnect();
  }, []);

  const handleApprove = async (groupId) => {
    if (!confirm("Approve this group?")) return;
    try {
      await api.patch(`/admin/approve/${groupId}`);
      toast.success("Group approved! Creator will receive an email.");
      fetchGroups();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve group");
    }
  };

  const handleDecline = async (groupId) => {
    if (!confirm("Decline this group?")) return;
    const remarks = prompt("Reason for declining this group:") || "No remarks provided";
    try {
      await api.patch(`/admin/decline/${groupId}`, { remarks });
      toast.info("Group declined! Creator will receive an email.");
      fetchGroups();
    } catch (err) {
      console.error(err);
      toast.error("Failed to decline group");
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) return <div className="p-10 text-center text-xl">Loading groups...</div>;

  const filteredGroups = groups.filter((g) => {
    const term = search.toLowerCase();
    return (
      g.group_name.toLowerCase().includes(term) ||
      g.course.toLowerCase().includes(term) ||
      g.location.toLowerCase().includes(term) ||
      (g.creator_name || g.created_by).toLowerCase().includes(term)
    );
  });

  const pending = filteredGroups.filter((g) => g.status === "pending");
  const approved = filteredGroups.filter((g) => g.status === "approved");
  const declined = filteredGroups.filter((g) => g.status === "declined");

  const renderRows = (groupArray, status) => {
    if (!expandedSections[status]) return null;
    return groupArray.map((group) => (
      <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
        <td className="px-6 py-4">{group.group_name}</td>
        <td className="px-6 py-4">{group.course} • {group.location}</td>
        <td className="px-6 py-4">{group.creator_name || group.created_by}</td>
        <td className="px-6 py-4">{group.current_members || 0} / {group.size}</td>
        <td className="px-6 py-4">
          {group.status === "pending" && <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Pending</span>}
          {group.status === "approved" && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">Approved</span>}
          {group.status === "declined" && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">Declined</span>}
          {group.status === "declined" && group.remarks && <p className="text-sm text-red-500 mt-1">Remark: {group.remarks}</p>}
        </td>
        <td className="px-6 py-4 flex justify-center gap-2">
          {group.status === "pending" && (
            <>
              <button onClick={() => handleApprove(group.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-green-700 transition">
                <CheckCircleIcon className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => handleDecline(group.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-red-700 transition">
                <XCircleIcon className="w-4 h-4" /> Decline
              </button>
            </>
          )}
          {group.status === "approved" && <span className="text-green-700 font-medium">✔</span>}
          {group.status === "declined" && <span className="text-red-700 font-medium">✖</span>}
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-maroon mb-4 flex items-center gap-3">
          <UsersIcon className="w-10 h-10" /> Manage Study Groups
        </h1>

        <div className="mb-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by group, course, location, or creator..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => setSearch("")} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
            Clear
          </button>
        </div>

        <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Group Name</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Course / Location</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Creator</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Members</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="text-center px-6 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50 cursor-pointer" onClick={() => toggleSection("pending")}>
              <td colSpan={6} className="px-6 py-3 font-semibold text-yellow-800 flex justify-between items-center">
                Pending Approval ({pending.length})
                {expandedSections.pending ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </td>
            </tr>
            {renderRows(pending, "pending")}

            <tr className="bg-gray-50 cursor-pointer" onClick={() => toggleSection("approved")}>
              <td colSpan={6} className="px-6 py-3 font-semibold text-green-800 flex justify-between items-center">
                Approved ({approved.length})
                {expandedSections.approved ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </td>
            </tr>
            {renderRows(approved, "approved")}

            <tr className="bg-gray-50 cursor-pointer" onClick={() => toggleSection("declined")}>
              <td colSpan={6} className="px-6 py-3 font-semibold text-red-800 flex justify-between items-center">
                Declined ({declined.length})
                {expandedSections.declined ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </td>
            </tr>
            {renderRows(declined, "declined")}
          </tbody>
        </table>
      </div>
    </div>
  );
}