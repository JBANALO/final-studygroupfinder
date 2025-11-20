// SchedulesPage.jsx
import { useEffect, useState, useMemo } from "react";
import { gapi } from "gapi-script";
import axios from "axios";
import {
  CalendarDaysIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment-timezone";
import "react-big-calendar/lib/css/react-big-calendar.css";

/*
  Big SchedulesPage with react-big-calendar integration
  - Merges backend schedules and Google Calendar events
  - Color-coded by type (study-group themed)
  - Displays Title + time + location in event title
  - Keeps your existing form and upcoming list
*/

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const API_KEY = "YOUR_GOOGLE_API_KEY";
const SCOPES =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
];
const API_BASE = "http://localhost:3000"; // change if backend uses other port

// timezone
const TZ = "Asia/Manila";
moment.tz.setDefault(TZ);
const localizer = momentLocalizer(moment);

// color map for types (study-group themed)
const TYPE_COLORS = {
  group: "#7a1422", // maroon-ish
  personal: "#f6c555", // gold/yellow
  exam: "#e53e3e", // red
  task: "#16a34a", // green
  google: "#f6c555", // google events default to personal/gold
  default: "#7a1422",
};

export default function SchedulesPage() {
  const userId = localStorage.getItem("userId") || null;

  // UI & Auth
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loadingGapi, setLoadingGapi] = useState(true);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");

  // attendees / groups (keeps prior functionality)
  const [attendeeEmailInput, setAttendeeEmailInput] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // schedules state
  const [backendSchedules, setBackendSchedules] = useState([]);
  const [mergedSchedules, setMergedSchedules] = useState([]); // normalized merged items
  const [calendarEvents, setCalendarEvents] = useState([]); // mapped for react-big-calendar

  // misc UI
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMerge, setLoadingMerge] = useState(false);
  const [error, setError] = useState(null);

  // initialize gapi
  useEffect(() => {
    const init = async () => {
      try {
        await gapi.load("client:auth2");
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });

        const auth = gapi.auth2.getAuthInstance();
        setIsSignedIn(auth.isSignedIn.get());
        auth.isSignedIn.listen((val) => setIsSignedIn(val));
      } catch (e) {
        console.error("gapi init error", e);
      } finally {
        setLoadingGapi(false);
      }
    };

    init();
    fetchUserGroups();
    fetchBackendSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch groups for attendee autofill (non-blocking)
  const fetchUserGroups = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/group/user/${userId}`);
      const myGroups = res.data.groups || res.data || [];
      setGroups(myGroups);
    } catch (e) {
      console.warn("Could not fetch groups for attendees autofill", e);
    }
  };

  // fetch backend schedules then merge
  const fetchBackendSchedules = async () => {
    if (!userId) {
      setBackendSchedules([]);
      return;
    }
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE}/api/schedules/user/${userId}`);
      const backend = res.data.schedules || res.data || [];
      setBackendSchedules(backend);
      // merge with Google when possible
      if (isSignedIn) {
        setLoadingMerge(true);
        const merged = await mergeWithGoogleEvents(backend);
        setMergedSchedules(merged);
        setLoadingMerge(false);
      } else {
        // normalize backend for display
        setMergedSchedules(normalizeBackend(backend));
      }
    } catch (e) {
      console.error("Failed to fetch schedules", e);
      setError("Failed to load schedules");
    } finally {
      setRefreshing(false);
    }
  };

  // on sign-in state change, refresh merged schedules
  useEffect(() => {
    fetchBackendSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // normalize backend schedule objects
  const normalizeBackend = (backendList) =>
    (backendList || []).map((s) => ({
      source: "local",
      id: s.id || s._id || null,
      googleEventId: s.googleEventId || null,
      title: s.title,
      description: s.description || "",
      start: s.start,
      end: s.end,
      location: s.location || "",
      attendees: s.attendees || [],
      type: s.type || "group", // allow backend to provide type: group|personal|exam|task
    }));

  // Merge backend + google events
  const mergeWithGoogleEvents = async (backendList) => {
    try {
      const normalizedBackend = normalizeBackend(backendList);

      // fetch Google events for +/- 30 days
      const now = new Date();
      const timeMin = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const resp = await gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
      });

      const googleEventsRaw = resp.result.items || [];

      const googleEvents = googleEventsRaw.map((ev) => ({
        source: "google",
        googleEventId: ev.id,
        title: ev.summary || "(No title)",
        description: ev.description || "",
        // prefer dateTime, fallback to date (all-day)
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        location: ev.location || "",
        attendees: (ev.attendees || []).map((a) => ({ email: a.email })),
        type: "personal", // treat google events as personal by default
      }));

      // Index backend by googleEventId
      const byGoogleId = {};
      normalizedBackend.forEach((b) => {
        if (b.googleEventId) byGoogleId[b.googleEventId] = b;
      });

      // Start merged with backend items (authoritative)
      const merged = [...normalizedBackend];

      // Add google events that don't exist in backend
      googleEvents.forEach((g) => {
        if (!byGoogleId[g.googleEventId]) {
          merged.push(g);
        }
      });

      // Sort by start time
      merged.sort((a, b) => new Date(a.start) - new Date(b.start));

      return merged;
    } catch (e) {
      console.error("Failed to merge with Google events", e);
      return normalizeBackend(backendList);
    }
  };

  // Map mergedSchedules -> react-big-calendar events
  useEffect(() => {
    const mapped = (mergedSchedules || []).map((s) => {
      // parse start/end that may be date-only or dateTime strings
      let startDate = s.start ? new Date(s.start) : new Date();
      let endDate = s.end ? new Date(s.end) : new Date(startDate.getTime() + 60 * 60 * 1000);

      // Build display title: Title — time → time @ Location
      // For all-day events (date-only), show date only.
      const isAllDay =
        String(s.start).length <= 10 && String(s.end).length <= 10 && !s.start.includes("T");

      const startTimeStr = isAllDay
        ? new Date(s.start).toLocaleDateString("en-PH")
        : moment(startDate).format("h:mm A");
      const endTimeStr = isAllDay ? "" : moment(endDate).format("h:mm A");

      const timePart = isAllDay ? `${startTimeStr}` : `${startTimeStr} → ${endTimeStr}`;
      const locPart = s.location ? ` @ ${s.location}` : "";

      const titleText = `${s.title}${locPart ? " – " + timePart + locPart : " – " + timePart}`;

      // Determine type/color
      const typeKey = s.type || (s.source === "google" ? "google" : "group");
      const color = TYPE_COLORS[typeKey] || TYPE_COLORS.default;

      return {
        ...s,
        title: titleText,
        start: startDate,
        end: endDate,
        allDay: isAllDay,
        _bgColor: color,
        _typeKey: typeKey,
      };
    });

    setCalendarEvents(mapped);
  }, [mergedSchedules]);

  // Calendar event style getter (color coding)
  const eventStyleGetter = (event) => {
    const backgroundColor = event._bgColor || TYPE_COLORS.default;
    const style = {
      backgroundColor,
      borderRadius: "6px",
      color: typeIsDark(backgroundColor) ? "white" : "black",
      border: "none",
      padding: "2px 4px",
      fontSize: "0.85rem",
    };
    return { style };
  };

  // small util: determine if backgroundColor is dark for text color
  const typeIsDark = (hex) => {
    if (!hex) return true;
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    // luminance
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 140;
  };

  // map user input attendees
  const addAttendeeFromInput = () => {
    const email = attendeeEmailInput.trim();
    if (!email) return;
    const re = /\S+@\S+\.\S+/;
    if (!re.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!attendees.find((a) => a.email === email)) {
      setAttendees((prev) => [...prev, { email }]);
    }
    setAttendeeEmailInput("");
  };

  const removeAttendee = (email) => {
    setAttendees((prev) => prev.filter((a) => a.email !== email));
  };

  const fetchGroupMembers = async (groupId) => {
    if (!groupId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/group/${groupId}/members`);
      const members = res.data.members || res.data || [];
      const mapped = members.map((m) => ({ email: m.email })).filter(Boolean);
      setAttendees((prev) => {
        const merged = [...prev];
        mapped.forEach((a) => {
          if (!merged.find((p) => p.email === a.email)) merged.push(a);
        });
        return merged;
      });
    } catch (e) {
      console.warn("Failed to fetch group members; backend may not have endpoint", e);
      alert("Unable to load group members. You can still type attendee emails manually.");
    }
  };

  // create google event (with attendees) and return googleEventId
  const createGoogleEvent = async ({
    title,
    description,
    startISO,
    endISO,
    location,
    attendees: attendeesArr,
  }) => {
    try {
      const auth = gapi.auth2.getAuthInstance();
      if (!auth || !auth.isSignedIn.get()) return null;

      const eventPayload = {
        summary: title,
        description: description || "",
        start: { dateTime: startISO, timeZone: TZ },
        end: { dateTime: endISO, timeZone: TZ },
        location: location || "",
        attendees: attendeesArr && attendeesArr.length ? attendeesArr : undefined,
      };

      const resp = await gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: eventPayload,
      });

      return resp.result?.id || null;
    } catch (e) {
      console.error("Google Calendar insert error:", e);
      return null;
    }
  };

  // save to backend
  const saveScheduleToBackend = async (payload) => {
    try {
      const res = await axios.post(`${API_BASE}/api/schedules`, payload);
      return res.data;
    } catch (e) {
      console.error("Failed to save schedule to backend", e);
      throw e;
    }
  };

  // create schedule handler with validation + attendees + google sync
  const handleCreate = async () => {
    if (!userId) {
      alert("You must be logged in (app account) to create schedules.");
      return;
    }
    if (!title || !start || !end) {
      alert("Please provide at least a title, start and end time.");
      return;
    }
    const startDt = new Date(start);
    const endDt = new Date(end);
    if (endDt <= startDt) {
      alert("End time must be later than start time.");
      return;
    }

    setSaving(true);
    setError(null);

    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();

    // attendees array of {email}
    const attendeesPayload = attendees.map((a) => ({ email: a.email }));

    let googleEventId = null;
    if (isSignedIn) {
      googleEventId = await createGoogleEvent({
        title,
        description,
        startISO,
        endISO,
        location,
        attendees: attendeesPayload,
      });
      if (!googleEventId) {
        console.warn("Google event create failed — will still save to backend.");
      }
    }

    // payload
    const payload = {
      userId,
      title,
      description,
      start: startISO,
      end: endISO,
      location,
      googleEventId,
      attendees: attendeesPayload,
      // allow type classification (default to 'group')
      type: "group",
    };

    try {
      await saveScheduleToBackend(payload);
      // reset form
      setTitle("");
      setDescription("");
      setStart("");
      setEnd("");
      setLocation("");
      setAttendees([]);
      setAttendeeEmailInput("");
      setSelectedGroupId("");
      // refresh schedules
      fetchBackendSchedules();
      alert("Schedule created" + (googleEventId ? " and added to your Google Calendar." : "."));
    } catch (e) {
      setError("Failed to save schedule in backend.");
      alert("Failed to save schedule to backend. Check console.");
    } finally {
      setSaving(false);
    }
  };

  // sign in / out
  const signIn = async () => {
    try {
      const auth = gapi.auth2.getAuthInstance();
      await auth.signIn();
      setIsSignedIn(auth.isSignedIn.get());
      fetchBackendSchedules();
    } catch (e) {
      console.error("Sign in failed", e);
      alert("Google sign-in failed. Check console.");
    }
  };

  const signOut = async () => {
    try {
      const auth = gapi.auth2.getAuthInstance();
      await auth.signOut();
      setIsSignedIn(auth.isSignedIn.get());
      fetchBackendSchedules();
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  // Calendar event click handler
  const onSelectEvent = (ev) => {
    // show details quickly; replace with a modal if you want
    const startStr = moment(ev.start).format("ddd, MMM D, YYYY h:mm A");
    const endStr = moment(ev.end).format("ddd, MMM D, YYYY h:mm A");
    const attendeesList = (ev.attendees || []).map((a) => a.email || a).join(", ") || "None";
    alert(
      `${ev.title.replace(/\s{2,}/g, " ")}\n\n${ev.description || ""}\n\nWhen: ${startStr} → ${endStr}\nLocation: ${
        ev.location || "None"
      }\nAttendees: ${attendeesList}`
    );
  };

  // legend component (small)
  const Legend = () => (
    <div className="flex gap-3 items-center text-xs mb-2">
      <LegendItem color={TYPE_COLORS.group} label="Group" />
      <LegendItem color={TYPE_COLORS.personal} label="Personal / Google" />
      <LegendItem color={TYPE_COLORS.exam} label="Exam" />
      <LegendItem color={TYPE_COLORS.task} label="Task" />
    </div>
  );
  const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-2">
      <div style={{ width: 14, height: 10, background: color, borderRadius: 4 }} />
      <div>{label}</div>
    </div>
  );

  // derive calendar default view and events via memo
  const calendarView = useMemo(() => ["month", "week", "day"], []);
  useEffect(() => {
    setCalendarEvents(
      (mergedSchedules || []).map((s) => ({
        ...s,
        start: s.start ? new Date(s.start) : new Date(),
        end: s.end ? new Date(s.end) : new Date(new Date(s.start).getTime() + 60 * 60 * 1000),
      }))
    );
  }, [mergedSchedules]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-maroon">Schedules</h1>
          <p className="text-sm text-gray-600">
            Create study sessions, invite attendees and view merged calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loadingGapi ? (
            <button
              className="px-3 py-1 bg-gray-200 rounded flex items-center gap-2 text-sm"
              disabled
            >
              <ArrowPathIcon className="w-4 h-4 animate-spin text-gray-600" />
              Loading Google...
            </button>
          ) : isSignedIn ? (
            <button
              onClick={signOut}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:brightness-90"
            >
              Sign out (Calendar)
            </button>
          ) : (
            <button
              onClick={signIn}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:brightness-90"
            >
              Sign in with Google (Calendar)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Form */}
        <div className="lg:col-span-1 bg-white border rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-maroon mb-3">Create Session</h2>

          <label className="block text-sm text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded border mt-1 mb-3"
            placeholder="e.g. IT312 Group Study"
          />

          <label className="block text-sm text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded border mt-1 mb-3"
            placeholder="Optional details"
            rows={3}
          />

          <div className="mb-3">
            <label className="block text-sm text-gray-700">Start (local)</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full p-2 rounded border mt-1"
            />
            <small className="text-xs text-gray-500">Timezone: {TZ}</small>
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-700">End (local)</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full p-2 rounded border mt-1"
            />
          </div>

          <label className="block text-sm text-gray-700">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 rounded border mt-1 mb-3"
            placeholder="e.g. Library / Google Meet link"
          />

          <label className="block text-sm text-gray-700 mt-2">Attendees (emails)</label>
          <div className="flex gap-2 mb-2">
            <input
              value={attendeeEmailInput}
              onChange={(e) => setAttendeeEmailInput(e.target.value)}
              className="flex-1 p-2 rounded border"
              placeholder="name@example.com"
            />
            <button
              onClick={addAttendeeFromInput}
              type="button"
              className="px-3 py-2 bg-maroon text-white rounded"
            >
              Add
            </button>
          </div>

          {attendees.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {attendees.map((a) => (
                  <div
                    key={a.email}
                    className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2 text-xs"
                  >
                    <span>{a.email}</span>
                    <button
                      onClick={() => removeAttendee(a.email)}
                      className="text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block text-sm text-gray-700">Add members from group</label>
          <div className="flex gap-2 mb-4">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="flex-1 p-2 rounded border"
            >
              <option value="">Select a group (optional)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!selectedGroupId) {
                  alert("Choose a group first.");
                  return;
                }
                fetchGroupMembers(selectedGroupId);
              }}
              className="px-3 py-2 bg-gold text-maroon rounded border"
            >
              Add Members
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-maroon text-white px-3 py-2 rounded hover:brightness-90"
            >
              {saving ? "Saving…" : "Create & Save"}
            </button>

            <button
              onClick={() => {
                setTitle("");
                setDescription("");
                setStart("");
                setEnd("");
                setLocation("");
                setAttendees([]);
                setAttendeeEmailInput("");
                setSelectedGroupId("");
              }}
              className="px-3 py-2 border rounded"
            >
              Clear
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Events saved to backend and (if signed-in) to Google Calendar.
          </p>
        </div>

        {/* Upcoming list */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-semibold text-maroon">Upcoming Sessions</h2>
              <Legend />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchBackendSchedules}
                className="text-sm px-2 py-1 border rounded flex items-center gap-2"
                disabled={refreshing}
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {loadingMerge && <p className="text-sm text-gray-600 mb-2">Merging Google Calendar events...</p>}

          {/* react-big-calendar */}
          <div style={{ height: 550 }}>
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              defaultView="month"
              views={calendarView}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={onSelectEvent}
              popup
              tooltipAccessor={(event) => `${event.title}\n${event.location || ""}`}
            />
          </div>

          {/* small upcoming list below calendar (keeps original list) */}
          <div className="mt-4">
            {mergedSchedules.length === 0 ? (
              <p className="text-sm text-gray-600">No scheduled sessions yet.</p>
            ) : (
              <ul className="space-y-3">
                {mergedSchedules.map((s) => {
                  const startTime = new Date(s.start).toLocaleString("en-PH", {
                    timeZone: TZ,
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
                  const endTime = new Date(s.end).toLocaleString("en-PH", {
                    timeZone: TZ,
                    dateStyle: "medium",
                    timeStyle: "short",
                  });

                  return (
                    <li
                      key={s.id || s._id || s.googleEventId || `${s.start}-${s.title}`}
                      className="p-3 border rounded"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-maroon">{s.title}</div>
                          <div className="text-xs text-gray-600">{s.description}</div>

                          <div className="text-xs text-gray-700 mt-2">
                            <CalendarDaysIcon className="inline-block w-4 h-4 mr-1" />
                            {startTime} — {endTime}
                          </div>

                          {s.location && (
                            <div className="text-xs text-gray-700 mt-1">
                              Location: {s.location}
                            </div>
                          )}

                          {s.attendees && s.attendees.length > 0 && (
                            <div className="text-xs text-gray-700 mt-1">
                              Attendees: {s.attendees.map((a) => a.email || a).join(", ")}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {s.googleEventId ? "Synced (Google)" : "Local"}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
