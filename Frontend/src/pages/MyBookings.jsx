import React, { useState, useEffect } from "react";
import { Brand } from "../brand.js";
import { getCurrentUserId, isLoggedIn } from "../utils/getCurrentUser";

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
    const [showMap, setShowMap] = useState(false);

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

    // Function to generate individual ground map URL
    const generateIndividualMapUrl = (ground) => {
        const location = ground?.location || ground?.name;
        if (!location) return "";
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.0!2d79.8612!3d6.9271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTUnMzcuNSJOIDc5wrA1MSc0MC4zIkU!5e0!3m2!1sen!2slk!4v1640000000000!5m2!1sen!2slk&q=${encodeURIComponent(
            location + ", Colombo, Sri Lanka"
        )}`;
    };

    // Function to generate map URL for all booking locations
    const generateAllBookingsMapUrl = () => {
        if (filteredBookings.length === 0) return "";

        // Get unique grounds from bookings
        const uniqueGrounds = filteredBookings.reduce((acc, booking) => {
            const groundId = booking.groundId?._id;
            if (groundId && !acc.find((g) => g._id === groundId)) {
                acc.push(booking.groundId);
            }
            return acc;
        }, []);

        if (uniqueGrounds.length === 0) return "";

        // Use the first ground as center and create markers for all
        const centerLocation = uniqueGrounds[0].location || uniqueGrounds[0].name;
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126742.36876216154!2d79.84732912953602!3d6.927078599999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae253d10f7a7003%3A0x320b2e4d32d3838d!2s${encodeURIComponent(
            centerLocation + ", Colombo, Sri Lanka"
        )}!5e0!3m2!1sen!2slk!4v1640000000000!5m2!1sen!2slk`;
    };

    // Function to handle view on map
    const handleViewOnMap = (ground) => {
        if (!ground?.location && !ground?.name) return;
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            (ground.location || ground.name) + ", Colombo, Sri Lanka"
        )}`;
        window.open(mapUrl, "_blank");
    };

    // Get unique grounds for map view
    const getUniqueGrounds = () => {
        return filteredBookings.reduce((acc, booking) => {
            const groundId = booking.groundId?._id;
            if (groundId && !acc.find((g) => g._id === groundId)) {
                acc.push({
                    ...booking.groundId,
                    bookingCount: filteredBookings.filter(
                        (b) => b.groundId?._id === groundId
                    ).length,
                });
            }
            return acc;
        }, []);
    };

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                <p className="text-lg" style={{ color: Brand.body }}>
                    Loading your bookings...
                </p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: Brand.light }}>
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

                {/* Map Toggle Button */}
                {filteredBookings.length > 0 && (
                    <div className="mb-8 text-center">
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="px-6 py-3 text-white transition-colors duration-200 rounded-lg shadow-md hover:opacity-90"
                            style={{ backgroundColor: Brand.secondary }}
                        >
                            {showMap
                                ? "📋 Show Bookings List"
                                : "🗺️ View Booked Grounds on Map"}
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Map View */}
                {showMap && filteredBookings.length > 0 && (
                    <div className="mb-8">
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <h2
                                className="mb-4 text-2xl font-bold text-center"
                                style={{ color: Brand.primary }}
                            >
                                Your Booked Grounds Map
                            </h2>
                            <div className="w-full overflow-hidden rounded-lg h-96">
                                <iframe
                                    src={generateAllBookingsMapUrl()}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="My Booked Grounds Locations"
                                ></iframe>
                            </div>

                            {/* Ground Legend */}
                            <div className="mt-4">
                                <h3
                                    className="mb-3 text-lg font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Your Booked Grounds:
                                </h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {getUniqueGrounds().map((ground, index) => (
                                        <div
                                            key={ground._id}
                                            className="flex items-center justify-between p-3 rounded-lg"
                                            style={{ backgroundColor: `${Brand.secondary}15` }}
                                        >
                                            <div>
                                                <div
                                                    className="font-medium"
                                                    style={{ color: Brand.heading }}
                                                >
                                                    {ground.name}
                                                </div>
                                                {ground.location && (
                                                    <div
                                                        className="text-sm"
                                                        style={{ color: Brand.body }}
                                                    >
                                                        📍 {ground.location}
                                                    </div>
                                                )}
                                                <div
                                                    className="text-xs"
                                                    style={{ color: Brand.accent }}
                                                >
                                                    {ground.bookingCount} booking
                                                    {ground.bookingCount > 1 ? "s" : ""}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleViewOnMap(ground)}
                                                className="px-3 py-1 text-xs text-white transition-colors duration-200 rounded hover:opacity-80"
                                                style={{ backgroundColor: Brand.secondary }}
                                                title="View on Google Maps"
                                            >
                                                🗺️ View
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div
                                className="mt-4 text-sm text-center"
                                style={{ color: Brand.body }}
                            >
                                📍 All your booked grounds are marked on the map above
                            </div>
                        </div>
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
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="text-sm" style={{ color: Brand.body }}>
                                                    <strong>Location:</strong> {booking.groundId.location}
                                                </div>
                                                <button
                                                    onClick={() => handleViewOnMap(booking.groundId)}
                                                    className="px-2 py-1 ml-3 text-xs text-white transition-colors duration-200 rounded hover:opacity-80"
                                                    style={{ backgroundColor: Brand.secondary }}
                                                    title="View location on Google Maps"
                                                >
                                                    🗺️ Map
                                                </button>
                                            </div>
                                        )}

                                        {/* Location Preview Map for Individual Booking */}
                                        {booking.groundId?.location && (
                                            <div className="mt-3">
                                                <div className="w-full h-32 overflow-hidden rounded-lg">
                                                    <iframe
                                                        src={generateIndividualMapUrl(booking.groundId)}
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer-when-downgrade"
                                                        title={`${booking.groundId.name} Location`}
                                                    ></iframe>
                                                </div>
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
                    <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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

                        {/* Ground Location Map in Modal */}
                        {selectedBooking.groundId?.location && (
                            <div className="mb-6">
                                <h3
                                    className="mb-3 text-lg font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Ground Location
                                </h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span>📍</span>
                                    <span style={{ color: Brand.body }}>
                                        {selectedBooking.groundId.location}
                                    </span>
                                    <button
                                        onClick={() => handleViewOnMap(selectedBooking.groundId)}
                                        className="px-3 py-1 text-xs text-white transition-colors duration-200 rounded hover:opacity-80"
                                        style={{ backgroundColor: Brand.secondary }}
                                    >
                                        🗺️ Open in Google Maps
                                    </button>
                                </div>
                                <div className="w-full h-48 overflow-hidden rounded-lg">
                                    <iframe
                                        src={generateIndividualMapUrl(selectedBooking.groundId)}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title={`${selectedBooking.groundId.name} Location`}
                                    ></iframe>
                                </div>
                            </div>
                        )}

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
        </div>
    );
};

export default MyBookings;
