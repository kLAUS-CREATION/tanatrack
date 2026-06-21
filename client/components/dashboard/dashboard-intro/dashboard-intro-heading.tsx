import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardIntoHeading () {
    return (
        <header className="w-full h-[7%] border-b">
            <div className="w-[98%] lg:w-[95%] h-full mx-auto flex justify-between items-center">
                <Logo />
                <DashboardIntroNewOrganizationButton />
            </div>
        </header>
    )
}

const DashboardIntroNewOrganizationButton = function () {
    return <Link href={'/organizations/new'}>
        <Button>
            New Organization
        </Button>
    </Link>
}
