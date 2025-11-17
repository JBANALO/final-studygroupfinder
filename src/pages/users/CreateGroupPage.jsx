import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [spaceAvailable, setSpaceAvailable] = useState("");
  const [message, setMessage] = useState(""); 

  const createdBy = 1; 

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/api/group/create", {
        group_name: groupName,
        description,
        created_by: createdBy,
        course,
        topic,
        location,
        size: Number(size),
        space_available: Number(spaceAvailable) || 1,
      });

      toast.success(response.data.message || "Group created successfully!");

      setGroupName("");
      setDescription("");
      setCourse("");
      setTopic("");
      setLocation("");
      setSize("");
      setSpaceAvailable("");

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden text-maroon">
      <div className="flex-1 p-10 flex flex-col overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Create a Study Group</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full p-3 rounded bg-gray-200 focus:ring-2 focus:ring-gold"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded bg-gray-200 focus:ring-2 focus:ring-gold h-24 resize-none"
          ></textarea>

          <input
            type="text"
            placeholder="Course (e.g., Math 143)"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full p-3 rounded bg-gray-200 focus:ring-2 focus:ring-gold"
          />

          <input
            type="text"
            placeholder="Topic (e.g., Chapter 5: Algebraic Expressions)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 rounded bg-gray-200 focus:ring-2 focus:ring-gold"
          />

          <input
            type="text"
            placeholder="Location (e.g., Library Room 2)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-3 rounded bg-gray-200 focus:ring-2 focus:ring-gold"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Group Size (e.g., 8)"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full p-3 rounded bg-gray-200 focus:ring-2 focus:ring-gold"
            />
            <input
              type="number"
              placeholder="Space Available (e.g., 3)"
              value={spaceAvailable}
              onChange={(e) => setSpaceAvailable(e.target.value)}
              className="w-full p-3 rounded bg-gray-200 focus:ring-2 focus:ring-gold"
            />
          </div>

          <button className="w-full bg-maroon text-white py-3 rounded-lg hover:brightness-110 font-semibold">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
}
