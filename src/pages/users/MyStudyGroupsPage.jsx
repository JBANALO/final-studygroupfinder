import { useState, useEffect } from "react";
import axios from "axios";

export default function MyStudyGroupsPage() {
  const [groups, setGroups] = useState([]);

  // Fetch all groups on mount
  const fetchGroups = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/group/list");
      if (res.data.success) setGroups(res.data.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">All Study Groups</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.id} className="bg-white p-5 rounded shadow text-maroon">
              <h2 className="text-xl font-bold">{group.group_name}</h2>
              <p className="text-gray-600">{group.description}</p>
              <p className="text-sm mt-2">
                Course: {group.course} | Topic: {group.topic} | Location: {group.location}
              </p>
              <p className="text-sm mt-1">
                Size: {group.size} | Space Available: {group.space_available}
              </p>
            </div>
          ))
        ) : (
          <p>No groups created yet.</p>
        )}
      </div>
    </div>
  );
}
