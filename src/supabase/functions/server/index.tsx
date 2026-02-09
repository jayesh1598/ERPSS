import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import * as accounting from "./accounting.tsx";

const app = new Hono();

// ✅ FIXED: Hardcode the target Supabase project credentials
// Edge Functions run in a different Supabase project, so we need to explicitly specify
// the target project that the frontend is connecting to
const SUPABASE_URL = "https://dhahhnqdwsncjieqydjh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Log configuration on startup
console.log("🚀 Server starting with configuration:");
console.log("   SUPABASE_URL:", SUPABASE_URL);
console.log("   SUPABASE_ANON_KEY (first 30 chars):", SUPABASE_ANON_KEY.substring(0, 30) + "...");
console.log("   SERVICE_ROLE_KEY configured:", !!SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase clients
// Service role client for admin operations (creating users, etc.)
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

// Anon client for validating user JWTs
const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

// Initialize Storage Buckets (idempotent - runs once per server start)
const initializeStorageBuckets = async () => {
  try {
    const bucketName = 'make-8eebe9eb-documents';
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('📦 Creating storage bucket:', bucketName);
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      });
      console.log('��� Storage bucket created successfully');
    } else {
      console.log('✅ Storage bucket already exists:', bucketName);
    }
  } catch (error: any) {
    console.error('❌ Failed to initialize storage bucket:', error.message);
  }
};

// Initialize buckets on server start
initializeStorageBuckets();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "x-client-info",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Authentication Middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    console.error(
      "Authentication failed: No Authorization header provided",
    );
    return c.json(
      {
        error:
          "Unauthorized - No token provided. Please log in again.",
      },
      401,
    );
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.error(
      "Authentication failed: Invalid Authorization header format",
    );
    return c.json(
      { error: "Unauthorized - Invalid token format" },
      401,
    );
  }

  const accessToken = parts[1];
  if (!accessToken) {
    console.error("Authentication failed: Empty token");
    return c.json(
      {
        error:
          "Unauthorized - Empty token provided. Please log in again.",
      },
      401,
    );
  }

  try {
    console.log(
      "🔐 Auth: Validating token, length:",
      accessToken.length,
    );
    console.log(
      "🔐 Auth: Token prefix:",
      accessToken.substring(0, 20),
    );
    
    // Decode JWT payload for debugging (without verification)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log("🔐 Auth: JWT payload:", {
        iss: payload.iss,
        sub: payload.sub,
        exp: payload.exp,
        expDate: new Date(payload.exp * 1000).toISOString(),
        isExpired: payload.exp * 1000 < Date.now()
      });
    } catch (e) {
      console.error("🔐 Auth: Failed to decode JWT payload:", e);
    }

    // ✅ FIXED: Use supabaseClient (with anon key) to verify user tokens
    // The admin client is only for admin operations, not for verifying user JWTs
    console.log("🔐 Auth: Verifying JWT with supabaseClient...");
    console.log("🔐 Auth: Using Supabase URL:", SUPABASE_URL);
    
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(accessToken);

    if (error) {
      console.error(
        "🔐 Auth failed: Token verification error:",
        error.message,
      );
      console.error("🔐 Auth failed: Full error object:", JSON.stringify(error));
      console.error("🔐 Auth failed: Error name:", error.name);
      console.error("🔐 Auth failed: Error status:", error.status);
      return c.json(
        {
          error: `Unauthorized - ${error.message}. Please log in again.`,
          code: 401,
          message: "Invalid JWT",
          details: {
            errorName: error.name,
            errorStatus: error.status,
            errorMessage: error.message
          }
        },
        401,
      );
    }

    if (!user) {
      console.error("🔐 Auth failed: No user found for token");
      return c.json(
        {
          error:
            "Unauthorized - Invalid token. Please log in again.",
          code: 401,
          message: "Invalid JWT",
        },
        401,
      );
    }

    console.log("🔐 Auth success: User validated:", user.email);
    // Token is valid, set user context
    c.set("userId", user.id);
    c.set("userEmail", user.email);
    await next();
  } catch (error: any) {
    console.error(
      "🔐 Auth middleware exception:",
      error.message,
      error,
    );
    return c.json(
      {
        error: `Authentication error: ${error.message}. Please log in again.`,
        code: 401,
        message: "Invalid JWT",
      },
      401,
    );
  }
};

// Audit Log Helper
const createAuditLog = async (
  userId: string,
  action: string,
  module: string,
  recordId?: string,
  oldValue?: any,
  newValue?: any,
) => {
  const logId = crypto.randomUUID();
  await kv.set(`audit_log:${logId}`, {
    id: logId,
    user_id: userId,
    action,
    module,
    record_id: recordId,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    timestamp: new Date().toISOString(),
  });
};

// Notification Helper
const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'approval_required' | 'approval_approved' | 'approval_rejected',
  relatedModule?: string,
  relatedId?: string,
) => {
  const notificationId = crypto.randomUUID();
  await kv.set(`notification:${userId}:${notificationId}`, {
    id: notificationId,
    user_id: userId,
    title,
    message,
    type,
    related_module: relatedModule,
    related_id: relatedId,
    read: false,
    created_at: new Date().toISOString(),
  });
  console.log(`📬 Notification created for user ${userId}: ${title}`);
};

// Approval Workflow Helper - Check if approval is needed and who needs to approve
const getNextApprover = async (documentType: string, amount: number, currentApprovalLevel: number = 0) => {
  // Get all approval rules for this document type
  const allRules = await kv.getByPrefix(`approval_rule:`);
  const rules = allRules
    .filter((r: any) => r.document_type === documentType && r.is_active)
    .sort((a: any, b: any) => a.approval_level - b.approval_level);
  
  console.log(`🔍 Checking approval rules for ${documentType}, amount: ${amount}, current level: ${currentApprovalLevel}`);
  
  // Find applicable rules based on amount thresholds
  const applicableRules = rules.filter((r: any) => {
    const meetsMin = !r.min_amount || amount >= r.min_amount;
    const meetsMax = !r.max_amount || amount <= r.max_amount;
    return meetsMin && meetsMax && r.approval_level > currentApprovalLevel;
  });
  
  if (applicableRules.length === 0) {
    console.log(`✅ No more approval levels required`);
    return null; // No more approvals needed
  }
  
  // Return the next approval level
  const nextRule = applicableRules[0];
  console.log(`📋 Next approval level ${nextRule.approval_level}: Role ${nextRule.role_name}`);
  return nextRule;
};

// Get users who can approve based on role
const getUsersWithRole = async (roleName: string) => {
  const allUserRoles = await kv.getByPrefix(`user_role:`);
  const roleUserIds = allUserRoles
    .filter((ur: any) => ur.role_name === roleName)
    .map((ur: any) => ur.user_id);
  
  return [...new Set(roleUserIds)]; // Remove duplicates
};

// Health check endpoint
app.get("/make-server-8eebe9eb/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "4.2-hardcoded-target-project",
    authMethod: "supabaseClient.auth.getUser(accessToken) with Anon Key",
    configuration: {
      targetSupabaseUrl: SUPABASE_URL,
      targetProjectId: "dhahhnqdwsncjieqydjh",
      hasTargetAnonKey: !!SUPABASE_ANON_KEY,
      hasTargetServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
      anonKeyPrefix: SUPABASE_ANON_KEY.substring(0, 30) + "...",
    },
    hostEnvironment: {
      supabaseUrl: Deno.env.get("SUPABASE_URL"),
      hasAnonKey: !!Deno.env.get("SUPABASE_ANON_KEY"),
      hasServiceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      hasTargetServiceKey: !!Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY"),
    }
  });
});

// Initialize Admin User (One-time setup)
app.post("/make-server-8eebe9eb/auth/init-admin", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    // Check if admin already exists
    const existingAdmins = await kv.getByPrefix("admin:");
    if (existingAdmins && existingAdmins.length > 0) {
      return c.json({ error: "Admin already exists" }, 400);
    }

    // Create admin user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: "admin" },
      email_confirm: true,
    });

    if (error) {
      console.error("Admin creation error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;

    // Create admin user record
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role: "admin",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Mark as admin
    await kv.set(`admin:${userId}`, {
      user_id: userId,
      email,
      created_at: new Date().toISOString(),
    });

    console.log("✅ Admin user created successfully:", email);
    return c.json({ 
      success: true, 
      message: "Admin user created successfully",
      user: { id: userId, email, name, role: "admin" }
    });
  } catch (error: any) {
    console.error("Init admin error:", error.message);
    return c.json({ error: error.message }, 500);
  }
});

// Simple auth test endpoint
app.get("/make-server-8eebe9eb/auth/test", authMiddleware, (c) => {
  const userId = c.get("userId");
  const userEmail = c.get("userEmail");
  return c.json({
    success: true,
    message: "Authentication successful!",
    user: {
      id: userId,
      email: userEmail
    }
  });
});

// Debug endpoint to test JWT validation
app.post(
  "/make-server-8eebe9eb/debug/validate-token",
  async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      console.log(
        "🔍 Debug: Received Authorization header:",
        authHeader?.substring(0, 50) + "...",
      );

      if (!authHeader) {
        return c.json({
          success: false,
          error: "No Authorization header",
        });
      }

      const token = authHeader.replace("Bearer ", "");
      console.log(
        "🔍 Debug: Token extracted, length:",
        token.length,
      );
      console.log(
        "🔍 Debug: Token starts with:",
        token.substring(0, 20),
      );

      // Check environment variables
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      console.log("🔍 Debug: SUPABASE_URL:", supabaseUrl);
      console.log(
        "🔍 Debug: SERVICE_ROLE_KEY present:",
        !!serviceRoleKey,
      );

      // ✅ FIXED: Use supabaseClient (anon key) for JWT validation
      console.log("🔍 Debug: Attempting supabaseClient.auth.getUser(token)...");
      const { data, error } =
        await supabaseClient.auth.getUser(token);

      if (error) {
        console.error("🔍 Debug: getUser() error:", error);
        return c.json({
          success: false,
          error: error.message,
          errorDetails: error,
        });
      }

      if (!data.user) {
        console.error("🔍 Debug: No user returned");
        return c.json({
          success: false,
          error: "No user returned",
        });
      }

      console.log(
        "🔍 Debug: User validated successfully:",
        data.user.email,
      );
      return c.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    } catch (error: any) {
      console.error("🔍 Debug: Exception:", error);
      return c.json({
        success: false,
        error: error.message,
        stack: error.stack,
      });
    }
  },
);

// ==================== AUTH ROUTES ====================

// Sign Up
app.post("/make-server-8eebe9eb/auth/signup", async (c) => {
  try {
    const { email, password, name, phone, employee_code } =
      await c.req.json();

    // Validate unique email and phone
    const allUsers = await kv.getByPrefix("user:");
    
    const emailExists = allUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return c.json({ error: "Email already exists" }, 400);
    }
    
    if (phone) {
      const phoneExists = allUsers.find((u: any) => u.phone === phone);
      if (phoneExists) {
        return c.json({ error: "Phone number already exists" }, 400);
      }
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, phone, employee_code },
        email_confirm: true, // Auto-confirm since email server not configured
      });

    if (error) {
      console.log("Signup error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    // Create user record
    const userId = data.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      phone,
      employee_code,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return c.json({ success: true, user: data.user });
  } catch (error: any) {
    console.log("Signup error:", error.message);
    return c.json({ error: error.message }, 500);
  }
});

