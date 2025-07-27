"use client";

import { BillingDashboard } from "@/components/BillingDashboard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <BillingDashboard />
      </div>
    </DashboardLayout>
  );
} 