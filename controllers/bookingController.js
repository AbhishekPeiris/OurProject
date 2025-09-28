import Booking from "../models/Booking.js";
import Ground from "../models/Ground.js";
import Payment from "../models/Payments.js";
import User from "../models/User.js";

// @desc    Create new ground booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
    try {
        console.log("Creating booking with data:", req.body);

        const {
            customerId,
            groundId,
            groundSlot,
            bookingDate,
            startTime,
            endTime,
            duration,
            bookingType,
            specialRequirements,
            notes,
            amount,
        } = req.body;

        // Validate required fields
        if (
            !customerId ||
            !groundId ||
            !bookingDate ||
            !startTime ||
            !endTime ||
            !amount
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: customerId, groundId, bookingDate, startTime, endTime, amount",
            });
        }

        // Verify ground exists
        const ground = await Ground.findById(groundId);
        if (!ground) {
            return res.status(404).json({
                success: false,
                message: "Ground not found",
            });
        }

        // Verify customer exists
        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Enhanced conflict checking with detailed error messages
        const conflictingBookings = await Booking.find({
            groundId,
            groundSlot: groundSlot || 1,
            bookingDate: {
                $gte: new Date(new Date(bookingDate).setHours(0, 0, 0, 0)),
                $lt: new Date(new Date(bookingDate).setHours(23, 59, 59, 999)),
            },
            status: { $nin: ["cancelled"] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime },
                },
            ],
        }).populate("customerId", "firstName lastName");

        if (conflictingBookings.length > 0) {
            const conflictInfo = conflictingBookings[0];
            const conflictCustomer = `${conflictInfo.customerId.firstName} ${conflictInfo.customerId.lastName}`;

            return res.status(409).json({
                success: false,
                message: `This time slot (${startTime} - ${endTime}) is already booked by another customer. Please choose a different time or date.`,
                conflictDetails: {
                    existingBooking: {
                        startTime: conflictInfo.startTime,
                        endTime: conflictInfo.endTime,
                        bookingType: conflictInfo.bookingType,
                        bookedBy: conflictCustomer,
                    },
                    suggestions: [
                        "Try booking for a different time on the same date",
                        "Select a different date",
                        "Choose a different ground if available",
                    ],
                },
            });
        }

        // Validate booking is not in the past
        const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
        const now = new Date();

        if (bookingDateTime <= now) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot book ground for past dates or times. Please select a future date and time.",
            });
        }

        // Validate minimum advance booking (e.g., at least 1 hour in advance)
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        if (bookingDateTime < oneHourFromNow) {
            return res.status(400).json({
                success: false,
                message:
                    "Ground must be booked at least 1 hour in advance. Please select a later time.",
            });
        }

        // Create booking
        const booking = await Booking.create({
            customerId,
            type: "ground",
            groundId,
            groundSlot: groundSlot || 1,
            bookingDate: new Date(bookingDate),
            startTime,
            endTime,
            duration: parseInt(duration),
            bookingType: bookingType || "practice",
            specialRequirements: specialRequirements || [],
            notes: notes || "",
            amount: parseFloat(amount),
            status: "pending",
        });

        // Populate the created booking
        const populatedBooking = await Booking.findById(booking._id)
            .populate("customerId", "firstName lastName email")
            .populate("groundId", "name location pricePerSlot");

        res.status(201).json({
            success: true,
            data: populatedBooking,
            message: "Booking created successfully",
        });
    } catch (error) {
        console.error("Error creating booking:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "This time slot is already booked. Please choose a different time.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Error creating booking",
            error: error.message,
        });
    }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            type,
            customerId,
            groundId,
            startDate,
            endDate,
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (customerId) filter.customerId = customerId;
        if (groundId) filter.groundId = groundId;

        if (startDate && endDate) {
            filter.bookingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const bookings = await Booking.find(filter)
            .populate("customerId", "firstName lastName email")
            .populate("groundId", "name location pricePerSlot")
            .populate("paymentId", "amount status paymentDate")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalBookings = await Booking.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalBookings,
                pages: Math.ceil(totalBookings / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message,
        });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("customerId", "firstName lastName email phone")
            .populate("groundId", "name location pricePerSlot facilities")
            .populate("paymentId", "amount status paymentDate");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching booking",
            error: error.message,
        });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check if booking can be modified (not completed or cancelled)
        if (["completed", "cancelled"].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: "Cannot modify completed or cancelled bookings",
            });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate("customerId", "firstName lastName email")
            .populate("groundId", "name location pricePerSlot");

        res.status(200).json({
            success: true,
            data: updatedBooking,
            message: "Booking updated successfully",
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }

        res.status(500).json({
            success: false,
            message: "Error updating booking",
            error: error.message,
        });
    }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
    try {
        const { reason } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // Check if booking can be cancelled (not too close to booking time)
        const bookingDateTime = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`);
        const now = new Date();
        const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

        if (hoursUntilBooking < 2 && booking.status === 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel booking less than 2 hours before start time'
            });
        }

        booking.status = 'cancelled';
        booking.notes = booking.notes ? `${booking.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

// @desc    Confirm booking and link payment
// @route   PUT /api/bookings/:id/confirm
// @access  Private
export const confirmBooking = async (req, res) => {
    try {
        const { paymentId } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Verify payment exists and is successful
        if (paymentId) {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            if (payment.status !== "success") {
                return res.status(400).json({
                    success: false,
                    message: "Payment is not successful",
                });
            }

            booking.paymentId = paymentId;
        }

        booking.status = "confirmed";
        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate("customerId", "firstName lastName email")
            .populate("groundId", "name location pricePerSlot")
            .populate("paymentId", "amount status paymentDate");

        res.status(200).json({
            success: true,
            data: populatedBooking,
            message: "Booking confirmed successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error confirming booking",
            error: error.message,
        });
    }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/user/:userId
// @access  Private
export const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, type, page = 1, limit = 10 } = req.query;

        const filter = { customerId: userId };
        if (status) filter.status = status;
        if (type) filter.type = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const bookings = await Booking.find(filter)
            .populate("groundId", "name location pricePerSlot")
            .populate("paymentId", "amount status paymentDate")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalBookings = await Booking.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalBookings,
                pages: Math.ceil(totalBookings / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user bookings",
            error: error.message,
        });
    }
};

