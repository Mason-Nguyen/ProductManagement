import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import RequesterDashboard from './pages/dashboards/RequesterDashboard';
import ReviewerDashboard from './pages/dashboards/ReviewerDashboard';
import ApproverDashboard from './pages/dashboards/ApproverDashboard';
import ReceiverDashboard from './pages/dashboards/ReceiverDashboard';
import PurchaserDashboard from './pages/dashboards/PurchaserDashboard';
import UsersManagement from './pages/users-management';
import ProvidersManagement from './pages/providers-management';
import ProductsManagement from './pages/products-management';
import DepartmentsManagement from './pages/departments-management';
import MyRequests from './pages/my-requests';
import PendingReviews from './pages/pending-reviews';
import ApprovedRequests from './pages/approved-requests';
import RejectedRequests from './pages/rejected-requests';
import PurchaseOrders from './pages/purchase-orders';
import ApprovalConfigManagement from './pages/approval-config-management';
import ApprovalLogPage from './pages/approval-log';
import LoginLogPage from './pages/login-log';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={
            authService.isAuthenticated()
              ? <Navigate to={authService.getRolePath()} replace />
              : <Login />
          }
        />

        {/* Role Dashboards */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/requester" element={
          <ProtectedRoute allowedRoles={['Requester']}>
            <RequesterDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/reviewer" element={
          <ProtectedRoute allowedRoles={['Reviewer']}>
            <ReviewerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/approver" element={
          <ProtectedRoute allowedRoles={['Approver']}>
            <ApproverDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/receiver" element={
          <ProtectedRoute allowedRoles={['Receiver']}>
            <ReceiverDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/purchaser" element={
          <ProtectedRoute allowedRoles={['Purchaser']}>
            <PurchaserDashboard />
          </ProtectedRoute>
        } />

        {/* Admin Management Pages */}
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <UsersManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/departments" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DepartmentsManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/providers" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <ProvidersManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <ProductsManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/approval-configs" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <ApprovalConfigManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/approval-logs" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <ApprovalLogPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/login-logs" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <LoginLogPage />
          </ProtectedRoute>
        } />

        {/* Requester Management Pages */}
        <Route path="/requester/providers" element={
          <ProtectedRoute allowedRoles={['Requester']}>
            <ProvidersManagement />
          </ProtectedRoute>
        } />
        <Route path="/requester/products" element={
          <ProtectedRoute allowedRoles={['Requester']}>
            <ProductsManagement />
          </ProtectedRoute>
        } />
        <Route path="/requester/my-requests" element={
          <ProtectedRoute allowedRoles={['Requester']}>
            <MyRequests />
          </ProtectedRoute>
        } />
        <Route path="/requester/purchase-orders" element={
          <ProtectedRoute allowedRoles={['Requester']}>
            <PurchaseOrders />
          </ProtectedRoute>
        } />

        {/* Reviewer Management Pages */}
        <Route path="/reviewer/pending-reviews" element={
          <ProtectedRoute allowedRoles={['Reviewer']}>
            <PendingReviews />
          </ProtectedRoute>
        } />
        <Route path="/reviewer/approved-requests" element={
          <ProtectedRoute allowedRoles={['Reviewer']}>
            <ApprovedRequests />
          </ProtectedRoute>
        } />
        <Route path="/reviewer/rejected-requests" element={
          <ProtectedRoute allowedRoles={['Reviewer']}>
            <RejectedRequests />
          </ProtectedRoute>
        } />
        <Route path="/reviewer/providers" element={
          <ProtectedRoute allowedRoles={['Reviewer']}>
            <ProvidersManagement />
          </ProtectedRoute>
        } />
        <Route path="/reviewer/products" element={
          <ProtectedRoute allowedRoles={['Reviewer']}>
            <ProductsManagement />
          </ProtectedRoute>
        } />

        {/* Approver Management Pages */}
        <Route path="/approver/pending-reviews" element={
          <ProtectedRoute allowedRoles={['Approver']}>
            <PendingReviews />
          </ProtectedRoute>
        } />
        <Route path="/approver/approved-requests" element={
          <ProtectedRoute allowedRoles={['Approver']}>
            <ApprovedRequests />
          </ProtectedRoute>
        } />
        <Route path="/approver/rejected-requests" element={
          <ProtectedRoute allowedRoles={['Approver']}>
            <RejectedRequests />
          </ProtectedRoute>
        } />
        <Route path="/approver/providers" element={
          <ProtectedRoute allowedRoles={['Approver']}>
            <ProvidersManagement />
          </ProtectedRoute>
        } />
        <Route path="/approver/products" element={
          <ProtectedRoute allowedRoles={['Approver']}>
            <ProductsManagement />
          </ProtectedRoute>
        } />
        <Route path="/approver/approval-logs" element={
          <ProtectedRoute allowedRoles={['Approver']}>
            <ApprovalLogPage />
          </ProtectedRoute>
        } />

        {/* Receiver Management Pages */}
        <Route path="/receiver/purchase-orders" element={
          <ProtectedRoute allowedRoles={['Receiver']}>
            <PurchaseOrders />
          </ProtectedRoute>
        } />
        <Route path="/receiver/products" element={
          <ProtectedRoute allowedRoles={['Receiver']}>
            <ProductsManagement />
          </ProtectedRoute>
        } />

        {/* Purchaser Management Pages */}
        <Route path="/purchaser/products" element={
          <ProtectedRoute allowedRoles={['Purchaser']}>
            <ProductsManagement />
          </ProtectedRoute>
        } />
        <Route path="/purchaser/providers" element={
          <ProtectedRoute allowedRoles={['Purchaser']}>
            <ProvidersManagement />
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
