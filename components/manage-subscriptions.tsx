"use client";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { DollarSign } from "lucide-react";

const ManageSubscription = () => {
    const router = useRouter();

    return (
        <Button
            variant="ghost"
            onClick={() => router.push("/subscription")}
            className="w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
            <DollarSign className="size-4" />
            Manage Subscriptions
        </Button>
    );
};

export default ManageSubscription;
