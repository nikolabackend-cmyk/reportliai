"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { 
  ArrowUpRight, 
  Terminal, 
  Cpu, 
  Layers, 
  Activity, 
  Database, 
  AlertOctagon, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Play, 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  ExternalLink,
  Sliders,
  Filter,
  LogOut,
  Github,
  Trash2,
  Settings,
  User,
  Menu,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams, useRouter } from "next/navigation";

// --- Types ---
interface Application {
  id: string;
  name: string;
  apiKey: string;
  status: "inactive" | "Active";
  supabaseUrl: string;
  supabaseTable: string;
  createdAt: string;
}

interface ErrorLog {
  id: string;
  apiKey: string;
  errorName: string;
  errorMessage: string;
  stackTrace: string;
  severity: "warning" | "error" | "critical";
  context: Record<string, any>;
  timestamp: string;
  status: "unresolved" | "resolved";
  aiAnalysis?: string;
}

// --- Initial Mock Data ---
const INITIAL_APPS: Application[] = [
  {
    id: "app_1",
    name: "checkout-microservice",
    apiKey: "rep_live_738dfc9201a0e",
    status: "Active",
    supabaseUrl: "https://gkqmizswvhyxrt.supabase.co",
    supabaseTable: "checkout_exceptions_v1",
    createdAt: "2026-06-25T12:00:00Z"
  },
  {
    id: "app_2",
    name: "PIPELINE_STANDBY",
    apiKey: "rep_live_4b8f1c3d02e12",
    status: "Active",
    supabaseUrl: "https://gkqmizswvhyxrt.supabase.co",
    supabaseTable: "auth_errors",
    createdAt: "2026-06-26T01:15:00Z"
  }
];

const INITIAL_ERRORS: ErrorLog[] = [
  {
    id: "err_1",
    apiKey: "rep_live_738dfc9201a0e",
    errorName: "TypeError",
    errorMessage: "Cannot read properties of null (reading 'payment_intent_id')",
    stackTrace: `TypeError: Cannot read properties of null (reading 'payment_intent_id')\n    at processPayment (payment.ts:42:25)\n    at async handleWebhook (stripe.ts:89:12)\n    at async NextNodeServer.run (node_modules/next/dist/server/next-server.js:142:11)`,
    severity: "critical",
    context: { userId: "usr_992a831", amount: 14900, currency: "usd", paymentGateway: "stripe_v3" },
    timestamp: "2026-06-26T04:20:00-07:00",
    status: "unresolved",
    aiAnalysis: "🚨 CRITICAL: Checkout crashes for users — active revenue loss..."
  },
  {
    id: "err_2",
    apiKey: "rep_live_738dfc9201a0e",
    errorName: "PostgresError",
    errorMessage: "connection pool saturated (max 20 clients reached)",
    stackTrace: `PostgresError: connection pool saturated (max 20 clients reached)\n    at ConnectionPool.acquire (pool.ts:18:9)\n    at async Database.query (db.ts:153:20)\n    at async getUserSubscriptions (subscription.ts:12:35)`,
    severity: "error",
    context: { activeConnections: 20, pendingQueue: 48, timeoutMs: 5000 },
    timestamp: "2026-06-26T04:15:00-07:00",
    status: "unresolved"
  },
  {
    id: "err_3",
    apiKey: "rep_live_4b8f1c3d02e12",
    errorName: "AuthRateLimitException",
    errorMessage: "Too many login attempts",
    stackTrace: `AuthRateLimitException: Rate limit exceeded on route /api/auth/login\n    at RateLimiter.consume (limiter.ts:74:15)\n    at async POST (app/api/auth/login/route.ts:44:22)`,
    severity: "warning",
    context: { ip: "198.51.100.42", attemptsIn10m: 15, route: "/api/auth/login" },
    timestamp: "2026-06-26T04:05:00-07:00",
    status: "unresolved"
  }
];

const MOCK_DIAGNOSTICS: Record<string, string> = {
  err_1: `🚨 CRITICAL: Checkout crashes for users — active revenue loss

**What's happening right now**
Users are hitting a fatal error during payment
processing. Your checkout is broken and users
are leaving without paying.

**Who is losing you money**
Environment: Production
Browser: Chrome on iPhone iOS 17
Page: /checkout
First seen: June 23, 2026 10:23 AM
Times happened: 47 times in last hour

**Exactly where it broke**
File: checkout.jsx
Line: 142
Function: processPayment()

**Why it broke**
Stripe initialization fails when Apple Pay is
loaded outside a secure context. The
processPayment() function assumes Stripe is
always ready but it loads asynchronously.

**Fix it in 2 minutes**
\`\`\`javascript
// Before (broken)
const payment = await processPayment(cart)
// After (fixed)
if (!stripe) await loadStripe(process.env.STRIPE_KEY)
const payment = await processPayment(cart)
\`\`\`

**Business impact**
Every minute this is unfixed = lost revenue.
47 users already hit this — how many didn't
come back?

**Error details**
Severity: 🔴 Critical
Category: Payment Error
Error code: STRIPE_NOT_INITIALIZED
Stack trace below
\`\`\`
TypeError: Cannot read property 'createPayment'
of undefined
at processPayment (checkout.jsx:142:14)
at handleSubmit (checkout.jsx:89:22)
\`\`\`

Detected and analyzed by Reportli AI agent 🤖
Fixed in seconds. Not hours.`,

  err_2: `🚨 ERROR: Database connection pool saturated — service degradation

**What's happening right now**
The database has reached its maximum concurrent connection limit. New user sessions are hanging and timing out during database queries.

**Who is losing you money**
Environment: Production
Browser: Chrome on macOS 14.5
Page: /api/db/query
First seen: June 26, 2026 04:15 AM
Times happened: 124 times in last hour

**Exactly where it broke**
File: pool.ts
Line: 18
Function: ConnectionPool.acquire()

**Why it broke**
Database clients are not being released back into the pool after query execution. This leaks connections and saturates the pool under high traffic.

**Fix it in 2 minutes**
\`\`\`javascript
// Before (broken)
const client = await pool.connect();
const res = await client.query(sql);
return res;
// After (fixed)
const client = await pool.connect();
try {
  const res = await client.query(sql);
  return res;
} finally {
  client.release();
}
\`\`\`

**Business impact**
Unreleased resources halt background jobs.
Critical user actions like user creation and login are failing.

**Error details**
Severity: 🔴 Critical
Category: Database Connection Error
Error code: POSTGRES_POOL_SATURATED
Stack trace below
\`\`\`
PostgresError: connection pool saturated (max 20 clients reached)
at ConnectionPool.acquire (pool.ts:18:9)
at async Database.query (db.ts:153:20)
\`\`\`

Detected and analyzed by Reportli AI agent 🤖
Fixed in seconds. Not hours.`,

  err_3: `🚨 WARNING: Authentication rate limits hit — user login block

**What's happening right now**
Users are hitting persistent 429 rate limit errors when attempting to log in, likely caused by a rogue brute force attempt.

**Who is losing you money**
Environment: Production
Browser: Firefox on Windows 11
Page: /api/auth/login
First seen: June 26, 2026 04:05 AM
Times happened: 315 times in last hour

**Exactly where it broke**
File: limiter.ts
Line: 74
Function: RateLimiter.consume()

**Why it broke**
The rate limiting threshold is set too low for shared IP environments, causing legitimate users from the same subnet to be locked out during peak hours.

**Fix it in 2 minutes**
\`\`\`javascript
// Before (broken)
const rateLimit = await getRateLimiter({ points: 5, duration: 600 });
// After (fixed)
const rateLimit = await getRateLimiter({ points: 30, duration: 600, blockDuration: 300 });
\`\`\`

**Business impact**
Legitimate users cannot log in to access their dashboards, leading to support tickets and reduced retention.

**Error details**
Severity: 🟡 Warning
Category: Authentication Rate Limit
Error code: RATE_LIMIT_EXCEEDED
Stack trace below
\`\`\`
AuthRateLimitException: Rate limit exceeded on route /api/auth/login
at RateLimiter.consume (limiter.ts:74:15)
at async POST (app/api/auth/login/route.ts:44:22)
\`\`\`

Detected and analyzed by Reportli AI agent 🤖
Fixed in seconds. Not hours.`
};

