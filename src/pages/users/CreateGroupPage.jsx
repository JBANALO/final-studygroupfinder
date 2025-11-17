import { useState } from "react";
import axios from "axios";

export default function CreateGroupPage({ onGroupCreated, currentUserId }) {
  const [groupData, setGroupData] = useState({
    group_name: "",
    description: "",
    course: "",
    topic: "",
    location: "",
    size: "",
  });

  const handleChange = (e) => setGroupData({ ...groupData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/group/create", { ...groupData, created_by: currentUserId });
      alert("Group created successfully!");
      setGroupData({ group_name: "", description: "", course: "", topic: "", location: "", size: "" });
      onGroupCreated(); // triggers dashboard refresh
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create group");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="group_name" value={groupData.group_name} onChange={handleChange} placeholder="Group Name" className="w-full p-3 rounded bg-gray-200" />
      <textarea name="description" value={groupData.description} onChange={handleChange} placeholder="Description" className="w-full p-3 rounded bg-gray-200 h-24" />
      <input name="course" value={groupData.course} onChange={handleChange} placeholder="Course" className="w-full p-3 rounded bg-gray-200" />
      <input name="topic" value={groupData.topic} onChange={handleChange} placeholder="Topic" className="w-full p-3 rounded bg-gray-200" />
      <input name="location" value={groupData.location} onChange={handleChange} placeholder="Location" className="w-full p-3 rounded bg-gray-200" />
      <input name="size" value={groupData.size} onChange={handleChange} placeholder="Group Size" className="w-full p-3 rounded bg-gray-200" />
      <button type="submit" className="w-full bg-maroon text-white py-3 rounded-lg">Create Group</button>
    </form>
  );
}
