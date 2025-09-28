import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// --- Functions for a user managing their OWN profile ---

// @desc    Get the profile of the currently logged-in user
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    // This correctly uses the ID from the secure token
    const user = await User.findById(req.user._id);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update the profile of the currently logged-in user
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.contactNumber = req.body.contactNumber || user.contactNumber;
        user.address = req.body.address || user.address;
        user.profileImageURL = req.body.profileImageURL || user.profileImageURL;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 100, // Increased default limit for admin selection
            role,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        // Add search functionality
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(filter)
            .select('-passwordHash') // Exclude password hash from response
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalUsers = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / parseInt(limit))
            },
            message: `Retrieved ${users.length} users successfully`
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get user by ID (by admin)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Create a new user/staff (by admin)
// @route   POST /api/users
// @access  Private/Admin
const createUserByAdmin = async (req, res) => {
    const { email, username, password, role, firstName, lastName } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
        email, username, passwordHash, role, firstName, lastName
    });

    const createdUser = await user.save();
    res.status(201).json(createdUser);
};

// @desc    Update any user (by admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUserByAdmin = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.role = req.body.role || user.role;
        user.status = req.body.status || user.status;
        user.email = req.body.email || user.email;

        if (req.body.email) {
            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Email is already in use.' });
            }
            user.email = req.body.email;
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Delete a user (by admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUserByAdmin = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};


// @desc    Update user status by admin
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatusByAdmin = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.status = req.body.status;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

export {
    // Functions for regular users
    getUserProfile,
    updateUserProfile,
    // Functions for Admins
    getAllUsers,
    getUserById,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    updateUserStatusByAdmin,
};
