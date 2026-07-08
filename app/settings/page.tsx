"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Database, 
  Activity,
  Github,
  Key,
  Check,
  ExternalLink,
  FileText,
  Scale,
  Receipt,
  Mail,
  Trash2,
  CreditCard,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ apps: 0, errors: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<"privacy" | "terms" | "refund" | "contact" | null>(null);

  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [showManageConfirm, setShowManageConfirm] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    if (profile?.plan === "Premium" || profile?.plan === "premium") {
      setShowManageConfirm(true);
      return;
    }
    setCheckoutLoading(true);
    setBillingError("");
    const productId = process.env.NEXT_PUBLIC_DODO_PAYMENTS_PRODUCT_ID;
    if (!productId) {
      console.error("Frontend: NEXT_PUBLIC_DODO_PAYMENTS_PRODUCT_ID is not defined");
      setBillingError("Billing is not properly configured. Please contact support.");
      setCheckoutLoading(false);
      return;
    }
    
    try {
      console.log("Frontend: Initiating checkout with productId:", productId);
      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_checkout_session",
          productId: productId,
          userId: user.uid,
          email: user.email,
          name: user.displayName,
          returnUrl: window.location.href
        })
      });

      if (!response.ok) {
        let errorMessage = "Failed to initiate billing session";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = `Server returned ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Frontend: Failed to parse response as JSON:", e);
        throw new Error("Invalid response format from server");
      }
      
      console.log("Frontend: API response data:", data);
      
      if (data && data.url) {
        console.log("Frontend: Redirecting to:", data.url);
        window.open(data.url, "_blank");
      } else {
        console.error("Frontend: Invalid response from API:", data);
        throw new Error(data.error || "No checkout URL returned from payment provider");
      }
    } catch (err: any) {
      console.error("Billing upgrade error:", err);
      setBillingError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      // 0. Pre-verify auth user to catch recent login requirement early if possible
      // (Though deleteUser is usually what triggers it)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be signed in to delete your account.");
      }

      // 1. Fetch user apps to delete
      const getResponse = await fetch(`/api/supabase?action=get_data&userId=${user.uid}`);
      if (getResponse.ok) {
        const data = await getResponse.json();
        const userApps = data.apps || [];
        
        // 2. Delete all user apps and their error logs
        for (const app of userApps) {
          try {
            await fetch('/api/supabase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'delete_app',
                id: app.id,
                apiKey: app.apiKey
              })
            });
          } catch (err) {
            console.error(`Failed to delete app ${app.id} during account deletion:`, err);
          }
        }
      }

      // 3. Delete the Firebase auth user
      // Note: This is the sensitive operation that triggers auth/requires-recent-login
      await deleteUser(currentUser);
      
      // 4. Redirect to home page
      window.location.href = "/";
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        console.warn("Re-authentication required:", err);
        setDeleteError("For security reasons, this operation requires a recent login. Please log out and sign in again, then return here to delete your account.");
      } else {
        console.error("Error deleting account:", err);
        setDeleteError(err.message || "An error occurred while deleting your account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/supabase?action=get_data&userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            apps: data.apps?.length || 0,
            errors: data.errors?.length || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings stats:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubscription = async () => {
      setSubLoading(true);
      try {
        const response = await fetch(`/api/supabase?action=get_subscription&userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription || null);
        }
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      } finally {
        setSubLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/supabase?action=get_user&userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data.user || null);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    fetchStats();
    fetchSubscription();
    fetchProfile();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-mono">
        <Activity className="w-8 h-8 text-[#ffd700] animate-spin" />
      </div>
    );
  }

  const renderPrivacyPolicy = () => (
    <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
      <div className="border-b border-[#2d2d2d] pb-4 mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Privacy Policy</h2>
        <p className="text-xs text-[#ffd700] mt-1 font-mono">Effective Date: July 5, 2026</p>
      </div>

      <p>
        Welcome to Reportli AI (&ldquo;Reportli AI,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website and services.
      </p>

      <div className="bg-[#111] border border-[#222] p-4 rounded-sm font-mono text-xs space-y-1 text-neutral-400">
        <div><span className="text-[#ffd700]">WEBSITE:</span> <a href="https://reportliai.sbs" target="_blank" rel="noopener noreferrer" className="hover:underline text-white">reportliai.sbs</a></div>
        <div><span className="text-[#ffd700]">SUPPORT EMAIL:</span> <a href="mailto:reportlihelp@gmail.com" className="hover:underline text-white">reportlihelp@gmail.com</a></div>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">1. Information We Collect</h3>
        <p>When you use Reportli AI, we may collect the following information:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
          <li>Name and email address provided through Firebase Authentication.</li>
          <li>Account information required to create and manage your account.</li>
          <li>Technical information such as browser type, operating system, IP address, and device information.</li>
          <li>Information you voluntarily provide when contacting support.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">2. How We Use Your Information</h3>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
          <li>Create and manage your account.</li>
          <li>Authenticate users securely.</li>
          <li>Provide, maintain, and improve our services.</li>
          <li>Respond to support requests.</li>
          <li>Detect, prevent, and investigate security issues or misuse.</li>
          <li>Comply with applicable legal obligations.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">3. Third-Party Services</h3>
        <p>We use trusted third-party service providers to operate our service:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
          <li><span className="text-white font-medium">Firebase Authentication</span> for secure user authentication.</li>
          <li><span className="text-white font-medium">Supabase</span> for database and backend services.</li>
        </ul>
        <p className="text-neutral-400 text-xs">These providers may process your information in accordance with their own privacy policies.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">4. Data Security</h3>
        <p>
          We take reasonable technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction. However, no method of transmitting or storing data over the Internet is completely secure.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">5. Data Retention</h3>
        <p>
          We retain your information only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">6. Your Rights</h3>
        <p>Depending on your location and applicable law, you may have the right to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
          <li>Access your personal information.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your account and personal information.</li>
          <li>Contact us regarding the processing of your data.</li>
        </ul>
        <p>
          To exercise these rights, contact us at <a href="mailto:reportlihelp@gmail.com" className="text-[#ffd700] hover:underline">reportlihelp@gmail.com</a>.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">7. Children&apos;s Privacy</h3>
        <p>
          Reportli AI is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">8. International Data Transfers</h3>
        <p>
          Your information may be processed or stored in countries other than your own through our service providers. We take reasonable steps to ensure appropriate protection of your information.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">9. Changes to This Privacy Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated Effective Date.
        </p>
      </div>

      <div className="space-y-4 border-t border-[#2d2d2d] pt-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider">10. Contact Us</h3>
        <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us:</p>
        <div className="text-neutral-400 text-xs space-y-1 font-mono">
          <div className="text-white font-bold">Reportli AI</div>
          <div>Website: reportliai.sbs</div>
          <div>Email: reportlihelp@gmail.com</div>
        </div>
      </div>
    </div>
  );

  const renderTermsOfService = () => (
    <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
      <div className="border-b border-[#2d2d2d] pb-4 mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Terms of Service</h2>
        <p className="text-xs text-[#ffd700] mt-1 font-mono">Effective Date: July 5, 2026</p>
      </div>

      <p>
        Welcome to Reportli AI. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Reportli AI website and services.
      </p>

      <div className="bg-[#111] border border-[#222] p-4 rounded-sm font-mono text-xs space-y-1 text-neutral-400">
        <div><span className="text-[#ffd700]">WEBSITE:</span> <a href="https://reportliai.sbs" target="_blank" rel="noopener noreferrer" className="hover:underline text-white">reportliai.sbs</a></div>
        <div><span className="text-[#ffd700]">SUPPORT EMAIL:</span> <a href="mailto:reportlihelp@gmail.com" className="hover:underline text-white">reportlihelp@gmail.com</a></div>
      </div>

      <p className="font-semibold text-white italic">
        By accessing or using Reportli AI, you agree to be bound by these Terms. If you do not agree, please do not use our services.
      </p>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">1. Eligibility</h3>
        <p>
          You must be at least 13 years old and legally capable of entering into a binding agreement to use Reportli AI.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">2. Account Registration</h3>
        <p>
          You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate and up-to-date information.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">3. Our Services</h3>
        <p>
          Reportli AI provides software and related services to help users monitor and manage application information. Features may change, be improved, or be discontinued at any time.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">4. Acceptable Use</h3>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
          <li>Use the service for any unlawful purpose.</li>
          <li>Attempt to gain unauthorized access to our systems.</li>
          <li>Disrupt or interfere with the operation or security of the service.</li>
          <li>Upload or distribute malicious software.</li>
          <li>Use the service to violate the rights of others.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">5. Intellectual Property</h3>
        <p>
          All content, software, branding, logos, and materials provided through Reportli AI are owned by or licensed to Reportli AI and are protected by applicable intellectual property laws.
        </p>
        <p>
          You may not copy, modify, distribute, reverse engineer, or create derivative works from our services unless permitted by law or with our written permission.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">6. User Content</h3>
        <p>
          You retain ownership of any content or information you submit through the service. You grant Reportli AI a limited license to process that information solely to provide the service.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">7. Service Availability</h3>
        <p>
          We strive to keep the service available but do not guarantee uninterrupted or error-free operation. We may perform maintenance, updates, or changes without prior notice.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">8. Account Suspension and Termination</h3>
        <p>
          We may suspend or terminate your account if you violate these Terms, misuse the service, or engage in fraudulent or unlawful activity.
        </p>
        <p>You may stop using the service at any time.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">9. Disclaimer of Warranties</h3>
        <p className="italic text-neutral-400">
          Reportli AI is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the maximum extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">10. Limitation of Liability</h3>
        <p className="text-neutral-400">
          To the maximum extent permitted by law, Reportli AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
        </p>
        <p className="text-neutral-400">
          Our total liability for any claim relating to the service shall not exceed the amount you paid to Reportli AI during the twelve (12) months preceding the claim.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">11. Privacy</h3>
        <p>
          Your use of Reportli AI is also governed by our <span className="text-[#ffd700] cursor-pointer hover:underline" onClick={() => setSelectedPolicy("privacy")}>Privacy Policy</span>.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">12. Changes to the Terms</h3>
        <p>
          We may update these Terms from time to time. Updated Terms will become effective when posted on our website. Continued use of the service constitutes acceptance of the revised Terms.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">13. Governing Law</h3>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
        </p>
      </div>

      <div className="space-y-4 border-t border-[#2d2d2d] pt-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider">14. Contact Us</h3>
        <p>If you have any questions regarding these Terms, please contact us:</p>
        <div className="text-neutral-400 text-xs space-y-1 font-mono">
          <div className="text-white font-bold">Reportli AI</div>
          <div>Website: reportliai.sbs</div>
          <div>Email: reportlihelp@gmail.com</div>
        </div>
      </div>
    </div>
  );

  const renderRefundPolicy = () => (
    <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
      <div className="border-b border-[#2d2d2d] pb-4 mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Refund Policy</h2>
        <p className="text-xs text-[#ffd700] mt-1 font-mono">Effective Date: July 5, 2026</p>
      </div>

      <p>Thank you for choosing Reportli AI.</p>
      <p>This Refund Policy explains when refunds are available for purchases made through Reportli AI.</p>

      <div className="bg-[#111] border border-[#222] p-4 rounded-sm font-mono text-xs space-y-1 text-neutral-400">
        <div><span className="text-[#ffd700]">WEBSITE:</span> <a href="https://reportliai.sbs" target="_blank" rel="noopener noreferrer" className="hover:underline text-white">reportliai.sbs</a></div>
        <div><span className="text-[#ffd700]">SUPPORT EMAIL:</span> <a href="mailto:reportlihelp@gmail.com" className="hover:underline text-white">reportlihelp@gmail.com</a></div>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">1. 7-Day Refund Period</h3>
        <p>
          Customers may request a refund within 7 calendar days of the original purchase.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">2. Eligibility for Refunds</h3>
        <p>A refund may be approved if:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
          <li>The purchase was made by accident.</li>
          <li>The service has not been used or only minimal use has occurred, as determined by Reportli AI.</li>
        </ul>
        <p>
          Refund requests are reviewed individually. We reserve the right to verify account activity before approving a refund.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">3. Non-Refundable Cases</h3>
        <p>Refunds will generally not be provided if:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
          <li>The service has been substantially used.</li>
          <li>The request is made more than 7 days after the purchase.</li>
          <li>The purchase violates our Terms of Service or involves fraud or abuse.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">4. How to Request a Refund</h3>
        <p>To request a refund, contact us at:</p>
        <p className="font-mono text-xs text-white bg-[#111] p-3 border border-[#222] rounded-sm">
          Email: <a href="mailto:reportlihelp@gmail.com" className="text-[#ffd700] hover:underline">reportlihelp@gmail.com</a>
        </p>
        <p className="text-xs text-[#888888] mt-2">Please include:</p>
        <ul className="list-disc pl-5 space-y-1 text-neutral-400 text-xs">
          <li>Your account email address.</li>
          <li>The reason for your refund request.</li>
          <li>Any relevant purchase information.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">5. Processing Time</h3>
        <p>
          If your refund is approved, it will be processed using the original payment method. Processing times may vary depending on your payment provider.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">6. Changes to This Policy</h3>
        <p>
          We may update this Refund Policy from time to time. Any changes will be posted on this page with an updated Effective Date.
        </p>
      </div>

      <div className="space-y-4 border-t border-[#2d2d2d] pt-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider">7. Contact Us</h3>
        <p>If you have any questions about this Refund Policy, please contact us:</p>
        <div className="text-neutral-400 text-xs space-y-1 font-mono">
          <div className="text-white font-bold">Reportli AI</div>
          <div>Website: reportliai.sbs</div>
          <div>Email: reportlihelp@gmail.com</div>
        </div>
      </div>
    </div>
  );

  const renderContactUs = () => (
    <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
      <div className="border-b border-[#2d2d2d] pb-4 mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Contact Us</h2>
        <p className="text-xs text-[#ffd700] mt-1 font-mono">Effective Date: July 5, 2026</p>
      </div>

      <p>
        We&apos;re here to help. If you have any questions, feedback, or need assistance with Reportli AI, please contact us using the information below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#111] border border-[#222] p-4 rounded-sm">
          <div className="text-[10px] text-[#888888] font-bold uppercase tracking-wider mb-1">Customer Support</div>
          <div className="text-sm font-bold text-white mb-1">Email</div>
          <a href="mailto:reportlihelp@gmail.com" className="text-[#ffd700] hover:underline text-xs font-mono">reportlihelp@gmail.com</a>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 rounded-sm">
          <div className="text-[10px] text-[#888888] font-bold uppercase tracking-wider mb-1">Official Website</div>
          <div className="text-sm font-bold text-white mb-1">URL</div>
          <a href="https://reportliai.sbs" target="_blank" rel="noopener noreferrer" className="text-[#ffd700] hover:underline text-xs font-mono">reportliai.sbs</a>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">Support Requests</h3>
        <p className="text-neutral-400">You can contact us regarding:</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 list-disc pl-5 text-neutral-400 text-xs">
          <li>General inquiries</li>
          <li>Technical support</li>
          <li>Account-related questions</li>
          <li>Billing and subscription inquiries</li>
          <li>Refund requests</li>
          <li>Privacy concerns</li>
          <li>Bug reports and feature suggestions</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-md font-bold text-white uppercase tracking-wider border-l-2 border-[#ffd700] pl-3">Response Time</h3>
        <p>
          We aim to respond to all support requests as quickly as possible. Response times may vary depending on the volume of inquiries.
        </p>
      </div>

      <div className="pt-6 border-t border-[#2d2d2d] text-center">
        <p className="text-xs text-[#888888] uppercase tracking-[0.1em] leading-relaxed">
          Thank you for using Reportli AI. We appreciate your feedback and are committed to providing the best possible support.
        </p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-mono">
        <div className="text-center">
          <Activity className="w-12 h-12 text-[#ffd700] mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-4">ACCESS DENIED</h1>
          <p className="text-[#888888] mb-8">Please authenticate to access settings.</p>
          <Link href="/">
            <button className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-sm hover:bg-neutral-200 transition-all cursor-pointer">
              Return to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (selectedPolicy) {
    return (
      <div className="min-h-screen bg-[#000000] text-white font-mono selection:bg-[#ffd700] selection:text-black">
        {/* Aesthetic Overlays */}
        <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none opacity-40 z-0" style={{ background: "radial-gradient(circle at 50% 0%, #333 0%, transparent 70%)" }}></div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
          {/* Back Button / Navigation */}
          <button 
            onClick={() => setSelectedPolicy(null)}
            className="group flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-[#888888] hover:text-[#ffd700] transition-all duration-200 bg-[#0c0c0c] border border-[#222] hover:border-[#ffd700]/30 px-4 py-2.5 rounded-sm cursor-pointer mb-8 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Settings
          </button>

          {/* Active Policy Render */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0c0c0c] border border-[#2d2d2d] p-8 sm:p-12 rounded-lg relative overflow-hidden shadow-2xl"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent pointer-events-none"></div>
            
            {selectedPolicy === "privacy" && renderPrivacyPolicy()}
            {selectedPolicy === "terms" && renderTermsOfService()}
            {selectedPolicy === "refund" && renderRefundPolicy()}
            {selectedPolicy === "contact" && renderContactUs()}
          </motion.div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setSelectedPolicy(null)}
              className="text-[10px] text-[#555] hover:text-[#ffd700] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer"
            >
              Close Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white font-mono selection:bg-[#ffd700] selection:text-black">
      {/* Aesthetic Overlays */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none opacity-40 z-0" style={{ background: "radial-gradient(circle at 50% 0%, #333 0%, transparent 70%)" }}></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[#161616] border border-transparent hover:border-[#333] rounded-sm transition-all text-[#888888] hover:text-white cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-[#ffd700]" />
                Settings
              </h1>
              <p className="text-[#888888] text-[10px] tracking-[0.2em] font-bold uppercase mt-1">Configure your diagnostic environment</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#333] rounded-sm">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[11px] text-green-500 tracking-wider uppercase font-bold">SECURE CHANNEL ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#161616] border border-[#333] p-6 rounded-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffd700]/5 rounded-bl-full pointer-events-none"></div>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white text-black flex items-center justify-center text-2xl font-bold overflow-hidden rounded-full border-4 border-[#333] mb-4">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" />
                  ) : (
                    user.displayName?.substring(0, 2).toUpperCase() || "U"
                  )}
                </div>
                <h2 className="text-lg font-bold text-white mb-1">{user.displayName || "Anonymous Agent"}</h2>
                <p className="text-[10px] text-[#888888] font-mono break-all uppercase tracking-wider">{user.email}</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#161616] border border-[#333] p-6 rounded-lg"
            >
              <h3 className="text-[10px] tracking-[0.2em] text-[#888888] font-bold uppercase mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#ffd700]" />
                Usage Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400">Applications</span>
                  <span className="text-sm font-bold text-white">{loading ? "..." : stats.apps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400">Error Logs Captured</span>
                  <span className="text-sm font-bold text-white">{loading ? "..." : stats.errors}</span>
                </div>
              </div>
            </motion.div>

            {/* Dodo Payments Subscription & Upgrade Section */}
            <motion.div 
              id="subscription-status"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#161616] border border-[#333] p-6 rounded-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffd700]/5 rounded-bl-full pointer-events-none"></div>
              
              <h3 className="text-[10px] tracking-[0.2em] text-[#888888] font-bold uppercase mb-4 flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-[#ffd700]" />
                Subscription Status
              </h3>

              {subLoading ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-2">
                  <Activity className="w-5 h-5 text-[#ffd700] animate-spin" />
                  <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Verifying subscription...</span>
                </div>
              ) : subscription && (subscription.status === "active" || subscription.status === "trialing") ? (
                <div className="space-y-4">
                  <div className="p-3 bg-[#ffd700]/10 border border-[#ffd700]/20 rounded-sm">
                    <div className="flex items-center gap-2 text-[#ffd700] font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Reportli AI Pro
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 uppercase font-mono tracking-wider">
                      Status: <span className="text-white font-bold">{subscription.status}</span>
                    </div>
                    {subscription.trial_end && subscription.status === "trialing" && (
                      <div className="text-[10px] text-neutral-400 font-mono tracking-wider">
                        Trial ends: <span className="text-white font-bold">{new Date(subscription.trial_end).toLocaleDateString()}</span>
                      </div>
                    )}
                    {subscription.current_period_end && (
                      <div className="text-[10px] text-neutral-400 font-mono tracking-wider">
                        Renewal: <span className="text-white font-bold">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                    Thank you for supporting Reportli AI! You have full access to pro diagnostic environments and automated diagnostics.
                  </div>
                  <button
                    onClick={() => setShowManageConfirm(true)}
                    className="w-full py-2.5 bg-[#ffd700] hover:bg-[#ffe240] text-black font-bold uppercase tracking-widest rounded-sm text-[10px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>MANAGE SUBSCRIPTION</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-l-2 border-[#ffd700] pl-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {(profile?.plan === "Premium" || profile?.plan === "premium") ? "Premium Subscription" : "Upgrade to Premium"}
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {(profile?.plan === "Premium" || profile?.plan === "premium") ? "You have full access to pro diagnostic power" : "Unlock professional diagnostic power"}
                    </p>
                  </div>

                  <div className="space-y-2 text-[10px] text-neutral-400 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#ffd700]"></div>
                      <span>15 Application Connections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#ffd700]"></div>
                      <span>Unlimited Automated AI error analyses</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-lg font-bold text-white">$9.99</span>
                      <span className="text-xs text-neutral-400 font-mono">/ month</span>
                      <span className="text-[9px] bg-[#ffd700]/10 border border-[#ffd700]/20 text-[#ffd700] px-1.5 py-0.5 rounded-sm ml-2 uppercase font-bold tracking-widest font-mono">
                        {(profile?.plan === "Premium" || profile?.plan === "premium") ? "Premium" : "7-Day Free Trial"}
                      </span>
                    </div>

                    {billingError && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-sm text-[10px] text-red-500 font-mono leading-normal mb-3">
                        {billingError}
                      </div>
                    )}

                    <button
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                      className="w-full py-2.5 bg-[#ffd700] hover:bg-[#ffe240] text-black font-bold uppercase tracking-widest rounded-sm text-[10px] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                      {checkoutLoading ? (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                          <span>Initiating Checkout...</span>
                        </>
                      ) : (profile?.plan === "Premium" || profile?.plan === "premium") ? (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>MANAGE SUBSCRIPTION</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Start 7-Day Free Trial</span>
                        </>
                      )}
                    </button>
                    <p className="text-[8px] text-neutral-500 text-center mt-2.5 font-mono uppercase tracking-wider">
                      Secured by Dodo Payments MoR
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Settings Sections / Legal Documents */}
          <div className="md:col-span-2 space-y-6">
            <div className="border border-[#2d2d2d] bg-[#0c0c0c] p-6 rounded-lg relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/30 to-transparent pointer-events-none"></div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white mb-2">Legal & Support Hub</h2>
              <p className="text-xs text-[#888888] leading-relaxed mb-6">
                Please select a document below to review our terms, policies, or contact details. Reviewing these documents is necessary for understanding your user rights and compliance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedPolicy("privacy")}
                  className="flex flex-col items-start gap-3 p-5 bg-[#111] border border-[#222] hover:border-[#ffd700]/50 hover:bg-[#161616] rounded-sm transition-all duration-200 cursor-pointer group text-left w-full"
                >
                  <div className="p-2 bg-[#ffd700]/10 rounded-sm text-[#ffd700] group-hover:bg-[#ffd700]/20 transition-all">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white group-hover:text-[#ffd700] transition-colors uppercase tracking-wider">Privacy Policy</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">How we collect, use, and protect your secure credentials.</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPolicy("terms")}
                  className="flex flex-col items-start gap-3 p-5 bg-[#111] border border-[#222] hover:border-[#ffd700]/50 hover:bg-[#161616] rounded-sm transition-all duration-200 cursor-pointer group text-left w-full"
                >
                  <div className="p-2 bg-[#ffd700]/10 rounded-sm text-[#ffd700] group-hover:bg-[#ffd700]/20 transition-all">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white group-hover:text-[#ffd700] transition-colors uppercase tracking-wider">Terms of Service</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">Rules and agreements governing your platform access.</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPolicy("refund")}
                  className="flex flex-col items-start gap-3 p-5 bg-[#111] border border-[#222] hover:border-[#ffd700]/50 hover:bg-[#161616] rounded-sm transition-all duration-200 cursor-pointer group text-left w-full"
                >
                  <div className="p-2 bg-[#ffd700]/10 rounded-sm text-[#ffd700] group-hover:bg-[#ffd700]/20 transition-all">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white group-hover:text-[#ffd700] transition-colors uppercase tracking-wider">Refund Policy</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">Details regarding purchase refunds and conditions.</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPolicy("contact")}
                  className="flex flex-col items-start gap-3 p-5 bg-[#111] border border-[#222] hover:border-[#ffd700]/50 hover:bg-[#161616] rounded-sm transition-all duration-200 cursor-pointer group text-left w-full"
                >
                  <div className="p-2 bg-[#ffd700]/10 rounded-sm text-[#ffd700] group-hover:bg-[#ffd700]/20 transition-all">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white group-hover:text-[#ffd700] transition-colors uppercase tracking-wider">Contact Us</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">Get in touch with support, feedback, or legal inquiries.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 bg-[#0c0c0c] p-6 rounded-lg relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent pointer-events-none"></div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Danger Zone
              </h2>
              <p className="text-xs text-[#888888] leading-relaxed mb-4">
                Permanently delete your account and all associated applications, error logs, and synced configuration settings. This action is irreversible.
              </p>
              
              <button
                onClick={() => {
                  setDeleteConfirmationText("");
                  setDeleteError("");
                  setShowDeleteConfirm(true);
                }}
                className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer border border-red-500/30 hover:border-red-600"
              >
                Delete Account
              </button>
            </div>

            {/* Footer info */}
            <div className="flex justify-between items-center px-2 pt-2">
              <div className="text-[9px] text-[#555] font-bold uppercase tracking-[0.2em]">
                System Version: v0.12.2_stable
              </div>
              <div className="text-[9px] text-[#555] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                Node: US-EAST-1
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) setShowDeleteConfirm(false);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#161616] border border-[#333] rounded-lg p-6 shadow-2xl z-10"
            >
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                Permanent Account Deletion
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed mb-4">
                Warning: Deleting your account will permanently wipe all your registered applications, API keys, error history logs, and profile records from the database. This cannot be undone.
              </p>

              <p className="text-xs text-neutral-400 mb-3">
                To confirm deletion, please type <strong className="text-white select-all">delete my account</strong> in the field below:
              </p>

              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="delete my account"
                disabled={isDeleting}
                className="w-full px-3 py-2 bg-[#090909] border border-[#333] text-white text-xs font-mono rounded-sm focus:outline-none focus:border-red-500 transition-colors mb-4"
              />

              {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold rounded-sm mb-4 leading-normal">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3 font-bold text-[10px] tracking-wider uppercase">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-[#222] text-neutral-400 hover:text-white border border-[#333] rounded-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== "delete my account"}
                  className="px-4 py-2.5 bg-red-600 text-white border border-red-700 hover:bg-red-700 rounded-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:bg-red-600/30 disabled:text-neutral-500 disabled:border-transparent"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Subscription Confirmation Modal */}
      <AnimatePresence>
        {showManageConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManageConfirm(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#161616] border border-[#333] rounded-lg p-6 shadow-2xl z-10"
            >
              <h3 className="text-sm font-bold text-[#ffd700] uppercase tracking-wider mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#ffd700]" />
                Manage Subscription
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed mb-6">
                You are about to be redirected to the secure Dodo Payments customer portal at <strong className="text-white">https://customer.dodopayments.com</strong>.
                There you can view your billing history, update your payment details, or manage your subscription.
              </p>

              <div className="flex justify-end gap-3 font-bold text-[10px] tracking-wider uppercase">
                <button
                  onClick={() => setShowManageConfirm(false)}
                  className="px-4 py-2.5 bg-[#222] text-neutral-400 hover:text-white border border-[#333] rounded-sm transition-all cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  onClick={() => {
                    window.location.href = "https://customer.dodopayments.com";
                  }}
                  className="px-4 py-2.5 bg-[#ffd700] text-black hover:bg-[#ffe240] rounded-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  Proceed to Portal
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
