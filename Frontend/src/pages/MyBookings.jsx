import React, { useState, useEffect } from "react";
import { Brand } from "../brand.js";
import { getCurrentUserId, isLoggedIn } from "../utils/getCurrentUser";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, confirmed, cancelled, completed
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("bookingDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const userId = getCurrentUserId();

  useEffect(() => {
    if (isLoggedIn() && userId) {
      fetchBookings();
    } else {
      setError("Please log in to view your bookings");
      setLoading(false);
    }
  }, [userId, filter, currentPage, sortBy, sortOrder]);

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

      const response = await fetch(`/api/bookings/user/${userId}?${params}`);
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

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Booking cancelled successfully");
        setCancellingBooking(null);
        setCancelReason("");
        fetchBookings(); // Refresh the list
      } else {
        alert(data.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Error cancelling booking");
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "confirmed":
        return "✅";
      case "cancelled":
        return "❌";
      case "completed":
        return "🏁";
      default:
        return "📋";
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.groundId?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.bookingType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: Brand.light }}>
        {/* <Header /> */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            <p className="text-lg" style={{ color: Brand.body }}>
              Loading your bookings...
            </p>
          </div>
        </div>
        {/* <Footer /> */}
      </div>
    );
  }

  return (
    <div className="" style={{ backgroundColor: Brand.light }}>
      {/* <Header /> */}

      <div className="container px-4 py-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="mb-2 text-4xl font-bold"
            style={{ color: Brand.primary }}
          >
            My Bookings
          </h1>
          <p className="text-lg" style={{ color: Brand.body }}>
            Manage your ground bookings and track their status
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border-2 rounded-lg focus:outline-none"
                style={{ borderColor: Brand.light }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full p-3 border-2 rounded-lg focus:outline-none"
                style={{ borderColor: Brand.light }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-3 border-2 rounded-lg focus:outline-none"
                style={{ borderColor: Brand.light }}
              >
                <option value="bookingDate">Booking Date</option>
                <option value="createdAt">Created Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full p-3 border-2 rounded-lg focus:outline-none"
                style={{ borderColor: Brand.light }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-lg shadow-md">
            <div className="mb-4 text-6xl">📅</div>
            <h3
              className="mb-2 text-xl font-semibold"
              style={{ color: Brand.heading }}
            >
              No bookings found
            </h3>
            <p style={{ color: Brand.body }}>
              {searchTerm
                ? "No bookings match your search criteria."
                : "You haven't made any bookings yet."}
            </p>
            {!searchTerm && (
              <a
                href="/ground-booking"
                className="inline-block px-6 py-3 mt-4 text-white transition-colors duration-200 rounded-lg"
                style={{ backgroundColor: Brand.primary }}
              >
                Book a Ground
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="p-6 bg-white rounded-lg shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Section - Main Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className="text-xl font-semibold"
                        style={{ color: Brand.heading }}
                      >
                        {booking.groundId?.name || "Ground"}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusIcon(booking.status)}{" "}
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2 lg:grid-cols-4"
                      style={{ color: Brand.body }}
                    >
                      <div>
                        <strong>Date:</strong> {formatDate(booking.bookingDate)}
                      </div>
                      <div>
                        <strong>Time:</strong> {formatTime(booking.startTime)} -{" "}
                        {formatTime(booking.endTime)}
                      </div>
                      <div>
                        <strong>Duration:</strong>{" "}
                        {Math.ceil(booking.duration / 60)} hour(s)
                      </div>
                      <div>
                        <strong>Type:</strong>{" "}
                        {booking.bookingType.charAt(0).toUpperCase() +
                          booking.bookingType.slice(1)}
                      </div>
                    </div>

                    {booking.groundId?.location && (
                      <div
                        className="mt-2 text-sm"
                        style={{ color: Brand.body }}
                      >
                        <strong>Location:</strong> {booking.groundId.location}
                      </div>
                    )}
                  </div>

                  {/* Right Section - Amount and Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: Brand.accent }}
                    >
                      LKR {booking.amount}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="px-4 py-2 text-white transition-colors duration-200 rounded-lg"
                        style={{ backgroundColor: Brand.secondary }}
                      >
                        View Details
                      </button>

                      {booking.status === "pending" && (
                        <button
                          onClick={() => setCancellingBooking(booking._id)}
                          className="px-4 py-2 text-white transition-colors duration-200 bg-red-500 rounded-lg hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
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
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl font-bold"
                style={{ color: Brand.primary }}
              >
                Booking Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong style={{ color: Brand.heading }}>Ground:</strong>
                  <p>{selectedBooking.groundId?.name}</p>
                </div>
                <div>
                  <strong style={{ color: Brand.heading }}>Status:</strong>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${getStatusColor(
                      selectedBooking.status
                    )}`}
                  >
                    {selectedBooking.status.charAt(0).toUpperCase() +
                      selectedBooking.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong style={{ color: Brand.heading }}>Date:</strong>
                  <p>{formatDate(selectedBooking.bookingDate)}</p>
                </div>
                <div>
                  <strong style={{ color: Brand.heading }}>Time:</strong>
                  <p>
                    {formatTime(selectedBooking.startTime)} -{" "}
                    {formatTime(selectedBooking.endTime)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong style={{ color: Brand.heading }}>Duration:</strong>
                  <p>{Math.ceil(selectedBooking.duration / 60)} hour(s)</p>
                </div>
                <div>
                  <strong style={{ color: Brand.heading }}>Type:</strong>
                  <p>
                    {selectedBooking.bookingType.charAt(0).toUpperCase() +
                      selectedBooking.bookingType.slice(1)}
                  </p>
                </div>
              </div>

              <div>
                <strong style={{ color: Brand.heading }}>Amount:</strong>
                <p
                  className="text-2xl font-bold"
                  style={{ color: Brand.accent }}
                >
                  LKR {selectedBooking.amount}
                </p>
              </div>

              {selectedBooking.groundId?.location && (
                <div>
                  <strong style={{ color: Brand.heading }}>Location:</strong>
                  <p>{selectedBooking.groundId.location}</p>
                </div>
              )}

              {selectedBooking.specialRequirements?.length > 0 && (
                <div>
                  <strong style={{ color: Brand.heading }}>
                    Special Requirements:
                  </strong>
                  <p>{selectedBooking.specialRequirements.join(", ")}</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <strong style={{ color: Brand.heading }}>Notes:</strong>
                  <p>{selectedBooking.notes}</p>
                </div>
              )}

              <div>
                <strong style={{ color: Brand.heading }}>Booked On:</strong>
                <p>{formatDate(selectedBooking.createdAt)}</p>
              </div>

              {selectedBooking.paymentId && (
                <div>
                  <strong style={{ color: Brand.heading }}>
                    Payment Status:
                  </strong>
                  <p className="text-green-600">✅ Paid</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-xl">
            <h3
              className="mb-4 text-xl font-bold"
              style={{ color: Brand.primary }}
            >
              Cancel Booking
            </h3>

            <div className="mb-4">
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: Brand.heading }}
              >
                Reason for cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 border-2 rounded-lg min-h-[80px] focus:outline-none"
                style={{ borderColor: Brand.light }}
                placeholder="Please provide a reason for cancelling this booking..."
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCancellingBooking(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 border-2 rounded-lg"
                style={{ borderColor: Brand.light, color: Brand.body }}
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(cancellingBooking)}
                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                disabled={!cancelReason.trim()}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <div className="mt-48">
        <Footer />
      </div> */}
    </div>
  );
};

export default MyBookings;
