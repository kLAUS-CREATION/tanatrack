"use client"

import React, { useState } from "react"
import SectionHeading from "@/components/shared/section-heading"
import OrganizationCreationForm from "./organization-creation-form"
import PlansSelection from "./plans-selection"
import { BillingInterval } from "@/types/organization"

export default function NewOrganization() {
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [planInterval, setPlanInterval] = useState<BillingInterval>(BillingInterval.MONTHLY)

    const updatePlanInterval = function (planInterval: BillingInterval) {
        setPlanInterval(planInterval)
    }

    return (
        <div className="w-[98%] lg:w-[95%] mx-auto size-full">
            <div className="py-6 mb-10 border-b border-border/50">
                <SectionHeading
                    title1="Create Your New"
                    title2="Organization"
                    desc="Select a pricing tier and name your workspace. You will get 14 days of full access to all features on your first purchase."
                />
            </div>

            <div className="w-full flex flex-col lg:flex-row gap-12 items-start backdrop-blur-md rounded-[2.5rem]">
                <OrganizationCreationForm planInterval={planInterval} selectedPlanId={selectedPlanId} />
                <PlansSelection
                    onUpdatePlanInterval={updatePlanInterval}
                    planInterval={planInterval}
                    selectedPlanId={selectedPlanId}
                    onSelect={(id) => setSelectedPlanId(id)}
                />
            </div>
        </div>
    )
}
