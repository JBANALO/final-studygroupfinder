import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import {
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { gapi } from "gapi-script";
import axios from "axios";

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const API_KEY = "YOUR_GOOGLE_API_KEY";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

const socket = io("http://localhost:3000");

export default function GroupChatPage() {
  const userId = localStorage.getItem("userId") || 1;
  const userName = localStorage.getItem("userName") || "You";

  const [channels, setChannels] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [groupsData, setGroupsData] = useState([]);
  const [showSignInModal, setShowSignInModal] = useState(false);

  const fileInputRef = useRef(null);

  // Google API init
  useEffect(() => {
    gapi.load("client:auth2", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      });
      const auth = gapi.auth2.getAuthInstance();
      setIsSignedIn(auth.isSignedIn.get());
      auth.isSignedIn.listen(setIsSignedIn);
    });
  }, []);

  // Fetch user groups
  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/group/user/${userId}`);
        const myGroups = res.data.groups || [];
        setGroupsData(myGroups);
        setChannels(myGroups.map((g) => ({ id: g.id, name: g.group_name, unread: 0 })));
        if (myGroups.length > 0) selectGroup(myGroups[0].id);
      } catch (err) {
        console.error("Failed to fetch your groups:", err);
      }
    };
    fetchMyGroups();
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receive_message", (data) => {
      if (selectedChat && data.groupId === selectedChat.id) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        setChannels((prev) =>
          prev.map((c) => (c.id === data.groupId ? { ...c, unread: c.unread + 1 } : c))
        );
      }
    });
    return () => socket.off("receive_message");
  }, [selectedChat]);

  const selectGroup = async (groupId) => {
    const group = groupsData.find((g) => g.id === groupId);
    setSelectedChat(group);
    socket.emit("join_group", groupId);
    setChannels((prev) => prev.map((c) => (c.id === groupId ? { ...c, unread: 0 } : c)));

    try {
      const res = await axios.get(`http://localhost:3000/api/group/${groupId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    }
  };

  const signIn = async () => {
    const auth = gapi.auth2.getAuthInstance();
    await auth.signIn();
    setIsSignedIn(auth.isSignedIn.get());
    setShowSignInModal(false);
  };

  const signOut = async () => {
    const auth = gapi.auth2.getAuthInstance();
    await auth.signOut();
    setIsSignedIn(auth.isSignedIn.get());
  };

  // Upload file to Google Drive
  const uploadToDriveAndSend = async (file) => {
    if (!selectedChat) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const auth = gapi.auth2.getAuthInstance();
      if (!auth.isSignedIn.get()) {
        setShowSignInModal(true);
        setUploading(false);
        return;
      }
      const token = auth.currentUser.get().getAuthResponse().access_token;

      const metadata = { name: file.name, mimeType: file.type };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onreadystatechange = async () => {
        if (xhr.readyState === 4) {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status !== 200) {
            alert("Upload failed. Check console.");
            console.error(res);
            setUploading(false);
            return;
          }

          await fetch(`https://www.googleapis.com/drive/v3/files/${res.id}/permissions`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ role: "reader", type: "anyone" }),
          });

          const link = `https://drive.google.com/file/d/${res.id}/view`;
          const newMsg = {
            sender: userName,
            text: `📎 ${file.name}`,
            fileLink: link,
            time: new Date().toLocaleTimeString(),
          };

          socket.emit("send_message", { groupId: selectedChat.id, message: newMsg });
          setMessages((prev) => [...prev, newMsg]);
          setUploading(false);
          setUploadProgress(0);
        }
      };

      xhr.open("POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(form);
    } catch (e) {
      console.error(e);
      alert("File upload failed. Check console.");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadToDriveAndSend(file);
    e.target.value = "";
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    if (!selectedChat) return;

    const newMsg = {
      sender: userName,
      text: inputText.trim(),
      fileLink: null,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", { groupId: selectedChat.id, message: newMsg });
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  return (
    <>
      {/* Sign-in Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowSignInModal(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Sign in Required</h2>
            <p className="text-sm mb-4">
              You must sign in to Google Drive to upload files.
            </p>
            <button
              onClick={signIn}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign in to Drive
            </button>
          </div>
        </div>
      )}

      {/* Top-right sign-in/out */}
      <div className="fixed top-4 right-4 z-10 flex flex-col items-end gap-2">
        {!isSignedIn && (
          <button
            onClick={signIn}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Sign in to Google Drive
          </button>
        )}
        {isSignedIn && (
          <button
            onClick={signOut}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Sign out from Drive
          </button>
        )}
      </div>

      {/* Main UI */}
      <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white border border-gray-300 shadow-xl rounded-xl overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-maroon text-white p-4 flex flex-col">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6" /> Study Groups
          </h2>
          <ul className="flex-1 space-y-2">
            {channels.map((group) => (
              <li
                key={group.id}
                onClick={() => selectGroup(group.id)}
                className={`cursor-pointer p-2 rounded-lg flex justify-between items-center ${
                  selectedChat?.id === group.id
                    ? "bg-gold text-maroon font-semibold"
                    : "hover:bg-white hover:text-maroon"
                }`}
              >
                <span>{group.name}</span>
                {group.unread > 0 && selectedChat?.id !== group.id && (
                  <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {group.unread}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* Chat Main */}
        <main className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-maroon" />
            <h2 className="font-semibold text-maroon">{selectedChat?.name || "Select a group"}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-sm">
                <p className="font-semibold text-maroon">{msg.sender}</p>
                <div className="bg-gray-200 p-3 rounded-lg inline-block text-gray-800 max-w-xs">
                  {msg.text}
                  {msg.fileLink && (
                    <a
                      href={msg.fileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-blue-600 underline text-xs"
                    >
                      View file
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{msg.time}</p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t flex flex-col gap-2">
            {uploading && (
              <div className="w-full bg-gray-300 h-2 rounded mb-2">
                <div
                  className="bg-maroon h-2 rounded"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isSignedIn) setShowSignInModal(true);
                  else fileInputRef.current.click();
                }}
                disabled={uploading}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <PaperClipIcon className="h-5 w-5 text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-lg bg-gray-200 focus:ring-2 focus:ring-gold outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={uploading || !inputText.trim()}
                className="bg-maroon text-white px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-70"
              >
                {uploading ? "Uploading…" : "Send"}
              </button>
            </div>
          </div>
        </main>

        {/* Right Info Panel */}
        <aside className="w-80 bg-gray-100 p-4 border-l flex flex-col justify-between">
          {selectedChat ? (
            <div>
              <h3 className="font-semibold text-maroon text-lg mb-3">{selectedChat.name}</h3>
              <p className="text-gray-700 text-sm mb-4">{selectedChat.description}</p>
            </div>
          ) : (
            <p className="text-gray-500">Select a group to see info</p>
          )}
        </aside>
      </div>
    </>
  );
}
