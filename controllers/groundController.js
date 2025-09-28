import Ground from '../models/Ground.js';

// @desc    Get all grounds
// @route   GET /api/grounds
// @access  Public
const getAllGrounds = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const grounds = await Ground.find()
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalGrounds = await Ground.countDocuments();

    res.status(200).json({
      success: true,
      data: grounds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalGrounds,
        pages: Math.ceil(totalGrounds / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grounds',
      error: error.message
    });
  }
};

// @desc    Get single ground
// @route   GET /api/grounds/:id
// @access  Public
const getGround = async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id);

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ground
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ground',
      error: error.message
    });
  }
};

// @desc    Create new ground
// @route   POST /api/grounds
// @access  Private (Admin only)
const createGround = async (req, res) => {
  try {
    const ground = await Ground.create(req.body);

    res.status(201).json({
      success: true,
      data: ground,
      message: 'Ground created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating ground',
      error: error.message
    });
  }
};

// @desc    Update ground
// @route   PUT /api/grounds/:id
// @access  Private (Admin only)
const updateGround = async (req, res) => {
  try {
    const ground = await Ground.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ground,
      message: 'Ground updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating ground',
      error: error.message
    });
  }
};

// @desc    Delete ground
// @route   DELETE /api/grounds/:id
// @access  Private (Admin only)
const deleteGround = async (req, res) => {
  try {
    const ground = await Ground.findByIdAndDelete(req.params.id);

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ground deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ground',
      error: error.message
    });
  }
};

// @desc    Get available ground slots for a specific date
// @route   GET /api/grounds/availability
// @access  Public
const getAvailableGroundSlots = async (req, res) => {
  try {
    const { date, duration = 120, startTime, endTime } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    // Get all grounds
    const grounds = await Ground.find({ isActive: true });

    // Get existing sessions for this date to check conflicts
    const Session = (await import('../models/Session.js')).default;
    const existingSessions = await Session.find({
      scheduledDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $nin: ['cancelled'] }
    }).select('ground groundSlot startTime endTime duration');

    // Process each ground to find available slots
    const availableGrounds = [];

    for (const ground of grounds) {
      const availableSlots = [];

      // If specific time is provided, show ALL available slots for that time
      if (startTime && endTime) {
        // Check if this ground has any conflicts for the specific time
        const hasConflict = existingSessions.some(session => {
          if (session.ground.toString() !== ground._id.toString()) return false;

          const sessionStart = session.startTime;
          const sessionEnd = session.endTime;
          return (startTime < sessionEnd && endTime > sessionStart);
        });

        if (!hasConflict) {
          // Get all used slots for this ground on this date
          const usedSlots = existingSessions
            .filter(session => session.ground.toString() === ground._id.toString())
            .map(session => session.groundSlot)
            .sort((a, b) => a - b);

          // Generate ALL available slots for this time period
          // Show all slots from 1 to totalSlots that are not booked
          for (let slotNum = 1; slotNum <= ground.totalSlots; slotNum++) {
            if (!usedSlots.includes(slotNum)) {
              availableSlots.push({
                slotNumber: slotNum,
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                available: true
              });
            }
          }
        }
      } else {
        // Generate all time slots for this ground (original behavior)
        const startHour = 6; // 6 AM
        const endHour = 22; // 10 PM

        for (let hour = startHour; hour < endHour; hour += 2) { // 2-hour slots
          const slotStartTime = `${hour.toString().padStart(2, '0')}:00`;
          const slotEndTime = `${(hour + 2).toString().padStart(2, '0')}:00`;

          // Check if this slot conflicts with existing sessions
          const hasConflict = existingSessions.some(session => {
            if (session.ground.toString() !== ground._id.toString()) return false;

            const sessionStart = session.startTime;
            const sessionEnd = session.endTime;
            return (slotStartTime < sessionEnd && slotEndTime > sessionStart);
          });

          if (!hasConflict) {
            availableSlots.push({
              slotNumber: Math.floor((hour - startHour) / 2) + 1,
              startTime: slotStartTime,
              endTime: slotEndTime,
              duration: duration,
              available: true
            });
          }
        }
      }

      if (availableSlots.length > 0) {
        availableGrounds.push({
          _id: ground._id,
          name: ground.name,
          location: ground.location,
          totalSlots: ground.totalSlots,
          availableSlots: availableSlots,
          facilities: ground.facilities || []
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        date: date,
        availableGrounds: availableGrounds,
        totalAvailableSlots: availableGrounds.reduce((sum, ground) => sum + ground.availableSlots.length, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available ground slots',
      error: error.message
    });
  }
};

// @desc    Export grounds data to CSV
// @route   GET /api/grounds/export/csv
// @access  Private (Admin only)
const exportGroundsCSV = async (req, res) => {
  try {
    const { status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter object
    const filter = {};
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const grounds = await Ground.find(filter).sort(sort);

    // Prepare CSV data
    const csvData = grounds.map(ground => ({
      'Ground ID': ground._id,
      'Ground Name': ground.name,
      'Location': ground.location || 'N/A',
      'Price per Slot (LKR)': ground.pricePerSlot,
      'Total Slots': ground.totalSlots,
      'Description': ground.description || 'N/A',
      'Facilities': ground.facilities ? ground.facilities.join('; ') : 'None',
      'Equipment': ground.equipment ? ground.equipment.join('; ') : 'None',
      'Status': ground.isActive ? 'Active' : 'Inactive',
      'Created Date': ground.createdAt ? new Date(ground.createdAt).toLocaleDateString() : 'N/A',
      'Updated Date': ground.updatedAt ? new Date(ground.updatedAt).toLocaleDateString() : 'N/A'
    }));

    // Convert to CSV format
    const csvHeaders = Object.keys(csvData[0] || {});
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row =>
        csvHeaders.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in values
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(',')
      )
    ].join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=grounds_export_${new Date().toISOString().split('T')[0]}.csv`);

    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting grounds data',
      error: error.message
    });
  }
};

export {
  getAllGrounds,
  getGround,
  createGround,
  updateGround,
  deleteGround,
  getAvailableGroundSlots,
  exportGroundsCSV
};
