import React, { useState, useEffect } from "react";
import { Brand } from "../brand.js";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId, isLoggedIn } from "../utils/getCurrentUser";
import Header from "../components/Header.jsx";

const GroundBooking = () => {
  const navigate = useNavigate();
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGround, setSelectedGround] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    bookingDate: "",
    startTime: "",
    endTime: "",
    duration: 120,
    bookingType: "practice",
    notes: "",
    specialRequirements: [],
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  // Fetch all grounds
  useEffect(() => {
    fetchGrounds();
  }, []);

  const fetchGrounds = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/grounds");
      const data = await response.json();

      if (data.success) {
        setGrounds(data.data);
      } else {
        setError("Failed to fetch grounds");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error("Error fetching grounds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookGround = (ground) => {
    setSelectedGround(ground);
    setShowBookingForm(true);
    setBookingSuccess("");
    setError("");
  };

  const checkAvailability = async () => {
    if (
      !selectedGround ||
      !bookingData.bookingDate ||
      !bookingData.startTime ||
      !bookingData.duration
    ) {
      return;
    }

    try {
      setAvailabilityChecking(true);
      setAvailabilityMessage("");

      // Calculate end time
      const startTime = new Date(`2000-01-01T${bookingData.startTime}:00`);
      const endTime = new Date(
        startTime.getTime() + bookingData.duration * 60000
      );
      const endTimeString = `${endTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

      const params = new URLSearchParams({
        groundId: selectedGround._id,
        groundSlot: 1, // Default slot
        bookingDate: bookingData.bookingDate,
        startTime: bookingData.startTime,
        endTime: endTimeString,
      });

      const response = await fetch(
        `/api/bookings/check-availability?${params}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.available) {
          setAvailabilityMessage("✅ This time slot is available for booking!");
          setError("");
        } else {
          setAvailabilityMessage("❌ " + data.message);
          setError("");

          // Show detailed conflict information if available
          if (data.conflicts && data.conflicts.length > 0) {
            const conflict = data.conflicts[0];
            setAvailabilityMessage(
              `❌ Time slot ${conflict.startTime} - ${conflict.endTime} is already booked. Please choose a different time.`
            );
          }
        }
      } else {
        setError("Failed to check availability");
      }
    } catch (err) {
      console.error("Error checking availability:", err);
      setError("Error checking availability");
    } finally {
      setAvailabilityChecking(false);
    }
  };

  // Check availability when booking details change
  useEffect(() => {
    if (
      selectedGround &&
      bookingData.bookingDate &&
      bookingData.startTime &&
      bookingData.duration
    ) {
      const debounceTimer = setTimeout(() => {
        checkAvailability();
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    } else {
      setAvailabilityMessage("");
    }
  }, [
    selectedGround,
    bookingData.bookingDate,
    bookingData.startTime,
    bookingData.duration,
  ]);

  const handleBookingInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setBookingData((prev) => ({
        ...prev,
        specialRequirements: checked
          ? [...prev.specialRequirements, value]
          : prev.specialRequirements.filter((req) => req !== value),
      }));
    } else {
      setBookingData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear previous availability message when user changes input
    if (["bookingDate", "startTime", "duration"].includes(name)) {
      setAvailabilityMessage("");
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!isLoggedIn()) {
      setError("Please log in to book a ground");
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      setError("Please log in to book a ground");
      return;
    }

    // Final availability check before proceeding
    setBookingLoading(true);
    try {
      // Calculate end time
      const startTime = new Date(`2000-01-01T${bookingData.startTime}:00`);
      const endTime = new Date(
        startTime.getTime() + bookingData.duration * 60000
      );
      const endTimeString = `${endTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

      // Check availability one more time before proceeding
      const params = new URLSearchParams({
        groundId: selectedGround._id,
        groundSlot: 1,
        bookingDate: bookingData.bookingDate,
        startTime: bookingData.startTime,
        endTime: endTimeString,
      });

      const availabilityResponse = await fetch(
        `/api/bookings/check-availability?${params}`
      );
      const availabilityData = await availabilityResponse.json();

      if (!availabilityData.success || !availabilityData.available) {
        setError(
          availabilityData.message ||
            "This time slot is no longer available. Please choose a different time."
        );
        setBookingLoading(false);
        return;
      }

      // Calculate booking amount
      const durationHours = Math.ceil(bookingData.duration / 60);
      const bookingAmount = selectedGround.pricePerSlot * durationHours;

      // Prepare booking data for payment
      const bookingPayload = {
        customerId: userId,
        groundId: selectedGround._id,
        groundSlot: 1,
        bookingDate: bookingData.bookingDate,
        startTime: bookingData.startTime,
        endTime: endTimeString,
        duration: parseInt(bookingData.duration),
        bookingType: bookingData.bookingType,
        notes: bookingData.notes,
        specialRequirements: bookingData.specialRequirements,
        amount: bookingAmount,
      };

      console.log("Navigating to payment with booking data:", bookingPayload);

      // Navigate to payment page with booking data
      navigate("/payment", {
        state: {
          type: "ground_booking",
          booking: bookingPayload,
          ground: selectedGround,
          amount: bookingAmount,
          bookingDetails: {
            groundName: selectedGround.name,
            date: bookingData.bookingDate,
            startTime: bookingData.startTime,
            endTime: endTimeString,
            duration: bookingData.duration,
            bookingType: bookingData.bookingType,
            specialRequirements: bookingData.specialRequirements,
            notes: bookingData.notes,
          },
        },
      });

      // Close the modal
      setShowBookingForm(false);
    } catch (error) {
      console.error("Error during booking submission:", error);
      setError(
        "An error occurred while processing your booking. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen p-8 text-center"
        style={{ backgroundColor: Brand.light }}
      >
        <div className="pt-12 text-lg" style={{ color: Brand.body }}>
          Loading available grounds...
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div
        className="min-h-screen px-4 py-8"
        style={{ backgroundColor: Brand.light }}
      >
        {/* Header */}
        <div className="mb-12 text-center">
          <h1
            className="mb-2 text-4xl font-bold"
            style={{ color: Brand.primary }}
          >
            Ground Booking
          </h1>
          <p className="text-lg" style={{ color: Brand.body }}>
            Choose from our available cricket grounds and book your session
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="max-w-4xl p-4 mx-auto mb-8 text-center text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        {bookingSuccess && (
          <div className="max-w-4xl p-4 mx-auto mb-8 text-center text-green-700 bg-green-100 rounded-lg">
            {bookingSuccess}
          </div>
        )}

        {/* Grounds Grid */}
        <div className="grid grid-cols-1 gap-8 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
          {grounds.map((ground) => (
            <div
              key={ground._id}
              className="p-6 transition-all duration-200 bg-white shadow-md cursor-pointer rounded-xl hover:-translate-y-1 hover:shadow-lg"
              style={{
                borderColor: `${Brand.secondary}33`,
                borderWidth: "1px",
              }}
            >
              <h3
                className="mb-2 text-xl font-semibold"
                style={{ color: Brand.heading }}
              >
                {ground.name}
              </h3>

              {ground.location && (
                <div
                  className="flex items-center gap-2 mb-4 text-sm"
                  style={{ color: Brand.body }}
                >
                  <span>📍</span>
                  <span>{ground.location}</span>
                </div>
              )}

              <div
                className="mb-4 text-xl font-bold"
                style={{ color: Brand.accent }}
              >
                LKR {ground.pricePerSlot}/slot
              </div>

              {ground.description && (
                <p className="mb-4 text-sm" style={{ color: Brand.body }}>
                  {ground.description}
                </p>
              )}

              <div className="mb-6">
                <div
                  className="mb-2 text-sm font-semibold"
                  style={{ color: Brand.heading }}
                >
                  Facilities:
                </div>
                <div className="flex flex-wrap gap-2">
                  {ground.facilities && ground.facilities.length > 0 ? (
                    ground.facilities.map((facility, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${Brand.secondary}33`,
                          color: Brand.primary,
                        }}
                      >
                        {facility.replace("_", " ")}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs" style={{ color: Brand.body }}>
                      Basic facilities available
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6 text-sm" style={{ color: Brand.body }}>
                <strong>Available Slots:</strong> {ground.totalSlots}
              </div>

              <button
                className="w-full px-6 py-3 font-semibold text-white transition-colors duration-200 rounded-lg hover:opacity-90"
                style={{ backgroundColor: Brand.primary }}
                onClick={() => handleBookGround(ground)}
              >
                Book This Ground
              </button>
            </div>
          ))}
        </div>

        {/* No Grounds Available */}
        {grounds.length === 0 && !loading && (
          <div className="py-12 text-center" style={{ color: Brand.body }}>
            <h3 className="mb-2 text-xl">No grounds available</h3>
            <p>Please check back later or contact support.</p>
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && selectedGround && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBookingForm(false);
              }
            }}
          >
            <div className="bg-white rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2
                className="mb-6 text-2xl font-bold"
                style={{ color: Brand.primary }}
              >
                Book {selectedGround.name}
              </h2>

              <form onSubmit={handleBookingSubmit}>
                {/* Booking Date */}
                <div className="mb-6">
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    name="bookingDate"
                    value={bookingData.bookingDate}
                    onChange={handleBookingInputChange}
                    className="w-full p-3 transition-colors duration-200 border-2 rounded-lg focus:outline-none"
                    style={{
                      borderColor: Brand.light,
                    }}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Start Time */}
                <div className="mb-6">
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={bookingData.startTime}
                    onChange={handleBookingInputChange}
                    className="w-full p-3 transition-colors duration-200 border-2 rounded-lg focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  />
                </div>

                {/* Duration */}
                <div className="mb-6">
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Duration (minutes) *
                  </label>
                  <select
                    name="duration"
                    value={bookingData.duration}
                    onChange={handleBookingInputChange}
                    className="w-full p-3 transition-colors duration-200 border-2 rounded-lg cursor-pointer focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                    <option value={180}>3 Hours</option>
                    <option value={240}>4 Hours</option>
                  </select>
                </div>

                {/* Booking Type */}
                <div className="mb-6">
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Booking Type *
                  </label>
                  <select
                    name="bookingType"
                    value={bookingData.bookingType}
                    onChange={handleBookingInputChange}
                    className="w-full p-3 transition-colors duration-200 border-2 rounded-lg cursor-pointer focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    required
                  >
                    <option value="practice">Practice</option>
                    <option value="match">Match</option>
                    <option value="training">Training</option>
                    <option value="session">Coaching Session</option>
                  </select>
                </div>

                {/* Availability Check Display */}
                {(availabilityChecking || availabilityMessage) && (
                  <div
                    className="p-3 mb-6 border-2 rounded-lg"
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
                          Checking availability...
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

                {/* Special Requirements */}
                <div className="mb-6">
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
                          checked={bookingData.specialRequirements.includes(
                            req.toLowerCase()
                          )}
                          onChange={handleBookingInputChange}
                          className="rounded"
                        />
                        <span>{req}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="mb-8">
                  <label
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={bookingData.notes}
                    onChange={handleBookingInputChange}
                    className="w-full p-3 rounded-lg border-2 min-h-[80px] resize-vertical transition-colors duration-200 focus:outline-none"
                    style={{ borderColor: Brand.light }}
                    placeholder="Any additional information or special requests..."
                  />
                </div>

                {/* Booking Summary */}
                <div className="p-4 mb-6 rounded-lg bg-gray-50">
                  <h4
                    className="mb-2 font-semibold"
                    style={{ color: Brand.heading }}
                  >
                    Booking Summary
                  </h4>
                  <div
                    className="space-y-1 text-sm"
                    style={{ color: Brand.body }}
                  >
                    <div>Ground: {selectedGround.name}</div>
                    <div>
                      Rate: LKR {selectedGround.pricePerSlot}/slot per hour
                    </div>
                    {bookingData.duration && (
                      <>
                        <div>
                          Duration: {Math.ceil(bookingData.duration / 60)}{" "}
                          hour(s)
                        </div>
                        <div className="font-semibold">
                          Total: LKR{" "}
                          {(
                            selectedGround.pricePerSlot *
                            Math.ceil(bookingData.duration / 60)
                          ).toFixed(2)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="px-6 py-3 transition-all duration-200 border-2 rounded-lg hover:bg-gray-50"
                    style={{
                      color: Brand.body,
                      borderColor: Brand.light,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      bookingLoading ||
                      availabilityChecking ||
                      (availabilityMessage &&
                        availabilityMessage.includes("❌"))
                    }
                    className="px-8 py-3 font-semibold text-white transition-all duration-200 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: Brand.primary }}
                  >
                    {bookingLoading ? "Processing..." : "Proceed to Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GroundBooking;
