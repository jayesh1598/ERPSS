import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Dashboard } from "./components/Dashboard";
import { SteelDashboard } from "./components/SteelDashboard";
import { ProcessFlowGuide } from "./components/ProcessFlowGuide";
import { MasterData } from "./components/MasterData";
import { PurchaseRequisitions } from "./components/PurchaseRequisitions";
import { Quotations } from "./components/Quotations";
import { PurchaseOrders } from "./components/PurchaseOrders";
import { Invoices } from "./components/Invoices";
import { Inventory } from "./components/Inventory";
import { QualityControl } from "./components/QualityControl";
import { Production } from "./components/Production";
import { FinishedGoods } from "./components/FinishedGoods";
import { Sales } from "./components/Sales";
import { SalesOrderManagement } from "./components/SalesOrderManagement";
import { SalesInvoiceManagement } from "./components/SalesInvoiceManagement";
import { DeliveryChallan } from "./components/DeliveryChallan";
import { EWayBills } from "./components/EWayBills";
import { GSTManagement } from "./components/GSTManagement";
import { HRM } from "./components/HRM"; // HRM Module
import { AuditLogs } from "./components/AuditLogs";
import { OfflineMode } from "./components/OfflineMode";
import { UserRoleManagement } from "./components/UserRoleManagement";
import { BillOfMaterials } from "./components/BillOfMaterials";
import { ProductionOrders } from "./components/ProductionOrders";
import { Reports } from "./components/Reports";
import { ApprovalRules } from "./components/ApprovalRules";
import { Notifications } from "./components/Notifications";
import { ProductionDemoWizard } from "./components/ProductionDemoWizard";
import { ProductionDemoPlaybook } from "./components/ProductionDemoPlaybook";
import { Accounting } from "./components/Accounting"; // Import Accounting module
import { NotFound } from "./components/NotFound";
import { DebugAuth } from "./components/DebugAuth";
import { DiagnosePage } from "./components/DiagnosePage";
import { VerificationPage } from "./components/VerificationPage";
import { TestAuth } from "./components/TestAuth";
import { AdminLogin } from "./components/AdminLogin";
import { AdminSetup } from "./components/AdminSetup";
import { JWTDebug } from "./components/JWTDebug";
import { SetupVerification } from "./components/SetupVerification";
import { AuthDiagnostics } from "./components/AuthDiagnostics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: SteelDashboard },
      { path: "process-flow", Component: ProcessFlowGuide },
      { path: "dashboard", Component: Dashboard },
      { path: "master-data", Component: MasterData },
      { path: "purchase-requisitions", Component: PurchaseRequisitions },
      { path: "quotations", Component: Quotations },
      { path: "purchase-orders", Component: PurchaseOrders },
      { path: "invoices", Component: Invoices },
      { path: "inventory", Component: Inventory },
      { path: "finished-goods", Component: FinishedGoods },
      { path: "quality-control", Component: QualityControl },
      { path: "production", Component: Production },
      { path: "production-orders", Component: ProductionOrders },
      { path: "production-demo-wizard", Component: ProductionDemoWizard },
      { path: "production-demo-playbook", Component: ProductionDemoPlaybook },
      { path: "accounting", Component: Accounting }, // NEW: Accounting Module Route
      { path: "hrm", Component: HRM }, // NEW: HRM Module Route
      
      // Sales & Dispatch Routes - ADDED
      { path: "sales-orders", Component: SalesOrderManagement },
      { path: "delivery-challan", Component: DeliveryChallan },
      { path: "eway-bills", Component: EWayBills },
      { path: "sales-invoices", Component: SalesInvoiceManagement },
      { path: "gst", Component: GSTManagement },
      
      { path: "reports", Component: Reports },
      { path: "audit-logs", Component: AuditLogs },
      { path: "offline-mode", Component: OfflineMode }, // Fixed: Changed from "offline" to "offline-mode"
      { path: "user-role-management", Component: UserRoleManagement },
      { path: "approval-rules", Component: ApprovalRules },
      { path: "notifications", Component: Notifications },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  { path: "/debug-auth", Component: DebugAuth },
  { path: "/diagnose", Component: DiagnosePage },
  { path: "/verify-jwt-fix", Component: VerificationPage },
  { path: "/test-auth", Component: TestAuth },
  { path: "/admin-login", Component: AdminLogin },
  { path: "/admin-setup", Component: AdminSetup },
  { path: "/jwt-debug", Component: JWTDebug },
  { path: "/setup-verification", Component: SetupVerification },
  { path: "/auth-diagnostics", Component: AuthDiagnostics },
  { path: "*", Component: NotFound },
]);