// @desc    Check ground availability for specific time slot
// @route   GET /api/bookings/check-availability
// @access  Private
export const checkGroundAvailability = async (req, res) => {
    try {
        const { groundId, groundSlot, bookingDate, startTime, endTime } = req.query;

        if (!groundId || !bookingDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required parameters: groundId, bookingDate, startTime, endTime",
            });
        }

        // Check for conflicting bookings
        const conflictingBookings = await Booking.find({
            groundId,
            groundSlot: groundSlot || 1,
            bookingDate: {
                $gte: new Date(new Date(bookingDate).setHours(0, 0, 0, 0)),
                $lt: new Date(new Date(bookingDate).setHours(23, 59, 59, 999)),
            },
            status: { $nin: ["cancelled"] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime },
                },
            ],
        })
            .populate("customerId", "firstName lastName")
            .populate("groundId", "name");

        const isAvailable = conflictingBookings.length === 0;

        if (!isAvailable) {
            const conflictDetails = conflictingBookings.map((booking) => ({
                bookingId: booking._id,
                customerName: `${booking.customerId.firstName} ${booking.customerId.lastName}`,
                startTime: booking.startTime,
                endTime: booking.endTime,
                bookingType: booking.bookingType,
                status: booking.status,
            }));

            return res.status(200).json({
                success: true,
                available: false,
                message: "This time slot is already booked",
                conflicts: conflictDetails,
                alternativeMessage: "Please select a different time slot or date",
            });
        }

        res.status(200).json({
            success: true,
            available: true,
            message: "Time slot is available for booking",
        });
    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({
            success: false,
            message: "Error checking ground availability",
            error: error.message,
        });
    }
};
