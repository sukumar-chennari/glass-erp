import { createBrowserRouter, useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

function RouterErrorPage() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? String(error.status) : 'Error';
  const message = isRouteErrorResponse(error)
    ? (error.statusText || 'This page could not be found.')
    : error instanceof Error
    ? error.message
    : 'An unexpected error occurred.';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'16px', padding:'32px', textAlign:'center' }}>
      <h1 style={{ fontSize:'48px', fontWeight:700, margin:0 }}>{status}</h1>
      <p style={{ color:'#666', maxWidth:'400px' }}>{message}</p>
      <Link to="/" style={{ color:'var(--color-primary)', fontWeight:500 }}>Return to Dashboard</Link>
    </div>
  );
}

import { AppLayout }             from '@/components/layout/AppLayout';
import { ProtectedRoute }         from '@/components/auth/ProtectedRoute';
import { RoleDefaultRedirect }    from '@/components/auth/RoleDefaultRedirect';
import { LoginPage }            from '@/features/auth/LoginPage';
import { ForgotPasswordPage }   from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage }    from '@/features/auth/ResetPasswordPage';
import { VerifyOtpPage }        from '@/features/auth/VerifyOtpPage';
import { DashboardPage }       from '@/features/dashboard/DashboardPage';
import { VendorsPage }         from '@/features/vendors/VendorsPage';
import { ProductsPage }        from '@/features/products/ProductsPage';
import { CustomersPage }       from '@/features/customers/CustomersPage';
import { TechniciansPage }     from '@/features/technicians/TechniciansPage';
import { PurchaseOrdersPage }  from '@/features/purchaseOrders/PurchaseOrdersPage';
import { StockPage }           from '@/features/stock/StockPage';
import { JobsPage }            from '@/features/jobs/JobsPage';
import { InvoicesPage }        from '@/features/invoices/InvoicesPage';
import { ClaimsPage }          from '@/features/claims/ClaimsPage';
import { ReportsPage }         from '@/features/reports/ReportsPage';
import { SettingsPage }        from '@/features/settings/SettingsPage';
import { UsersPage }           from '@/features/settings/pages/UsersPage';
import { BranchesPage }        from '@/features/settings/pages/BranchesPage';
import { EnquiryPage }         from '@/features/enquiry/EnquiryPage';

import { ROUTES }              from '@/constants/routes';

export const router = createBrowserRouter([
  // Public: auth flow (no authentication required)
  {
    path:         ROUTES.LOGIN,
    element:      <LoginPage />,
    errorElement: <RouterErrorPage />,
  },
  {
    path:         ROUTES.FORGOT_PASSWORD,
    element:      <ForgotPasswordPage />,
    errorElement: <RouterErrorPage />,
  },
  {
    path:         ROUTES.RESET_PASSWORD,
    element:      <ResetPasswordPage />,
    errorElement: <RouterErrorPage />,
  },
  {
    path:         ROUTES.VERIFY_OTP,
    element:      <VerifyOtpPage />,
    errorElement: <RouterErrorPage />,
  },

  // Protected: all app routes inside AppLayout
  {
    path:         '/',
    element:      <ProtectedRoute />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <RoleDefaultRedirect /> },

          { path: ROUTES.DASHBOARD,      element: <DashboardPage /> },

          { path: ROUTES.VENDORS,        element: <VendorsPage /> },
          { path: ROUTES.PRODUCTS,       element: <ProductsPage /> },
          { path: ROUTES.PURCHASE_ORDERS,element: <PurchaseOrdersPage /> },
          { path: ROUTES.STOCK,          element: <StockPage /> },
          { path: ROUTES.CUSTOMERS,      element: <CustomersPage /> },
          { path: ROUTES.TECHNICIANS,    element: <TechniciansPage /> },
          { path: ROUTES.JOBS,           element: <JobsPage /> },
          { path: ROUTES.INVOICES,       element: <InvoicesPage /> },
          { path: ROUTES.CLAIMS,         element: <ClaimsPage /> },
          { path: ROUTES.REPORTS,        element: <ReportsPage /> },
          { path: ROUTES.SETTINGS,          element: <SettingsPage /> },
          { path: ROUTES.SETTINGS_USERS,    element: <UsersPage /> },
          { path: ROUTES.SETTINGS_BRANCHES, element: <BranchesPage /> },
          { path: ROUTES.ENQUIRY,           element: <EnquiryPage /> },
        ],
      },
    ],
  },
]);