// Get Current User
app.get(
  "/make-server-8eebe9eb/auth/me",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const user = await kv.get(`user:${userId}`);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if user is admin
      const adminRecord = await kv.get(`admin:${userId}`);
      const isAdmin = !!adminRecord;

      // Get user roles
      const roleKeys = await kv.getByPrefix(
        `user_role:${userId}:`,
      );
      const roles = roleKeys.map((r: any) => r.role_id);

      return c.json({ 
        user: {
          ...user,
          role: isAdmin ? "admin" : (user.role || "user"),
          is_admin: isAdmin
        }, 
        roles 
      });
    } catch (error: any) {
      console.log("Get user error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get All Users (Admin Only)
app.get(
  "/make-server-8eebe9eb/users",
  authMiddleware,
  async (c) => {
    try {
      const users = await kv.getByPrefix("user:");
      
      // Deduplicate users by ID (in case of duplicate records)
      const uniqueUsersMap = new Map();
      users.forEach((user: any) => {
        if (!uniqueUsersMap.has(user.id)) {
          uniqueUsersMap.set(user.id, user);
        }
      });
      const uniqueUsers = Array.from(uniqueUsersMap.values());
      
      // Enrich each user with role assignments
      const enrichedUsers = await Promise.all(
        uniqueUsers.map(async (user: any) => {
          // Get user role assignments
          const roleAssignments = await kv.getByPrefix(`user_role:${user.id}:`);
          
          // Deduplicate role assignments
          const uniqueRoleAssignments = roleAssignments.filter((assignment: any, index: number, self: any[]) =>
            index === self.findIndex((a: any) => a.role_id === assignment.role_id)
          );
          
          // Get role details for each assignment
          const rolesWithDetails = await Promise.all(
            uniqueRoleAssignments.map(async (assignment: any) => {
              const role = await kv.get(`role:${assignment.role_id}`);
              return {
                ...assignment,
                role_name: role?.name || 'Unknown Role',
                role_description: role?.description
              };
            })
          );
          
          // Check if user is admin
          const adminRecord = await kv.get(`admin:${user.id}`);
          const isAdmin = !!adminRecord;
          
          return {
            ...user,
            is_admin: isAdmin,
            role_assignments: rolesWithDetails,
            role_count: uniqueRoleAssignments.length
          };
        })
      );
      
      return c.json({ users: enrichedUsers });
    } catch (error: any) {
      console.log("Get users error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== ROLE & PERMISSION ROUTES ====================

// Create Role (Admin Only)
app.post(
  "/make-server-8eebe9eb/roles",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { name, description, permissions } =
        await c.req.json();

      // Check for duplicate role name
      const allRoles = await kv.getByPrefix("role:");
      const roleExists = allRoles.find((r: any) => r.name.toLowerCase() === name.toLowerCase());
      if (roleExists) {
        return c.json({ error: "Role name already exists" }, 400);
      }

      const roleId = crypto.randomUUID();
      const role = {
        id: roleId,
        name,
        description,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`role:${roleId}`, role);

      // Create permissions
      if (permissions && Array.isArray(permissions)) {
        for (const perm of permissions) {
          const permId = crypto.randomUUID();
          await kv.set(`permission:${roleId}:${permId}`, {
            id: permId,
            role_id: roleId,
            permission_id: perm.permission_id,
            permission_name: perm.permission_name,
            module: perm.module,
          });
        }
      }

      await createAuditLog(
        userId,
        "create",
        "roles",
        roleId,
        null,
        role,
      );
      return c.json({ success: true, role });
    } catch (error: any) {
      console.log("Create role error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get All Roles
app.get(
  "/make-server-8eebe9eb/roles",
  authMiddleware,
  async (c) => {
    try {
      const roles = await kv.getByPrefix("role:");
      
      // Deduplicate roles by ID (in case of duplicate records)
      const uniqueRolesMap = new Map();
      roles.forEach((role: any) => {
        if (!uniqueRolesMap.has(role.id)) {
          uniqueRolesMap.set(role.id, role);
        }
      });
      const uniqueRoles = Array.from(uniqueRolesMap.values());
      
      // Enrich each role with permission count
      const enrichedRoles = await Promise.all(
        uniqueRoles.map(async (role: any) => {
          const permissions = await kv.getByPrefix(`permission:${role.id}:`);
          
          // Deduplicate permissions
          const uniquePermissions = permissions.filter((perm: any, index: number, self: any[]) =>
            index === self.findIndex((p: any) => p.permission_id === perm.permission_id)
          );
          
          return {
            ...role,
            permissions: uniquePermissions,
            permission_count: uniquePermissions.length
          };
        })
      );
      
      return c.json({ roles: enrichedRoles });
    } catch (error: any) {
      console.log("Get roles error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Assign Role to User
app.post(
  "/make-server-8eebe9eb/users/:userId/roles",
  authMiddleware,
  async (c) => {
    try {
      const adminId = c.get("userId");
      const { userId } = c.req.param();
      const { role_id, warehouse_id, department_id } =
        await c.req.json();

      const assignmentId = crypto.randomUUID();
      const assignment = {
        id: assignmentId,
        user_id: userId,
        role_id,
        warehouse_id,
        department_id,
        assigned_at: new Date().toISOString(),
        assigned_by: adminId,
      };

      await kv.set(
        `user_role:${userId}:${assignmentId}`,
        assignment,
      );
      await createAuditLog(
        adminId,
        "assign_role",
        "user_roles",
        assignmentId,
        null,
        assignment,
      );

      return c.json({ success: true, assignment });
    } catch (error: any) {
      console.log("Assign role error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get Permissions for Role
app.get(
  "/make-server-8eebe9eb/roles/:roleId/permissions",
  authMiddleware,
  async (c) => {
    try {
      const { roleId } = c.req.param();
      const permissions = await kv.getByPrefix(
        `permission:${roleId}:`,
      );
      return c.json({ permissions });
    } catch (error: any) {
      console.log("Get permissions error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== MASTER DATA ROUTES ====================

// Warehouses
app.post(
  "/make-server-8eebe9eb/warehouses",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { code, name, location } = await c.req.json();

      // Validate required fields
      if (!code || !name || !location) {
        console.log("Warehouse creation validation failed:", {
          code,
          name,
          location,
        });
        return c.json(
          {
            error:
              "All fields (code, name, location) are required",
          },
          400,
        );
      }

      // Check if warehouse code already exists
      const existingWarehouses =
        await kv.getByPrefix("warehouse:");
      const codeExists = existingWarehouses.some(
        (wh: any) => wh.code === code,
      );
      if (codeExists) {
        console.log("Warehouse code already exists:", code);
        return c.json(
          { error: `Warehouse code '${code}' already exists` },
          400,
        );
      }

      const id = crypto.randomUUID();
      const warehouse = {
        id,
        code,
        name,
        location,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await kv.set(`warehouse:${id}`, warehouse);
      await createAuditLog(
        userId,
        "create",
        "warehouses",
        id,
        null,
        warehouse,
      );

      console.log("Warehouse created successfully:", id);
      return c.json({ success: true, warehouse });
    } catch (error: any) {
      console.log(
        "Create warehouse error:",
        error.message,
        error.stack,
      );
      return c.json(
        {
          error: `Failed to create warehouse: ${error.message}`,
        },
        500,
      );
    }
  },
);

app.get(
  "/make-server-8eebe9eb/warehouses",
  authMiddleware,
  async (c) => {
    try {
      const warehouses = await kv.getByPrefix("warehouse:");
      
      // Deduplicate warehouses by ID
      const uniqueWarehousesMap = new Map();
      warehouses.forEach((warehouse: any) => {
        if (!uniqueWarehousesMap.has(warehouse.id)) {
          uniqueWarehousesMap.set(warehouse.id, warehouse);
        }
      });
      const uniqueWarehouses = Array.from(uniqueWarehousesMap.values());
      
      return c.json({ warehouses: uniqueWarehouses });
    } catch (error: any) {
      console.log("Get warehouses error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Departments
app.post(
  "/make-server-8eebe9eb/departments",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { code, name } = await c.req.json();

      // Validate required fields
      if (!code || !name) {
        console.log("Department creation validation failed:", {
          code,
          name,
        });
        return c.json(
          { error: "All fields (code, name) are required" },
          400,
        );
      }

      // Check if department code already exists
      const existingDepartments =
        await kv.getByPrefix("department:");
      const codeExists = existingDepartments.some(
        (dept: any) => dept.code === code,
      );
      if (codeExists) {
        console.log("Department code already exists:", code);
        return c.json(
          { error: `Department code '${code}' already exists` },
          400,
        );
      }

      const id = crypto.randomUUID();
      const department = {
        id,
        code,
        name,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await kv.set(`department:${id}`, department);
      await createAuditLog(
        userId,
        "create",
        "departments",
        id,
        null,
        department,
      );

      console.log("Department created successfully:", id);
      return c.json({ success: true, department });
    } catch (error: any) {
      console.log(
        "Create department error:",
        error.message,
        error.stack,
      );
      return c.json(
        {
          error: `Failed to create department: ${error.message}`,
        },
        500,
      );
    }
  },
);

app.get(
  "/make-server-8eebe9eb/departments",
  authMiddleware,
  async (c) => {
    try {
      const departments = await kv.getByPrefix("department:");
      
      // Deduplicate departments by ID
      const uniqueDepartmentsMap = new Map();
      departments.forEach((department: any) => {
        if (!uniqueDepartmentsMap.has(department.id)) {
          uniqueDepartmentsMap.set(department.id, department);
        }
      });
      const uniqueDepartments = Array.from(uniqueDepartmentsMap.values());
      
      return c.json({ departments: uniqueDepartments });
    } catch (error: any) {
      console.log("Get departments error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// UOM
app.post(
  "/make-server-8eebe9eb/uom",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { code, name, description } = await c.req.json();

      // Check for duplicate UOM code
      const allUOMs = await kv.getByPrefix("uom:");
      const codeExists = allUOMs.find((uom: any) => 
        uom.code && uom.code.toLowerCase() === code.toLowerCase()
      );
      if (codeExists) {
        return c.json({ error: "UOM code already exists" }, 400);
      }

      const id = crypto.randomUUID();
      const uom = { id, code, name, description };

      await kv.set(`uom:${id}`, uom);
      await createAuditLog(
        userId,
        "create",
        "uom",
        id,
        null,
        uom,
      );

      return c.json({ success: true, uom });
    } catch (error: any) {
      console.log("Create UOM error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/uom",
  authMiddleware,
  async (c) => {
    try {
      const uoms = await kv.getByPrefix("uom:");
      
      // Deduplicate UOMs by ID
      const uniqueUOMsMap = new Map();
      uoms.forEach((uom: any) => {
        if (!uniqueUOMsMap.has(uom.id)) {
          uniqueUOMsMap.set(uom.id, uom);
        }
      });
      const uniqueUOMs = Array.from(uniqueUOMsMap.values());
      
      return c.json({ uoms: uniqueUOMs });
    } catch (error: any) {
      console.log("Get UOM error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Categories
app.post(
  "/make-server-8eebe9eb/categories",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { name, type, parent_id } = await c.req.json();

      // Check for duplicate category name within the same type
      const allCategories = await kv.getByPrefix("category:");
      const categoryExists = allCategories.find((cat: any) => 
        cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
      );
      if (categoryExists) {
        return c.json({ error: `Category '${name}' already exists in ${type} type` }, 400);
      }

      const id = crypto.randomUUID();
      const category = { id, name, type, parent_id };

      await kv.set(`category:${id}`, category);
      await createAuditLog(
        userId,
        "create",
        "categories",
        id,
        null,
        category,
      );

      return c.json({ success: true, category });
    } catch (error: any) {
      console.log("Create category error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/categories",
  authMiddleware,
  async (c) => {
    try {
      const categories = await kv.getByPrefix("category:");
      
      // Deduplicate categories by ID
      const uniqueCategoriesMap = new Map();
      categories.forEach((category: any) => {
        if (!uniqueCategoriesMap.has(category.id)) {
          uniqueCategoriesMap.set(category.id, category);
        }
      });
      const uniqueCategories = Array.from(uniqueCategoriesMap.values());
      
      return c.json({ categories: uniqueCategories });
    } catch (error: any) {
      console.log("Get categories error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Items
app.post(
  "/make-server-8eebe9eb/items",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const data = await c.req.json();

      // Check for duplicate SKU or item code
      if (data.sku || data.item_code) {
        const allItems = await kv.getByPrefix("item:");
        if (data.sku) {
          const skuExists = allItems.find((item: any) => 
            item.sku && item.sku.toLowerCase() === data.sku.toLowerCase()
          );
          if (skuExists) {
            return c.json({ error: "SKU already exists" }, 400);
          }
        }
        if (data.item_code) {
          const codeExists = allItems.find((item: any) => 
            item.item_code && item.item_code.toLowerCase() === data.item_code.toLowerCase()
          );
          if (codeExists) {
            return c.json({ error: "Item code already exists" }, 400);
          }
        }
      }

      const id = crypto.randomUUID();
      const item = {
        id,
        ...data,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await kv.set(`item:${id}`, item);
      await createAuditLog(
        userId,
        "create",
        "items",
        id,
        null,
        item,
      );

      return c.json({ success: true, item });
    } catch (error: any) {
      console.log("Create item error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/items",
  authMiddleware,
  async (c) => {
    try {
      const items = await kv.getByPrefix("item:");
      
      // Deduplicate items by ID
      const uniqueItemsMap = new Map();
      items.forEach((item: any) => {
        if (!uniqueItemsMap.has(item.id)) {
          uniqueItemsMap.set(item.id, item);
        }
      });
      const uniqueItems = Array.from(uniqueItemsMap.values());
      
      return c.json({ items: uniqueItems });
    } catch (error: any) {
      console.log("Get items error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/items/:id",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const item = await kv.get(`item:${id}`);

      if (!item) {
        return c.json({ error: "Item not found" }, 404);
      }

      return c.json({ item });
    } catch (error: any) {
      console.log("Get item error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Parties
app.post(
  "/make-server-8eebe9eb/parties",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const data = await c.req.json();

      // Check for duplicate party code or GSTIN
      const allParties = await kv.getByPrefix("party:");
      if (data.party_code) {
        const codeExists = allParties.find((party: any) => 
          party.party_code && party.party_code.toLowerCase() === data.party_code.toLowerCase()
        );
        if (codeExists) {
          return c.json({ error: "Party code already exists" }, 400);
        }
      }
      if (data.gstin) {
        const gstinExists = allParties.find((party: any) => 
          party.gstin && party.gstin.toUpperCase() === data.gstin.toUpperCase()
        );
        if (gstinExists) {
          return c.json({ error: "GSTIN already exists" }, 400);
        }
      }

      const id = crypto.randomUUID();
      const party = {
        id,
        ...data,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await kv.set(`party:${id}`, party);
      await createAuditLog(
        userId,
        "create",
        "parties",
        id,
        null,
        party,
      );

      return c.json({ success: true, party });
    } catch (error: any) {
      console.log("Create party error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/parties",
  authMiddleware,
  async (c) => {
    try {
      const type = c.req.query("type");
      let parties = await kv.getByPrefix("party:");

      // Deduplicate parties by ID
      const uniquePartiesMap = new Map();
      parties.forEach((party: any) => {
        if (!uniquePartiesMap.has(party.id)) {
          uniquePartiesMap.set(party.id, party);
        }
      });
      parties = Array.from(uniquePartiesMap.values());

      if (type) {
        parties = parties.filter((p: any) => p.type === type);
      }

      return c.json({ parties });
    } catch (error: any) {
      console.log("Get parties error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== PURCHASE REQUISITION ROUTES ====================

app.post(
  "/make-server-8eebe9eb/purchase-requisitions",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { department_id, items, remarks } =
        await c.req.json();

      const id = crypto.randomUUID();
      const prNumber = `PR-${Date.now()}`;

      const pr = {
        id,
        pr_number: prNumber,
        pr_date: new Date().toISOString().split("T")[0],
        department_id,
        requested_by: userId,
        status: "draft",
        remarks,
        created_at: new Date().toISOString(),
      };

      await kv.set(`pr:${id}`, pr);

      // Save PR items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`pr_item:${id}:${itemId}`, {
          id: itemId,
          pr_id: id,
          ...item,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "purchase_requisitions",
        id,
        null,
        pr,
      );
      return c.json({ success: true, requisition: pr });
    } catch (error: any) {
      console.log("Create PR error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/purchase-requisitions",
  authMiddleware,
  async (c) => {
    try {
      const prs = await kv.getByPrefix("pr:");
      return c.json({ prs });
    } catch (error: any) {
      console.log("Get PRs error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/purchase-requisitions/:id/items",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const items = await kv.getByPrefix(`pr_item:${id}:`);
      return c.json({ items });
    } catch (error: any) {
      console.log("Get PR items error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/purchase-requisitions/:id/submit",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const pr = await kv.get(`pr:${id}`);
      if (!pr) {
        return c.json({ error: "PR not found" }, 404);
      }

      pr.status = "submitted";
      await kv.set(`pr:${id}`, pr);
      await createAuditLog(
        userId,
        "submit",
        "purchase_requisitions",
        id,
        "draft",
        "submitted",
      );

      return c.json({ success: true, pr });
    } catch (error: any) {
      console.log("Submit PR error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== QUOTATION ROUTES ====================

app.post(
  "/make-server-8eebe9eb/quotations",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        pr_id,
        supplier_id,
        quotation_date,
        valid_until,
        items,
      } = await c.req.json();

      const id = crypto.randomUUID();
      const quotationNumber = `QT-${Date.now()}`;

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.total_amount;
      }

      const quotation = {
        id,
        quotation_number: quotationNumber,
        pr_id,
        supplier_id,
        quotation_date,
        valid_until,
        total_amount: totalAmount,
        status: "submitted",
        is_best: false,
        created_at: new Date().toISOString(),
      };

      await kv.set(`quotation:${id}`, quotation);

      // Save quotation items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`quotation_item:${id}:${itemId}`, {
          id: itemId,
          quotation_id: id,
          ...item,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "quotations",
        id,
        null,
        quotation,
      );
      return c.json({ success: true, quotation });
    } catch (error: any) {
      console.log("Create quotation error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/quotations",
  authMiddleware,
  async (c) => {
    try {
      const prId = c.req.query("pr_id");
      let quotations = await kv.getByPrefix("quotation:");

      if (prId) {
        quotations = quotations.filter(
          (q: any) => q.pr_id === prId,
        );
      }

      return c.json({ quotations });
    } catch (error: any) {
      console.log("Get quotations error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/quotations/:id/items",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const items = await kv.getByPrefix(
        `quotation_item:${id}:`,
      );
      return c.json({ items });
    } catch (error: any) {
      console.log("Get quotation items error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/quotations/:id/approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const quotation = await kv.get(`quotation:${id}`);
      if (!quotation) {
        return c.json({ error: "Quotation not found" }, 404);
      }

      quotation.status = "approved";
      quotation.approved_by = userId;
      quotation.approved_at = new Date().toISOString();

      await kv.set(`quotation:${id}`, quotation);
      await createAuditLog(
        userId,
        "approve",
        "quotations",
        id,
        "pending_approval",
        "approved",
      );

      return c.json({ success: true, quotation });
    } catch (error: any) {
      console.log("Approve quotation error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Upload Quotation with Document
app.post(
  "/make-server-8eebe9eb/quotations/upload",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const data = await c.req.json();

      const id = crypto.randomUUID();

      const quotation = {
        id,
        quotation_number: data.quotation_number,
        pr_id: data.pr_id,
        supplier_id: data.supplier_id,
        quotation_date: data.quotation_date,
        valid_until: data.valid_until,
        quotation_type: data.quotation_type,
        total_amount: data.total_amount,
        remarks: data.remarks || '',
        document_url: data.document?.data || null,
        document_name: data.document?.name || null,
        document_type: data.document?.type || null,
        status: "pending_approval",
        is_best: false,
        amount_blocked: false,
        uploaded_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`quotation:${id}`, quotation);

      await createAuditLog(
        userId,
        "upload",
        "quotations",
        id,
        null,
        quotation,
      );

      return c.json({ success: true, quotation });
    } catch (error: any) {
      console.log("Upload quotation error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Reject Quotation
app.put(
  "/make-server-8eebe9eb/quotations/:id/reject",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const quotation = await kv.get(`quotation:${id}`);
      if (!quotation) {
        return c.json({ error: "Quotation not found" }, 404);
      }

      quotation.status = "rejected";
      quotation.rejected_by = userId;
      quotation.rejected_at = new Date().toISOString();

      await kv.set(`quotation:${id}`, quotation);
      await createAuditLog(
        userId,
        "reject",
        "quotations",
        id,
        quotation.status,
        "rejected",
      );

      return c.json({ success: true, quotation });
    } catch (error: any) {
      console.log("Reject quotation error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Mark Quotation as Best and Block Amount
app.put(
  "/make-server-8eebe9eb/quotations/:id/mark-best",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const quotation = await kv.get(`quotation:${id}`);
      if (!quotation) {
        return c.json({ error: "Quotation not found" }, 404);
      }

      if (quotation.status !== "approved") {
        return c.json(
          { error: "Only approved quotations can be marked as best" },
          400,
        );
      }

      // Unmark all other quotations for same PR as best
      const allQuotations = await kv.getByPrefix("quotation:");
      for (const q of allQuotations) {
        if (q.pr_id === quotation.pr_id && q.id !== id) {
          q.is_best = false;
          q.amount_blocked = false;
          await kv.set(`quotation:${q.id}`, q);
        }
      }

      quotation.is_best = true;
      quotation.amount_blocked = true;
      quotation.blocked_amount = quotation.total_amount;
      quotation.marked_best_by = userId;
      quotation.marked_best_at = new Date().toISOString();

      await kv.set(`quotation:${id}`, quotation);

      // 🎯 AUTO-CREATE PURCHASE ORDER when marking as best
      const poId = crypto.randomUUID();
      const poNumber = `PO-${Date.now()}`;
      
      // Get PR to calculate delivery date (add 30 days by default)
      const pr = await kv.get(`pr:${quotation.pr_id}`);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 30);

      const po = {
        id: poId,
        po_number: poNumber,
        quotation_id: id,
        pr_id: quotation.pr_id,
        supplier_id: quotation.supplier_id,
        po_date: new Date().toISOString().split("T")[0],
        delivery_date: deliveryDate.toISOString().split("T")[0],
        total_amount: quotation.total_amount,
        status: "draft", // Will be approved by admin
        created_at: new Date().toISOString(),
        created_by: userId,
        auto_created: true, // Flag to indicate auto-creation
      };

      await kv.set(`po:${poId}`, po);

      // Copy quotation items to PO items
      const quotationItems = await kv.getByPrefix(
        `quotation_item:${id}:`,
      );
      for (const item of quotationItems) {
        const itemId = crypto.randomUUID();
        await kv.set(`po_item:${poId}:${itemId}`, {
          id: itemId,
          po_id: poId,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          total_amount: item.total_amount,
        });
      }

      await createAuditLog(
        userId,
        "create_po_from_best_quotation",
        "purchase_orders",
        poId,
        null,
        po,
      );

      await createAuditLog(
        userId,
        "mark_as_best",
        "quotations",
        id,
        { is_best: false, amount_blocked: false },
        { is_best: true, amount_blocked: true, blocked_amount: quotation.total_amount },
      );

      console.log(`✅ Quotation marked as best and PO ${poNumber} auto-created`);
      return c.json({ success: true, quotation, po });
    } catch (error: any) {
      console.log("Mark quotation as best error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Create PO from Best Quotation (Retroactive/Manual)
app.post(
  "/make-server-8eebe9eb/quotations/:id/create-po",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const quotation = await kv.get(`quotation:${id}`);
      if (!quotation) {
        return c.json({ error: "Quotation not found" }, 404);
      }

      if (!quotation.is_best) {
        return c.json(
          { error: "Only best quotations can generate POs" },
          400,
        );
      }

      // Check if PO already exists for this quotation
      const allPOs = await kv.getByPrefix("po:");
      const existingPO = allPOs.find((po: any) => po.quotation_id === id);
      
      if (existingPO) {
        console.log(`⚠️ PO already exists for quotation ${id}: ${existingPO.po_number}`);
        return c.json({ 
          success: true, 
          po: existingPO,
          message: "PO already exists for this quotation" 
        });
      }

      // Create new PO
      const poId = crypto.randomUUID();
      const poNumber = `PO-${Date.now()}`;
      
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 30);

      const po = {
        id: poId,
        po_number: poNumber,
        quotation_id: id,
        pr_id: quotation.pr_id,
        supplier_id: quotation.supplier_id,
        po_date: new Date().toISOString().split("T")[0],
        delivery_date: deliveryDate.toISOString().split("T")[0],
        total_amount: quotation.total_amount,
        status: "draft",
        created_at: new Date().toISOString(),
        created_by: userId,
        auto_created: false,
        retroactive: true,
      };

      await kv.set(`po:${poId}`, po);

      // Copy quotation items to PO items
      const quotationItems = await kv.getByPrefix(
        `quotation_item:${id}:`,
      );
      for (const item of quotationItems) {
        const itemId = crypto.randomUUID();
        await kv.set(`po_item:${poId}:${itemId}`, {
          id: itemId,
          po_id: poId,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          total_amount: item.total_amount,
        });
      }

      await createAuditLog(
        userId,
        "create_po_from_best_quotation_retroactive",
        "purchase_orders",
        poId,
        null,
        po,
      );

      console.log(`✅ Retroactive PO created: ${poNumber} for quotation ${quotation.quotation_number}`);
      return c.json({ success: true, po });
    } catch (error: any) {
      console.log("Create PO from quotation error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== PURCHASE ORDER ROUTES ====================

app.post(
  "/make-server-8eebe9eb/purchase-orders",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { quotation_id, delivery_date } =
        await c.req.json();

      const quotation = await kv.get(
        `quotation:${quotation_id}`,
      );
      if (!quotation || quotation.status !== "approved") {
        return c.json(
          { error: "Invalid or unapproved quotation" },
          400,
        );
      }

      const id = crypto.randomUUID();
      const poNumber = `PO-${Date.now()}`;

      const po = {
        id,
        po_number: poNumber,
        quotation_id,
        supplier_id: quotation.supplier_id,
        po_date: new Date().toISOString().split("T")[0],
        delivery_date,
        total_amount: quotation.total_amount,
        status: "draft",
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`po:${id}`, po);

      // Copy quotation items to PO items
      const quotationItems = await kv.getByPrefix(
        `quotation_item:${quotation_id}:`,
      );
      for (const item of quotationItems) {
        const itemId = crypto.randomUUID();
        await kv.set(`po_item:${id}:${itemId}`, {
          id: itemId,
          po_id: id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          gst_amount: item.gst_amount,
          total_amount: item.total_amount,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "purchase_orders",
        id,
        null,
        po,
      );
      return c.json({ success: true, po });
    } catch (error: any) {
      console.log("Create PO error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/purchase-orders",
  authMiddleware,
  async (c) => {
    try {
      const pos = await kv.getByPrefix("po:");
      return c.json({ pos });
    } catch (error: any) {
      console.log("Get POs error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/purchase-orders/:id/items",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const items = await kv.getByPrefix(`po_item:${id}:`);
      return c.json({ items });
    } catch (error: any) {
      console.log("Get PO items error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/purchase-orders/:id/approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const po = await kv.get(`po:${id}`);
      if (!po) {
        return c.json({ error: "PO not found" }, 404);
      }

      po.status = "approved";
      po.approved_by = userId;
      po.approved_at = new Date().toISOString();

      await kv.set(`po:${id}`, po);
      await createAuditLog(
        userId,
        "approve",
        "purchase_orders",
        id,
        "draft",
        "approved",
      );

      return c.json({ success: true, po });
    } catch (error: any) {
      console.log("Approve PO error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== INVOICE ROUTES ====================

// Upload Document to Supabase Storage (Server-side to bypass RLS)
app.post(
  "/make-server-8eebe9eb/invoices/upload-document",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return c.json({ error: "Invalid file type. Only PDF, JPG, and PNG are allowed." }, 400);
      }

      // Validate file size (50MB max)
      const maxSize = 52428800; // 50MB
      if (file.size > maxSize) {
        return c.json({ error: "File size exceeds 50MB limit" }, 400);
      }

      // Upload to Supabase Storage using service role (bypasses RLS)
      const fileName = `invoices/${Date.now()}_${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data, error } = await supabaseAdmin.storage
        .from('make-8eebe9eb-documents')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error("Storage upload error:", error);
        return c.json({ error: `Failed to upload file: ${error.message}` }, 500);
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('make-8eebe9eb-documents')
        .getPublicUrl(fileName);

      console.log(`✅ Document uploaded by user ${userId}: ${fileName}`);
      return c.json({ 
        success: true, 
        url: urlData.publicUrl,
        fileName: file.name 
      });
    } catch (error: any) {
      console.error("Upload document error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  }
);

// Upload Invoice with Document (Supplier uploads invoice)
app.post(
  "/make-server-8eebe9eb/invoices/upload",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { 
        po_id, 
        invoice_number, 
        invoice_date, 
        items,
        document_url, // URL from Supabase Storage
        document_name,
        remarks 
      } = await c.req.json();

      // Check for duplicate invoice number
      const allInvoices = await kv.getByPrefix("invoice:");
      const invoiceExists = allInvoices.find((inv: any) => 
        inv.invoice_number && inv.invoice_number.toLowerCase() === invoice_number.toLowerCase()
      );
      if (invoiceExists) {
        return c.json({ error: "Invoice number already exists" }, 400);
      }

      const po = await kv.get(`po:${po_id}`);
      if (!po) {
        return c.json({ error: "PO not found" }, 404);
      }

      // Get the quotation linked to this PO
      const quotation = await kv.get(`quotation:${po.quotation_id}`);
      
      const id = crypto.randomUUID();
      let totalAmount = 0;

      for (const item of items) {
        totalAmount += item.total_amount;
      }

      // Enhanced 4-way matching: Compare invoice with Quotation, PO, and GRN
      let status = "pending_verification";
      let holdReason = "";
      const tolerance = 0.01; // ₹0.01 tolerance
      let matchingResults = {
        quotation_match: "pending",
        po_match: "pending",
        grn_match: "pending",
        invoice_verified: false
      };

      // Step 1: Check against quotation amount (if quotation exists and is approved)
      if (quotation && quotation.status === "approved") {
        const quotationItems = await kv.getByPrefix(`quotation_item:${po.quotation_id}:`);
        let quotationTotal = 0;
        for (const qi of quotationItems) {
          quotationTotal += qi.total_amount || 0;
        }
        
        const quotationDiff = Math.abs(totalAmount - quotationTotal);
        if (quotationDiff > tolerance) {
          status = "hold";
          holdReason = `Invoice amount (₹${totalAmount.toFixed(2)}) does not match quotation amount (₹${quotationTotal.toFixed(2)}). Difference: ₹${quotationDiff.toFixed(2)}. Admin approval required.`;
          matchingResults.quotation_match = "mismatch";
        } else {
          matchingResults.quotation_match = "matched";
        }
      }

      // Step 2: Check against PO amount (only if quotation check passed)
      if (matchingResults.quotation_match === "matched") {
        const poDiff = Math.abs(totalAmount - po.total_amount);
        if (poDiff > tolerance) {
          status = "hold";
          holdReason = `Invoice amount (₹${totalAmount.toFixed(2)}) does not match PO amount (₹${po.total_amount.toFixed(2)}). Difference: ₹${poDiff.toFixed(2)}. Admin approval required.`;
          matchingResults.po_match = "mismatch";
        } else {
          matchingResults.po_match = "matched";
        }
      } else if (matchingResults.quotation_match === "mismatch") {
        matchingResults.po_match = "pending";
      }

      // If both quotation and PO match, set status to awaiting GRN
      if (matchingResults.quotation_match === "matched" && matchingResults.po_match === "matched") {
        status = "awaiting_grn";
      }

      const invoice = {
        id,
        invoice_number,
        po_id,
        quotation_id: po.quotation_id,
        supplier_id: po.supplier_id,
        invoice_date,
        total_amount: totalAmount,
        status,
        hold_reason: holdReason,
        matching_results: matchingResults,
        document_url,
        document_name,
        remarks,
        uploaded_by: userId,
        edit_requested: false,
        edit_approved: false,
        admin_override: false,
        admin_override_by: null,
        admin_override_at: null,
        admin_override_reason: null,
        created_at: new Date().toISOString(),
      };

      await kv.set(`invoice:${id}`, invoice);

      // Save invoice items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`invoice_item:${id}:${itemId}`, {
          id: itemId,
          invoice_id: id,
          ...item,
        });
      }

      await createAuditLog(
        userId,
        "upload_invoice",
        "invoices",
        id,
        null,
        invoice,
      );
      
      console.log(`✅ Invoice uploaded: ${invoice_number}, Status: ${status}`);
      return c.json({ success: true, invoice });
    } catch (error: any) {
      console.log("Upload invoice error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Admin approves invoice discrepancy (overrides matching rules)
app.put(
  "/make-server-8eebe9eb/invoices/:id/admin-approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { reason } = await c.req.json();

      // Check if user is admin
      const adminRecord = await kv.get(`admin:${userId}`);
      if (!adminRecord) {
        return c.json({ error: "Unauthorized - Admin access required" }, 403);
      }

      const invoice = await kv.get(`invoice:${id}`);
      if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }

      const oldStatus = invoice.status;
      
      invoice.status = "awaiting_grn"; // Move to next stage
      invoice.admin_override = true;
      invoice.admin_override_by = userId;
      invoice.admin_override_at = new Date().toISOString();
      invoice.admin_override_reason = reason;
      invoice.hold_reason = ""; // Clear hold reason

      await kv.set(`invoice:${id}`, invoice);
      
      await createAuditLog(
        userId,
        "admin_approve_invoice",
        "invoices",
        id,
        oldStatus,
        invoice.status,
      );

      console.log(`✅ Admin approved invoice: ${invoice.invoice_number}`);
      return c.json({ success: true, invoice });
    } catch (error: any) {
      console.log("Admin approve invoice error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get invoice details with items
app.get(
  "/make-server-8eebe9eb/invoices/:id",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const invoice = await kv.get(`invoice:${id}`);
      
      if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }

      const items = await kv.getByPrefix(`invoice_item:${id}:`);
      
      return c.json({ invoice, items });
    } catch (error: any) {
      console.log("Get invoice error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/invoices",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { po_id, invoice_number, invoice_date, items } =
        await c.req.json();

      // Check for duplicate invoice number
      const allInvoices = await kv.getByPrefix("invoice:");
      const invoiceExists = allInvoices.find((inv: any) => 
        inv.invoice_number && inv.invoice_number.toLowerCase() === invoice_number.toLowerCase()
      );
      if (invoiceExists) {
        return c.json({ error: "Invoice number already exists" }, 400);
      }

      const po = await kv.get(`po:${po_id}`);
      if (!po) {
        return c.json({ error: "PO not found" }, 404);
      }

      // Get the quotation linked to this PO
      const quotation = await kv.get(`quotation:${po.quotation_id}`);

      const id = crypto.randomUUID();
      let totalAmount = 0;

      for (const item of items) {
        totalAmount += item.total_amount;
      }

      // Enhanced 4-way matching: Compare invoice with Blocked Quotation, PO, and GRN
      let status = "submitted";
      let holdReason = "";
      const tolerance = 0.01; // ₹0.01 tolerance

      // Step 1: Check against blocked quotation amount (if quotation exists and is blocked)
      if (quotation && quotation.amount_blocked && quotation.blocked_amount) {
        const quotationDiff = Math.abs(totalAmount - quotation.blocked_amount);
        if (quotationDiff > tolerance) {
          status = "hold";
          holdReason = `Invoice amount (₹${totalAmount.toFixed(2)}) does not match blocked quotation amount (₹${quotation.blocked_amount.toFixed(2)}). Difference: ₹${quotationDiff.toFixed(2)}`;
        }
      }

      // Step 2: Check against PO amount (only if quotation check passed)
      if (status !== "hold") {
        const poDiff = Math.abs(totalAmount - po.total_amount);
        if (poDiff > tolerance) {
          status = "hold";
          holdReason = `Invoice amount (₹${totalAmount.toFixed(2)}) does not match PO amount (₹${po.total_amount.toFixed(2)}). Difference: ₹${poDiff.toFixed(2)}`;
        }
      }

      const invoice = {
        id,
        invoice_number,
        po_id,
        supplier_id: po.supplier_id,
        invoice_date,
        total_amount: totalAmount,
        status,
        hold_reason: holdReason,
        edit_requested: false,
        edit_approved: false,
        created_at: new Date().toISOString(),
      };

      await kv.set(`invoice:${id}`, invoice);

      // Save invoice items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`invoice_item:${id}:${itemId}`, {
          id: itemId,
          invoice_id: id,
          ...item,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "invoices",
        id,
        null,
        invoice,
      );
      return c.json({ success: true, invoice });
    } catch (error: any) {
      console.log("Create invoice error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/invoices",
  authMiddleware,
  async (c) => {
    try {
      const invoices = await kv.getByPrefix("invoice:");
      return c.json({ invoices });
    } catch (error: any) {
      console.log("Get invoices error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Helper function to calculate due date based on payment terms
function calculateDueDate(paymentTerms: string): string {
  const today = new Date();
  let daysToAdd = 30; // default
  
  if (paymentTerms === 'immediate') daysToAdd = 0;
  else if (paymentTerms === 'net_15') daysToAdd = 15;
  else if (paymentTerms === 'net_30') daysToAdd = 30;
  else if (paymentTerms === 'net_45') daysToAdd = 45;
  else if (paymentTerms === 'net_60') daysToAdd = 60;
  
  today.setDate(today.getDate() + daysToAdd);
  return today.toISOString().split('T')[0];
}

// Generate Invoice from Sales Order or Quotation
app.post(
  "/make-server-8eebe9eb/invoices/generate-from-source",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { source_type, source_id } = await c.req.json();

      if (!source_type || !source_id) {
        return c.json({ error: "source_type and source_id are required" }, 400);
      }

      let sourceData;
      let sourceItems;
      let party_id;
      let reference_number;

      if (source_type === "sales_order") {
        // Get sales order
        sourceData = await kv.get(`sales_order:${source_id}`);
        if (!sourceData) {
          return c.json({ error: "Sales order not found" }, 404);
        }

        // Get sales order items
        const allItems = await kv.getByPrefix(`sales_order_item:${source_id}:`);
        sourceItems = allItems;
        party_id = sourceData.party_id;
        reference_number = sourceData.order_number;

      } else if (source_type === "quotation") {
        // Get quotation
        sourceData = await kv.get(`sales_quotation:${source_id}`);
        if (!sourceData) {
          return c.json({ error: "Quotation not found" }, 404);
        }

        if (sourceData.status !== "approved") {
          return c.json({ error: "Quotation must be approved before generating invoice" }, 400);
        }

        // Get quotation items
        const allItems = await kv.getByPrefix(`sales_quotation_item:${source_id}:`);
        sourceItems = allItems;
        party_id = sourceData.party_id;
        reference_number = sourceData.quotation_number;

      } else {
        return c.json({ error: "Invalid source_type. Must be 'sales_order' or 'quotation'" }, 400);
      }

      // Generate invoice number
      const invoiceId = crypto.randomUUID();
      const invoiceNumber = `INV-${Date.now()}`;

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;
      let totalAmount = 0;

      for (const item of sourceItems) {
        subtotal += item.total_amount - (item.tax_amount || 0);
        totalTax += item.tax_amount || 0;
        totalAmount += item.total_amount;
      }

      // Create invoice
      const invoice = {
        id: invoiceId,
        invoice_number: invoiceNumber,
        source_type,
        source_id,
        customer_id: party_id,
        party_id,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: calculateDueDate(sourceData.payment_terms || 'net_30'),
        payment_terms: sourceData.payment_terms || 'net_30',
        reference_number,
        subtotal,
        tax_amount: totalTax,
        total_amount: totalAmount,
        status: "pending",
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`invoice:${invoiceId}`, invoice);

      // Save invoice items
      for (const item of sourceItems) {
        const itemId = crypto.randomUUID();
        await kv.set(`invoice_item:${invoiceId}:${itemId}`, {
          id: itemId,
          invoice_id: invoiceId,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          discount_percent: item.discount_percent || 0,
          discount_amount: item.discount_amount || 0,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount,
          hsn_code: item.hsn_code || '',
        });
      }

      // Create audit log
      await createAuditLog(
        userId,
        "create",
        "invoices",
        invoiceId,
        null,
        invoice,
      );

      return c.json({ success: true, invoice });
    } catch (error: any) {
      console.log("Generate invoice from source error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Create Custom Invoice
app.post(
  "/make-server-8eebe9eb/invoices/custom",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        customer_id,
        invoice_date,
        due_date,
        payment_terms,
        reference_number,
        notes,
        items,
      } = await c.req.json();

      if (!customer_id || !invoice_date || !due_date || !items || items.length === 0) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      // Generate invoice number
      const invoiceId = crypto.randomUUID();
      const invoiceNumber = `INV-${Date.now()}`;

      // Calculate totals
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let totalAmount = 0;

      for (const item of items) {
        const itemSubtotal = item.quantity * item.rate;
        const discountAmount = item.discount_amount || 0;
        const taxableAmount = itemSubtotal - discountAmount;
        const taxAmount = item.tax_amount || 0;

        subtotal += itemSubtotal;
        totalDiscount += discountAmount;
        totalTax += taxAmount;
        totalAmount += item.total_amount;
      }

      // Create invoice
      const invoice = {
        id: invoiceId,
        invoice_number: invoiceNumber,
        source_type: "custom",
        customer_id,
        party_id: customer_id,
        invoice_date,
        due_date,
        payment_terms: payment_terms || 'net_30',
        reference_number: reference_number || '',
        notes: notes || '',
        subtotal,
        discount_amount: totalDiscount,
        taxable_amount: subtotal - totalDiscount,
        tax_amount: totalTax,
        total_amount: totalAmount,
        status: "pending",
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`invoice:${invoiceId}`, invoice);

      // Save invoice items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`invoice_item:${invoiceId}:${itemId}`, {
          id: itemId,
          invoice_id: invoiceId,
          ...item,
        });
      }

      // Create audit log
      await createAuditLog(
        userId,
        "create",
        "invoices",
        invoiceId,
        null,
        invoice,
      );

      return c.json({ success: true, invoice });
    } catch (error: any) {
      console.log("Create custom invoice error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/invoices/:id/request-edit",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const invoice = await kv.get(`invoice:${id}`);
      if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }

      invoice.edit_requested = true;
      await kv.set(`invoice:${id}`, invoice);
      await createAuditLog(
        userId,
        "request_edit",
        "invoices",
        id,
        null,
        null,
      );

      return c.json({ success: true, invoice });
    } catch (error: any) {
      console.log("Request edit error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/invoices/:id/approve-edit",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const invoice = await kv.get(`invoice:${id}`);
      if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }

      invoice.edit_approved = true;
      invoice.status = "approved";
      invoice.approved_by = userId;
      invoice.approved_at = new Date().toISOString();

      await kv.set(`invoice:${id}`, invoice);
      await createAuditLog(
        userId,
        "approve_edit",
        "invoices",
        id,
        null,
        null,
      );

      return c.json({ success: true, invoice });
    } catch (error: any) {
      console.log("Approve edit error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== INVENTORY & STOCK ROUTES ====================

app.post(
  "/make-server-8eebe9eb/grn",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { po_id, invoice_id, warehouse_id, items } =
        await c.req.json();

      const id = crypto.randomUUID();
      const grnNumber = `GRN-${Date.now()}`;

      const grn = {
        id,
        grn_number: grnNumber,
        po_id,
        invoice_id,
        warehouse_id,
        grn_date: new Date().toISOString().split("T")[0],
        received_by: userId,
        status: "pending_qc",
        created_at: new Date().toISOString(),
      };

      await kv.set(`grn:${id}`, grn);

      // Save GRN items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`grn_item:${id}:${itemId}`, {
          id: itemId,
          grn_id: id,
          ...item,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "grn",
        id,
        null,
        grn,
      );
      return c.json({ success: true, grn });
    } catch (error: any) {
      console.log("Create GRN error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/grn",
  authMiddleware,
  async (c) => {
    try {
      const grns = await kv.getByPrefix("grn:");
      return c.json({ grns });
    } catch (error: any) {
      console.log("Get GRNs error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Complete GRN and perform 4-way matching
app.put(
  "/make-server-8eebe9eb/grn/:id/complete",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { actual_items } = await c.req.json(); // Actual received quantities

      const grn = await kv.get(`grn:${id}`);
      if (!grn) {
        return c.json({ error: "GRN not found" }, 404);
      }

      // Get related invoice
      const invoice = await kv.get(`invoice:${grn.invoice_id}`);
      if (!invoice) {
        return c.json({ error: "Related invoice not found" }, 404);
      }

      // Get related PO
      const po = await kv.get(`po:${grn.po_id}`);
      if (!po) {
        return c.json({ error: "Related PO not found" }, 404);
      }

      // Get quotation
      const quotation = await kv.get(`quotation:${invoice.quotation_id}`);

      // Calculate GRN total
      let grnTotal = 0;
      for (const item of actual_items) {
        grnTotal += item.quantity * item.rate;
      }

      // Perform 4-way matching
      const tolerance = 0.01;
      let allMatched = true;
      let matchingReport = [];

      // Get quotation total
      let quotationTotal = 0;
      if (quotation) {
        const quotationItems = await kv.getByPrefix(`quotation_item:${invoice.quotation_id}:`);
        for (const qi of quotationItems) {
          quotationTotal += qi.total_amount || 0;
        }
      }

      // Check all 4 amounts
      const quotationDiff = Math.abs(quotationTotal - invoice.total_amount);
      const poDiff = Math.abs(po.total_amount - invoice.total_amount);
      const grnDiff = Math.abs(grnTotal - invoice.total_amount);

      if (quotationDiff > tolerance) {
        allMatched = false;
        matchingReport.push(`Quotation-Invoice mismatch: ₹${quotationDiff.toFixed(2)}`);
      }
      if (poDiff > tolerance) {
        allMatched = false;
        matchingReport.push(`PO-Invoice mismatch: ₹${poDiff.toFixed(2)}`);
      }
      if (grnDiff > tolerance) {
        allMatched = false;
        matchingReport.push(`GRN-Invoice mismatch: ₹${grnDiff.toFixed(2)}`);
      }

      // Update GRN
      grn.status = allMatched ? "completed" : "discrepancy";
      grn.grn_total = grnTotal;
      grn.completed_by = userId;
      grn.completed_at = new Date().toISOString();
      grn.matching_report = matchingReport;
      grn.four_way_matched = allMatched;

      await kv.set(`grn:${id}`, grn);

      // Update invoice based on matching
      if (allMatched) {
        invoice.status = "approved";
        invoice.matching_results.grn_match = "matched";
        invoice.matching_results.invoice_verified = true;
        invoice.hold_reason = "";
      } else {
        invoice.status = "hold";
        invoice.matching_results.grn_match = "mismatch";
        invoice.hold_reason = `4-way matching failed: ${matchingReport.join("; ")}. Admin approval required.`;
      }

      await kv.set(`invoice:${invoice.id}`, invoice);

      // Save GRN items
      for (const item of actual_items) {
        const itemId = crypto.randomUUID();
        await kv.set(`grn_item:${id}:${itemId}`, {
          id: itemId,
          grn_id: id,
          ...item,
        });

        // Update stock if matching passed
        if (allMatched) {
          const stockKey = `stock:${grn.warehouse_id}:${item.item_id}${item.batch_number ? ":" + item.batch_number : ""}`;
          let stock = await kv.get(stockKey);

          if (!stock) {
            stock = {
              id: crypto.randomUUID(),
              item_id: item.item_id,
              warehouse_id: grn.warehouse_id,
              batch_number: item.batch_number,
              quantity: 0,
              reserved_quantity: 0,
              available_quantity: 0,
              last_updated: new Date().toISOString(),
            };
          }

          stock.quantity += item.quantity;
          stock.available_quantity += item.quantity;
          stock.last_updated = new Date().toISOString();
          await kv.set(stockKey, stock);
        }
      }

      await createAuditLog(
        userId,
        "complete_grn",
        "grn",
        id,
        "pending_qc",
        grn.status,
      );

      console.log(`✅ GRN completed: ${grn.grn_number}, 4-way match: ${allMatched}`);
      return c.json({ 
        success: true, 
        grn, 
        invoice, 
        four_way_matched: allMatched,
        matching_report: matchingReport 
      });
    } catch (error: any) {
      console.log("Complete GRN error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/stock",
  authMiddleware,
  async (c) => {
    try {
      const warehouseId = c.req.query("warehouse_id");
      let stock = await kv.getByPrefix("stock:");

      if (warehouseId) {
        stock = stock.filter(
          (s: any) => s.warehouse_id === warehouseId,
        );
      }

      return c.json({ stock });
    } catch (error: any) {
      console.log("Get stock error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/stock/update",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        item_id,
        warehouse_id,
        quantity,
        transaction_type,
        reference_type,
        reference_id,
        batch_number,
      } = await c.req.json();

      // Get or create stock record
      const stockKey = `stock:${warehouse_id}:${item_id}${batch_number ? ":" + batch_number : ""}`;
      let stock = await kv.get(stockKey);

      if (!stock) {
        stock = {
          id: crypto.randomUUID(),
          item_id,
          warehouse_id,
          batch_number,
          quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          last_updated: new Date().toISOString(),
        };
      }

      // Update quantity based on transaction type
      if (transaction_type === "in") {
        stock.quantity += quantity;
        stock.available_quantity += quantity;
      } else if (transaction_type === "out") {
        if (stock.available_quantity < quantity) {
          return c.json({ error: "Insufficient stock" }, 400);
        }
        stock.quantity -= quantity;
        stock.available_quantity -= quantity;
      }

      stock.last_updated = new Date().toISOString();
      await kv.set(stockKey, stock);

      // Create stock transaction
      const transId = crypto.randomUUID();
      await kv.set(`stock_transaction:${transId}`, {
        id: transId,
        transaction_type,
        reference_type,
        reference_id,
        item_id,
        warehouse_id,
        quantity,
        batch_number,
        transaction_date: new Date().toISOString(),
        created_by: userId,
      });

      await createAuditLog(
        userId,
        "update_stock",
        "stock",
        stockKey,
        null,
        stock,
      );
      return c.json({ success: true, stock });
    } catch (error: any) {
      console.log("Update stock error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Stock Adjustment (Manual adjustment with reason)
app.post(
  "/make-server-8eebe9eb/stock/adjustment",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        item_id,
        warehouse_id,
        batch_number,
        adjustment_quantity,
        adjustment_type, // 'increase' or 'decrease'
        reason,
        remarks
      } = await c.req.json();

      const stockKey = `stock:${warehouse_id}:${item_id}${batch_number ? ":" + batch_number : ""}`;
      let stock = await kv.get(stockKey);

      if (!stock) {
        stock = {
          id: crypto.randomUUID(),
          item_id,
          warehouse_id,
          batch_number,
          quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          min_stock_level: 0,
          max_stock_level: 0,
          reorder_point: 0,
          last_updated: new Date().toISOString(),
        };
      }

      const oldQuantity = stock.quantity;

      if (adjustment_type === 'increase') {
        stock.quantity += adjustment_quantity;
        stock.available_quantity += adjustment_quantity;
      } else if (adjustment_type === 'decrease') {
        if (stock.available_quantity < adjustment_quantity) {
          return c.json({ error: "Insufficient available stock for adjustment" }, 400);
        }
        stock.quantity -= adjustment_quantity;
        stock.available_quantity -= adjustment_quantity;
      }

      stock.last_updated = new Date().toISOString();
      await kv.set(stockKey, stock);

      // Create adjustment record
      const adjustmentId = crypto.randomUUID();
      await kv.set(`stock_adjustment:${adjustmentId}`, {
        id: adjustmentId,
        item_id,
        warehouse_id,
        batch_number,
        adjustment_type,
        adjustment_quantity,
        old_quantity: oldQuantity,
        new_quantity: stock.quantity,
        reason,
        remarks,
        adjusted_by: userId,
        adjusted_at: new Date().toISOString(),
      });

      await createAuditLog(
        userId,
        "stock_adjustment",
        "stock",
        stockKey,
        oldQuantity,
        stock.quantity,
      );

      console.log(`✅ Stock adjusted: ${item_id}, ${adjustment_type} by ${adjustment_quantity}`);
      return c.json({ success: true, stock, adjustment_id: adjustmentId });
    } catch (error: any) {
      console.log("Stock adjustment error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Set Min/Max Stock Levels
app.put(
  "/make-server-8eebe9eb/stock/levels/:itemId/:warehouseId",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { itemId, warehouseId } = c.req.param();
      const { min_stock_level, max_stock_level, reorder_point } = await c.req.json();

      const stockKey = `stock:${warehouseId}:${itemId}`;
      let stock = await kv.get(stockKey);

      if (!stock) {
        stock = {
          id: crypto.randomUUID(),
          item_id: itemId,
          warehouse_id: warehouseId,
          quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          last_updated: new Date().toISOString(),
        };
      }

      stock.min_stock_level = min_stock_level;
      stock.max_stock_level = max_stock_level;
      stock.reorder_point = reorder_point;
      stock.last_updated = new Date().toISOString();

      await kv.set(stockKey, stock);

      await createAuditLog(
        userId,
        "update_stock_levels",
        "stock",
        stockKey,
        null,
        { min_stock_level, max_stock_level, reorder_point },
      );

      return c.json({ success: true, stock });
    } catch (error: any) {
      console.log("Update stock levels error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get Low Stock Items (below reorder point)
app.get(
  "/make-server-8eebe9eb/stock/low-stock",
  authMiddleware,
  async (c) => {
    try {
      const allStock = await kv.getByPrefix("stock:");
      const lowStock = allStock.filter((s: any) => {
        return s.reorder_point && s.available_quantity <= s.reorder_point;
      });

      return c.json({ low_stock: lowStock });
    } catch (error: any) {
      console.log("Get low stock error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get Stock History/Transactions
app.get(
  "/make-server-8eebe9eb/stock/transactions",
  authMiddleware,
  async (c) => {
    try {
      const itemId = c.req.query("item_id");
      const warehouseId = c.req.query("warehouse_id");
      
      let transactions = await kv.getByPrefix("stock_transaction:");
      
      if (itemId) {
        transactions = transactions.filter((t: any) => t.item_id === itemId);
      }
      if (warehouseId) {
        transactions = transactions.filter((t: any) => t.warehouse_id === warehouseId);
      }

      // Sort by date descending
      transactions.sort((a: any, b: any) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return c.json({ transactions });
    } catch (error: any) {
      console.log("Get stock transactions error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get Stock Adjustments History
app.get(
  "/make-server-8eebe9eb/stock/adjustments",
  authMiddleware,
  async (c) => {
    try {
      const adjustments = await kv.getByPrefix("stock_adjustment:");
      
      // Sort by date descending
      adjustments.sort((a: any, b: any) => 
        new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime()
      );

      return c.json({ adjustments });
    } catch (error: any) {
      console.log("Get stock adjustments error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Stock Transfer between warehouses
app.post(
  "/make-server-8eebe9eb/stock/transfer",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        item_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        batch_number,
        remarks
      } = await c.req.json();

      // Check source warehouse stock
      const sourceKey = `stock:${from_warehouse_id}:${item_id}${batch_number ? ":" + batch_number : ""}`;
      const sourceStock = await kv.get(sourceKey);

      if (!sourceStock || sourceStock.available_quantity < quantity) {
        return c.json({ error: "Insufficient stock at source warehouse" }, 400);
      }

      // Reduce from source
      sourceStock.quantity -= quantity;
      sourceStock.available_quantity -= quantity;
      sourceStock.last_updated = new Date().toISOString();
      await kv.set(sourceKey, sourceStock);

      // Add to destination
      const destKey = `stock:${to_warehouse_id}:${item_id}${batch_number ? ":" + batch_number : ""}`;
      let destStock = await kv.get(destKey);

      if (!destStock) {
        destStock = {
          id: crypto.randomUUID(),
          item_id,
          warehouse_id: to_warehouse_id,
          batch_number,
          quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          last_updated: new Date().toISOString(),
        };
      }

      destStock.quantity += quantity;
      destStock.available_quantity += quantity;
      destStock.last_updated = new Date().toISOString();
      await kv.set(destKey, destStock);

      // Create transfer record
      const transferId = crypto.randomUUID();
      await kv.set(`stock_transfer:${transferId}`, {
        id: transferId,
        item_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        batch_number,
        remarks,
        transferred_by: userId,
        transferred_at: new Date().toISOString(),
      });

      await createAuditLog(
        userId,
        "stock_transfer",
        "stock",
        transferId,
        from_warehouse_id,
        to_warehouse_id,
      );

      console.log(`✅ Stock transferred: ${item_id} from ${from_warehouse_id} to ${to_warehouse_id}`);
      return c.json({ success: true, transfer_id: transferId, source: sourceStock, destination: destStock });
    } catch (error: any) {
      console.log("Stock transfer error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== QC ROUTES ====================

app.post(
  "/make-server-8eebe9eb/qc/templates",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { name, description, qc_type, steps } =
        await c.req.json();

      // Check for duplicate QC template name
      const allTemplates = await kv.getByPrefix("qc_template:");
      const templateExists = allTemplates.find((tmpl: any) => 
        tmpl.name.toLowerCase() === name.toLowerCase() && tmpl.qc_type === qc_type
      );
      if (templateExists) {
        return c.json({ error: `QC template '${name}' already exists for ${qc_type}` }, 400);
      }

      const id = crypto.randomUUID();
      const template = {
        id,
        name,
        description,
        qc_type,
        is_active: true,
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`qc_template:${id}`, template);

      // Save QC steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepId = crypto.randomUUID();
        await kv.set(`qc_step:${id}:${stepId}`, {
          id: stepId,
          template_id: id,
          step_number: i + 1,
          ...step,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "qc_templates",
        id,
        null,
        template,
      );
      return c.json({ success: true, template });
    } catch (error: any) {
      console.log("Create QC template error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/qc/templates",
  authMiddleware,
  async (c) => {
    try {
      const templates = await kv.getByPrefix("qc_template:");
      return c.json({ templates });
    } catch (error: any) {
      console.log("Get QC templates error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/qc/inspections",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        template_id,
        reference_type,
        reference_id,
        item_id,
        batch_number,
        quantity,
      } = await c.req.json();

      const id = crypto.randomUUID();
      const inspectionNumber = `QC-${Date.now()}`;

      const inspection = {
        id,
        inspection_number: inspectionNumber,
        template_id,
        reference_type,
        reference_id,
        item_id,
        batch_number,
        quantity,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      await kv.set(`qc_inspection:${id}`, inspection);
      await createAuditLog(
        userId,
        "create",
        "qc_inspections",
        id,
        null,
        inspection,
      );

      return c.json({ success: true, inspection });
    } catch (error: any) {
      console.log("Create QC inspection error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/qc/inspections",
  authMiddleware,
  async (c) => {
    try {
      const inspections =
        await kv.getByPrefix("qc_inspection:");
      return c.json({ inspections });
    } catch (error: any) {
      console.log("Get QC inspections error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/qc/inspections/:id/complete",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { results, status, remarks } = await c.req.json();

      const inspection = await kv.get(`qc_inspection:${id}`);
      if (!inspection) {
        return c.json({ error: "Inspection not found" }, 404);
      }

      inspection.status = status;
      inspection.inspected_by = userId;
      inspection.inspected_at = new Date().toISOString();
      inspection.remarks = remarks;

      await kv.set(`qc_inspection:${id}`, inspection);

      // Save results
      for (const result of results) {
        const resultId = crypto.randomUUID();
        await kv.set(`qc_result:${id}:${resultId}`, {
          id: resultId,
          inspection_id: id,
          ...result,
        });
      }

      // Update GRN status if it's incoming QC
      if (inspection.reference_type === "grn") {
        const grn = await kv.get(
          `grn:${inspection.reference_id}`,
        );
        if (grn) {
          grn.status =
            status === "passed" ? "qc_passed" : "qc_failed";
          await kv.set(`grn:${inspection.reference_id}`, grn);
        }
      }

      await createAuditLog(
        userId,
        "complete_qc",
        "qc_inspections",
        id,
        "pending",
        status,
      );
      return c.json({ success: true, inspection });
    } catch (error: any) {
      console.log(
        "Complete QC inspection error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

// Admin override QC decision
app.put(
  "/make-server-8eebe9eb/qc/inspections/:id/admin-approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { override_status, override_reason } = await c.req.json();

      // Check if user is admin
      const adminRecord = await kv.get(`admin:${userId}`);
      if (!adminRecord) {
        return c.json({ error: "Unauthorized - Admin access required" }, 403);
      }

      const inspection = await kv.get(`qc_inspection:${id}`);
      if (!inspection) {
        return c.json({ error: "Inspection not found" }, 404);
      }

      const oldStatus = inspection.status;
      
      inspection.status = override_status; // 'passed' or 'failed'
      inspection.admin_override = true;
      inspection.admin_override_by = userId;
      inspection.admin_override_at = new Date().toISOString();
      inspection.admin_override_reason = override_reason;

      await kv.set(`qc_inspection:${id}`, inspection);

      // Update GRN status if applicable
      if (inspection.reference_type === "grn") {
        const grn = await kv.get(`grn:${inspection.reference_id}`);
        if (grn) {
          grn.status = override_status === "passed" ? "qc_passed" : "qc_failed";
          await kv.set(`grn:${inspection.reference_id}`, grn);
        }
      }

      await createAuditLog(
        userId,
        "admin_override_qc",
        "qc_inspections",
        id,
        oldStatus,
        override_status,
      );

      console.log(`✅ Admin overrode QC inspection: ${inspection.inspection_number}`);
      return c.json({ success: true, inspection });
    } catch (error: any) {
      console.log("Admin QC override error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get QC template steps
app.get(
  "/make-server-8eebe9eb/qc/templates/:id/steps",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const steps = await kv.getByPrefix(`qc_step:${id}:`);
      
      // Sort by step number
      steps.sort((a: any, b: any) => a.step_number - b.step_number);
      
      return c.json({ steps });
    } catch (error: any) {
      console.log("Get QC steps error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get QC inspection results
app.get(
  "/make-server-8eebe9eb/qc/inspections/:id/results",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const results = await kv.getByPrefix(`qc_result:${id}:`);
      
      return c.json({ results });
    } catch (error: any) {
      console.log("Get QC results error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== BOM & PRODUCTION ROUTES ====================

app.post(
  "/make-server-8eebe9eb/bom",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { finished_item_id, version, components, description } =
        await c.req.json();

      if (!finished_item_id || !components || components.length === 0) {
        return c.json(
          { error: "finished_item_id and components are required" },
          400,
        );
      }

      const id = crypto.randomUUID();
      const bomCode = `BOM-${Date.now()}`;
      
      const bom = {
        id,
        bom_code: bomCode,
        finished_item_id,
        version: version || "1.0",
        status: "active",
        description: description || "",
        component_count: components.length,
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`bom:${id}`, bom);

      // Save BOM components
      for (const component of components) {
        const componentId = crypto.randomUUID();
        await kv.set(`bom_component:${id}:${componentId}`, {
          id: componentId,
          bom_id: id,
          item_id: component.item_id,
          quantity: component.quantity,
          is_optional: component.is_optional || false,
          created_at: new Date().toISOString(),
        });
      }

      await createAuditLog(
        userId,
        "create",
        "bom",
        id,
        null,
        bom,
      );
      return c.json({ success: true, bom });
    } catch (error: any) {
      console.log("Create BOM error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/bom",
  authMiddleware,
  async (c) => {
    try {
      const boms = await kv.getByPrefix("bom:");
      return c.json({ boms });
    } catch (error: any) {
      console.log("Get BOMs error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get BOM components
app.get(
  "/make-server-8eebe9eb/bom/:id/components",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const components = await kv.getByPrefix(`bom_component:${id}:`);
      return c.json({ components });
    } catch (error: any) {
      console.log("Get BOM components error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/work-orders",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        bom_id,
        quantity,
        warehouse_id,
        planned_start_date,
        planned_end_date,
        remarks,
      } = await c.req.json();

      if (!bom_id || !quantity || !warehouse_id || !planned_end_date) {
        return c.json(
          { error: "bom_id, quantity, warehouse_id, and planned_end_date are required" },
          400,
        );
      }

      // Get BOM to get finished item
      const bom = await kv.get(`bom:${bom_id}`);
      if (!bom) {
        return c.json({ error: "BOM not found" }, 404);
      }

      const id = crypto.randomUUID();
      const woNumber = `WO-${Date.now()}`;

      const wo = {
        id,
        wo_number: woNumber,
        bom_id,
        finished_item_id: bom.finished_item_id,
        quantity: parseFloat(quantity),
        produced_quantity: 0,
        status: "planned",
        planned_start_date: planned_start_date || new Date().toISOString().split('T')[0],
        planned_end_date,
        actual_start_date: null,
        actual_end_date: null,
        warehouse_id,
        remarks: remarks || "",
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`wo:${id}`, wo);
      
      // Reserve materials from BOM
      const bomComponents = await kv.getByPrefix(`bom_component:${bom_id}:`);
      for (const component of bomComponents) {
        const requiredQty = component.quantity * parseFloat(quantity);
        // Material reservation would be tracked here
        const reservationId = crypto.randomUUID();
        await kv.set(`material_reservation:${id}:${reservationId}`, {
          id: reservationId,
          wo_id: id,
          item_id: component.item_id,
          reserved_quantity: requiredQty,
          consumed_quantity: 0,
          is_optional: component.is_optional,
          created_at: new Date().toISOString(),
        });
      }

      await createAuditLog(
        userId,
        "create",
        "work_orders",
        id,
        null,
        wo,
      );

      return c.json({ success: true, wo });
    } catch (error: any) {
      console.log("Create work order error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/work-orders",
  authMiddleware,
  async (c) => {
    try {
      const wos = await kv.getByPrefix("wo:");
      return c.json({ wos });
    } catch (error: any) {
      console.log("Get work orders error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/work-orders/:id/consume",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { item_id, quantity, batch_number } =
        await c.req.json();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      // Update WO status to in_progress if it's planned
      if (wo.status === "planned") {
        wo.status = "in_progress";
        wo.actual_start_date = new Date().toISOString().split('T')[0];
        await kv.set(`wo:${id}`, wo);
      }

      const consumptionId = crypto.randomUUID();
      await kv.set(
        `material_consumption:${id}:${consumptionId}`,
        {
          id: consumptionId,
          wo_id: id,
          item_id,
          consumed_quantity: parseFloat(quantity),
          batch_number: batch_number || null,
          consumed_by: userId,
          consumed_at: new Date().toISOString(),
        },
      );

      // Deduct from stock
      const stockKey = `stock:${item_id}:${wo.warehouse_id}`;
      const stockData = await kv.get(stockKey);
      if (stockData) {
        stockData.quantity -= parseFloat(quantity);
        await kv.set(stockKey, stockData);
      }

      await createAuditLog(
        userId,
        "consume_material",
        "material_consumption",
        consumptionId,
        null,
        { wo_id: id, item_id, quantity },
      );
      return c.json({ success: true });
    } catch (error: any) {
      console.log("Consume material error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/work-orders/:id/produce",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const {
        quantity,
        batch_number,
        remarks,
      } = await c.req.json();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      const outputId = crypto.randomUUID();
      await kv.set(`production_output:${id}:${outputId}`, {
        id: outputId,
        wo_id: id,
        item_id: wo.finished_item_id,
        quantity: parseFloat(quantity),
        batch_number,
        remarks: remarks || "",
        produced_by: userId,
        produced_at: new Date().toISOString(),
      });

      // Update work order produced quantity
      wo.produced_quantity = (wo.produced_quantity || 0) + parseFloat(quantity);
      
      // Complete WO if fully produced
      if (wo.produced_quantity >= wo.quantity) {
        wo.status = "completed";
        wo.actual_end_date = new Date().toISOString().split('T')[0];
      }
      
      await kv.set(`wo:${id}`, wo);

      // Add to stock
      const stockKey = `stock:${wo.finished_item_id}:${wo.warehouse_id}`;
      let stockData = await kv.get(stockKey);
      if (!stockData) {
        stockData = {
          item_id: wo.finished_item_id,
          warehouse_id: wo.warehouse_id,
          quantity: 0,
          last_updated: new Date().toISOString(),
        };
      }
      stockData.quantity += parseFloat(quantity);
      stockData.last_updated = new Date().toISOString();
      await kv.set(stockKey, stockData);

      await createAuditLog(
        userId,
        "produce",
        "production_output",
        outputId,
        null,
        { wo_id: id, quantity },
      );
      return c.json({ success: true });
    } catch (error: any) {
      console.log("Produce output error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Start Work Order - Change status from 'planned' to 'in_progress'
app.post(
  "/make-server-8eebe9eb/work-orders/:id/start",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      if (wo.status !== 'planned') {
        return c.json({ error: "Work order can only be started from 'planned' status" }, 400);
      }

      wo.status = 'in_progress';
      wo.actual_start_date = new Date().toISOString().split('T')[0];
      wo.started_by = userId;

      await kv.set(`wo:${id}`, wo);
      await createAuditLog(userId, "start", "work_orders", id, null, wo);

      return c.json({ success: true, wo });
    } catch (error: any) {
      console.log("Start work order error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Issue Materials for Work Order
app.post(
  "/make-server-8eebe9eb/work-orders/:id/issue-materials",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { materials } = await c.req.json();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      if (wo.status !== 'in_progress') {
        return c.json({ error: "Work order must be 'in_progress' to issue materials" }, 400);
      }

      const issueId = crypto.randomUUID();
      const materialIssue = {
        id: issueId,
        wo_id: id,
        materials,
        issued_by: userId,
        issued_at: new Date().toISOString(),
      };

      for (const material of materials) {
        const stockKey = `stock:${material.item_id}:${wo.warehouse_id}`;
        const stockData = await kv.get(stockKey);
        
        if (!stockData || stockData.quantity < material.quantity) {
          return c.json({ 
            error: `Insufficient stock for item ${material.item_id}. Available: ${stockData?.quantity || 0}, Required: ${material.quantity}` 
          }, 400);
        }

        stockData.quantity -= parseFloat(material.quantity);
        stockData.last_updated = new Date().toISOString();
        await kv.set(stockKey, stockData);
      }

      await kv.set(`material_issue:${issueId}`, materialIssue);
      
      wo.materials_issued = true;
      wo.material_issue_date = new Date().toISOString();
      await kv.set(`wo:${id}`, wo);

      await createAuditLog(userId, "issue_materials", "work_orders", id, null, materialIssue);

      return c.json({ success: true, material_issue: materialIssue });
    } catch (error: any) {
      console.log("Issue materials error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Record Production Entry
app.post(
  "/make-server-8eebe9eb/work-orders/:id/record-production",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { quantity, batch_number, remarks, waste_quantity } = await c.req.json();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      if (wo.status !== 'in_progress') {
        return c.json({ error: "Work order must be 'in_progress' to record production" }, 400);
      }

      const entryId = crypto.randomUUID();
      const productionEntry = {
        id: entryId,
        wo_id: id,
        quantity: parseFloat(quantity),
        waste_quantity: parseFloat(waste_quantity || 0),
        batch_number,
        remarks,
        recorded_by: userId,
        recorded_at: new Date().toISOString(),
      };

      await kv.set(`production_entry:${entryId}`, productionEntry);

      wo.produced_quantity = (wo.produced_quantity || 0) + parseFloat(quantity);
      wo.waste_quantity = (wo.waste_quantity || 0) + parseFloat(waste_quantity || 0);
      await kv.set(`wo:${id}`, wo);

      await createAuditLog(userId, "record_production", "work_orders", id, null, productionEntry);

      return c.json({ success: true, production_entry: productionEntry, wo });
    } catch (error: any) {
      console.log("Record production error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Submit for QC
app.post(
  "/make-server-8eebe9eb/work-orders/:id/submit-qc",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      if (wo.produced_quantity < wo.quantity) {
        return c.json({ 
          error: `Cannot submit for QC. Produced: ${wo.produced_quantity}, Required: ${wo.quantity}` 
        }, 400);
      }

      wo.status = 'qc_pending';
      wo.qc_submitted_at = new Date().toISOString();
      wo.qc_submitted_by = userId;

      await kv.set(`wo:${id}`, wo);
      await createAuditLog(userId, "submit_qc", "work_orders", id, null, wo);

      return c.json({ success: true, wo });
    } catch (error: any) {
      console.log("Submit QC error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// QC Approval
app.post(
  "/make-server-8eebe9eb/work-orders/:id/qc-approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { approved, rejected_quantity, remarks } = await c.req.json();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      if (wo.status !== 'qc_pending') {
        return c.json({ error: "Work order must be in 'qc_pending' status" }, 400);
      }

      const qcId = crypto.randomUUID();
      const qcInspection = {
        id: qcId,
        wo_id: id,
        approved,
        rejected_quantity: parseFloat(rejected_quantity || 0),
        remarks,
        inspected_by: userId,
        inspected_at: new Date().toISOString(),
      };

      await kv.set(`qc_inspection:${qcId}`, qcInspection);

      if (approved) {
        wo.status = 'completed';
        wo.actual_end_date = new Date().toISOString().split('T')[0];
        wo.qc_approved = true;
        wo.qc_approved_by = userId;
        wo.qc_approved_at = new Date().toISOString();

        const approvedQty = wo.produced_quantity - parseFloat(rejected_quantity || 0);
        const stockKey = `stock:${wo.finished_item_id}:${wo.warehouse_id}`;
        let stockData = await kv.get(stockKey);
        
        if (!stockData) {
          stockData = {
            item_id: wo.finished_item_id,
            warehouse_id: wo.warehouse_id,
            quantity: 0,
            last_updated: new Date().toISOString(),
          };
        }
        
        stockData.quantity += approvedQty;
        stockData.last_updated = new Date().toISOString();
        await kv.set(stockKey, stockData);

        wo.approved_quantity = approvedQty;
        wo.rejected_quantity = parseFloat(rejected_quantity || 0);
      } else {
        wo.status = 'qc_rejected';
        wo.qc_rejected_by = userId;
        wo.qc_rejected_at = new Date().toISOString();
      }

      await kv.set(`wo:${id}`, wo);
      await createAuditLog(userId, approved ? "qc_approve" : "qc_reject", "work_orders", id, null, qcInspection);

      return c.json({ success: true, wo, qc_inspection: qcInspection });
    } catch (error: any) {
      console.log("QC approval error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get Work Order History/Timeline
app.get(
  "/make-server-8eebe9eb/work-orders/:id/timeline",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();

      const wo = await kv.get(`wo:${id}`);
      if (!wo) {
        return c.json({ error: "Work order not found" }, 404);
      }

      const allMaterialIssues = await kv.getByPrefix("material_issue:");
      const allProductionEntries = await kv.getByPrefix("production_entry:");
      const allQCInspections = await kv.getByPrefix("qc_inspection:");

      const materialIssues = allMaterialIssues.filter((mi: any) => mi.wo_id === id);
      const productionEntries = allProductionEntries.filter((pe: any) => pe.wo_id === id);
      const qcInspections = allQCInspections.filter((qc: any) => qc.wo_id === id);

      return c.json({
        wo,
        material_issues: materialIssues,
        production_entries: productionEntries,
        qc_inspections: qcInspections,
      });
    } catch (error: any) {
      console.log("Get work order timeline error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== SALES ROUTES ====================

app.post(
  "/make-server-8eebe9eb/sales-quotations",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { party_id, quotation_date, valid_until, items } =
        await c.req.json();

      const id = crypto.randomUUID();
      const quotationNumber = `SQ-${Date.now()}`;

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.total_amount;
      }

      const quotation = {
        id,
        quotation_number: quotationNumber,
        party_id,
        quotation_date,
        valid_until,
        total_amount: totalAmount,
        status: "draft",
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`sales_quotation:${id}`, quotation);

      // Save items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`sales_quotation_item:${id}:${itemId}`, {
          id: itemId,
          quotation_id: id,
          ...item,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "sales_quotations",
        id,
        null,
        quotation,
      );
      return c.json({ success: true, quotation });
    } catch (error: any) {
      console.log(
        "Create sales quotation error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/sales-quotations",
  authMiddleware,
  async (c) => {
    try {
      const quotations = await kv.getByPrefix(
        "sales_quotation:",
      );
      
      // Enrich each quotation with creator name and items
      const enrichedQuotations = await Promise.all(
        quotations.map(async (quot: any) => {
          // Fetch creator name
          let created_by_name = 'Unknown';
          if (quot.created_by) {
            const creator = await kv.get(`user:${quot.created_by}`);
            if (creator && creator.name) {
              created_by_name = creator.name;
            }
          }
          
          // Fetch items
          const items = await kv.getByPrefix(`sales_quotation_item:${quot.id}:`);
          
          return {
            ...quot,
            created_by_name,
            items
          };
        })
      );
      
      return c.json({ quotations: enrichedQuotations });
    } catch (error: any) {
      console.log("Get sales quotations error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Approve Sales Quotation
app.put(
  "/make-server-8eebe9eb/sales-quotations/:id/approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      console.log(`🔍 Approve quotation request - ID: ${id}, User: ${userId}`);
      
      const quotation = await kv.get(`sales_quotation:${id}`);
      if (!quotation) {
        console.log(`❌ Quotation not found with ID: ${id}`);
        return c.json({ error: "Sales quotation not found" }, 404);
      }
      
      console.log(`✅ Found quotation: ${quotation.quotation_number}`);

      // Initialize approval tracking if not exists
      if (!quotation.approval_history) {
        quotation.approval_history = [];
      }
      if (!quotation.current_approval_level) {
        quotation.current_approval_level = 0;
      }

      // Check if next approval level is required
      const nextApprover = await getNextApprover(
        'sales_quotation', 
        quotation.total_amount, 
        quotation.current_approval_level
      );

      // Add current approval to history
      quotation.approval_history.push({
        approver_id: userId,
        approval_level: quotation.current_approval_level + 1,
        approved_at: new Date().toISOString(),
        amount: quotation.total_amount,
      });

      if (nextApprover) {
        // More approvals needed
        quotation.current_approval_level++;
        quotation.status = "pending_approval";
        quotation.pending_approver_role = nextApprover.role_name;
        
        console.log(`⏳ Approval level ${quotation.current_approval_level} complete. Next: ${nextApprover.role_name}`);
        
        // Notify next approvers
        const nextApprovers = await getUsersWithRole(nextApprover.role_name);
        for (const approver of nextApprovers) {
          await createNotification(
            approver,
            'Approval Required',
            `Sales Quotation ${quotation.quotation_number} (₹${quotation.total_amount.toLocaleString()}) requires your approval`,
            'approval_required',
            'Sales',
            id
          );
        }
        
        await kv.set(`sales_quotation:${id}`, quotation);
        await createAuditLog(
          userId,
          "approve_sales_quotation_level",
          "Sales",
          id,
          { approval_level: quotation.current_approval_level - 1 },
          { approval_level: quotation.current_approval_level, status: "pending_approval" },
        );

        return c.json({ 
          success: true, 
          quotation,
          message: `Approved at level ${quotation.current_approval_level}. Pending approval from ${nextApprover.role_name}`,
          next_approval_required: true,
          next_approver_role: nextApprover.role_name
        });
      } else {
        // Final approval - no more levels required
        quotation.status = "approved";
        quotation.approved_by = userId;
        quotation.approved_at = new Date().toISOString();
        quotation.fully_approved = true;
        
        console.log(`✅ Final approval complete for ${quotation.quotation_number}`);

        await kv.set(`sales_quotation:${id}`, quotation);
        
        // Notify the creator
        if (quotation.created_by && quotation.created_by !== userId) {
          await createNotification(
            quotation.created_by,
            'Quotation Approved',
            `Sales Quotation ${quotation.quotation_number} has been fully approved`,
            'approval_approved',
            'Sales',
            id
          );
        }
        
        await createAuditLog(
          userId,
          "approve_sales_quotation",
          "Sales",
          id,
          { status: quotation.approval_history.length > 1 ? "pending_approval" : "draft" },
          { status: "approved" },
        );

        return c.json({ 
          success: true, 
          quotation,
          message: 'Quotation fully approved',
          next_approval_required: false
        });
      }
    } catch (error: any) {
      console.log("Approve sales quotation error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Reject Sales Quotation
app.put(
  "/make-server-8eebe9eb/sales-quotations/:id/reject",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const quotation = await kv.get(`sales_quotation:${id}`);
      if (!quotation) {
        return c.json({ error: "Sales quotation not found" }, 404);
      }

      quotation.status = "rejected";
      quotation.rejected_by = userId;
      quotation.rejected_at = new Date().toISOString();

      await kv.set(`sales_quotation:${id}`, quotation);
      await createAuditLog(
        userId,
        "reject_sales_quotation",
        "Sales",
        id,
        { status: quotation.status },
        { status: "rejected" },
      );

      // Notify the creator about rejection
      if (quotation.created_by && quotation.created_by !== userId) {
        await createNotification(
          quotation.created_by,
          'Quotation Rejected',
          `Sales Quotation ${quotation.quotation_number} has been rejected`,
          'approval_rejected',
          'Sales',
          id
        );
      }

      return c.json({ success: true, quotation });
    } catch (error: any) {
      console.log("Reject sales quotation error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== APPROVAL RULES MANAGEMENT ====================

// Get All Approval Rules
app.get(
  "/make-server-8eebe9eb/approval-rules",
  authMiddleware,
  async (c) => {
    try {
      const rules = await kv.getByPrefix("approval_rule:");
      const sortedRules = rules.sort((a: any, b: any) => {
        if (a.document_type !== b.document_type) {
          return a.document_type.localeCompare(b.document_type);
        }
        return a.approval_level - b.approval_level;
      });
      return c.json({ rules: sortedRules });
    } catch (error: any) {
      console.log("Get approval rules error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Create Approval Rule
app.post(
  "/make-server-8eebe9eb/approval-rules",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        document_type,
        approval_level,
        role_name,
        min_amount,
        max_amount,
        description,
      } = await c.req.json();

      if (!document_type || !approval_level || !role_name) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const ruleId = crypto.randomUUID();
      const rule = {
        id: ruleId,
        document_type,
        approval_level,
        role_name,
        min_amount: min_amount || null,
        max_amount: max_amount || null,
        description: description || '',
        is_active: true,
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`approval_rule:${ruleId}`, rule);
      await createAuditLog(
        userId,
        "create_approval_rule",
        "Settings",
        ruleId,
        null,
        rule,
      );

      console.log(`✅ Approval rule created: ${document_type} Level ${approval_level}`);
      return c.json({ success: true, rule });
    } catch (error: any) {
      console.log("Create approval rule error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Update Approval Rule
app.put(
  "/make-server-8eebe9eb/approval-rules/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const updates = await c.req.json();

      const rule = await kv.get(`approval_rule:${id}`);
      if (!rule) {
        return c.json({ error: "Approval rule not found" }, 404);
      }

      const oldRule = { ...rule };
      Object.assign(rule, updates, { updated_at: new Date().toISOString() });

      await kv.set(`approval_rule:${id}`, rule);
      await createAuditLog(
        userId,
        "update_approval_rule",
        "Settings",
        id,
        oldRule,
        rule,
      );

      return c.json({ success: true, rule });
    } catch (error: any) {
      console.log("Update approval rule error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Delete Approval Rule
app.delete(
  "/make-server-8eebe9eb/approval-rules/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const rule = await kv.get(`approval_rule:${id}`);
      if (!rule) {
        return c.json({ error: "Approval rule not found" }, 404);
      }

      await kv.del(`approval_rule:${id}`);
      await createAuditLog(
        userId,
        "delete_approval_rule",
        "Settings",
        id,
        rule,
        null,
      );

      return c.json({ success: true });
    } catch (error: any) {
      console.log("Delete approval rule error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== NOTIFICATIONS MANAGEMENT ====================

// Get User Notifications
app.get(
  "/make-server-8eebe9eb/notifications",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const notifications = await kv.getByPrefix(`notification:${userId}:`);
      
      // Sort by created_at descending
      const sorted = notifications.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      return c.json({ notifications: sorted });
    } catch (error: any) {
      console.log("Get notifications error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Mark Notification as Read
app.put(
  "/make-server-8eebe9eb/notifications/:id/read",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const notification = await kv.get(`notification:${userId}:${id}`);
      if (!notification) {
        return c.json({ error: "Notification not found" }, 404);
      }

      notification.read = true;
      notification.read_at = new Date().toISOString();
      await kv.set(`notification:${userId}:${id}`, notification);

      return c.json({ success: true, notification });
    } catch (error: any) {
      console.log("Mark notification read error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Mark All Notifications as Read
app.put(
  "/make-server-8eebe9eb/notifications/mark-all-read",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const notifications = await kv.getByPrefix(`notification:${userId}:`);
      
      for (const notification of notifications) {
        if (!notification.read) {
          notification.read = true;
          notification.read_at = new Date().toISOString();
          await kv.set(`notification:${userId}:${notification.id}`, notification);
        }
      }

      return c.json({ success: true, count: notifications.length });
    } catch (error: any) {
      console.log("Mark all notifications read error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/sales-orders",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        quotation_id,
        party_id,
        order_date,
        delivery_date,
        items,
        payment_terms,
        remarks,
      } = await c.req.json();

      const id = crypto.randomUUID();
      const orderNumber = `SO-${Date.now()}`;

      let totalAmount = 0;
      const itemsWithAvailability = [];

      // Check inventory availability for each item and calculate amounts
      for (const item of items) {
        totalAmount += item.total_amount;

        // Get current inventory for this item
        const inventoryRecords = await kv.getByPrefix(`inventory:${item.item_id}:`);
        let availableStock = 0;
        
        for (const invRecord of inventoryRecords) {
          if (invRecord.quantity_available) {
            availableStock += invRecord.quantity_available;
          }
        }

        const shortfall = Math.max(0, item.quantity - availableStock);
        
        itemsWithAvailability.push({
          ...item,
          available_stock: availableStock,
          shortfall: shortfall,
          needs_production: shortfall > 0
        });
      }

      const order = {
        id,
        order_number: orderNumber,
        quotation_id,
        party_id,
        order_date,
        delivery_date,
        payment_terms,
        remarks,
        total_amount: totalAmount,
        status: "confirmed",
        fulfillment_status: "pending",
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`sales_order:${id}`, order);

      // Save items and create production orders for items with shortfall
      for (const item of itemsWithAvailability) {
        const itemId = crypto.randomUUID();
        await kv.set(`sales_order_item:${id}:${itemId}`, {
          id: itemId,
          order_id: id,
          ...item,
        });

        // If there's a shortfall, automatically create a production order
        if (item.needs_production && item.shortfall > 0) {
          const productionOrderId = crypto.randomUUID();
          const productionOrderNumber = `PO-${Date.now()}-${itemId.substring(0, 8)}`;

          const productionOrder = {
            id: productionOrderId,
            order_number: productionOrderNumber,
            sales_order_id: id,
            sales_order_number: orderNumber,
            item_id: item.item_id,
            quantity_to_produce: item.shortfall,
            target_date: delivery_date,
            priority: "high",
            status: "pending",
            auto_generated: true,
            created_at: new Date().toISOString(),
            created_by: userId,
          };

          await kv.set(`production_order:${productionOrderId}`, productionOrder);

          // Log the auto-generated production order
          await createAuditLog(
            userId,
            "create",
            "production_orders",
            productionOrderId,
            null,
            productionOrder,
          );
        }
      }

      await createAuditLog(
        userId,
        "create",
        "sales_orders",
        id,
        null,
        order,
      );

      return c.json({ 
        success: true, 
        order,
        items: itemsWithAvailability,
        message: itemsWithAvailability.some(i => i.needs_production) 
          ? "Sales order created. Production orders auto-generated for items with stock shortfall."
          : "Sales order created successfully."
      });
    } catch (error: any) {
      console.log("Create sales order error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/sales-orders",
  authMiddleware,
  async (c) => {
    try {
      const orders = await kv.getByPrefix("sales_order:");
      return c.json({ orders });
    } catch (error: any) {
      console.log("Get sales orders error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== DELIVERY CHALLAN & E-WAY BILL ROUTES ====================

app.post(
  "/make-server-8eebe9eb/delivery-challans",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        order_id,
        party_id,
        warehouse_id,
        challan_date,
        transporter_name,
        vehicle_number,
        lr_number,
        items,
      } = await c.req.json();

      const id = crypto.randomUUID();
      const challanNumber = `DC-${Date.now()}`;

      const challan = {
        id,
        challan_number: challanNumber,
        order_id,
        party_id,
        warehouse_id,
        challan_date,
        transporter_name,
        vehicle_number,
        lr_number,
        status: "pending_approval",
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`delivery_challan:${id}`, challan);

      // Save items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await kv.set(`challan_item:${id}:${itemId}`, {
          id: itemId,
          challan_id: id,
          ...item,
        });
      }

      await createAuditLog(
        userId,
        "create",
        "delivery_challans",
        id,
        null,
        challan,
      );
      return c.json({ success: true, challan });
    } catch (error: any) {
      console.log(
        "Create delivery challan error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/delivery-challans",
  authMiddleware,
  async (c) => {
    try {
      const challans = await kv.getByPrefix(
        "delivery_challan:",
      );
      return c.json({ challans });
    } catch (error: any) {
      console.log(
        "Get delivery challans error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/delivery-challans/:id/approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const challan = await kv.get(`delivery_challan:${id}`);
      if (!challan) {
        return c.json({ error: "Challan not found" }, 404);
      }

      challan.status = "approved";
      challan.approved_by = userId;
      challan.approved_at = new Date().toISOString();

      await kv.set(`delivery_challan:${id}`, challan);

      // Deduct stock for challan items
      const challanItems = await kv.getByPrefix(
        `challan_item:${id}:`,
      );
      for (const item of challanItems) {
        // Stock deduction logic would go here
        // Using stock update API
      }

      await createAuditLog(
        userId,
        "approve",
        "delivery_challans",
        id,
        "pending_approval",
        "approved",
      );
      return c.json({ success: true, challan });
    } catch (error: any) {
      console.log(
        "Approve delivery challan error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/eway-bills",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { challan_id, invoice_id, valid_until } =
        await c.req.json();

      const id = crypto.randomUUID();
      const ewayBillNumber = `EWB-${Date.now()}`;

      // NOTE: In production, this would call the government E-Way Bill API
      // For now, we're simulating the generation

      const ewayBill = {
        id,
        eway_bill_number: ewayBillNumber,
        challan_id,
        invoice_id,
        generated_date: new Date().toISOString(),
        valid_until,
        status: "active",
        generated_by: userId,
        api_response: JSON.stringify({
          success: true,
          message:
            "E-Way Bill generated successfully (simulated)",
        }),
      };

      await kv.set(`eway_bill:${id}`, ewayBill);

      // Update challan with e-way bill number
      if (challan_id) {
        const challan = await kv.get(
          `delivery_challan:${challan_id}`,
        );
        if (challan) {
          challan.eway_bill_number = ewayBillNumber;
          await kv.set(
            `delivery_challan:${challan_id}`,
            challan,
          );
        }
      }

      await createAuditLog(
        userId,
        "generate",
        "eway_bills",
        id,
        null,
        ewayBill,
      );
      return c.json({ success: true, ewayBill });
    } catch (error: any) {
      console.log("Generate E-Way Bill error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/eway-bills",
  authMiddleware,
  async (c) => {
    try {
      const ewayBills = await kv.getByPrefix("eway_bill:");
      return c.json({ ewayBills });
    } catch (error: any) {
      console.log("Get E-Way Bills error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/eway-bills/:id/cancel",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      const ewayBill = await kv.get(`eway_bill:${id}`);
      if (!ewayBill) {
        return c.json({ error: "E-Way Bill not found" }, 404);
      }

      ewayBill.status = "cancelled";
      ewayBill.cancelled_by = userId;
      ewayBill.cancelled_at = new Date().toISOString();

      await kv.set(`eway_bill:${id}`, ewayBill);
      await createAuditLog(
        userId,
        "cancel",
        "eway_bills",
        id,
        "active",
        "cancelled",
      );

      return c.json({ success: true, ewayBill });
    } catch (error: any) {
      console.log("Cancel E-Way Bill error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== GST & ACCOUNTING ROUTES ====================

app.post(
  "/make-server-8eebe9eb/gst/transactions",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const data = await c.req.json();

      const id = crypto.randomUUID();
      const transaction = {
        id,
        ...data,
        created_at: new Date().toISOString(),
      };

      await kv.set(`gst_transaction:${id}`, transaction);
      await createAuditLog(
        userId,
        "create",
        "gst_transactions",
        id,
        null,
        transaction,
      );

      return c.json({ success: true, transaction });
    } catch (error: any) {
      console.log(
        "Create GST transaction error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/gst/transactions",
  authMiddleware,
  async (c) => {
    try {
      const type = c.req.query("type");
      let transactions = await kv.getByPrefix(
        "gst_transaction:",
      );

      if (type) {
        transactions = transactions.filter(
          (t: any) => t.transaction_type === type,
        );
      }

      return c.json({ transactions });
    } catch (error: any) {
      console.log("Get GST transactions error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/gst/payments",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { period, cgst_amount, sgst_amount, igst_amount } =
        await c.req.json();

      const id = crypto.randomUUID();
      const totalAmount =
        cgst_amount + sgst_amount + igst_amount;

      // NOTE: In production, this would call the GST Payment API
      // For now, we're simulating the payment initiation

      const payment = {
        id,
        payment_date: new Date().toISOString().split("T")[0],
        period,
        cgst_amount,
        sgst_amount,
        igst_amount,
        total_amount: totalAmount,
        payment_status: "initiated",
        api_response: JSON.stringify({
          success: true,
          message: "GST payment initiated (simulated)",
        }),
        paid_by: userId,
      };

      await kv.set(`gst_payment:${id}`, payment);
      await createAuditLog(
        userId,
        "initiate_payment",
        "gst_payments",
        id,
        null,
        payment,
      );

      return c.json({ success: true, payment });
    } catch (error: any) {
      console.log("Initiate GST payment error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/gst/payments",
  authMiddleware,
  async (c) => {
    try {
      const payments = await kv.getByPrefix("gst_payment:");
      return c.json({ payments });
    } catch (error: any) {
      console.log("Get GST payments error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== EMPLOYEE & HRM ROUTES ====================

app.post(
  "/make-server-8eebe9eb/employees",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const data = await c.req.json();

      // Check for duplicate employee code or email
      const allEmployees = await kv.getByPrefix("employee:");
      if (data.employee_code) {
        const codeExists = allEmployees.find((emp: any) => 
          emp.employee_code && emp.employee_code.toLowerCase() === data.employee_code.toLowerCase()
        );
        if (codeExists) {
          return c.json({ error: "Employee code already exists" }, 400);
        }
      }
      if (data.email) {
        const emailExists = allEmployees.find((emp: any) => 
          emp.email && emp.email.toLowerCase() === data.email.toLowerCase()
        );
        if (emailExists) {
          return c.json({ error: "Employee email already exists" }, 400);
        }
      }

      const id = crypto.randomUUID();
      const employee = {
        id,
        ...data,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await kv.set(`employee:${id}`, employee);
      await createAuditLog(
        userId,
        "create",
        "employees",
        id,
        null,
        employee,
      );

      return c.json({ success: true, employee });
    } catch (error: any) {
      console.log("Create employee error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/employees",
  authMiddleware,
  async (c) => {
    try {
      const employees = await kv.getByPrefix("employee:");
      return c.json({ employees });
    } catch (error: any) {
      console.log("Get employees error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/attendance",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        employee_id,
        attendance_date,
        check_in,
        check_out,
        status,
        remarks,
      } = await c.req.json();

      const id = crypto.randomUUID();
      const attendance = {
        id,
        employee_id,
        attendance_date,
        check_in,
        check_out,
        status,
        remarks,
      };

      await kv.set(
        `attendance:${employee_id}:${attendance_date}`,
        attendance,
      );
      await createAuditLog(
        userId,
        "create",
        "attendance",
        id,
        null,
        attendance,
      );

      return c.json({ success: true, attendance });
    } catch (error: any) {
      console.log("Create attendance error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/attendance",
  authMiddleware,
  async (c) => {
    try {
      const employeeId = c.req.query("employee_id");
      let attendance = await kv.getByPrefix("attendance:");

      if (employeeId) {
        attendance = attendance.filter(
          (a: any) => a.employee_id === employeeId,
        );
      }

      return c.json({ attendance });
    } catch (error: any) {
      console.log("Get attendance error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/leave-applications",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const {
        employee_id,
        leave_type,
        from_date,
        to_date,
        days,
        reason,
      } = await c.req.json();

      const id = crypto.randomUUID();
      const application = {
        id,
        employee_id,
        leave_type,
        from_date,
        to_date,
        days,
        reason,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      await kv.set(`leave_application:${id}`, application);
      await createAuditLog(
        userId,
        "create",
        "leave_applications",
        id,
        null,
        application,
      );

      return c.json({ success: true, application });
    } catch (error: any) {
      console.log(
        "Create leave application error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

app.get(
  "/make-server-8eebe9eb/leave-applications",
  authMiddleware,
  async (c) => {
    try {
      const applications = await kv.getByPrefix(
        "leave_application:",
      );
      return c.json({ applications });
    } catch (error: any) {
      console.log(
        "Get leave applications error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-8eebe9eb/leave-applications/:id/approve",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { status } = await c.req.json();

      const application = await kv.get(
        `leave_application:${id}`,
      );
      if (!application) {
        return c.json(
          { error: "Leave application not found" },
          404,
        );
      }

      application.status = status;
      application.approved_by = userId;
      application.approved_at = new Date().toISOString();

      await kv.set(`leave_application:${id}`, application);
      await createAuditLog(
        userId,
        "approve",
        "leave_applications",
        id,
        "pending",
        status,
      );

      return c.json({ success: true, application });
    } catch (error: any) {
      console.log(
        "Approve leave application error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== DASHBOARD & ANALYTICS ROUTES ====================

app.get(
  "/make-server-8eebe9eb/dashboard/stats",
  authMiddleware,
  async (c) => {
    try {
      const prs = await kv.getByPrefix("pr:");
      const pos = await kv.getByPrefix("po:");
      const invoices = await kv.getByPrefix("invoice:");
      const salesOrders = await kv.getByPrefix("sales_order:");
      const wos = await kv.getByPrefix("wo:");
      const stock = await kv.getByPrefix("stock:");
      const boms = await kv.getByPrefix("bom:");
      const productionOrders = await kv.getByPrefix("production_order:");

      // Calculate production costs for today
      const today = new Date().toISOString().split('T')[0];
      const completedOrdersToday = productionOrders.filter((po: any) => {
        if (po.status !== 'completed') return false;
        const completedDate = po.completed_at ? new Date(po.completed_at).toISOString().split('T')[0] : null;
        return completedDate === today;
      });

      const todayProductionCost = completedOrdersToday.reduce((sum: number, po: any) => 
        sum + (po.total_material_cost || 0) + (po.total_waste_cost || 0), 0
      );

      const todayUnitsProduced = completedOrdersToday.reduce((sum: number, po: any) => 
        sum + (po.quantity_produced || 0), 0
      );

      const stats = {
        purchase_requisitions: {
          total: prs.length,
          pending: prs.filter(
            (pr: any) => pr.status === "submitted",
          ).length,
        },
        purchase_orders: {
          total: pos.length,
          pending_approval: pos.filter(
            (po: any) => po.status === "draft",
          ).length,
        },
        invoices: {
          total: invoices.length,
          on_hold: invoices.filter(
            (inv: any) => inv.status === "hold",
          ).length,
        },
        sales_orders: {
          total: salesOrders.length,
          confirmed: salesOrders.filter(
            (so: any) => so.status === "confirmed",
          ).length,
        },
        work_orders: {
          total: wos.length,
          in_progress: wos.filter(
            (wo: any) => wo.status === "in_progress",
          ).length,
        },
        stock_items: stock.length,
        bill_of_materials: {
          total: boms.length,
          active: boms.filter((bom: any) => bom.status === 'active').length,
        },
        production_orders: {
          total: productionOrders.length,
          in_progress: productionOrders.filter((po: any) => po.status === 'in_progress').length,
          completed: productionOrders.filter((po: any) => po.status === 'completed').length,
          today_production_cost: todayProductionCost,
          today_units_produced: todayUnitsProduced,
        },
      };

      return c.json({ stats });
    } catch (error: any) {
      console.log("Get dashboard stats error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== AUDIT LOG ROUTES ====================

app.get(
  "/make-server-8eebe9eb/audit-logs",
  authMiddleware,
  async (c) => {
    try {
      const module = c.req.query("module");
      let logs = await kv.getByPrefix("audit_log:");

      if (module) {
        logs = logs.filter((log: any) => log.module === module);
      }

      // Sort by timestamp descending
      logs.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime(),
      );

      return c.json({ logs: logs.slice(0, 100) }); // Return last 100 logs
    } catch (error: any) {
      console.log("Get audit logs error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== OFFLINE MODE & SYNC ROUTES ====================

// Get all offline transactions
app.get(
  "/make-server-8eebe9eb/offline/transactions",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const transactions = await kv.getByPrefix(
        "offline_transaction:",
      );

      // Filter by user if not admin (optional)
      return c.json({ transactions });
    } catch (error: any) {
      console.log(
        "Get offline transactions error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

// Create offline transaction
app.post(
  "/make-server-8eebe9eb/offline/transactions",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { transaction_type, transaction_data, device_id } =
        await c.req.json();

      const id = crypto.randomUUID();
      const transaction = {
        id,
        transaction_data,
        transaction_type,
        device_id,
        created_at: new Date().toISOString(),
        synced: false,
        conflict: false,
      };

      await kv.set(`offline_transaction:${id}`, transaction);
      await createAuditLog(
        userId,
        "create",
        "offline_transactions",
        id,
        null,
        transaction,
      );

      return c.json({ success: true, transaction });
    } catch (error: any) {
      console.log(
        "Create offline transaction error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

// Sync offline transactions
app.post(
  "/make-server-8eebe9eb/offline/sync",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const transactions = await kv.getByPrefix(
        "offline_transaction:",
      );

      let syncedCount = 0;
      let conflictCount = 0;

      // Process each pending transaction
      for (const txn of transactions) {
        if (txn.synced) continue;

        try {
          // Parse transaction data
          const data = JSON.parse(txn.transaction_data);

          // Check for conflicts (simplified - in production, implement proper conflict detection)
          const hasConflict = false; // Placeholder for actual conflict detection logic

          if (hasConflict) {
            txn.conflict = true;
            conflictCount++;
          } else {
            // Process the transaction based on type
            // This is a simplified version - in production, route to appropriate handlers

            txn.synced = true;
            txn.synced_at = new Date().toISOString();
            syncedCount++;
          }

          await kv.set(`offline_transaction:${txn.id}`, txn);
        } catch (err: any) {
          console.error(
            `Error processing transaction ${txn.id}:`,
            err,
          );
          txn.conflict = true;
          txn.conflict_resolution = err.message;
          await kv.set(`offline_transaction:${txn.id}`, txn);
          conflictCount++;
        }
      }

      await createAuditLog(
        userId,
        "sync",
        "offline_transactions",
        null,
        null,
        {
          synced_count: syncedCount,
          conflicts: conflictCount,
        },
      );

      return c.json({
        success: true,
        synced_count: syncedCount,
        conflicts: conflictCount,
        total_processed: syncedCount + conflictCount,
      });
    } catch (error: any) {
      console.log(
        "Sync offline transactions error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

// Resolve conflict
app.post(
  "/make-server-8eebe9eb/offline/resolve/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();
      const { resolution } = await c.req.json();

      const transaction = await kv.get(
        `offline_transaction:${id}`,
      );
      if (!transaction) {
        return c.json({ error: "Transaction not found" }, 404);
      }

      transaction.conflict = false;
      transaction.conflict_resolution = resolution;
      transaction.synced = true;
      transaction.synced_at = new Date().toISOString();

      await kv.set(`offline_transaction:${id}`, transaction);
      await createAuditLog(
        userId,
        "resolve_conflict",
        "offline_transactions",
        id,
        null,
        { resolution },
      );

      return c.json({ success: true, transaction });
    } catch (error: any) {
      console.log("Resolve conflict error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Clear synced transactions
app.delete(
  "/make-server-8eebe9eb/offline/clear-synced",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const transactions = await kv.getByPrefix(
        "offline_transaction:",
      );

      let deletedCount = 0;
      for (const txn of transactions) {
        if (txn.synced && !txn.conflict) {
          await kv.del(`offline_transaction:${txn.id}`);
          deletedCount++;
        }
      }

      await createAuditLog(
        userId,
        "clear_synced",
        "offline_transactions",
        null,
        null,
        {
          deleted_count: deletedCount,
        },
      );

      return c.json({
        success: true,
        deleted_count: deletedCount,
      });
    } catch (error: any) {
      console.log(
        "Clear synced transactions error:",
        error.message,
      );
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== ADDITIONAL HRM ROUTES ====================

// Designations
app.get(
  "/make-server-8eebe9eb/designations",
  authMiddleware,
  async (c) => {
    try {
      // Return standard designations (can be extended to store in KV)
      const designations = [
        { id: "1", name: "Manager", code: "MGR" },
        { id: "2", name: "Senior Executive", code: "SR_EXE" },
        { id: "3", name: "Executive", code: "EXE" },
        { id: "4", name: "Team Lead", code: "TL" },
        { id: "5", name: "Supervisor", code: "SUP" },
        { id: "6", name: "Operator", code: "OPR" },
        { id: "7", name: "Technician", code: "TECH" },
        { id: "8", name: "Quality Inspector", code: "QI" },
        { id: "9", name: "Store Keeper", code: "SK" },
        { id: "10", name: "Admin", code: "ADMIN" },
      ];
      return c.json({ designations });
    } catch (error: any) {
      console.log("Get designations error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Leave Types
app.get(
  "/make-server-8eebe9eb/leave-types",
  authMiddleware,
  async (c) => {
    try {
      // Return standard leave types (can be extended to store in KV)
      const leave_types = [
        { id: "1", name: "Casual Leave", code: "CL", days_allowed: 12 },
        { id: "2", name: "Sick Leave", code: "SL", days_allowed: 7 },
        { id: "3", name: "Earned Leave", code: "EL", days_allowed: 15 },
        { id: "4", name: "Maternity Leave", code: "ML", days_allowed: 180 },
        { id: "5", name: "Paternity Leave", code: "PL", days_allowed: 7 },
        { id: "6", name: "Unpaid Leave", code: "UL", days_allowed: 0 },
      ];
      return c.json({ leave_types });
    } catch (error: any) {
      console.log("Get leave types error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Shifts
app.get(
  "/make-server-8eebe9eb/shifts",
  authMiddleware,
  async (c) => {
    try {
      const shifts = await kv.getByPrefix("shift:");
      return c.json({ shifts });
    } catch (error: any) {
      console.log("Get shifts error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/shifts",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { name, start_time, end_time, break_duration } = await c.req.json();

      const shiftId = `SHIFT-${Date.now()}`;
      const shift = {
        id: shiftId,
        name,
        start_time,
        end_time,
        break_duration: break_duration || 0,
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`shift:${shiftId}`, shift);
      await createAuditLog(userId, "create", "shifts", shiftId, null, name);

      return c.json({ shift });
    } catch (error: any) {
      console.log("Create shift error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.delete(
  "/make-server-8eebe9eb/shifts/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      await kv.del(`shift:${id}`);
      await createAuditLog(userId, "delete", "shifts", id, null, null);

      return c.json({ success: true });
    } catch (error: any) {
      console.log("Delete shift error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Holidays
app.get(
  "/make-server-8eebe9eb/holidays",
  authMiddleware,
  async (c) => {
    try {
      const holidays = await kv.getByPrefix("holiday:");
      return c.json({ holidays });
    } catch (error: any) {
      console.log("Get holidays error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/holidays",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { name, date, description } = await c.req.json();

      const holidayId = `HOL-${Date.now()}`;
      const holiday = {
        id: holidayId,
        name,
        date,
        description: description || "",
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`holiday:${holidayId}`, holiday);
      await createAuditLog(userId, "create", "holidays", holidayId, null, name);

      return c.json({ holiday });
    } catch (error: any) {
      console.log("Create holiday error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.delete(
  "/make-server-8eebe9eb/holidays/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { id } = c.req.param();

      await kv.del(`holiday:${id}`);
      await createAuditLog(userId, "delete", "holidays", id, null, null);

      return c.json({ success: true });
    } catch (error: any) {
      console.log("Delete holiday error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Performance Reviews
app.get(
  "/make-server-8eebe9eb/performance-reviews",
  authMiddleware,
  async (c) => {
    try {
      const reviews = await kv.getByPrefix("performance_review:");
      return c.json({ reviews });
    } catch (error: any) {
      console.log("Get performance reviews error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/performance-reviews",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { employee_id, review_period, rating, comments, goals } = await c.req.json();

      const reviewId = `PR-${Date.now()}`;
      const review = {
        id: reviewId,
        employee_id,
        review_period,
        rating,
        comments: comments || "",
        goals: goals || [],
        reviewer_id: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`performance_review:${reviewId}`, review);
      await createAuditLog(userId, "create", "performance_reviews", reviewId, null, employee_id);

      return c.json({ review });
    } catch (error: any) {
      console.log("Create performance review error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Payroll
app.get(
  "/make-server-8eebe9eb/payroll",
  authMiddleware,
  async (c) => {
    try {
      const payroll = await kv.getByPrefix("payroll:");
      return c.json({ payroll });
    } catch (error: any) {
      console.log("Get payroll error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.post(
  "/make-server-8eebe9eb/payroll/process",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { employee_id, month, year, basic_salary, allowances, deductions } = await c.req.json();

      const payrollId = `PAY-${Date.now()}`;
      const gross_salary = basic_salary + (allowances?.reduce((sum: number, a: any) => sum + a.amount, 0) || 0);
      const total_deductions = deductions?.reduce((sum: number, d: any) => sum + d.amount, 0) || 0;
      const net_salary = gross_salary - total_deductions;

      const payroll = {
        id: payrollId,
        employee_id,
        month,
        year,
        basic_salary,
        allowances: allowances || [],
        deductions: deductions || [],
        gross_salary,
        total_deductions,
        net_salary,
        status: "processed",
        processed_by: userId,
        processed_at: new Date().toISOString(),
      };

      await kv.set(`payroll:${payrollId}`, payroll);
      await createAuditLog(userId, "process", "payroll", payrollId, null, `${month}/${year}`);

      return c.json({ payroll });
    } catch (error: any) {
      console.log("Process payroll error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== BILL OF MATERIALS (BOM) ROUTES ====================

// Create BOM
app.post(
  "/make-server-8eebe9eb/bom",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { product_id, product_name, bom_items, total_material_cost, total_scrap_cost, final_cost_per_unit, status } = await c.req.json();

      // Check for duplicate BOM for the same product
      const allBOMs = await kv.getByPrefix("bom:");
      const bomExists = allBOMs.find((bom: any) => bom.product_id === product_id && bom.status === 'active');
      if (bomExists) {
        return c.json({ error: `Active BOM already exists for product ${product_name}` }, 400);
      }

      const bomId = crypto.randomUUID();
      const bom = {
        id: bomId,
        product_id,
        product_name,
        bom_items,
        total_material_cost,
        total_scrap_cost,
        final_cost_per_unit,
        status: status || 'active',
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`bom:${bomId}`, bom);
      await createAuditLog(userId, "create", "bom", bomId, null, bom);

      return c.json(bom);
    } catch (error: any) {
      console.log("Create BOM error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get all BOMs
app.get(
  "/make-server-8eebe9eb/bom",
  authMiddleware,
  async (c) => {
    try {
      const boms = await kv.getByPrefix("bom:");
      
      // Remove duplicates
      const uniqueBOMs = Array.from(new Map(boms.map(item => [item.id, item])).values());
      
      uniqueBOMs.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return c.json(uniqueBOMs);
    } catch (error: any) {
      console.log("Get BOMs error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get BOM by ID
app.get(
  "/make-server-8eebe9eb/bom/:id",
  authMiddleware,
  async (c) => {
    try {
      const id = c.req.param("id");
      const bom = await kv.get(`bom:${id}`);

      if (!bom) {
        return c.json({ error: "BOM not found" }, 404);
      }

      return c.json(bom);
    } catch (error: any) {
      console.log("Get BOM error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Update BOM
app.put(
  "/make-server-8eebe9eb/bom/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const updates = await c.req.json();

      const bom = await kv.get(`bom:${id}`);
      if (!bom) {
        return c.json({ error: "BOM not found" }, 404);
      }

      const updatedBOM = {
        ...bom,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };

      await kv.set(`bom:${id}`, updatedBOM);
      await createAuditLog(userId, "update", "bom", id, bom, updatedBOM);

      return c.json(updatedBOM);
    } catch (error: any) {
      console.log("Update BOM error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Delete BOM
app.delete(
  "/make-server-8eebe9eb/bom/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const id = c.req.param("id");

      const bom = await kv.get(`bom:${id}`);
      if (!bom) {
        return c.json({ error: "BOM not found" }, 404);
      }

      await kv.del(`bom:${id}`);
      await createAuditLog(userId, "delete", "bom", id, bom, null);

      return c.json({ success: true });
    } catch (error: any) {
      console.log("Delete BOM error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== PRODUCTION ORDERS ROUTES ====================

// Create Production Order
app.post(
  "/make-server-8eebe9eb/production-orders",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { bom_id, product_id, product_name, quantity_planned, notes } = await c.req.json();

      // Generate order number
      const allOrders = await kv.getByPrefix("production_order:");
      const orderNumber = `PO-${Date.now()}-${(allOrders.length + 1).toString().padStart(4, '0')}`;

      const orderId = crypto.randomUUID();
      const order = {
        id: orderId,
        order_number: orderNumber,
        bom_id,
        product_id,
        product_name,
        quantity_planned,
        quantity_produced: 0,
        quantity_rejected: 0,
        material_consumption: [],
        total_material_cost: 0,
        total_waste_cost: 0,
        cost_per_unit: 0,
        status: 'draft',
        notes,
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      await kv.set(`production_order:${orderId}`, order);
      await createAuditLog(userId, "create", "production_order", orderId, null, order);

      return c.json(order);
    } catch (error: any) {
      console.log("Create production order error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get all Production Orders
app.get(
  "/make-server-8eebe9eb/production-orders",
  authMiddleware,
  async (c) => {
    try {
      const orders = await kv.getByPrefix("production_order:");
      
      // Remove duplicates
      const uniqueOrders = Array.from(new Map(orders.map(item => [item.id, item])).values());
      
      uniqueOrders.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return c.json(uniqueOrders);
    } catch (error: any) {
      console.log("Get production orders error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Start Production Order
app.post(
  "/make-server-8eebe9eb/production-orders/:id/start",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const id = c.req.param("id");

      const order = await kv.get(`production_order:${id}`);
      if (!order) {
        return c.json({ error: "Production order not found" }, 404);
      }

      order.status = 'in_progress';
      order.started_at = new Date().toISOString();
      order.started_by = userId;

      await kv.set(`production_order:${id}`, order);
      await createAuditLog(userId, "start", "production_order", id, null, order);

      return c.json(order);
    } catch (error: any) {
      console.log("Start production order error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Complete Production Order
app.post(
  "/make-server-8eebe9eb/production-orders/:id/complete",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const { material_consumption, total_material_cost, total_waste_cost, cost_per_unit, quantity_produced, quantity_rejected } = await c.req.json();

      const order = await kv.get(`production_order:${id}`);
      if (!order) {
        return c.json({ error: "Production order not found" }, 404);
      }

      order.material_consumption = material_consumption;
      order.total_material_cost = total_material_cost;
      order.total_waste_cost = total_waste_cost;
      order.cost_per_unit = cost_per_unit;
      order.quantity_produced = quantity_produced;
      order.quantity_rejected = quantity_rejected || 0;
      order.status = 'completed';
      order.completed_at = new Date().toISOString();
      order.completed_by = userId;

      await kv.set(`production_order:${id}`, order);
      await createAuditLog(userId, "complete", "production_order", id, null, order);

      return c.json(order);
    } catch (error: any) {
      console.log("Complete production order error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Update Production Order
app.put(
  "/make-server-8eebe9eb/production-orders/:id",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const updates = await c.req.json();

      const order = await kv.get(`production_order:${id}`);
      if (!order) {
        return c.json({ error: "Production order not found" }, 404);
      }

      const updatedOrder = {
        ...order,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };

      await kv.set(`production_order:${id}`, updatedOrder);
      await createAuditLog(userId, "update", "production_order", id, order, updatedOrder);

      return c.json(updatedOrder);
    } catch (error: any) {
      console.log("Update production order error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== MATERIALS ROUTES ====================

// Get all materials (from existing master data)
app.get(
  "/make-server-8eebe9eb/materials",
  authMiddleware,
  async (c) => {
    try {
      const materials = await kv.getByPrefix("material:");
      
      // Remove duplicates
      const uniqueMaterials = Array.from(new Map(materials.map(item => [item.id, item])).values());
      
      uniqueMaterials.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

      return c.json(uniqueMaterials);
    } catch (error: any) {
      console.log("Get materials error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== PRODUCTS ROUTES ====================

// Get all products (from existing master data)
app.get(
  "/make-server-8eebe9eb/products",
  authMiddleware,
  async (c) => {
    try {
      const products = await kv.getByPrefix("product:");
      
      // Remove duplicates
      const uniqueProducts = Array.from(new Map(products.map(item => [item.id, item])).values());
      
      uniqueProducts.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

      return c.json(uniqueProducts);
    } catch (error: any) {
      console.log("Get products error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== REPORTS ROUTES ====================

// Production Cost Report
app.get(
  "/make-server-8eebe9eb/reports/production-cost",
  authMiddleware,
  async (c) => {
    try {
      const dateFrom = c.req.query("date_from");
      const dateTo = c.req.query("date_to");
      const productId = c.req.query("product_id");

      let orders = await kv.getByPrefix("production_order:");
      
      // Filter by date range
      if (dateFrom && dateTo) {
        orders = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= new Date(dateFrom) && orderDate <= new Date(dateTo + 'T23:59:59');
        });
      }

      // Filter by product
      if (productId && productId !== 'all') {
        orders = orders.filter((order: any) => order.product_id === productId);
      }

      // Only include completed orders
      orders = orders.filter((order: any) => order.status === 'completed');

      // Group by product
      const productMap = new Map();
      
      orders.forEach((order: any) => {
        const key = order.product_id;
        
        if (!productMap.has(key)) {
          productMap.set(key, {
            product_name: order.product_name,
            total_quantity: 0,
            total_material_cost: 0,
            total_waste_cost: 0,
            total_cost: 0,
            average_cost_per_unit: 0,
            waste_percentage: 0,
          });
        }
        
        const product = productMap.get(key);
        product.total_quantity += order.quantity_produced;
        product.total_material_cost += order.total_material_cost;
        product.total_waste_cost += order.total_waste_cost;
        product.total_cost = product.total_material_cost + product.total_waste_cost;
      });

      // Calculate averages
      const report = Array.from(productMap.values()).map((product: any) => {
        product.average_cost_per_unit = product.total_quantity > 0 
          ? product.total_cost / product.total_quantity 
          : 0;
        product.waste_percentage = product.total_material_cost > 0
          ? (product.total_waste_cost / product.total_material_cost) * 100
          : 0;
        return product;
      });

      return c.json(report);
    } catch (error: any) {
      console.log("Production cost report error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Material Usage Report
app.get(
  "/make-server-8eebe9eb/reports/material-usage",
  authMiddleware,
  async (c) => {
    try {
      const dateFrom = c.req.query("date_from");
      const dateTo = c.req.query("date_to");
      const productId = c.req.query("product_id");

      let orders = await kv.getByPrefix("production_order:");
      
      // Filter by date range
      if (dateFrom && dateTo) {
        orders = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= new Date(dateFrom) && orderDate <= new Date(dateTo + 'T23:59:59');
        });
      }

      // Filter by product
      if (productId && productId !== 'all') {
        orders = orders.filter((order: any) => order.product_id === productId);
      }

      // Only include completed orders
      orders = orders.filter((order: any) => order.status === 'completed');

      // Group by material
      const materialMap = new Map();
      
      orders.forEach((order: any) => {
        if (order.material_consumption && Array.isArray(order.material_consumption)) {
          order.material_consumption.forEach((consumption: any) => {
            const key = consumption.material_id;
            
            if (!materialMap.has(key)) {
              materialMap.set(key, {
                material_name: consumption.material_name,
                total_planned: 0,
                total_actual: 0,
                total_waste: 0,
                unit: consumption.unit,
                total_cost: 0,
                waste_cost: 0,
                efficiency_percentage: 0,
              });
            }
            
            const material = materialMap.get(key);
            material.total_planned += consumption.planned_quantity;
            material.total_actual += consumption.actual_quantity;
            material.total_waste += consumption.waste_quantity;
            material.total_cost += consumption.total_cost;
            material.waste_cost += consumption.waste_cost;
          });
        }
      });

      // Calculate efficiency
      const report = Array.from(materialMap.values()).map((material: any) => {
        material.efficiency_percentage = material.total_planned > 0
          ? ((material.total_planned - material.total_waste) / material.total_planned) * 100
          : 0;
        return material;
      });

      return c.json(report);
    } catch (error: any) {
      console.log("Material usage report error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Waste Analysis Report
app.get(
  "/make-server-8eebe9eb/reports/waste-analysis",
  authMiddleware,
  async (c) => {
    try {
      const dateFrom = c.req.query("date_from");
      const dateTo = c.req.query("date_to");
      const productId = c.req.query("product_id");

      let orders = await kv.getByPrefix("production_order:");
      
      // Filter by date range
      if (dateFrom && dateTo) {
        orders = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= new Date(dateFrom) && orderDate <= new Date(dateTo + 'T23:59:59');
        });
      }

      // Filter by product
      if (productId && productId !== 'all') {
        orders = orders.filter((order: any) => order.product_id === productId);
      }

      // Only include completed orders
      orders = orders.filter((order: any) => order.status === 'completed');

      // Group by product and material
      const wasteMap = new Map();
      
      orders.forEach((order: any) => {
        if (order.material_consumption && Array.isArray(order.material_consumption)) {
          order.material_consumption.forEach((consumption: any) => {
            if (consumption.waste_quantity > 0) {
              const key = `${order.product_id}:${consumption.material_id}`;
              
              if (!wasteMap.has(key)) {
                wasteMap.set(key, {
                  product_name: order.product_name,
                  material_name: consumption.material_name,
                  waste_quantity: 0,
                  waste_cost: 0,
                  waste_percentage: 0,
                  order_count: 0,
                  total_actual: 0,
                });
              }
              
              const waste = wasteMap.get(key);
              waste.waste_quantity += consumption.waste_quantity;
              waste.waste_cost += consumption.waste_cost;
              waste.order_count += 1;
              waste.total_actual += consumption.actual_quantity;
            }
          });
        }
      });

      // Calculate waste percentage
      const report = Array.from(wasteMap.values()).map((waste: any) => {
        waste.waste_percentage = waste.total_actual > 0
          ? (waste.waste_quantity / waste.total_actual) * 100
          : 0;
        delete waste.total_actual; // Remove helper field
        return waste;
      });

      return c.json(report);
    } catch (error: any) {
      console.log("Waste analysis report error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ==================== PAYMENT TRACKING ROUTES ====================

// Record payment for Sales Order
app.post(
  "/make-server-8eebe9eb/sales-payments",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { order_id, party_id, amount, payment_date, payment_method, reference_number, remarks } = await c.req.json();

      const id = crypto.randomUUID();
      const payment = {
        id,
        order_id,
        party_id,
        amount: parseFloat(amount),
        payment_date,
        payment_method, // cash, bank_transfer, cheque, card, upi
        reference_number,
        remarks,
        type: 'sales',
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`payment:sales:${id}`, payment);
      await createAuditLog(userId, "create", "sales_payments", id, null, payment);

      return c.json({ success: true, payment });
    } catch (error: any) {
      console.log("Create sales payment error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get payments for a sales order
app.get(
  "/make-server-8eebe9eb/sales-orders/:id/payments",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const allPayments = await kv.getByPrefix("payment:sales:");
      const orderPayments = allPayments.filter((p: any) => p.order_id === id);
      
      const totalPaid = orderPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      
      return c.json({ payments: orderPayments, total_paid: totalPaid });
    } catch (error: any) {
      console.log("Get sales order payments error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get all payments by party (customer)
app.get(
  "/make-server-8eebe9eb/parties/:id/sales-payments",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const allPayments = await kv.getByPrefix("payment:sales:");
      const partyPayments = allPayments.filter((p: any) => p.party_id === id);
      
      const totalPaid = partyPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      
      return c.json({ payments: partyPayments, total_paid: totalPaid });
    } catch (error: any) {
      console.log("Get party sales payments error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Record payment for Purchase Order
app.post(
  "/make-server-8eebe9eb/purchase-payments",
  authMiddleware,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { order_id, party_id, amount, payment_date, payment_method, reference_number, remarks } = await c.req.json();

      const id = crypto.randomUUID();
      const payment = {
        id,
        order_id,
        party_id,
        amount: parseFloat(amount),
        payment_date,
        payment_method,
        reference_number,
        remarks,
        type: 'purchase',
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      await kv.set(`payment:purchase:${id}`, payment);
      await createAuditLog(userId, "create", "purchase_payments", id, null, payment);

      return c.json({ success: true, payment });
    } catch (error: any) {
      console.log("Create purchase payment error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get payments for a purchase order
app.get(
  "/make-server-8eebe9eb/purchase-orders/:id/payments",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const allPayments = await kv.getByPrefix("payment:purchase:");
      const orderPayments = allPayments.filter((p: any) => p.order_id === id);
      
      const totalPaid = orderPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      
      return c.json({ payments: orderPayments, total_paid: totalPaid });
    } catch (error: any) {
      console.log("Get purchase order payments error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get all payments by party (supplier)
app.get(
  "/make-server-8eebe9eb/parties/:id/purchase-payments",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      const allPayments = await kv.getByPrefix("payment:purchase:");
      const partyPayments = allPayments.filter((p: any) => p.party_id === id);
      
      const totalPaid = partyPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      
      return c.json({ payments: partyPayments, total_paid: totalPaid });
    } catch (error: any) {
      console.log("Get party purchase payments error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Get party outstanding balance with credit utilization
app.get(
  "/make-server-8eebe9eb/parties/:id/outstanding",
  authMiddleware,
  async (c) => {
    try {
      const { id } = c.req.param();
      
      // Get party details
      const party = await kv.get(`party:${id}`);
      if (!party) {
        return c.json({ error: "Party not found" }, 404);
      }
      
      // Get all sales orders for this party
      const allOrders = await kv.getByPrefix("sales_order:");
      const partyOrders = allOrders.filter((o: any) => o.party_id === id && o.status === 'approved');
      
      // Calculate total order amount
      const totalOrderAmount = partyOrders.reduce((sum: number, order: any) => {
        return sum + (order.total || 0);
      }, 0);
      
      // Get all payments from this party
      const allPayments = await kv.getByPrefix("payment:sales:");
      const partyPayments = allPayments.filter((p: any) => p.party_id === id);
      const totalPaid = partyPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      
      // Calculate outstanding
      const outstanding = totalOrderAmount - totalPaid;
      const creditLimit = party.credit_limit || 0;
      const availableCredit = creditLimit - outstanding;
      const creditUtilization = creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0;
      
      return c.json({
        party_id: id,
        party_name: party.name,
        credit_limit: creditLimit,
        total_orders: totalOrderAmount,
        total_paid: totalPaid,
        outstanding_balance: outstanding,
        available_credit: availableCredit,
        credit_utilization_percentage: creditUtilization,
        advance_payment: totalPaid > totalOrderAmount ? totalPaid - totalOrderAmount : 0,
      });
    } catch (error: any) {
      console.log("Get party outstanding error:", error.message);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ============================================
// ACCOUNTING MODULE ROUTES
// ============================================

// Account Groups
app.get("/make-server-8eebe9eb/accounting/groups", authMiddleware, accounting.getAccountGroups);
app.post("/make-server-8eebe9eb/accounting/groups", authMiddleware, accounting.createAccountGroup);
app.put("/make-server-8eebe9eb/accounting/groups/:id", authMiddleware, accounting.updateAccountGroup);
app.delete("/make-server-8eebe9eb/accounting/groups/:id", authMiddleware, accounting.deleteAccountGroup);

// Account Ledgers
app.get("/make-server-8eebe9eb/accounting/ledgers", authMiddleware, accounting.getAccountLedgers);
app.get("/make-server-8eebe9eb/accounting/ledgers/:id", authMiddleware, accounting.getAccountLedger);
app.post("/make-server-8eebe9eb/accounting/ledgers", authMiddleware, accounting.createAccountLedger);
app.put("/make-server-8eebe9eb/accounting/ledgers/:id", authMiddleware, accounting.updateAccountLedger);
app.delete("/make-server-8eebe9eb/accounting/ledgers/:id", authMiddleware, accounting.deleteAccountLedger);

// Vouchers
app.get("/make-server-8eebe9eb/accounting/vouchers", authMiddleware, accounting.getVouchers);
app.get("/make-server-8eebe9eb/accounting/vouchers/:id", authMiddleware, accounting.getVoucher);
app.post("/make-server-8eebe9eb/accounting/vouchers", authMiddleware, accounting.createVoucher);
app.put("/make-server-8eebe9eb/accounting/vouchers/:id", authMiddleware, accounting.updateVoucher);
app.delete("/make-server-8eebe9eb/accounting/vouchers/:id", authMiddleware, accounting.deleteVoucher);

// Bank Reconciliation
app.get("/make-server-8eebe9eb/accounting/bank-reconciliation/statements", authMiddleware, accounting.getBankStatements);
app.post("/make-server-8eebe9eb/accounting/bank-reconciliation/statements", authMiddleware, accounting.createBankStatement);
app.put("/make-server-8eebe9eb/accounting/bank-reconciliation/statements/:id", authMiddleware, accounting.updateBankStatement);
app.delete("/make-server-8eebe9eb/accounting/bank-reconciliation/statements/:id", authMiddleware, accounting.deleteBankStatement);
app.post("/make-server-8eebe9eb/accounting/bank-reconciliation/match", authMiddleware, accounting.matchTransactions);

// Initialize predefined account groups on server start
accounting.initializeAccountGroups();

// ==================== HRM (HUMAN RESOURCE MANAGEMENT) ROUTES ====================

// Employees
app.get("/make-server-8eebe9eb/hrm/employees", authMiddleware, async (c) => {
  try {
    const employees = await kv.getByPrefix("hrm_employee_");
    return c.json(employees);
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-8eebe9eb/hrm/employees", authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const employee = {
      id,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`hrm_employee_${id}`, employee);
    return c.json(employee, 201);
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-8eebe9eb/hrm/employees/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const existing = await kv.get(`hrm_employee_${id}`);
    
    if (!existing) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const updated = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`hrm_employee_${id}`, updated);
    return c.json(updated);
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-8eebe9eb/hrm/employees/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`hrm_employee_${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Attendance
app.get("/make-server-8eebe9eb/hrm/attendance", authMiddleware, async (c) => {
  try {
    const date = c.req.query("date");
    const attendance = await kv.getByPrefix("hrm_attendance_");
    
    if (date) {
      const filtered = attendance.filter((a: any) => a.date === date);
      return c.json(filtered);
    }
    
    return c.json(attendance);
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-8eebe9eb/hrm/attendance", authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const attendance = {
      id,
      ...data,
      created_at: new Date().toISOString(),
    };
    await kv.set(`hrm_attendance_${id}`, attendance);
    return c.json(attendance, 201);
  } catch (error: any) {
    console.error("Error creating attendance:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-8eebe9eb/hrm/attendance/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const existing = await kv.get(`hrm_attendance_${id}`);
    
    if (!existing) {
      return c.json({ error: "Attendance record not found" }, 404);
    }

    const updated = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`hrm_attendance_${id}`, updated);
    return c.json(updated);
  } catch (error: any) {
    console.error("Error updating attendance:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Leave Management
app.get("/make-server-8eebe9eb/hrm/leaves", authMiddleware, async (c) => {
  try {
    const leaves = await kv.getByPrefix("hrm_leave_");
    // Sort by applied_date descending
    leaves.sort((a: any, b: any) => {
      return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime();
    });
    return c.json(leaves);
  } catch (error: any) {
    console.error("Error fetching leaves:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-8eebe9eb/hrm/leaves", authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const leave = {
      id,
      ...data,
      created_at: new Date().toISOString(),
    };
    await kv.set(`hrm_leave_${id}`, leave);
    return c.json(leave, 201);
  } catch (error: any) {
    console.error("Error creating leave application:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-8eebe9eb/hrm/leaves/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const existing = await kv.get(`hrm_leave_${id}`);
    
    if (!existing) {
      return c.json({ error: "Leave application not found" }, 404);
    }

    const updated = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`hrm_leave_${id}`, updated);
    return c.json(updated);
  } catch (error: any) {
    console.error("Error updating leave application:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Payroll
app.get("/make-server-8eebe9eb/hrm/payroll", authMiddleware, async (c) => {
  try {
    const month = c.req.query("month");
    const year = c.req.query("year");
    
    const payrolls = await kv.getByPrefix("hrm_payroll_");
    
    if (month && year) {
      const filtered = payrolls.filter((p: any) => 
        p.month === month && p.year === parseInt(year)
      );
      return c.json(filtered);
    }
    
    return c.json(payrolls);
  } catch (error: any) {
    console.error("Error fetching payroll:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-8eebe9eb/hrm/payroll", authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const payroll = {
      id,
      ...data,
      created_at: new Date().toISOString(),
    };
    await kv.set(`hrm_payroll_${id}`, payroll);
    return c.json(payroll, 201);
  } catch (error: any) {
    console.error("Error creating payroll:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-8eebe9eb/hrm/payroll/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const existing = await kv.get(`hrm_payroll_${id}`);
    
    if (!existing) {
      return c.json({ error: "Payroll record not found" }, 404);
    }

    const updated = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`hrm_payroll_${id}`, updated);
    return c.json(updated);
  } catch (error: any) {
    console.error("Error updating payroll:", error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);