// app/admin/page.tsx
import AdminForm from './AdminForm'
import Link from 'next/link'

export default function AdminPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
            <div className="grid md:grid-cols-2 gap-6">
                {/* Card for Mapping Chat Slug to Campaign ID */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Map Chat Slug to Campaign ID</h2>
                    </div>
                    <AdminForm />
                </div>

                {/* Card for Assigning Extra Details to Chat Slug */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Assign Extra Details to Chat</h2>
                    </div>
                    <AdminForm extraDetails />
                </div>

                {/* Card for Feature Toggles Link */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Feature Toggles</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Feature toggles are used to safely test changes in production and only go live when changes are
                            fully implemented and tested. They are also utilized for enabling certain admin-only functionalities
                            within the application, allowing for controlled access to specific features.
                        </p>
                        <Link
                            href="/feature-toggles"
                            className="block w-full text-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition duration-150 ease-in-out"
                        >
                            View Feature Toggles
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}