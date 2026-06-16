import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    Users,
    Package,
    ShoppingCart,
    ArrowUpRight,
    LayoutDashboard
} from "lucide-react";
import React from "react";

export default function Page() {
    return (
        <div className="flex flex-col gap-8 p-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    Dashboard Overview
                </h1>
                <p className="text-muted-foreground text-lg">
                    Welcome back. Here's a quick look at your business performance today.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Total Revenue", value: "$45,231.89", trend: "+20.1%", icon: TrendingUp, color: "text-emerald-500" },
                    { title: "Active Customers", value: "+2,350", trend: "+180.1%", icon: Users, color: "text-blue-500" },
                    { title: "Inventory Items", value: "12,234", trend: "+19%", icon: Package, color: "text-orange-500" },
                    { title: "Recent Sales", value: "+573", trend: "+201", icon: ShoppingCart, color: "text-purple-500" },
                ].map((stat, i) => (
                    <Card key={i} className="overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color} transition-transform group-hover:scale-110`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <span className="text-emerald-500 font-medium flex items-center">
                                    {stat.trend} <ArrowUpRight className="h-3 w-3" />
                                </span>
                                from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-muted/20 rounded-xl m-4 mt-0 border border-dashed border-border/50">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Chart visualization would render here</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {String.fromCharCode(64 + item)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">New purchase order #123{item}</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                    </div>
                                    <div className="text-sm font-medium">+$2{item}0.00</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

