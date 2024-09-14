import AdminStatsFetcher from "@/app/admin/stats/OverallStats";
import UserStatsFetcher from "@/app/admin/stats/UserStats";

export default function StatsPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold text-gray-500 mb-10">Statistics Dashboard</h1>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Overall Statistics</h2>
                    </div>
                    <div className="p-6">
                        <AdminStatsFetcher />
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Specific Data</h2>
                    </div>
                    <div className="p-6">
                        <UserStatsFetcher />
                    </div>
                </div>
            </div>
        </div>
    );
}
