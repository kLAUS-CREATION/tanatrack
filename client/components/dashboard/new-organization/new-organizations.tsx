"use client"

import React, { useState } from "react"
import SectionHeading from "@/components/shared/section-heading"
import OrganizationCreationForm from "./organization-creation-form"
import PlansSelection from "./plans-selection"

export default function NewOrganization() {
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");

    return (
        <div className="w-[98%] lg:w-[95%] mx-auto px-4  min-h-screen">
            <div className="py-6 mb-10 border-b border-border/50">
                <SectionHeading
                    title1="Create Your New"
                    title2="Organization"
                    desc="Select a pricing tier and name your workspace. You will get 14 days of full access to all features on your first purchase."
                />
            </div>

            <div className="w-full flex flex-col lg:flex-row gap-12 items-start backdrop-blur-md rounded-[2.5rem]">

                <OrganizationCreationForm selectedPlanId={selectedPlanId} />

                <PlansSelection
                    selectedPlanId={selectedPlanId}
                    onSelect={(id) => setSelectedPlanId(id)}
                />

            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                By creating an organization, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    )
}
