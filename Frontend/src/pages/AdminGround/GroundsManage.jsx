import React, { useState, useEffect } from "react";
import { Brand } from "../../brand.js";

const GroundsManage = () => {
    const [grounds, setGrounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterActive, setFilterActive] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGround, setSelectedGround] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        pricePerSlot: "",
        description: "",
        totalSlots: 12,
        facilities: [],
        equipment: [],
        isActive: true,
    });

    // Predefined options
    const facilityOptions = [
        "parking",
        "changing_room",
        "washrooms",
        "canteen",
        "first_aid",
        "security",
        "lighting",
    ];
    const equipmentOptions = [
        "nets",
        "balls",
        "bats",
        "stumps",
        "pads",
        "gloves",
        "helmets",
        "markers",
    ];

    useEffect(() => {
        fetchGrounds();
    }, []);

    const fetchGrounds = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/grounds");
            const data = await response.json();

            if (data.success) {
                setGrounds(data.data || []);
            } else {
                setError("Failed to fetch grounds");
            }
        } catch (err) {
            console.error("Error fetching grounds:", err);
            setError("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            if (name === "facilities" || name === "equipment") {
                setFormData((prev) => ({
                    ...prev,
                    [name]: checked
                        ? [...prev[name], value]
                        : prev[name].filter((item) => item !== value),
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    [name]: checked,
                }));
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            location: "",
            pricePerSlot: "",
            description: "",
            totalSlots: 12,
            facilities: [],
            equipment: [],
            isActive: true,
        });
    };

    const handleCreateGround = async (e) => {
        e.preventDefault();

        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const response = await fetch("/api/grounds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userInfo?.token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    pricePerSlot: parseFloat(formData.pricePerSlot),
                    totalSlots: parseInt(formData.totalSlots),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess("Ground created successfully!");
                setShowCreateModal(false);
                resetForm();
                fetchGrounds();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.message || "Failed to create ground");
            }
        } catch (err) {
            console.error("Error creating ground:", err);
            setError("Error creating ground");
        }
    };

    const handleEditGround = async (e) => {
        e.preventDefault();

        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const response = await fetch(`/api/grounds/${selectedGround._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userInfo?.token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    pricePerSlot: parseFloat(formData.pricePerSlot),
                    totalSlots: parseInt(formData.totalSlots),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess("Ground updated successfully!");
                setShowEditModal(false);
                setSelectedGround(null);
                resetForm();
                fetchGrounds();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.message || "Failed to update ground");
            }
        } catch (err) {
            console.error("Error updating ground:", err);
            setError("Error updating ground");
        }
    };

    const handleDeleteGround = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const response = await fetch(`/api/grounds/${selectedGround._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${userInfo?.token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setSuccess("Ground deleted successfully!");
                setShowDeleteModal(false);
                setSelectedGround(null);
                fetchGrounds();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.message || "Failed to delete ground");
            }
        } catch (err) {
            console.error("Error deleting ground:", err);
            setError("Error deleting ground");
        }
    };

    const openEditModal = (ground) => {
        setSelectedGround(ground);
        setFormData({
            name: ground.name,
            location: ground.location || "",
            pricePerSlot: ground.pricePerSlot.toString(),
            description: ground.description || "",
            totalSlots: ground.totalSlots,
            facilities: ground.facilities || [],
            equipment: ground.equipment || [],
            isActive: ground.isActive,
        });
        setShowEditModal(true);
    };

    const filteredGrounds = grounds.filter((ground) => {
        const matchesSearch =
            ground.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ground.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterActive === "all" ||
            (filterActive === "active" && ground.isActive) ||
            (filterActive === "inactive" && !ground.isActive);
        return matchesSearch && matchesFilter;
    });

    const sortedGrounds = filteredGrounds.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (typeof aValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (sortOrder === "asc") {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    // Add CSV export function
    const exportToCSV = () => {
        // Prepare CSV data
        const csvData = sortedGrounds.map((ground) => ({
            "Ground Name": ground.name,
            Location: ground.location || "N/A",
            "Price per Slot (LKR)": ground.pricePerSlot,
            "Total Slots": ground.totalSlots,
            Description: ground.description || "N/A",
            Facilities: ground.facilities
                ? ground.facilities.join(", ")
                : "None",
            Equipment: ground.equipment ? ground.equipment.join(", ") : "None",
            Status: ground.isActive ? "Active" : "Inactive",
            "Created Date": new Date(ground.createdAt).toLocaleDateString(),
            "Updated Date": new Date(ground.updatedAt).toLocaleDateString(),
        }));

        // Convert to CSV format
        const csvHeaders = Object.keys(csvData[0] || {});
        const csvContent = [
            csvHeaders.join(","),
            ...csvData.map((row) =>
                csvHeaders
                    .map((header) => {
                        const value = row[header] || "";
                        // Escape commas and quotes in values
                        const escapedValue = String(value).replace(/"/g, '""');
                        return `"${escapedValue}"`;
                    })
                    .join(",")
            ),
        ].join("\n");

        // Create and download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `grounds_report_${new Date()
                .toISOString()
                .split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSuccess("Grounds data exported successfully!");
        setTimeout(() => setSuccess(""), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <p className="text-lg" style={{ color: Brand.body }}>
                        Loading grounds...
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
                    Ground Management
                </h1>
                <p className="text-lg" style={{ color: Brand.body }}>
                    Manage cricket grounds, facilities, and pricing
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
                            placeholder="Search grounds..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border-2 rounded-lg focus:outline-none"
                            style={{ borderColor: Brand.light }}
                        />

                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="px-4 py-2 border-2 rounded-lg focus:outline-none"
                            style={{ borderColor: Brand.light }}
                        >
                            <option value="all">All Grounds</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border-2 rounded-lg focus:outline-none"
                            style={{ borderColor: Brand.light }}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="pricePerSlot">Sort by Price</option>
                            <option value="totalSlots">Sort by Slots</option>
                            <option value="createdAt">Sort by Date Added</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                            className="px-4 py-2 border-2 rounded-lg"
                            style={{ borderColor: Brand.light, color: Brand.body }}
                        >
                            {sortOrder === "asc" ? "↑" : "↓"}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 text-white transition-colors duration-200 rounded-lg hover:opacity-90"
                            style={{ backgroundColor: Brand.secondary }}
                            title="Export grounds data to CSV"
                        >
                            📊 Export CSV
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 text-white transition-colors duration-200 rounded-lg hover:opacity-90"
                            style={{ backgroundColor: Brand.primary }}
                        >
                            + Add New Ground
                        </button>
                    </div>
                </div>

                {/* Export Summary */}
                <div className="mt-4 text-sm" style={{ color: Brand.body }}>
                    📈 Total: {sortedGrounds.length} ground(s) •{" "}
                    Active: {sortedGrounds.filter((g) => g.isActive).length} •{" "}
                    Inactive: {sortedGrounds.filter((g) => !g.isActive).length}
                </div>
            </div>

            {/* Grounds Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedGrounds.length === 0 ? (
                    <div
                        className="py-12 text-center col-span-full"
                        style={{ color: Brand.body }}
                    >
                        <div className="mb-4 text-6xl">🏏</div>
                        <h3 className="mb-2 text-xl font-semibold">No grounds found</h3>
                        <p>
                            {searchTerm
                                ? "No grounds match your search criteria."
                                : "No grounds have been added yet."}
                        </p>
                    </div>
                ) : (
                    sortedGrounds.map((ground) => (
                        <div key={ground._id} className="p-6 bg-white rounded-lg shadow-md">
                            <div className="flex items-start justify-between mb-4">
                                <h3
                                    className="text-xl font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    {ground.name}
                                </h3>
                                <span
                                    className={`px-3 py-1 text-sm font-medium rounded-full ${ground.isActive
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                >
                                    {ground.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            {ground.location && (
                                <div
                                    className="flex items-center mb-2 text-sm"
                                    style={{ color: Brand.body }}
                                >
                                    <span className="mr-2">📍</span>
                                    <span>{ground.location}</span>
                                </div>
                            )}

                            <div className="mb-4">
                                <div
                                    className="text-2xl font-bold"
                                    style={{ color: Brand.accent }}
                                >
                                    LKR {ground.pricePerSlot}/slot
                                </div>
                                <div className="text-sm" style={{ color: Brand.body }}>
                                    {ground.totalSlots} total slots available
                                </div>
                            </div>

                            {ground.description && (
                                <p className="mb-4 text-sm" style={{ color: Brand.body }}>
                                    {ground.description.length > 100
                                        ? `${ground.description.substring(0, 100)}...`
                                        : ground.description}
                                </p>
                            )}

                            {/* Facilities */}
                            <div className="mb-4">
                                <div
                                    className="mb-2 text-sm font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Facilities:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {ground.facilities && ground.facilities.length > 0 ? (
                                        ground.facilities.slice(0, 3).map((facility, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-xs rounded-full"
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
                                            Basic facilities
                                        </span>
                                    )}
                                    {ground.facilities && ground.facilities.length > 3 && (
                                        <span className="text-xs" style={{ color: Brand.body }}>
                                            +{ground.facilities.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4 border-t">
                                <button
                                    onClick={() => openEditModal(ground)}
                                    className="flex-1 px-4 py-2 text-sm text-white rounded hover:opacity-80"
                                    style={{ backgroundColor: Brand.secondary }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedGround(ground);
                                        setShowDeleteModal(true);
                                    }}
                                    className="flex-1 px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Ground Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2
                                className="text-2xl font-bold"
                                style={{ color: Brand.primary }}
                            >
                                Add New Ground
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

                        <form onSubmit={handleCreateGround} className="space-y-4">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        className="block mb-2 text-sm font-semibold"
                                        style={{ color: Brand.heading }}
                                    >
                                        Ground Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
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
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border-2 rounded-lg focus:outline-none"
                                        style={{ borderColor: Brand.light }}
                                        placeholder="e.g., Colombo Sports Complex"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        className="block mb-2 text-sm font-semibold"
                                        style={{ color: Brand.heading }}
                                    >
                                        Price per Slot (LKR) *
                                    </label>
                                    <input
                                        type="number"
                                        name="pricePerSlot"
                                        value={formData.pricePerSlot}
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
                                        Total Slots *
                                    </label>
                                    <select
                                        name="totalSlots"
                                        value={formData.totalSlots}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border-2 rounded-lg focus:outline-none"
                                        style={{ borderColor: Brand.light }}
                                        required
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1} slots
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    className="block mb-2 text-sm font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border-2 rounded-lg min-h-[80px] resize-vertical focus:outline-none"
                                    style={{ borderColor: Brand.light }}
                                    placeholder="Describe the ground features, size, playing conditions..."
                                />
                            </div>

                            {/* Facilities */}
                            <div>
                                <label
                                    className="block mb-2 text-sm font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Facilities Available
                                </label>
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                    {facilityOptions.map((facility) => (
                                        <label
                                            key={facility}
                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                            style={{ color: Brand.body }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="facilities"
                                                value={facility}
                                                checked={formData.facilities.includes(facility)}
                                                onChange={handleInputChange}
                                                className="rounded"
                                            />
                                            <span>{facility.replace("_", " ")}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Equipment */}
                            <div>
                                <label
                                    className="block mb-2 text-sm font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Equipment Provided
                                </label>
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                    {equipmentOptions.map((equipment) => (
                                        <label
                                            key={equipment}
                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                            style={{ color: Brand.body }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="equipment"
                                                value={equipment}
                                                checked={formData.equipment.includes(equipment)}
                                                onChange={handleInputChange}
                                                className="rounded"
                                            />
                                            <span>{equipment}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label
                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                    style={{ color: Brand.body }}
                                >
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="rounded"
                                    />
                                    <span>Ground is active and available for booking</span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 transition-all duration-200 border-2 rounded-lg hover:bg-gray-50"
                                    style={{ borderColor: Brand.light, color: Brand.body }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 font-semibold text-white transition-all duration-200 rounded-lg"
                                    style={{ backgroundColor: Brand.primary }}
                                >
                                    Add Ground
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Ground Modal */}
            {showEditModal && selectedGround && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2
                                className="text-2xl font-bold"
                                style={{ color: Brand.primary }}
                            >
                                Edit Ground: {selectedGround.name}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedGround(null);
                                    resetForm();
                                }}
                                className="text-2xl text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEditGround} className="space-y-4">
                            {/* Same form fields as create modal */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        className="block mb-2 text-sm font-semibold"
                                        style={{ color: Brand.heading }}
                                    >
                                        Ground Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
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
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border-2 rounded-lg focus:outline-none"
                                        style={{ borderColor: Brand.light }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        className="block mb-2 text-sm font-semibold"
                                        style={{ color: Brand.heading }}
                                    >
                                        Price per Slot (LKR) *
                                    </label>
                                    <input
                                        type="number"
                                        name="pricePerSlot"
                                        value={formData.pricePerSlot}
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
                                        Total Slots *
                                    </label>
                                    <select
                                        name="totalSlots"
                                        value={formData.totalSlots}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border-2 rounded-lg focus:outline-none"
                                        style={{ borderColor: Brand.light }}
                                        required
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1} slots
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    className="block mb-2 text-sm font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border-2 rounded-lg min-h-[80px] resize-vertical focus:outline-none"
                                    style={{ borderColor: Brand.light }}
                                />
                            </div>

                            {/* Facilities */}
                            <div>
                                <label
                                    className="block mb-2 text-sm font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Facilities Available
                                </label>
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                    {facilityOptions.map((facility) => (
                                        <label
                                            key={facility}
                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                            style={{ color: Brand.body }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="facilities"
                                                value={facility}
                                                checked={formData.facilities.includes(facility)}
                                                onChange={handleInputChange}
                                                className="rounded"
                                            />
                                            <span>{facility.replace("_", " ")}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Equipment */}
                            <div>
                                <label
                                    className="block mb-2 text-sm font-semibold"
                                    style={{ color: Brand.heading }}
                                >
                                    Equipment Provided
                                </label>
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                    {equipmentOptions.map((equipment) => (
                                        <label
                                            key={equipment}
                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                            style={{ color: Brand.body }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="equipment"
                                                value={equipment}
                                                checked={formData.equipment.includes(equipment)}
                                                onChange={handleInputChange}
                                                className="rounded"
                                            />
                                            <span>{equipment}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label
                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                    style={{ color: Brand.body }}
                                >
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="rounded"
                                    />
                                    <span>Ground is active and available for booking</span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedGround(null);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 transition-all duration-200 border-2 rounded-lg hover:bg-gray-50"
                                    style={{ borderColor: Brand.light, color: Brand.body }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 font-semibold text-white transition-all duration-200 rounded-lg"
                                    style={{ backgroundColor: Brand.secondary }}
                                >
                                    Update Ground
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedGround && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 bg-white rounded-xl">
                        <h3
                            className="mb-4 text-xl font-bold"
                            style={{ color: Brand.primary }}
                        >
                            Delete Ground
                        </h3>

                        <p className="mb-6" style={{ color: Brand.body }}>
                            Are you sure you want to delete{" "}
                            <strong>{selectedGround.name}</strong>? This action cannot be
                            undone and will affect any existing bookings.
                        </p>

                        <p className="mb-6 text-sm text-red-600">
                            ⚠️ Warning: Deleting this ground will impact active bookings and
                            cannot be reversed.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedGround(null);
                                }}
                                className="px-4 py-2 border-2 rounded-lg"
                                style={{ borderColor: Brand.light, color: Brand.body }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteGround}
                                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                            >
                                Delete Ground
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroundsManage;