export default function ReportliDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center font-mono text-white">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'default' | 'privacy' | 'terms' | 'refund' | 'contact' | 'how-it-works' | 'pricing'>('default');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Handle deep linking via search params
  useEffect(() => {
    const view = searchParams.get('v');
    const targetView = (view === 'privacy' || view === 'terms' || view === 'refund' || view === 'contact' || view === 'how-it-works' || view === 'pricing') 
      ? view as any 
      : 'default';
    
    if (activeView !== targetView) {
      setTimeout(() => setActiveView(targetView), 0);
    }
  }, [searchParams, activeView]);

  const updateView = (view: 'default' | 'privacy' | 'terms' | 'refund' | 'contact' | 'how-it-works' | 'pricing') => {
    setActiveView(view);
    setIsSidebarOpen(false);
    if (view === 'default') {
      router.push('/');
    } else {
      router.push(`/?v=${view}`);
    }
  };
  
  // --- Component State ---
  const [apps, setApps] = useState<Application[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);

  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>("err_1");
  
  // Profile & Plan State
  const [profile, setProfile] = useState<any>(null);
  const [loadingApps, setLoadingApps] = useState<boolean>(true);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiErrorMsg, setAiErrorMsg] = useState<string>("");
  const [retryCounter, setRetryCounter] = useState<number>(0);
  const apiKeysRef = useRef<string[]>([]);

  // Update apiKeysRef whenever apps change
  useEffect(() => {
    apiKeysRef.current = apps.map(a => a.apiKey);
  }, [apps]);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // App Creation Form
  const [newAppName, setNewAppName] = useState<string>("");
  const [isCreatingApp, setIsCreatingApp] = useState<boolean>(false);

  // Supabase Configuration/Sync Simulation
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [supabaseTable, setSupabaseTable] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);


  // Copy states
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  // Connection verification state
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Deletion States
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // --- Sync with LocalStorage ---
  useEffect(() => {
    localStorage.setItem("reportli_apps", JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem("reportli_errors", JSON.stringify(errors));
  }, [errors]);

  // Automatically select another app if current active app gets deleted or is invalid
  useEffect(() => {
    if (apps.length > 0) {
      const exists = apps.some(a => a.id === selectedAppId);
      if (!exists) {
        Promise.resolve().then(() => {
          setSelectedAppId(apps[0].id);
          setSupabaseUrl(apps[0].supabaseUrl || "");
          setSupabaseTable(apps[0].supabaseTable || "");
        });
      }
    } else {
      if (selectedAppId !== "") {
        Promise.resolve().then(() => {
          setSelectedAppId("");
          setSupabaseUrl("");
          setSupabaseTable("");
        });
      }
    }
  }, [apps, selectedAppId]);

  const handleDeleteApp = async (appId: string) => {
    if (!appToDelete) return;
    setIsDeleting(true);
    
    try {
      // 1. Remove from local state
      setApps(prev => prev.filter(a => a.id !== appId));
      setErrors(prev => prev.filter(e => e.apiKey !== appToDelete.apiKey));
      
      // 2. Remove from Supabase if logged in
      if (user) {
        const response = await fetch("/api/supabase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete_app",
            id: appId,
            apiKey: appToDelete.apiKey
          })
        });
        if (!response.ok) {
          const resData = await response.json();
          console.error("Error deleting application from Supabase:", resData.error);
        }
      }
      
      setAppToDelete(null);
    } catch (err) {
      console.error("Failed to delete application:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Live Supabase Synchronization ---
  useEffect(() => {
    if (!user) return;

    const syncWithSupabase = async () => {
      try {
        // Fetch Apps and Errors
        const response = await fetch(`/api/supabase?action=get_data&userId=${user.uid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data from secure Supabase API");
        }
        const data = await response.json();
        const { apps: dbApps, errors: dbErrors } = data;

        setApps(dbApps || []);
        setErrors(dbErrors || []);
        
        if (dbApps && dbApps.length > 0) {
          if (!selectedAppId || !dbApps.find((a: any) => a.id === selectedAppId)) {
            setSelectedAppId(dbApps[0].id);
          }
        } else {
          setSelectedAppId("");
        }

        // Fetch Profile for Plan Details
        const profileRes = await fetch(`/api/supabase?action=get_user&userId=${user.uid}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.user);
        }
      } catch (err) {
        console.warn("Supabase sync failed or skip because keys aren't set:", err);
      } finally {
        setLoadingApps(false);
      }
    };

    syncWithSupabase();

    // Set up safe server-side polling to fetch updates without needing client-side anon key
    const interval = setInterval(syncWithSupabase, 8000);

    return () => {
      clearInterval(interval);
    };
  }, [user, selectedAppId]);

  // Derive active app and active error logs dynamically during render
  const activeApp = apps.find(a => a.id === selectedAppId);
  const appErrors = activeApp ? errors.filter(e => e.apiKey === activeApp.apiKey) : [];
  const selectedError = appErrors.find(e => e.id === selectedErrorId) || appErrors[0] || null;

  // Run AI analysis when selectedError changes
  useEffect(() => {
    let active = true;

    if (!selectedError) {
      Promise.resolve().then(() => {
        if (active) {
          setAiAnalysis("");
          setAiErrorMsg("");
        }
      });
      return;
    }

    const fetchDiagnosis = async () => {
      setIsAiLoading(true);
      setAiErrorMsg("");
      setAiAnalysis("");

      if (selectedError.aiAnalysis) {
        setAiAnalysis(selectedError.aiAnalysis);
        setIsAiLoading(false);
        return;
      }

      // If we have a handcrafted high-fidelity mockup for this error, let's load it instantly!
      // This is fast, responsive, matches user specification perfectly, and works offline.
      if (selectedError.id && MOCK_DIAGNOSTICS[selectedError.id]) {
        setTimeout(async () => {
          if (active) {
            const mockText = MOCK_DIAGNOSTICS[selectedError.id];
            setAiAnalysis(mockText);
            setIsAiLoading(false);
            setErrors(prev => prev.map(e => e.id === selectedError.id ? { ...e, aiAnalysis: mockText } : e));

            if (user) {
              try {
                const res = await fetch("/api/supabase", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "update_error_ai",
                    id: selectedError.id,
                    aiAnalysis: mockText
                  })
                });
                if (!res.ok) {
                  const resData = await res.json();
                  console.error("Failed to persist mockup AI analysis to Supabase:", resData.error);
                }
              } catch (err) {
                console.error("Failed to persist mockup AI analysis to Supabase:", err);
              }
            }
          }
        }, 300); // Small realistic telemetry compiling delay
        return;
      }

      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            errorName: selectedError.errorName,
            errorMessage: selectedError.errorMessage,
            stackTrace: selectedError.stackTrace,
            severity: selectedError.severity,
            context: selectedError.context
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to trigger AI diagnosis");
        }

        const data = await response.json();
        if (active) {
          setAiAnalysis(data.text);
          setErrors(prev => prev.map(e => e.id === selectedError.id ? { ...e, aiAnalysis: data.text } : e));

          if (user) {
            try {
              const res = await fetch("/api/supabase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "update_error_ai",
                  id: selectedError.id,
                  aiAnalysis: data.text
                })
              });
              if (!res.ok) {
                const resData = await res.json();
                console.error("Failed to persist AI analysis to Supabase:", resData.error);
              }
            } catch (err) {
              console.error("Failed to persist AI analysis to Supabase:", err);
            }
          }
        }
      } catch (e: any) {
        if (active) {
          setAiErrorMsg(e.message || "Unable to contact Gemini AI diagnostic engines. Please declare GEMINI_API_KEY inside secrets panel.");
        }
      } finally {
        if (active) {
          setIsAiLoading(false);
        }
      }
    };

    fetchDiagnosis();

    return () => {
      active = false;
    };
  }, [selectedError, retryCounter, user]);

  // --- Helper Methods ---
  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    // Plan-based limits: Free = 1, Premium = 15
    const limit = (profile?.plan === "Premium" || profile?.plan === "premium") ? 15 : 1;
    if (apps.length >= limit) {
      if (profile?.plan !== "Premium" && profile?.plan !== "premium") {
        router.push("/settings#subscription-status");
      } else {
        alert(`You have reached the limit of ${limit} application${limit > 1 ? 's' : ''} for your current plan.`);
      }
      return;
    }

    const formattedName = newAppName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");

    const prefix = "rep_live_";
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 40 - prefix.length; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generatedApiKey = prefix + randomPart;

    const newApp: Application = {
      id: "app_" + Math.random().toString(36).substring(2, 9),
      name: formattedName,
      apiKey: generatedApiKey,
      status: "inactive",
      supabaseUrl: "",
      supabaseTable: "",
      createdAt: new Date().toISOString()
    };

    setApps([...apps, newApp]);
    setSelectedAppId(newApp.id);
    setNewAppName("");
    setIsCreatingApp(false);

    // Persist new app to Supabase if user is logged in
    if (user) {
      try {
        const response = await fetch("/api/supabase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_app",
            id: newApp.id,
            name: newApp.name,
            apiKey: newApp.apiKey,
            status: newApp.status,
            supabaseUrl: newApp.supabaseUrl,
            supabaseTable: newApp.supabaseTable,
            userId: user.uid,
            createdAt: newApp.createdAt
          })
        });
        if (!response.ok) {
          const resData = await response.json();
          console.error("Failed to insert new application into Supabase:", resData.error);
        }
      } catch (err) {
        console.error("Failed to insert new application into Supabase:", err);
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAppId(id);
    setTimeout(() => setCopiedAppId(null), 2000);
  };

  // Connect / Sync Supabase simulator
  const handleSupabaseSync = (appId: string) => {
    if (!supabaseUrl.trim() || !supabaseTable.trim()) {
      alert("Please enter a valid Supabase URL and Table name.");
      return;
    }

    setIsSyncing(true);
    setSyncLogs([]);

    const logs = [
      `[info] initializing connection to supabase instance: ${supabaseUrl}...`,
      `[info] checking table schemas for '${supabaseTable}'...`,
      `[info] establishing real-time error ingestion webhooks...`,
      `[success] connection established. status updated: ACTIVE.`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(async () => {
      if (currentLogIndex < logs.length) {
        setSyncLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsSyncing(false);
        
        // Update app status to active
        setApps(apps.map(app => {
          if (app.id === appId) {
            return {
              ...app,
              status: "Active",
              supabaseUrl,
              supabaseTable
            };
          }
          return app;
        }));

        // Persist update to Supabase if user is logged in
        if (user) {
          try {
            const response = await fetch("/api/supabase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update_app",
                id: appId,
                status: "Active",
                supabaseUrl,
                supabaseTable
              })
            });
            if (!response.ok) {
              const resData = await response.json();
              console.error("Failed to update app configuration in Supabase:", resData.error);
            }
          } catch (err) {
            console.error("Failed to update app configuration in Supabase:", err);
          }
        }

        // Inject simulated Supabase errors for the newly activated app
        const newAppObj = apps.find(a => a.id === appId);
        if (newAppObj) {
          const simulatedSupabaseErrors: ErrorLog[] = [
            {
              id: "err_sb_1",
              apiKey: newAppObj.apiKey,
              errorName: "DatabaseConstraintError",
              errorMessage: "violates foreign key constraint \"fk_user_profile\"",
              stackTrace: `DatabaseConstraintError: violates foreign key constraint "fk_user_profile" on table "orders"\n    at PostgresDriver.execute (db/postgres.ts:14:10)\n    at async createOrder (services/order.ts:55:12)\n    at async POST (app/api/checkout/route.ts:22:9)`,
              severity: "critical",
              context: { userId: "usr_null_or_invalid", table: "orders", constraint: "fk_user_profile" },
              timestamp: new Date(Date.now() - 30000).toISOString(),
              status: "unresolved"
            },
            {
              id: "err_sb_2",
              apiKey: newAppObj.apiKey,
              errorName: "SupabaseAuthException",
              errorMessage: "JWT signature is invalid or expired",
              stackTrace: `SupabaseAuthException: JWT signature is invalid or expired\n    at SupabaseClient.getUser (node_modules/@supabase/supabase-js/dist/main/SupabaseClient.js:24:18)\n    at async authenticate (middleware.ts:18:24)`,
              severity: "error",
              context: { authHeader: "Bearer eyJhbGciOi...", ip: "203.0.113.195" },
              timestamp: new Date(Date.now() - 120000).toISOString(),
              status: "unresolved"
            }
          ];

          setErrors(prev => [...simulatedSupabaseErrors, ...prev]);

          // Save the simulated errors to Supabase too if logged in
          if (user) {
            try {
              const response = await fetch("/api/supabase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "insert_errors",
                  errors: simulatedSupabaseErrors
                })
              });
              if (!response.ok) {
                const resData = await response.json();
                console.error("Failed to save simulated errors to Supabase:", resData.error);
              }
            } catch (err) {
              console.error("Failed to save simulated errors to Supabase:", err);
            }
          }
        }
      }
    }, 800);
  };

  const handleCheckConnection = async (appId: string, apiKey: string) => {
    setIsCheckingConnection(true);
    setConnectionMessage(null);
    
    try {
      // 1. Fetch errors for this apiKey from our server api
      const response = await fetch(`/api/report-error?apiKey=${apiKey}`);
      if (!response.ok) {
        throw new Error("Failed to contact the connection verification server");
      }
      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        // Yes! We have received events for this API key.
        setConnectionMessage({
          text: "Success! We detected incoming telemetry events. Application is now connected.",
          type: "success"
        });
        
        // Update app status to Active in local state
        setApps(prev => prev.map(app => {
          if (app.id === appId) {
            return { ...app, status: "Active" };
          }
          return app;
        }));
        
        // Also update in Supabase if logged in
        if (user) {
          await fetch("/api/supabase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update_app",
              id: appId,
              status: "Active",
              supabaseUrl: activeApp?.supabaseUrl || "",
              supabaseTable: activeApp?.supabaseTable || ""
            })
          });
          
          // Re-fetch data from supabase to refresh full list
          const getRes = await fetch(`/api/supabase?action=get_data&userId=${user.uid}`);
          if (getRes.ok) {
            const getData = await getRes.json();
            if (getData.errors) {
              setErrors(getData.errors);
            }
          }
        } else {
          // If not logged in, add those errors to local errors state
          setErrors(prev => [...data.errors, ...prev.filter(e => e.apiKey !== apiKey)]);
        }
      } else {
        // No errors found
        setConnectionMessage({
          text: "No telemetry events detected yet. Make sure your application has initialized the SDK and triggered an error.",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error("Check connection failed:", err);
      setConnectionMessage({
        text: err.message || "An error occurred while checking connection.",
        type: "error"
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };



  // Filter errors
  const filteredErrors = errors
    .filter(err => err.apiKey === activeApp?.apiKey)
    .filter(err => {
      if (severityFilter !== "all" && err.severity !== severityFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          (err.errorName || "").toLowerCase().includes(query) ||
          (err.errorMessage || "").toLowerCase().includes(query) ||
          (err.stackTrace || "").toLowerCase().includes(query)
        );
      }
      return true;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#ffd700] animate-spin" />
          <span className="text-[10px] tracking-[0.2em] text-[#888888] uppercase">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden font-body text-foreground">
        {/* Fullscreen Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
        </video>
        
        {/* Navigation Bar */}
        <nav className="relative z-10 flex flex-row justify-between items-center px-8 py-6 max-w-7xl mx-auto">
          <div className="text-3xl tracking-tight font-display text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
            reportli ai
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-foreground hover:text-[#ffd700] transition-colors cursor-pointer"
          >
            <Menu className="w-8 h-8" />
          </button>
        </nav>

        {/* Sidebar Menu */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] cursor-pointer"
              />
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-80 bg-black border-l border-[#333] z-[110] p-8 flex flex-col"
              >
                <div className="flex justify-end mb-12">
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-foreground hover:text-[#ffd700] transition-colors cursor-pointer"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
                <div className="flex flex-col gap-8">
                  <span 
                    onClick={() => updateView('default')}
                    className="text-3xl font-display text-foreground hover:text-[#ffd700] cursor-pointer transition-colors" 
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Home
                  </span>
                  <span 
                    onClick={() => updateView('how-it-works')}
                    className="text-3xl font-display text-foreground hover:text-[#ffd700] cursor-pointer transition-colors" 
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    How it works
                  </span>
                  <span 
                    onClick={() => updateView('pricing')}
                    className="text-3xl font-display text-foreground hover:text-[#ffd700] cursor-pointer transition-colors" 
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Pricing
                  </span>
                </div>

                <div className="mt-12 flex flex-wrap gap-x-4 gap-y-2">
                  <button onClick={() => updateView('privacy')} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Privacy Policy</button>
                  <button onClick={() => updateView('terms')} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Terms of Service</button>
                  <button onClick={() => updateView('refund')} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Refund Policy</button>
                  <button onClick={() => updateView('contact')} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Contact Us</button>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => {
                      setIsSidebarOpen(false);
                      signInWithGoogle();
                    }}
                    className="w-full liquid-glass rounded-full py-4 text-[#ffd700] font-bold tracking-widest uppercase text-xs border border-[#ffd700]/30 hover:bg-[#ffd700]/10 transition-all cursor-pointer"
                  >
                    Start for free
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 py-[90px] min-h-[calc(100vh-100px)]">
          {activeView === 'default' ? (
            <>
              <h1 
                className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal animate-fade-rise"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Making SaaS <em className="not-italic text-[#ffd700]">Monitoring</em> <br />
                F*cking <em className="not-italic text-muted-foreground">Easy.</em>
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
                Your AI agent that never misses a bug. <br className="hidden sm:block" />
                Monitors your SaaS 24/7, catches every error instantly, and helps you fix issues before they impact your users.
              </p>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl text-left"
            >
              <h2 className="text-4xl font-display text-white mb-8" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {activeView === 'privacy' && 'Privacy Policy'}
                {activeView === 'terms' && 'Terms of Service'}
                {activeView === 'refund' && 'Refund Policy'}
                {activeView === 'contact' && 'Contact Us'}
                {activeView === 'how-it-works' && 'How it works'}
                {activeView === 'pricing' && 'Pricing Plans'}
              </h2>
              <div className="text-muted-foreground space-y-6 text-sm sm:text-base leading-relaxed overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                {activeView === 'privacy' && (
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-widest text-white/50">Effective Date: July 5, 2026</p>
                    <p>Welcome to Reportli AI (&quot;Reportli AI,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website and services.</p>
                    <div className="space-y-1">
                      <p>Website: reportliai.sbs</p>
                      <p>Support Email: reportlihelp@gmail.com</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">1. Information We Collect</h3>
                      <p>When you use Reportli AI, we may collect the following information:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Name and email address provided through Firebase Authentication.</li>
                        <li>Account information required to create and manage your account.</li>
                        <li>Technical information such as browser type, operating system, IP address, and device information.</li>
                        <li>Information you voluntarily provide when contacting support.</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">2. How We Use Your Information</h3>
                      <p>We use your information to:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Create and manage your account.</li>
                        <li>Authenticate users securely.</li>
                        <li>Provide, maintain, and improve our services.</li>
                        <li>Respond to support requests.</li>
                        <li>Detect, prevent, and investigate security issues or misuse.</li>
                        <li>Comply with applicable legal obligations.</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">3. Third-Party Services</h3>
                      <p>We use trusted third-party service providers to operate our service:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Firebase Authentication for secure user authentication.</li>
                        <li>Supabase for database and backend services.</li>
                      </ul>
                      <p>These providers may process your information in accordance with their own privacy policies.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">4. Data Security</h3>
                      <p>We take reasonable technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction. However, no method of transmitting or storing data over the Internet is completely secure.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">5. Data Retention</h3>
                      <p>We retain your information only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">6. Your Rights</h3>
                      <p>Depending on your location and applicable law, you may have the right to:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Access your personal information.</li>
                        <li>Request correction of inaccurate information.</li>
                        <li>Request deletion of your account and personal information.</li>
                        <li>Contact us regarding the processing of your data.</li>
                      </ul>
                      <p>To exercise these rights, contact us at reportlihelp@gmail.com.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">7. Children&apos;s Privacy</h3>
                      <p>Reportli AI is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">8. International Data Transfers</h3>
                      <p>Your information may be processed or stored in countries other than your own through our service providers. We take reasonable steps to ensure appropriate protection of your information.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">9. Changes to This Privacy Policy</h3>
                      <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated Effective Date.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">10. Contact Us</h3>
                      <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us:</p>
                      <p>Reportli AI<br />Website: reportliai.sbs<br />Email: reportlihelp@gmail.com</p>
                    </div>
                  </div>
                )}
                {activeView === 'terms' && (
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-widest text-white/50">Effective Date: July 5, 2026</p>
                    <p>Welcome to Reportli AI. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Reportli AI website and services.</p>
                    <div className="space-y-1">
                      <p>Website: reportliai.sbs</p>
                      <p>Support Email: reportlihelp@gmail.com</p>
                    </div>
                    <p>By accessing or using Reportli AI, you agree to be bound by these Terms. If you do not agree, please do not use our services.</p>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">1. Eligibility</h3>
                      <p>You must be at least 13 years old and legally capable of entering into a binding agreement to use Reportli AI.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">2. Account Registration</h3>
                      <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate and up-to-date information.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">3. Our Services</h3>
                      <p>Reportli AI provides software and related services to help users monitor and manage application information. Features may change, be improved, or be discontinued at any time.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">4. Acceptable Use</h3>
                      <p>You agree not to:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Use the service for any unlawful purpose.</li>
                        <li>Attempt to gain unauthorized access to our systems.</li>
                        <li>Disrupt or interfere with the operation or security of the service.</li>
                        <li>Upload or distribute malicious software.</li>
                        <li>Use the service to violate the rights of others.</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">5. Intellectual Property</h3>
                      <p>All content, software, branding, logos, and materials provided through Reportli AI are owned by or licensed to Reportli AI and are protected by applicable intellectual property laws.</p>
                      <p>You may not copy, modify, distribute, reverse engineer, or create derivative works from our services unless permitted by law or with our written permission.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">6. User Content</h3>
                      <p>You retain ownership of any content or information you submit through the service. You grant Reportli AI a limited license to process that information solely to provide the service.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">7. Service Availability</h3>
                      <p>We strive to keep the service available but do not guarantee uninterrupted or error-free operation. We may perform maintenance, updates, or changes without prior notice.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">8. Account Suspension and Termination</h3>
                      <p>We may suspend or terminate your account if you violate these Terms, misuse the service, or engage in fraudulent or unlawful activity.</p>
                      <p>You may stop using the service at any time.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">9. Disclaimer of Warranties</h3>
                      <p>Reportli AI is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">10. Limitation of Liability</h3>
                      <p>To the maximum extent permitted by law, reportli ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.</p>
                      <p>Our total liability for any claim relating to the service shall not exceed the amount you paid to Reportli AI during the twelve (12) months preceding the claim.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">11. Privacy</h3>
                      <p>Your use of Reportli AI is also governed by our Privacy Policy.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">12. Changes to the Terms</h3>
                      <p>We may update these Terms from time to time. Updated Terms will become effective when posted on our website. Continued use of the service constitutes acceptance of the revised Terms.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">13. Governing Law</h3>
                      <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">14. Contact Us</h3>
                      <p>If you have any questions regarding these Terms, please contact us:</p>
                      <p>Reportli AI<br />Website: reportliai.sbs<br />Email: reportlihelp@gmail.com</p>
                    </div>
                  </div>
                )}
                {activeView === 'refund' && (
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-widest text-white/50">Effective Date: July 5, 2026</p>
                    <p>Thank you for choosing Reportli AI.</p>
                    <p>This Refund Policy explains when refunds are available for purchases made through Reportli AI.</p>
                    <div className="space-y-1">
                      <p>Website: reportliai.sbs</p>
                      <p>Support Email: reportlihelp@gmail.com</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">1. 7-Day Refund Period</h3>
                      <p>Customers may request a refund within 7 calendar days of the original purchase.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">2. Eligibility for Refunds</h3>
                      <p>A refund may be approved if:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>The purchase was made by accident.</li>
                        <li>The service has not been used or only minimal use has occurred, as determined by Reportli AI.</li>
                      </ul>
                      <p>Refund requests are reviewed individually. We reserve the right to verify account activity before approving a refund.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">3. Non-Refundable Cases</h3>
                      <p>Refunds will generally not be provided if:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>The service has been substantially used.</li>
                        <li>The request is made more than 7 days after the purchase.</li>
                        <li>The purchase violates our Terms of Service or involves fraud or abuse.</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">4. How to Request a Refund</h3>
                      <p>To request a refund, contact us at: reportlihelp@gmail.com</p>
                      <p>Please include:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Your account email address.</li>
                        <li>The reason for your refund request.</li>
                        <li>Any relevant purchase information.</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">5. Processing Time</h3>
                      <p>If your refund is approved, it will be processed using the original payment method. Processing times may vary depending on your payment provider.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">6. Changes to This Policy</h3>
                      <p>We may update this Refund Policy from time to time. Any changes will be posted on this page with an updated Effective Date.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">7. Contact Us</h3>
                      <p>If you have any questions about this Refund Policy, please contact us:</p>
                      <p>Reportli AI<br />Website: reportliai.sbs<br />Email: reportlihelp@gmail.com</p>
                    </div>
                  </div>
                )}
                {activeView === 'contact' && (
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-widest text-white/50">Effective Date: July 5, 2026</p>
                    <p>We&apos;re here to help. If you have any questions, feedback, or need assistance with Reportli AI, please contact us using the information below.</p>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">Customer Support</h3>
                      <p>Email: reportlihelp@gmail.com</p>
                      <p>Website: reportliai.sbs</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">Support Requests</h3>
                      <p>You can contact us regarding:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>General inquiries</li>
                        <li>Technical support</li>
                        <li>Account-related questions</li>
                        <li>Billing and subscription inquiries</li>
                        <li>Refund requests</li>
                        <li>Privacy concerns</li>
                        <li>Bug reports and feature suggestions</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-bold">Response Time</h3>
                      <p>We aim to respond to all support requests as quickly as possible. Response times may vary depending on the volume of inquiries.</p>
                    </div>
                    <p>Thank you for using Reportli AI. We appreciate your feedback and are committed to providing the best possible support.</p>
                  </div>
                )}

                {activeView === 'how-it-works' && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-white text-xl font-bold flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ffd700] text-black text-sm">1</span>
                        Connect Your SaaS
                      </h3>
                      <p>Add your application to Reportli AI and integrate the SDK in just a few minutes.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white text-xl font-bold flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ffd700] text-black text-sm">2</span>
                        Monitor Every Error
                      </h3>
                      <p>Reportli AI automatically captures runtime errors, crashes, and exceptions from your application in real time.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white text-xl font-bold flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ffd700] text-black text-sm">3</span>
                        Get an AI Analysis
                      </h3>
                      <p>Every detected error is analyzed by AI, giving you a clear explanation of what happened and suggestions for how to fix it.</p>
                    </div>
                  </div>
                )}

                {activeView === 'pricing' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 pb-12">
                    {/* Free Plan */}
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ffd700]/30 transition-colors">
                      <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                      <p className="text-muted-foreground mb-6">Perfect for trying Reportli AI.</p>
                      <div className="text-4xl font-bold text-white mb-8">$0</div>
                      <ul className="space-y-4 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          Monitor one application
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          Real-time error tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          Community support
                        </li>
                      </ul>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-8 rounded-2xl bg-white/5 border border-[#ffd700]/50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-[#ffd700] text-black text-[10px] font-bold px-3 py-1 uppercase tracking-tighter rounded-bl-lg">Most Popular</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                      <p className="text-muted-foreground mb-6">Built for growing SaaS products.</p>
                      <div className="text-4xl font-bold text-white mb-8">$9.99 <span className="text-lg font-normal text-muted-foreground">/ month</span></div>
                      <ul className="space-y-4 text-sm">
                        <li className="flex items-center gap-2 font-bold text-white">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          Everything in Free
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          Unlimited AI error reports
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          15 Applications
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          Priority processing
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          Email support
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          {(profile?.plan === "Premium" || profile?.plan === "premium") ? "Premium Subscription Active" : "7-day free trial"}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => updateView('default')}
                className="mt-8 text-[#ffd700] text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:translate-x-1 transition-transform cursor-pointer"
              >
                ← Back to Home
              </button>
            </motion.div>
          )}
          
          <button 
            onClick={signInWithGoogle}
            className="liquid-glass rounded-full px-14 py-5 text-base text-[#ffd700] border border-[#ffd700]/30 mt-12 hover:scale-[1.03] cursor-pointer animate-fade-rise-delay-2 transition-transform font-bold tracking-wide"
          >
            Start for free
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col font-mono overflow-x-hidden select-none">
      {/* 1. Aesthetics Overlay */}
      {/* Subtle Dark Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
      {/* Subtle Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none opacity-40 z-0" style={{ background: "radial-gradient(circle at 50% 0%, #333 0%, transparent 70%)" }}></div>

      {/* 2. Top Navigation Header */}
      <header className="relative z-30 flex items-center justify-between px-8 py-6 border-b border-[#333] bg-[#000000]/60 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold tracking-tighter text-white">reportli ai</h1>
          <nav className="hidden md:flex gap-6">
            <span className="text-[10px] tracking-[0.2em] text-[#ffd700] font-bold cursor-pointer">DASHBOARD</span>
            <span className="text-[10px] tracking-[0.2em] text-white font-bold cursor-pointer">APPLICATIONS</span>
            <span className="text-[10px] tracking-[0.2em] text-[#888888] font-bold cursor-pointer hover:text-white transition-colors">DOCUMENTATION</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 relative z-[100]">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              className="w-9 h-9 bg-white text-black flex items-center justify-center text-sm font-bold overflow-hidden rounded-full border-2 border-[#333] cursor-pointer hover:border-[#ffd700] transition-all"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" />
              ) : (
                user.displayName?.substring(0, 2).toUpperCase() || "U"
              )}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[110]" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 top-12 w-56 bg-[#161616] border border-[#333] rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[120] overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-[#333] bg-[#000000]">
                      <div className="text-[10px] text-[#888888] font-bold uppercase tracking-[0.15em] mb-1">Authenticated Identity</div>
                      <div className="text-[12px] text-white font-bold truncate">{user.displayName || "System Agent"}</div>
                      <div className="text-[9px] text-[#555] font-mono mt-0.5 truncate">{user.email}</div>
                    </div>
                    
                    <div className="p-1.5">
                      <Link 
                        href="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-neutral-300 font-bold hover:bg-[#222] hover:text-[#ffd700] transition-all rounded-sm cursor-pointer text-left uppercase tracking-wider"
                      >
                        <Settings className="w-4 h-4" />
                        Settings Profile
                      </Link>
                      
                      <div className="my-1 border-t border-[#333]/50"></div>

                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-red-500 font-bold hover:bg-red-500/10 transition-all rounded-sm cursor-pointer text-left uppercase tracking-wider"
                      >
                        <LogOut className="w-4 h-4" />
                        Terminate Session
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* 3. Main Dashboard Workspace (12-column Grid) */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-1 p-1 bg-[#1a1a1a]">
        {/* ================= COLUMN 1: SIDEBAR (col-span-12 lg:col-span-3) ================= */}
        <aside className="col-span-12 lg:col-span-3 bg-[#000000] flex flex-col p-6 border border-[#2d2d2d] lg:border-none">
          <div className="text-[10px] tracking-[0.2em] text-[#888888] mb-4 uppercase font-bold">ACTIVE INSTANCES</div>
          
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {apps.length === 0 ? (
              <div className="py-8 px-4 border border-dashed border-[#2d2d2d] rounded flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center border border-[#2d2d2d]">
                  <Plus className="w-5 h-5 text-[#ffd700]" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white font-bold uppercase tracking-widest">Connect First App</p>
                  <p className="text-[9px] text-[#555] font-mono leading-relaxed uppercase">No active instances found. Create your first application below.</p>
                </div>
              </div>
            ) : apps.map((app) => {
              const isSelected = app.id === selectedAppId;
              const isActive = app.status === "Active";
              
              return (
                <div
                  key={app.id}
                  className={`w-full flex items-center justify-between p-3 border transition-all rounded-[4px] relative group/item ${
                    isSelected 
                      ? "bg-[#161616] border-[#ffd700]/50" 
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setSupabaseUrl(app.supabaseUrl || "");
                      setSupabaseTable(app.supabaseTable || "");
                    }}
                    className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer focus:outline-none"
                  >
                    <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                      {app.name}
                      {isSelected && <ArrowUpRight className="w-3.5 h-3.5 text-[#ffd700]" />}
                    </span>
                    <span className="text-[9px] font-mono text-[#888888] block truncate max-w-[150px]">
                      {app.apiKey.substring(0, 14)}...
                    </span>
                  </button>
                  
                  <div className="flex items-center gap-2 relative z-10">
                    <span className={`text-[9px] px-1.5 py-0.5 border font-bold rounded-[2px] ${
                      isActive 
                        ? "bg-green-500/20 text-green-500 border-green-500/40" 
                        : "bg-[#333] text-[#888888] border-[#444]"
                    }`}>
                      {isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAppToDelete(app);
                      }}
                      className="p-1 hover:bg-red-500/10 border border-[#333] hover:border-red-500/30 rounded text-red-400 hover:text-red-500 transition-all cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Create new application button/form */}
          <div className="mt-6 pt-4 border-t border-[#262626]">
            {!isCreatingApp ? (
              <button
                onClick={() => setIsCreatingApp(true)}
                className="w-full py-3 border border-dashed border-[#888888] text-[#888888] text-xs hover:bg-[#161616] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                + create new application
              </button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateApp}
                className="flex flex-col gap-2.5 bg-[#161616] p-3 rounded border border-[#333]"
              >
                <span className="text-[9px] text-[#888888] uppercase tracking-wider font-bold">application name:</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. billing-notifier"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full bg-[#000000] border border-[#333] text-white text-xs p-2 rounded-[4px] font-mono focus:outline-none focus:border-[#ffd700]"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase py-1.5 rounded-[4px] cursor-pointer"
                  >
                    provision
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingApp(false)}
                    className="px-3 border border-[#333] hover:border-red-500 text-[#888888] hover:text-red-400 text-[10px] uppercase py-1.5 rounded-[4px] cursor-pointer"
                  >
                    cancel
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </aside>

        {/* ================= COLUMN 2: PRIMARY VIEWPORT ================= */}
        <section className={`col-span-12 ${activeApp && activeApp.status !== "Active" ? "lg:col-span-9" : (apps.length > 0 ? "lg:col-span-7" : "lg:col-span-9")} flex flex-col gap-1`}>
          
          {activeApp && activeApp.status !== "Active" ? (
            /* Connection Guide checklist */
            <div className="bg-[#161616] p-8 rounded-[4px] border border-[#222] flex flex-col flex-1 gap-6 text-white min-h-[500px]">
              <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight uppercase font-mono text-[#ffd700]">Connect Your Application</h2>
                  <p className="text-[10px] text-[#888888] mt-1 uppercase tracking-wider">
                    Follow the checklist below to integrate Reportli and activate your pipeline
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#ff3b30]/10 border border-[#ff3b30]/20 px-2.5 py-1 rounded-[2px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold tracking-wider uppercase text-red-400">INACTIVE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Steps 1 & 2 */}
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[10px] font-bold font-mono">
                        1
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Step 1 — Install the SDK</h3>
                    </div>
                    <div className="bg-[#000000] p-3 rounded border border-[#333] flex items-center justify-between font-mono text-[11px] text-neutral-300">
                      <span>npm install reportli</span>
                      <button
                        onClick={() => handleCopy("npm install reportli", "install_cmd")}
                        className="text-[#888888] hover:text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {copiedAppId === "install_cmd" ? <span className="text-green-500">COPIED</span> : "COPY"}
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[10px] font-bold font-mono">
                        2
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Step 2 — Initialize Reportli</h3>
                    </div>
                    <div className="relative bg-[#000000] p-3 rounded border border-[#333] font-mono text-[10px] text-neutral-300 leading-relaxed whitespace-pre select-all">
                      {`import { Reportli } from "reportli";\n\nReportli.init({\n  apiKey: "${activeApp.apiKey}",\n});`}
                      <button
                        onClick={() => handleCopy(`import { Reportli } from "reportli";\n\nReportli.init({\n  apiKey: "${activeApp.apiKey}",\n});`, "init_code")}
                        className="absolute top-3 right-3 text-[#888888] hover:text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {copiedAppId === "init_code" ? <span className="text-green-500">COPIED</span> : "COPY"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side: Steps 3 & 4 */}
                <div className="space-y-6 flex flex-col justify-between">
                  <div>
                    {/* Step 3 */}
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[10px] font-bold font-mono">
                          3
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Step 3 — Deploy Your Application</h3>
                      </div>
                      <p className="text-[11px] text-[#888888] leading-relaxed pl-7">
                        Deploy your application after adding the SDK.
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[10px] font-bold font-mono">
                          4
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Step 4 — Verify Connection</h3>
                      </div>
                      <p className="text-[11px] text-[#888888] leading-relaxed pl-7 mb-3">
                        Return to Reportli AI and click Check Connection.
                      </p>
                      
                      <div className="pl-7 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            id="check-connection-btn"
                            disabled={isCheckingConnection}
                            onClick={() => handleCheckConnection(activeApp.id, activeApp.apiKey)}
                            className="px-4 py-2.5 bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold text-[10px] tracking-wider uppercase rounded-sm transition-all cursor-pointer inline-flex items-center gap-2 disabled:cursor-not-allowed"
                          >
                            {isCheckingConnection && connectionMessage?.type !== "info" ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin text-black" />
                                Checking...
                              </>
                            ) : (
                              "Check Connection"
                            )}
                          </button>
                        </div>

                        {connectionMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-[3px] text-[10.5px] leading-relaxed font-mono border ${
                              connectionMessage.type === "success"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : connectionMessage.type === "info"
                                ? "bg-[#ffd700]/5 border-[#ffd700]/10 text-[#ffd700]"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {connectionMessage.type === "success" ? (
                                <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                              ) : connectionMessage.type === "info" ? (
                                <Sparkles className="w-3.5 h-3.5 text-[#ffd700] shrink-0 mt-0.5 animate-pulse" />
                              ) : (
                                <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                              )}
                              <span>{connectionMessage.text}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Vibe Coding prompt card */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-[4px] flex flex-col gap-3 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">AI / VIBE CODING PROMPT</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const promptText = `Integrate Reportli AI into my application.

1. Install the Reportli SDK using the appropriate package manager ("npm install reportli", or the equivalent for my project).

2. Initialize Reportli using the following Project API Key:

"${activeApp.apiKey}"

Complete the integration using the best practices for my project's framework and make sure the application builds successfully.`;
                            handleCopy(promptText, "vibe_prompt");
                          }}
                          className="text-neutral-400 hover:text-white text-[9px] font-bold uppercase tracking-wider py-1 px-2 border border-neutral-700 hover:border-neutral-500 rounded bg-black/40 cursor-pointer transition-all"
                        >
                          {copiedAppId === "vibe_prompt" ? "COPIED" : "COPY PROMPT"}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        Click above to copy the automated integration prompt. You can paste this directly into Cursor, Windsurf, or Copilot.
                      </p>
                      <div className="bg-black/60 p-2.5 rounded border border-[#222] font-mono text-[9px] text-neutral-400 max-h-[120px] overflow-y-auto leading-normal whitespace-pre-wrap select-all">
                        {`Integrate Reportli AI into my application.\n\n1. Install the Reportli SDK using the appropriate package manager ("npm install reportli", or the equivalent for my project).\n\n2. Initialize Reportli using the following Project API Key:\n\n"${activeApp.apiKey}"\n\nComplete the integration using the best practices for my project's framework and make sure the application builds successfully.`}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#ffd700]/5 border border-[#ffd700]/15 rounded-[3px] text-[#ffd700]/80 text-[10.5px] leading-relaxed">
                    Once your application sends its first event, the status will automatically change to <span className="font-bold text-green-400">🟢 Connected</span>.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Top Row (Connect Application) */}
              {(!activeApp || activeApp.status !== "Active") && (
                <div className="grid grid-cols-1 gap-1 min-h-[160px]">
                  
                  {/* Connect Card */}
                  <div className="bg-[#161616] p-6 rounded-[4px] relative group border border-[#222] md:border-none flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] tracking-[0.2em] text-[#888888] font-bold uppercase block">CONNECT APPLICATION</span>
                      {activeApp ? (
                        <div className="mt-4 space-y-3">
                          <div className="bg-[#000000] p-2 text-[11px] border border-[#333] text-[#888888] font-mono">
                            <span className="text-[#ffd700]">npm</span> install reportli-node
                          </div>
                          <div className="text-[10px] text-[#888888] uppercase tracking-wider font-bold">API KEY</div>
                          <div className="flex items-center justify-between bg-[#000000] p-2 text-[11px] border border-[#333] font-mono">
                            <span className="truncate mr-2 text-white">{activeApp.apiKey}</span>
                            <button
                              onClick={() => handleCopy(activeApp.apiKey, "apiKey")}
                              className="text-[#888888] hover:text-white transition-all text-[9px] font-bold tracking-wider cursor-pointer uppercase flex items-center gap-1"
                            >
                              {copiedAppId === "apiKey" ? <span className="text-green-500">COPIED</span> : "COPY"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#888888] mt-4">Select or provision an app pipeline to inspect details.</div>
                      )}
                    </div>
                    <span className="absolute top-4 right-4 opacity-30 group-hover:opacity-100 transition-opacity text-[#ffd700]">↗</span>
                  </div>

                </div>
              )}

              {/* Application Error Logs */}
              {apps.length > 0 && (
                <div className="flex-1 bg-[#161616] p-6 rounded-[4px] flex flex-col border border-[#222] md:border-none">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] tracking-[0.2em] text-[#888888] font-bold uppercase">APPLICATION ERROR LOGS</span>
                    <span className="text-[10px] text-[#888888] font-bold uppercase">TOTAL: {appErrors.length}</span>
                  </div>

                  {activeApp && (activeApp.status === "Active" || appErrors.length > 0) ? (
                    <div className="flex flex-col flex-1 gap-4">
                      {/* Filters */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-[200px]">
                          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                          <input
                            type="text"
                            placeholder="search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#000000] border border-[#333] text-white text-[10px] pl-8 pr-2.5 py-1.5 rounded-[4px] font-mono focus:outline-none focus:border-[#ffd700] w-full"
                          />
                        </div>
                        <select
                          value={severityFilter}
                          onChange={(e) => setSeverityFilter(e.target.value)}
                          className="bg-[#000000] border border-[#333] text-white text-[10px] px-2 py-1.5 rounded-[4px] font-mono focus:outline-none cursor-pointer"
                        >
                          <option value="all">all levels</option>
                          <option value="critical">critical</option>
                          <option value="error">error</option>
                          <option value="warning">warning</option>
                        </select>
                      </div>

                      {/* Exception Table list matches requested High Density output */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-[350px] pr-1">
                        {filteredErrors.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500 bg-[#000000]/40 border border-dashed border-[#333] rounded-[4px]">
                            <Terminal className="w-6 h-6 mb-2 text-[#888888] opacity-40" />
                            <div className="text-[10px] uppercase font-bold tracking-widest text-[#888888]">NO RECORDS FOUND</div>
                            <div className="text-[9px] mt-1 text-[#666]">No logs detected for the active filters.</div>
                          </div>
                        ) : (
                          filteredErrors.map((err) => {
                            const isSelected = selectedError?.id === err.id;
                            const sevBorder = 
                              err.severity === "critical" 
                                ? "border-red-500" 
                                : err.severity === "error"
                                ? "border-orange-500"
                                : "border-amber-500";
                            
                            const sevText = 
                              err.severity === "critical" 
                                ? "text-red-500" 
                                : err.severity === "error"
                                ? "text-orange-500"
                                : "text-amber-500";

                            return (
                              <button
                                key={err.id}
                                onClick={() => setSelectedErrorId(err.id)}
                                className={`w-full text-left grid grid-cols-12 gap-2 text-[11px] p-2 bg-[#000000] border-l-2 ${sevBorder} transition-all cursor-pointer ${
                                  isSelected ? "opacity-100 ring-1 ring-[#ffd700]/30" : "opacity-60 hover:opacity-100"
                                }`}
                              >
                                <span className="col-span-2 text-[#888888] font-mono">
                                  {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className={`col-span-3 font-bold truncate ${sevText}`}>
                                  {err.errorName}
                                </span>
                                <span className="col-span-7 truncate text-neutral-300 font-mono">
                                  {err.errorMessage}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-[#888888] bg-[#000000]/20 border border-dashed border-[#333] rounded-[4px]">
                      <AlertOctagon className="w-8 h-8 mb-2 opacity-30 text-[#ffd700]" />
                      <div className="text-[10px] uppercase font-bold tracking-widest text-white">PIPELINE STANDBY</div>
                      <p className="text-[10px] mt-1 max-w-[240px] leading-relaxed mx-auto">
                        Please select an active pipeline or connect a new one to inspect telemetry logs.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ================= COLUMN 3: Reportli AI ================= */}
        {apps.length > 0 && !(activeApp && activeApp.status !== "Active") && (
          <section className="col-span-12 lg:col-span-2 bg-[#000000] p-6 flex flex-col justify-between text-white relative border-l border-[#ffd700]/20 rounded-[4px] lg:rounded-none overflow-hidden">
            {/* Aesthetic background glow for column 3 */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-[#ffd700]/5 to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col flex-1 h-full relative z-10">
              {/* High contrast dark Terminal box for Gemini AI diagnosis output */}
              <div className="bg-[#000000] text-white font-mono flex flex-col relative overflow-hidden flex-1">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#2d2d2d]">
                  <div className="flex items-center gap-1.5 bg-[#ffd700]/10 px-2 py-1 rounded-sm border border-[#ffd700]/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-pulse"></div>
                    <span className="text-[10px] tracking-wider uppercase text-[#ffd700] font-bold">Reportli AI</span>
                  </div>
                </div>

                {selectedError ? (
                  <div className="flex flex-col flex-1 text-[10px]">
                    {/* Anomaly header info */}
                    <div className="bg-[#161616] p-2 rounded-[3px] border border-[#2d2d2d] mb-3">
                      <div className="flex justify-between items-center text-[7.5px] text-[#888888] uppercase tracking-wider mb-0.5 font-bold">
                        <span>target anomaly</span>
                        <span className="text-[#ffd700]">{selectedError.id}</span>
                      </div>
                      <div className="font-bold text-white truncate text-[10px]">{selectedError.errorName}</div>
                      <div className="text-[#888888] text-[9px] leading-relaxed max-h-[80px] overflow-y-auto custom-scrollbar pr-1 break-words whitespace-pre-wrap selection:bg-[#ffd700]/20">
                        {selectedError.errorMessage}
                      </div>
                    </div>

                    {/* Diagnosing state readout console */}
                    <div className="flex-1 flex flex-col justify-start overflow-y-auto pr-1">
                      {isAiLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                          <RefreshCw className="w-5 h-5 text-[#ffd700] animate-spin mb-2" />
                          <div className="text-[9px] uppercase tracking-wider font-bold text-neutral-300">COMPILING...</div>
                          <div className="text-[8px] text-neutral-500 mt-1 max-w-[120px] leading-tight">Querying telemetry maps from intelligence models</div>
                        </div>
                      ) : aiErrorMsg ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-3 text-center border border-red-500/20 bg-red-500/5 rounded-[4px]">
                          <AlertOctagon className="w-5 h-5 text-red-500 mb-1" />
                          <div className="text-[9px] uppercase tracking-widest text-red-400 font-bold">AUDIT ERROR</div>
                          <div className="text-[8px] text-neutral-400 mt-1 leading-normal">{aiErrorMsg}</div>
                          <button
                            onClick={() => setRetryCounter(prev => prev + 1)}
                            className="mt-3 px-2 py-1 bg-[#161616] border border-[#2d2d2d] hover:border-[#444] text-[8px] text-white rounded-[2px] font-mono cursor-pointer uppercase font-bold"
                          >
                            retry audit
                          </button>
                        </div>
                      ) : aiAnalysis ? (
                        <div className="markdown-body text-[10px] leading-relaxed text-neutral-300 select-text">
                          <ReactMarkdown
                            components={{
                              h2: ({node, ...props}) => (
                                <h3 className="text-[9px] uppercase tracking-widest text-[#ffd700] font-bold mt-3 mb-1 first:mt-0 border-b border-[#2d2d2d] pb-0.5" {...props} />
                              ),
                              p: ({node, ...props}) => (
                                <p className="mb-1.5 text-neutral-300 leading-normal" {...props} />
                              ),
                              ul: ({node, ...props}) => (
                                <ul className="list-disc pl-3 mb-2 text-neutral-400 space-y-0.5" {...props} />
                              ),
                              li: ({node, ...props}) => (
                                <li className="text-[9.5px]" {...props} />
                              ),
                              code: ({node, ...props}) => (
                                <code className="text-[9px] bg-[#161616] border border-[#2d2d2d] text-[#ffd700] px-1 py-0.5 rounded font-mono" {...props} />
                              ),
                              pre: ({node, ...props}) => (
                                <pre className="bg-[#161616] p-2 rounded-[3px] border border-[#2d2d2d] text-[9px] text-[#ffd700] font-mono leading-tight overflow-x-auto my-2 select-all" {...props} />
                              )
                            }}
                          >
                            {aiAnalysis}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-neutral-500">
                          <HelpCircle className="w-5 h-5 mb-1 opacity-30" />
                          <div className="text-[9px] uppercase font-bold tracking-widest">AWAITING SELECTION</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-neutral-500">
                    <Sparkles className="w-5 h-5 mb-1 text-[#ffd700] opacity-40 animate-pulse" />
                    <div className="text-[9px] uppercase tracking-widest text-[#ffd700] font-bold">AUTONOMOUS STANDBY</div>
                    <div className="text-[8px] text-neutral-600 mt-1 max-w-[120px]">Select an anomaly to analyze telemetry.</div>
                  </div>
                )}
              </div>

            </div>

            
          </section>
        )}
      </main>

      {/* 4. Dense Footer */}
      <footer className="p-2 px-8 flex justify-between items-center border-t border-[#333] bg-[#000000] relative z-10">
        <div className="flex gap-4">
          <span className="text-[9px] text-[#888888]">SYSTEM: STABLE</span>
          <span className="text-[9px] text-[#888888]">NODE_ENV: PRODUCTION</span>
          <span className="text-[9px] text-[#888888]">REGION: US-EAST-1</span>
        </div>
        <div className="text-[9px] text-[#888888]">© 2026 reportli_ai_v0.12.2_stable</div>
      </footer>
      {/* 5. Delete Application Modal */}
      <AnimatePresence>
        {appToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAppToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#161616] border border-red-500/30 p-6 rounded-lg shadow-2xl z-10"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-sm">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white uppercase font-mono">
                    Delete Pipeline
                  </h3>
                  <p className="text-[#888888] text-xs mt-1 font-mono uppercase tracking-wider">
                    {appToDelete.name}
                  </p>
                </div>
              </div>

              <div className="text-xs text-neutral-300 leading-relaxed mb-6 font-mono">
                Are you sure you want to permanently delete this application pipeline? This will remove the application, all its API keys, and all associated error logs from the cloud database and your dashboard.
                <div className="mt-3 p-2 bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded-sm">
                  ⚠️ This action is irreversible.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteApp(appToDelete.id)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-900/50 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      DELETING...
                    </>
                  ) : (
                    "PERMANENTLY DELETE"
                  )}
                </button>
                <button
                  onClick={() => setAppToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 border border-[#333] hover:border-neutral-500 text-[#888888] hover:text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#161616] border border-[#333] rounded-lg p-6 shadow-2xl z-10"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Confirm Termination</h3>
              <p className="text-xs text-[#888888] leading-relaxed mb-6">
                Are you sure you want to terminate your current session? You will need to authenticate again to access your dashboard.
              </p>
              <div className="flex justify-end gap-3 font-bold text-[10px] tracking-wider uppercase">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2.5 bg-[#222] text-neutral-400 hover:text-white border border-[#333] rounded-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowLogoutConfirm(false);
                    await logout();
                  }}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-sm transition-all cursor-pointer"
                >
                  Terminate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
