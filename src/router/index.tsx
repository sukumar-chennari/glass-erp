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
import { LoginPage }            from '@/features/auth/LoginPage';
import { ForgotPasswordPage }   from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage }    from '@/features/auth/ResetPasswordPage';
import { VerifyOtpPage }        from '@/features/auth/VerifyOtpPage';
import { SetupPasswordPage }   from '@/features/auth/SetupPasswordPage';
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
import { SettingsLayout, SettingsIndexRedirect } from '@/features/settings/SettingsLayout';
import { UsersPage }            from '@/features/settings/pages/UsersPage';
import { BranchesPage }         from '@/features/settings/pages/BranchesPage';
import { PricingPage }          from '@/features/settings/pages/PricingPage';
import { InsuranceRulesPage }   from '@/features/settings/pages/InsuranceRulesPage';
import { VehicleModelsPage }    from '@/features/settings/pages/VehicleModelsPage';
import { CarBrandsPage }        from '@/features/settings/pages/CarBrandsPage';
import { CarModelsPage }        from '@/features/settings/pages/CarModelsPage';
import { EnquiryPage }         from '@/features/enquiry/EnquiryPage';
import { CustomerSubmitPage }  from '@/features/customer/CustomerSubmitPage';
import { CustomerTrackPage }   from '@/features/customer/CustomerTrackPage';
import { EntryPage }           from '@/features/entry/EntryPage';

import { ROUTES }              from '@/constants/routes';

export const router = createBrowserRouter([
  // Public: customer entry page — unauthenticated users land here first.
  // EntryPage redirects authenticated users to their role dashboard via getRoleDefaultRoute.
  {
    path:         ROUTES.ROOT,
    element:      <EntryPage />,
    errorElement: <RouterErrorPage />,
  },

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
  {
    path:         ROUTES.SETUP_PASSWORD,
    element:      <SetupPasswordPage />,
    errorElement: <RouterErrorPage />,
  },
  {
    path:         ROUTES.SUBMIT,
    element:      <CustomerSubmitPage />,
    errorElement: <RouterErrorPage />,
  },
  {
    path:         ROUTES.TRACK,
    element:      <CustomerTrackPage />,
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
          {
            path:    ROUTES.SETTINGS,
            element: <SettingsLayout />,
            children: [
              { index: true,                             element: <SettingsIndexRedirect /> },
              { path: ROUTES.SETTINGS_INSURANCE_RULES,  element: <InsuranceRulesPage /> },
              { path: ROUTES.SETTINGS_VEHICLE_MODELS,   element: <VehicleModelsPage /> },
              { path: ROUTES.SETTINGS_CAR_BRANDS,       element: <CarBrandsPage /> },
              { path: ROUTES.SETTINGS_CAR_MODELS,       element: <CarModelsPage /> },
              { path: ROUTES.SETTINGS_USERS,            element: <UsersPage /> },
              { path: ROUTES.SETTINGS_BRANCHES,         element: <BranchesPage /> },
              { path: ROUTES.SETTINGS_PRICING,          element: <PricingPage /> },
            ],
          },
          { path: ROUTES.ENQUIRY,           element: <EnquiryPage /> },
        ],
      },
    ],
  },
]);
