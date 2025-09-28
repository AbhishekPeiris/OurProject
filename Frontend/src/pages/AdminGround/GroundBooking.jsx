import React, { useState, useEffect } from "react";
import { Brand } from "../../brand.js";

const GroundBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter and pagination states
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("bookingDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    customerId: "",
    groundId: "",
    groundSlot: 1,
    bookingDate: "",
    startTime: "",
    endTime: "",
    duration: 120,
    bookingType: "practice",
    specialRequirements: [],
    notes: "",
    amount: 0,
    status: "pending",
  });

  // Add new state for availability checking
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isSlotAvailable, setIsSlotAvailable] = useState(true);

  // Add user search state
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    fetchBookings();
    fetchGrounds();
    fetchUsers();
  }, [filter, currentPage, sortBy, sortOrder]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(filter !== "all" && { status: filter }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      });

      const response = await fetch(`/api/bookings?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError("Failed to fetch bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchGrounds = async () => {
    try {
      const response = await fetch("/api/grounds");
      const data = await response.json();
      if (data.success) {
        setGrounds(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching grounds:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      // First try with authentication
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      if (userInfo && userInfo.token) {
        const response = await fetch("/api/users", {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUsers(data.data || []);
            return;
          }
        }
      }

      // If authenticated request fails, try creating some sample users for development
      console.warn(
        "Could not fetch users from API, using sample data for development"
      );

      // Create sample users for development/testing
      const sampleUsers = [
        {
          _id: "sample1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          username: "johndoe",
          role: "customer",
        },
        {
          _id: "sample2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          username: "janesmith",
          role: "customer",
        },
        {
          _id: "sample3",
          firstName: "Mike",
          lastName: "Johnson",
          email: "mike.johnson@example.com",
          username: "mikejohnson",
          role: "customer",
        },
      ];

      setUsers(sampleUsers);
    } catch (err) {
      console.error("Error fetching users:", err);

      // Fallback to sample data
      const sampleUsers = [
        {
          _id: "fallback1",
          firstName: "Sample",
          lastName: "User",
          email: "sample@example.com",
          username: "sampleuser",
          role: "customer",
        },
      ];

      setUsers(sampleUsers);
    }
  };

  // Add availability checking function
  const checkSlotAvailability = async () => {
    if (
      !formData.groundId ||
      !formData.groundSlot ||
      !formData.bookingDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setAvailabilityMessage("");
      return;
    }

    try {
      setAvailabilityChecking(true);
      setAvailabilityMessage("");

      const params = new URLSearchParams({
        groundId: formData.groundId,
        groundSlot: formData.groundSlot,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      const response = await fetch(
        `/api/bookings/check-availability?${params}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.available) {
          setAvailabilityMessage("✅ This time slot is available for booking!");
          setIsSlotAvailable(true);
          setError("");
        } else {
          setAvailabilityMessage("❌ " + data.message);
          setIsSlotAvailable(false);

          // Show detailed conflict information if available
          if (data.conflicts && data.conflicts.length > 0) {
            const conflict = data.conflicts[0];
            setAvailabilityMessage(
              `❌ Slot ${formData.groundSlot} is already booked from ${conflict.startTime} - ${conflict.endTime} by ${conflict.customerName}. Please choose a different time or slot.`
            );
          }
        }
      } else {
        setError("Failed to check availability");
        setIsSlotAvailable(false);
      }
    } catch (err) {
      console.error("Error checking availability:", err);
      setError("Error checking availability");
      setIsSlotAvailable(false);
    } finally {
      setAvailabilityChecking(false);
    }
  };

  // Add useEffect to check availability when form data changes
  useEffect(() => {
    if (
      formData.groundId &&
      formData.groundSlot &&
      formData.bookingDate &&
      formData.startTime &&
      formData.endTime
    ) {
      const debounceTimer = setTimeout(() => {
        checkSlotAvailability();
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    } else {
      setAvailabilityMessage("");
      setIsSlotAvailable(true);
    }
  }, [
    formData.groundId,
    formData.groundSlot,
    formData.bookingDate,
    formData.startTime,
    formData.endTime,
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        specialRequirements: checked
          ? [...prev.specialRequirements, value]
          : prev.specialRequirements.filter((req) => req !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Auto-calculate amount when ground or duration changes
      if (name === "groundId" || name === "duration") {
        const selectedGround = grounds.find(
          (g) => g._id === (name === "groundId" ? value : formData.groundId)
        );
        if (selectedGround && formData.duration) {
          const durationHours = Math.ceil(
            (name === "duration" ? parseInt(value) : formData.duration) / 60
          );
          setFormData((prev) => ({
            ...prev,
            amount: selectedGround.pricePerSlot * durationHours,
          }));
        }
      }

      // Auto-calculate end time when start time or duration changes
      if (name === "startTime" || name === "duration") {
        const startTime = name === "startTime" ? value : formData.startTime;
        const duration =
          name === "duration" ? parseInt(value) : formData.duration;

        if (startTime && duration) {
          const start = new Date(`2000-01-01T${startTime}:00`);
          const end = new Date(start.getTime() + duration * 60000);
          const endTimeString = `${end
            .getHours()
            .toString()
            .padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;

          setFormData((prev) => ({
            ...prev,
            endTime: endTimeString,
          }));
        }
      }
    }

    // Clear availability message when user changes relevant fields
    if (
      [
        "groundId",
        "groundSlot",
        "bookingDate",
        "startTime",
        "endTime",
      ].includes(e.target.name)
    ) {
      setAvailabilityMessage("");
      setIsSlotAvailable(true);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      groundId: "",
      groundSlot: 1,
      bookingDate: "",
      startTime: "",
      endTime: "",
      duration: 120,
      bookingType: "practice",
      specialRequirements: [],
      notes: "",
      amount: 0,
      status: "pending",
    });
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    // Check availability one final time before creating
    if (!isSlotAvailable) {
      setError(
        "This time slot is not available. Please choose a different time or slot."
      );
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Booking created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to create booking");
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Error creating booking");
    }
  };

  const handleEditBooking = async (e) => {
    e.preventDefault();

    // Check availability for edit (excluding current booking)
    if (!isSlotAvailable && showEditModal) {
      setError(
        "This time slot is not available. Please choose a different time or slot."
      );
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Booking updated successfully!");
        setShowEditModal(false);
        setSelectedBooking(null);
        resetForm();
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update booking");
      }
    } catch (err) {
      console.error("Error updating booking:", err);
      setError("Error updating booking");
    }
  };

  const handleDeleteBooking = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Booking deleted successfully!");
        setShowDeleteModal(false);
        setSelectedBooking(null);
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to delete booking");
      }
    } catch (err) {
      console.error("Error deleting booking:", err);
      setError("Error deleting booking");
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Booking status updated to ${newStatus}!`);
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Error updating status");
    }
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      customerId: booking.customerId._id,
      groundId: booking.groundId._id,
      groundSlot: booking.groundSlot,
      bookingDate: new Date(booking.bookingDate).toISOString().split("T")[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      bookingType: booking.bookingType,
      specialRequirements: booking.specialRequirements || [],
      notes: booking.notes || "",
      amount: booking.amount,
      status: booking.status,
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.groundId?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.customerId?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.customerId?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.bookingType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const searchTerm = userSearch.toLowerCase();
    const fullName = `${user.firstName || ""} ${
      user.lastName || ""
    }`.toLowerCase();
    const username = (user.username || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const userId = (user._id || "").toLowerCase();

    return (
      fullName.includes(searchTerm) ||
      username.includes(searchTerm) ||
      email.includes(searchTerm) ||
      userId.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg" style={{ color: Brand.body }}>
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ backgroundColor: Brand.light }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>
          Ground Booking Management
        </h1>
        <p className="text-lg" style={{ color: Brand.body }}>
          Manage all ground bookings from customers
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 mb-6 text-green-700 bg-green-100 border border-green-400 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border-2 rounded-lg focus:outline-none"
              style={{ borderColor: Brand.light }}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border-2 rounded-lg focus:outline-none"
              style={{ borderColor: Brand.light }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 rounded-lg focus:outline-none"
              style={{ borderColor: Brand.light }}
            >
              <option value="bookingDate">Booking Date</option>
              <option value="createdAt">Created Date</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 text-white transition-colors duration-200 rounded-lg hover:opacity-90"
            style={{ backgroundColor: Brand.primary }}
          >
            + Create New Booking
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full">
          <thead className="border-b" style={{ backgroundColor: Brand.light }}>
            <tr>
              <th
                className="px-6 py-4 font-semibold text-left"
                style={{ color: Brand.heading }}
              >
                Customer
              </th>
              <th
                className="px-6 py-4 font-semibold text-left"
                style={{ color: Brand.heading }}
              >
                Ground
              </th>
              <th
                className="px-6 py-4 font-semibold text-left"
                style={{ color: Brand.heading }}
              >
                Date & Time
              </th>
              <th
                className="px-6 py-4 font-semibold text-left"
                style={{ color: Brand.heading }}
              >
                Type
              </th>
              <th
                className="px-6 py-4 font-semibold text-left"
                style={{ color: Brand.heading }}
              >
                Amount
              </th>
              <th
                className="px-6 py-4 font-semibold text-left"
                style={{ color: Brand.heading }}
              >
                Status
              </th>
              <th
                className="px-6 py-4 font-semibold text-left"
                style={{ color: Brand.heading }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center"
                  style={{ color: Brand.body }}
                >
                  <div className="mb-4 text-6xl">📅</div>
                  <h3 className="mb-2 text-xl font-semibold">
                    No bookings found
                  </h3>
                  <p>
                    {searchTerm
                      ? "No bookings match your search criteria."
                      : "No bookings available yet."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: Brand.heading }}
                      >
                        {booking.customerId?.firstName}{" "}
                        {booking.customerId?.lastName}
                      </div>
                      <div className="text-sm" style={{ color: Brand.body }}>
                        {booking.customerId?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: Brand.heading }}
                      >
                        {booking.groundId?.name || "Unknown Ground"}
                      </div>
                      <div className="text-sm" style={{ color: Brand.body }}>
                        Slot {booking.groundSlot}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: Brand.heading }}
                      >
                        {formatDate(booking.bookingDate)}
                      </div>
                      <div className="text-sm" style={{ color: Brand.body }}>
                        {formatTime(booking.startTime)} -{" "}
                        {formatTime(booking.endTime)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 text-sm font-medium capitalize rounded-full"
                      style={{
                        backgroundColor: `${Brand.secondary}33`,
                        color: Brand.primary,
                      }}
                    >
                      {booking.bookingType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold" style={{ color: Brand.accent }}>
                      LKR {booking.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(booking._id, e.target.value)
                      }
                      className={`px-3 py-1 text-sm font-medium rounded-full border-0 ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(booking)}
                        className="px-3 py-1 text-sm text-white rounded hover:opacity-80"
                        style={{ backgroundColor: Brand.secondary }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDeleteModal(true);
                        }}
                        className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
            style={{ borderColor: Brand.light }}
          >
            Previous
          </button>

          <span className="px-4 py-2" style={{ color: Brand.body }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
            style={{ borderColor: Brand.light }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl font-bold"
                style={{ color: Brand.primary }}
              >
                Create New Booking
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              {/* Customer Selection with Search */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Customer *
                </label>

                {/* Add search input */}
                <input
                  type="text"
                  placeholder="Search users by name, email, or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full p-2 mb-2 text-sm border rounded-lg focus:outline-none"
                  style={{ borderColor: Brand.light }}
                />

                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  className="w-full p-3 overflow-y-auto border-2 rounded-lg focus:outline-none max-h-40"
                  style={{ borderColor: Brand.light }}
                  required
                >
                  <option value="">
                    Select Customer ({users.length} users available)
                  </option>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.firstName || user.username || "No Name"}{" "}
                        {user.lastName || ""}
                        {user.email && ` - ${user.email}`}
                        {user.role && ` (${user.role})`} - ID:{" "}
                        {user._id.slice(-6)}
                      </option>
                    ))
                  ) : userSearch ? (
                    <option disabled>
                      No users found matching "{userSearch}"
                    </option>
                  ) : (
                    <option disabled>No users available</option>
                  )}
                </select>

                {users.length === 0 && (
                  <p className="mt-1 text-sm text-orange-600">
                    ⚠️ Using sample users for development. In production, ensure
                    proper user authentication.
                  </p>
                )}

                {filteredUsers.length === 0 &&
                  userSearch &&
                  users.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No users match "{userSearch}". Try a different search
                      term.
                    </p>
                  )}
              </div>

              {/* Ground Selection */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Ground *
                </label>
                <select
                  name="groundId"
                  value={formData.groundId}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: Brand.light }}
                  required
                >
                  <option value="">Select Ground</option>
                  {grounds.map((ground) => (
                    <option key={ground._id} value={ground._id}>
                      {ground.name} - LKR {ground.pricePerSlot}/slot
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Ground Slot *
                  </label>
                  <select
                    name="groundSlot"
                    value={formData.groundSlot}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Slot {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Duration (minutes) *
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                    <option value={180}>3 Hours</option>
                    <option value={240}>4 Hours</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-100 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    readOnly
                  />
                </div>
              </div>

              {/* Booking Type and Status */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Booking Type *
                  </label>
                  <select
                    name="bookingType"
                    value={formData.bookingType}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    <option value="practice">Practice</option>
                    <option value="match">Match</option>
                    <option value="training">Training</option>
                    <option value="session">Coaching Session</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Amount (LKR) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: Brand.light }}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Special Requirements */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Special Requirements
                </label>
                <div className="flex flex-wrap gap-4">
                  {[
                    "Equipment",
                    "Lighting",
                    "Security",
                    "Catering",
                    "Photography",
                  ].map((req) => (
                    <label
                      key={req}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                      style={{ color: Brand.body }}
                    >
                      <input
                        type="checkbox"
                        value={req.toLowerCase()}
                        checked={formData.specialRequirements.includes(
                          req.toLowerCase()
                        )}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <span>{req}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 rounded-lg min-h-[80px] resize-vertical focus:outline-none"
                  style={{ borderColor: Brand.light }}
                  placeholder="Any additional information or special requests..."
                />
              </div>

              {/* Add Availability Check Display after End Time field */}
              {(availabilityChecking || availabilityMessage) && (
                <div
                  className="p-3 mb-4 border-2 rounded-lg"
                  style={{
                    backgroundColor: availabilityMessage.includes("✅")
                      ? "#f0fdf4"
                      : availabilityMessage.includes("❌")
                      ? "#fef2f2"
                      : "#f9fafb",
                    borderColor: availabilityMessage.includes("✅")
                      ? "#bbf7d0"
                      : availabilityMessage.includes("❌")
                      ? "#fecaca"
                      : "#e5e7eb",
                  }}
                >
                  {availabilityChecking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                      <span style={{ color: Brand.body }}>
                        Checking slot availability...
                      </span>
                    </div>
                  ) : (
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: availabilityMessage.includes("✅")
                          ? "#16a34a"
                          : availabilityMessage.includes("❌")
                          ? "#dc2626"
                          : Brand.body,
                      }}
                    >
                      {availabilityMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons - Updated to disable when slot not available */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                    setUserSearch(""); // Clear user search
                    setAvailabilityMessage("");
                    setIsSlotAvailable(true);
                  }}
                  className="px-6 py-3 transition-all duration-200 border-2 rounded-lg hover:bg-gray-50"
                  style={{ borderColor: Brand.light, color: Brand.body }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    availabilityChecking ||
                    !isSlotAvailable ||
                    (availabilityMessage && availabilityMessage.includes("❌"))
                  }
                  className="px-8 py-3 font-semibold text-white transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: Brand.primary }}
                >
                  {availabilityChecking ? "Checking..." : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal - Add similar availability checking */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl font-bold"
                style={{ color: Brand.primary }}
              >
                Edit Booking
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBooking(null);
                  resetForm();
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditBooking} className="space-y-4">
              {/* Customer Selection - Enhanced Display */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Customer
                </label>
                <input
                  type="text"
                  value={`${
                    selectedBooking.customerId?.firstName ||
                    selectedBooking.customerId?.username ||
                    "Unknown"
                  } ${selectedBooking.customerId?.lastName || ""} (${
                    selectedBooking.customerId?.email || "No email"
                  }) - ID: ${
                    selectedBooking.customerId?._id?.slice(-6) || "N/A"
                  }`}
                  className="w-full p-3 bg-gray-100 border-2 rounded-lg"
                  style={{ borderColor: Brand.light }}
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">
                  Customer information cannot be changed for existing bookings
                </p>
              </div>

              {/* Ground Selection */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Ground *
                </label>
                <select
                  name="groundId"
                  value={formData.groundId}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: Brand.light }}
                  required
                >
                  {grounds.map((ground) => (
                    <option key={ground._id} value={ground._id}>
                      {ground.name} - LKR {ground.pricePerSlot}/slot
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Status */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Amount and Notes */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Amount (LKR) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Booking Type *
                  </label>
                  <select
                    name="bookingType"
                    value={formData.bookingType}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    <option value="practice">Practice</option>
                    <option value="match">Match</option>
                    <option value="training">Training</option>
                    <option value="session">Coaching Session</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 rounded-lg min-h-[80px] resize-vertical focus:outline-none"
                  style={{ borderColor: Brand.light }}
                  placeholder="Any additional information or special requests..."
                />
              </div>

              {/* Add Availability Check Display for Edit Modal */}
              {(availabilityChecking || availabilityMessage) && (
                <div
                  className="p-3 mb-4 border-2 rounded-lg"
                  style={{
                    backgroundColor: availabilityMessage.includes("✅")
                      ? "#f0fdf4"
                      : availabilityMessage.includes("❌")
                      ? "#fef2f2"
                      : "#f9fafb",
                    borderColor: availabilityMessage.includes("✅")
                      ? "#bbf7d0"
                      : availabilityMessage.includes("❌")
                      ? "#fecaca"
                      : "#e5e7eb",
                  }}
                >
                  {availabilityChecking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                      <span style={{ color: Brand.body }}>
                        Checking slot availability...
                      </span>
                    </div>
                  ) : (
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: availabilityMessage.includes("✅")
                          ? "#16a34a"
                          : availabilityMessage.includes("❌")
                          ? "#dc2626"
                          : Brand.body,
                      }}
                    >
                      {availabilityMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons - Updated for edit modal */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBooking(null);
                    resetForm();
                    setAvailabilityMessage("");
                    setIsSlotAvailable(true);
                  }}
                  className="px-6 py-3 transition-all duration-200 border-2 rounded-lg hover:bg-gray-50"
                  style={{ borderColor: Brand.light, color: Brand.body }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    availabilityChecking ||
                    !isSlotAvailable ||
                    (availabilityMessage && availabilityMessage.includes("❌"))
                  }
                  className="px-8 py-3 font-semibold text-white transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: Brand.secondary }}
                >
                  {availabilityChecking ? "Checking..." : "Update Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-xl">
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ color: Brand.primary }}
            >
              Confirm Deletion
            </h2>
            <p className="mb-6" style={{ color: Brand.body }}>
              Are you sure you want to delete the booking for{" "}
              <strong>
                {selectedBooking.customerId?.firstName ||
                  selectedBooking.customerId?.username ||
                  "Unknown"}{" "}
                {selectedBooking.customerId?.lastName || ""}
              </strong>{" "}
              on{" "}
              <strong>
                {new Date(selectedBooking.bookingDate).toLocaleDateString()}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedBooking(null);
                }}
                className="px-6 py-3 transition-all duration-200 border-2 rounded-lg hover:bg-gray-50"
                style={{ borderColor: Brand.light, color: Brand.body }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBooking}
                className="px-8 py-3 font-semibold text-white transition-all duration-200 rounded-lg"
                style={{ backgroundColor: Brand.danger }}
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroundBooking;
