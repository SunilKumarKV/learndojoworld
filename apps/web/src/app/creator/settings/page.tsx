"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { CreatorProfileForm } from "@/features/creator/components/creator-profile-form";
import { useCreatorProfile, useCreatorProfileUpdate } from "@/features/creator/hooks/use-creator";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import type { CreatorProfilePayload } from "@/services/creator.api";

export default function CreatorSettingsPage() {
  const profileQuery = useCreatorProfile();
  const updateMutation = useCreatorProfileUpdate();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(payload: CreatorProfilePayload) {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateMutation.mutateAsync(payload);
      setSuccessMessage("Creator profile updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update creator profile.");
    }
  }

  if (profileQuery.isLoading) return <LoadingState />;
  if (profileQuery.isError) {
    return (
      <ErrorState
        message={
          profileQuery.error instanceof Error
            ? profileQuery.error.message
            : "Unable to load creator profile."
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Settings</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Creator profile
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Edit the profile foundation that will support future marketplace and course pages.
        </p>
      </section>

      <Card>
        <CardContent className="p-6 sm:p-8">
          {successMessage ? (
            <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <CreatorProfileForm
            initialProfile={profileQuery.data}
            isSubmitting={updateMutation.isPending}
            mode="settings"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
