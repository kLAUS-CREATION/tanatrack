import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardIntoHeading () {
    return (
        <header className="w-full h-[10%]">
            <div className="container h-full mx-auto flex justify-between items-center">
                <Logo />
                <DashboardIntroNewOrganizationButton />
            </div>
        </header>
    )
}

const DashboardIntroNewOrganizationButton = function () {
    return <Link href={'/dashboard/new-organization/plans'}>
        <Button variant={'outline'}>
            New Organization
        </Button>
    </Link>
}
