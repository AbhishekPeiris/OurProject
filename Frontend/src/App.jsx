import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

// --- Security and Layout Components ---
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import CustomerLayout from "./components/CustomerLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import OrderManagerLayout from "./components/OrderManagerLayout.jsx";

// --- Page Components ---
import Login from "./components/Login.jsx";
import SignUpMultiStep from "./components/SignUpMultiStep.jsx";
import HomePage from "./components/HomePage.jsx";
import Profile from "./pages/Profile.jsx";
import EditAccount from "./pages/EditAccount.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import AllPayments from "./pages/Allpayments.jsx";
import Inventorys from "./pages/Inventory.jsx";
import PayrollManagement from "./pages/PayrollManagement.jsx";
import MyOrders from "./pages/MyOrders.jsx";

// --- New E-commerce Pages ---
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import BuyPage from "./pages/BuyPage.jsx";
import Cart from "./pages/Cart.jsx";
import Delivery from "./pages/Delivery.jsx";
import Payment from "./pages/Payment.jsx";
import OrderSummary from "./pages/OrderSummary.jsx";
import Orders from "./pages/Orders.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";

// --- Coaching Programs Pages ---
import Programs from "./pages/Programs.jsx";
import ProgramDetails from "./pages/ProgramDetails.jsx";
import EnrollmentDetails from "./pages/EnrollmentDetails.jsx";
import CoachDashboard from "./pages/CoachDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";

// --- Order Manager Pages ---
import ListOrders from "./pages/OrderManager/ListOrders.jsx";
import ListProducts from "./pages/OrderManager/ListProducts.jsx";
import AddProducts from "./pages/OrderManager/AddProduct.jsx";
// Removed CartPending page; cart pending now shown in orders list
// Add other Order Manager page imports here

// --- Placeholder Pages for Admin Dashboard ---
const AdminDashboardOverview = () => (
  <div className="p-4 bg-white rounded-lg shadow">
    <h2>Admin Dashboard Overview</h2>
    <p>Here you can see site statistics.</p>
  </div>
);
const Payments = () => (
  <div className="p-4 bg-white rounded-lg shadow">
    <h2>All Payments</h2>
  </div>
);

// --- Repair Service Components ---
import RepairRequestForm from "./pages/RepairRequestForm";
import MyRequestsPage from "./pages/MyRequestsPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import ServiceManagerDashboard from "./pages/ServiceManagerDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import Dashboard from "./pages/Dashboard";
import SimpleDashboard from "./pages/SimpleDashboard";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import FAQ from "./pages/FAQ";
import ContactUs from "./pages/ContactUs";
import ContactSuccess from "./pages/ContactSuccess";
import AdminMessages from "./pages/AdminMessages";
import Header from "./components/Header";
import Footer from "./components/Footer";
import NewTechnicianForm from "./pages/NewTechnicianForm";
import TestPage from "./pages/TestPage";
import RepairRevenue from "./pages/RepairRevenue";
import GroundBooking from "./pages/GroundBooking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import AdminGroundBooking from "./pages/AdminGround/GroundBooking.jsx";

// Wrapper to pass URL param
function CustomerDashboardWrapper() {
  const { customerId } = useParams();
  return <CustomerDashboard customerId={customerId} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUpMultiStep />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        {/* --- E-commerce Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/buy" element={<BuyPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/orders" element={<OrderSummary />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/track-order" element={<OrderTracking />} />
        <Route path="/ground-booking" element={<GroundBooking />} />
        <Route path="/my-booking" element={<MyBookings />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        {/* --- Coaching Programs Public Routes --- */}
        <Route path="/programs" element={<Programs />} />
        <Route path="/programs/:id" element={<ProgramDetails />} />
        <Route
          path="/enrollment/:enrollmentId"
          element={<EnrollmentDetails />}
        />
        {/* --- Legacy Home Route --- */}
        <Route path="/homepage" element={<HomePage />} />
        {/* --- CUSTOMER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<Navigate to="/customer/profile" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="edit-account" element={<EditAccount />} />
            <Route path="my-orders" element={<MyOrders />} />
            <Route path="my-booking" element={<MyBookings />} />
          </Route>
        </Route>
        {/* --- 🏏 COACH ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["coach"]} />}>
          <Route path="/coach-dashboard" element={<CoachDashboard />} />
        </Route>
        {/* --- 🏏 COACH ROUTES (TESTING - NO AUTH) --- */}
        <Route path="/coach-dashboard-test" element={<CoachDashboard />} />
        {/* --- 📊 COACHING MANAGER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["coaching_manager"]} />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        </Route>
        {/* --- 🔧 TECHNICIAN ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["technician"]} />}>
          <Route path="/technician" element={<TechnicianDashboard />} />
        </Route>
        {/* --- 🛠️ SERVICE MANAGER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["service_manager"]} />}>
          <Route path="/service-dashboard" element={<Dashboard />} />
        </Route>
        {/* --- Repair Service Routes --- */}
        <Route path="/" element={<SimpleDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/repair" element={<RepairRequestForm />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route
          path="/dashboard/:customerId"
          element={<CustomerDashboardWrapper />}
        />
        <Route path="/manager" element={<ServiceManagerDashboard />} />
        <Route path="/technician" element={<TechnicianDashboard />} />
        <Route path="/new-technician" element={<NewTechnicianForm />} />
        <Route path="/repair-revenue" element={<RepairRevenue />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/contact-success" element={<ContactSuccess />} />
        <Route path="/admin-messages" element={<AdminMessages />} />
        <Route path="/test" element={<TestPage />} />
        {/* --- ADMIN ROUTES --- */}
        {/* <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" />} />
                <Route path="dashboard" element={<AdminDashboardOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="payments" element={<AllPayments />} />
                <Route path="payroll" element={<PayrollManagement />} />
                <Route path="inventory" element={<Inventorys />} />
                <Route path="profile" element={<Profile />} />
                <Route path="edit-account" element={<EditAccount />} />
                <Route path="orders" element={<ListOrders />} />
                <Route path="ground-booking" element={<AdminGroundBooking />} />
            </Route>
        </Route> */}

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboardOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="payments" element={<AllPayments />} />
          <Route path="payroll" element={<PayrollManagement />} />
          <Route path="inventory" element={<Inventorys />} />
          <Route path="profile" element={<Profile />} />
          <Route path="edit-account" element={<EditAccount />} />
          <Route path="orders" element={<ListOrders />} />
          <Route path="ground-booking" element={<AdminGroundBooking />} />
        </Route>


        {/* --- 📦 ORDER MANAGER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["order_manager"]} />}>
          <Route path="/order_manager" element={<OrderManagerLayout />}>
            <Route index element={<Navigate to="/order_manager/orders" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="edit-account" element={<EditAccount />} />
            <Route path="orders" element={<ListOrders />} />
            <Route path="products" element={<ListProducts />} />
            <Route path="add_product" element={<AddProducts />} />
            {/* You can add more routes for the order manager here */}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
