"use client";

import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      window.location.href = "/admin";
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, usersRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/users"),
      ]);

      const eventsData = await eventsRes.json();
      const usersData = await usersRes.json();

      setEvents(eventsData);
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete event");

      setEvents(events.filter((e) => e.id !== id));
      alert("Event deleted successfully");
    } catch (error) {
      alert("Error deleting event: " + error.message);
    }
  };

  const handleVerifyUser = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: true }),
      });

      if (!response.ok) throw new Error("Failed to verify user");

      setUsers(
        users.map((u) => (u.id === id ? { ...u, is_verified: true } : u)),
      );
      alert("User verified successfully");
    } catch (error) {
      alert("Error verifying user: " + error.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers(users.filter((u) => u.id !== id));
      alert("User deleted successfully");
    } catch (error) {
      alert("Error deleting user: " + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111]">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#222222] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://ucarecdn.com/32afcda9-7aef-451f-a137-37de029f8cf5/-/format/auto/"
              alt="Scene Logo"
              className="w-12 h-12"
            />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-[#FF5E5B] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FF5E5B]/90"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "events"
                ? "bg-[#FF5E5B] text-white"
                : "bg-[#222222] text-white/60 hover:text-white"
            }`}
          >
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "users"
                ? "bg-[#7B61FF] text-white"
                : "bg-[#222222] text-white/60 hover:text-white"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("popups")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "popups"
                ? "bg-[#FFD23F] text-black"
                : "bg-[#222222] text-white/60 hover:text-white"
            }`}
          >
            Pop-Ups
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === "events" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">All Events</h2>
              <button
                onClick={() => setShowAddEvent(true)}
                className="bg-[#FF5E5B] text-white px-6 py-2 rounded-lg font-semibold"
              >
                + Add Pop-Up Event
              </button>
            </div>

            <div className="grid gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-[#1A1A1A] rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">
                        {event.title}
                      </h3>
                      <p className="text-white/60 text-sm">{event.location}</p>
                      <p className="text-white/60 text-sm">
                        {new Date(event.event_date).toLocaleDateString()} at{" "}
                        {event.event_time}
                      </p>
                      {event.is_admin_created && (
                        <span className="inline-block bg-[#FFD23F] text-black text-xs px-2 py-1 rounded mt-2">
                          Admin Created
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {event.vibe_tags && event.vibe_tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {event.vibe_tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-[#222222] text-white/80 text-xs px-3 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">All Users</h2>
            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#1A1A1A] rounded-lg p-6 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      @{user.username}
                    </h3>
                    <p className="text-white/60 text-sm mb-2">
                      {user.city} • {user.account_type}
                    </p>
                    {user.is_verified && (
                      <span className="inline-block bg-[#7B61FF] text-white text-xs px-2 py-1 rounded">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!user.is_verified && user.account_type === "promoter" && (
                      <button
                        onClick={() => handleVerifyUser(user.id)}
                        className="bg-[#7B61FF] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pop-Ups Tab */}
        {activeTab === "popups" && (
          <AddPopUpForm
            onSuccess={() => {
              fetchData();
              setActiveTab("events");
            }}
          />
        )}
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <AddEventModal
          onClose={() => setShowAddEvent(false)}
          onSuccess={() => {
            setShowAddEvent(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function AddEventModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    event_time: "",
    flyer_image: "",
    external_rsvp_link: "",
    city: "New York City",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          vibe_tags: ["Pop Up"],
          is_admin_created: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to create event");

      alert("Pop-up event created successfully!");
      onSuccess();
    } catch (error) {
      alert("Error: " + error.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Add Pop-Up Event</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3 min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                className="w-full bg-[#222222] text-white rounded-lg px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Time *
              </label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) =>
                  setFormData({ ...formData, event_time: e.target.value })
                }
                className="w-full bg-[#222222] text-white rounded-lg px-4 py-3"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              Flyer Image URL
            </label>
            <input
              type="url"
              value={formData.flyer_image}
              onChange={(e) =>
                setFormData({ ...formData, flyer_image: e.target.value })
              }
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              External RSVP Link
            </label>
            <input
              type="url"
              value={formData.external_rsvp_link}
              onChange={(e) =>
                setFormData({ ...formData, external_rsvp_link: e.target.value })
              }
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3"
              placeholder="https://eventbrite.com/..."
            />
            <p className="text-white/60 text-xs mt-1">
              If provided, users will be redirected here to RSVP
            </p>
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              City *
            </label>
            <select
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3"
              required
            >
              <option value="New York City">New York City</option>
              <option value="Miami">Miami</option>
              <option value="Los Angeles">Los Angeles</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#222222] text-white py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#FFD23F] text-black py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Pop-Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddPopUpForm({ onSuccess }) {
  return (
    <div className="bg-[#1A1A1A] rounded-lg p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-4">Manage Pop-Ups</h2>
      <p className="text-white/60 mb-6">
        Pop-up events are special brand activations, food pop-ups, fashion
        events, and art installations. They appear in the dedicated Pop-Ups tab
        and can have external RSVP links.
      </p>
      <p className="text-white/80 text-sm">
        Click "Add Pop-Up Event" above to create a new pop-up. Pop-ups will
        automatically be tagged and won't have RSVP buttons unless you provide
        an external RSVP link.
      </p>
    </div>
  );
}
