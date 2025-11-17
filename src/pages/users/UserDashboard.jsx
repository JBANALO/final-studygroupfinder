import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UserDashboard({ currentUserId }) {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [refreshSignal, setRefreshSignal] = useState(false);

  const fetchAllGroups = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/group/list");
      if (res.data.success) setAllGroups(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/group/list");
      if (res.data.success)
        setUserGroups(res.data.data.filter(g => g.created_by === currentUserId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllGroups();
    fetchUserGroups();
  }, [refreshSignal]);

  const handleJoinGroup = async (groupId) => {
    try {
      const res = await axios.post("http://localhost:3000/api/group/join", {
        groupId,
        userId: currentUserId,
      });
      if (res.data.success) setRefreshSignal(prev => !prev);
      else alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to join group");
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
      <div className="flex flex-1 flex-col lg:flex-row gap-0">
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-maroon">Groups Available</h1>
            <button
              onClick={() => navigate("/create-group")}
              className="bg-maroon text-white px-4 py-2 rounded-lg hover:brightness-110"
            >
              + Create Group
            </button>
          </div>

          <div className="space-y-6">
            {allGroups.length === 0 ? (
              <p className="text-gray-500">No groups available.</p>
            ) : (
              allGroups.map(g => {
                const isFull = g.current_members >= g.size;
                return (
                  <div key={g.id} className="flex items-center justify-between bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <div>
                      <p className="font-semibold text-maroon">{g.group_name} ({g.topic})</p>
                      <p className="text-gray-700">{g.description}</p>
                      <p className="text-gray-500">{g.course} • {g.location}</p>
                      <p>Size: {g.size} • Space Available: {g.space_available - g.current_members}</p>
                    </div>
                    <button
                      disabled={isFull}
                      onClick={() => handleJoinGroup(g.id)}
                      className={`px-4 py-2 rounded hover:brightness-110 ${isFull ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-gold text-maroon"}`}
                    >
                      {isFull ? "Full" : "Join Group"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 p-6 bg-gray-50 overflow-y-auto">
          <h3 className="font-semibold text-maroon text-lg mb-3">Your Created Groups</h3>
          <ul>
            {userGroups.length === 0 ? (
              <li className="text-gray-500">You haven't created any groups yet.</li>
            ) : (
              userGroups.map(g => (
                <li key={g.id} className="flex justify-between items-center">
                  <span>{g.group_name} ({g.current_members})</span>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
