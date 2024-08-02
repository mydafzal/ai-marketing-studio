import Link from 'next/link';
import {featureToggles} from '@/lib/helpers/feature-toggle/feature-toggles';
import {isEnabled, setFeatureToggle} from '@/lib/helpers/feature-toggle/server-feature-toggle-manager';

export default function FeatureToggles() {
    async function handleSubmit(formData: FormData) {
        'use server';

        for (const toggle of featureToggles) {
            const isToggleEnabled = formData.get(toggle.name) === 'on';
            setFeatureToggle(toggle.name, isToggleEnabled);
        }
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Feature Toggles</h2>
                    <p className="mt-1 text-sm text-gray-600">Enable or disable features for your application</p>
                </div>
                <form action={handleSubmit} className="px-6 py-4">
                    <div className="space-y-4">
                        {featureToggles.map((toggle) => (
                            <div key={toggle.name}
                                 className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                                <div>
                                    <label htmlFor={toggle.name}
                                           className="font-medium text-gray-700">{toggle.name}</label>
                                    <p className="text-sm text-gray-500">{toggle.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name={toggle.name}
                                        id={toggle.name}
                                        defaultChecked={isEnabled(toggle.name)}
                                        className="sr-only peer"
                                    />
                                    <div
                                        className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-800/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-700"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white bg-teal-700 rounded hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            Save Feature Toggles
                        </button>
                    </div>
                </form>
            </div>
            <div className="mt-4">
                <Link href="/feature-toggles/demo" className="text-teal-600 hover:text-teal-800 underline">
                    View Feature Toggle Demo
                </Link>
            </div>
        </div>
    );
}