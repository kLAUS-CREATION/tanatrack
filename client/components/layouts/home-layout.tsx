import React from "react";
import Header from "../landing/header";

export default function HomeLayout ( { children } : { children: React.ReactNode }) {
    return (
        <div className="w-full h-screen overflow-hidden">
            {/* Header Section*/}
            <section className="w-full h-[8%]">
                <Header />
            </section>

            {/* Main Section*/}
            <section className="w-full h-[92%] overflow-y-auto">
                { children }
            </section>
        </div>
    )
}
