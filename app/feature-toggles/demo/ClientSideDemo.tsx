'use client';

import {useState, useEffect} from 'react';
import {isFeatureToggleEnabled} from "@/lib/helpers/feature-toggle/feature-toggle-manager";

export default function ClientSideDemo({initialToggleState}: { initialToggleState: boolean }) {
    const [isDemoToggleEnabled, setIsDemoToggleEnabled] = useState(initialToggleState);

    useEffect(() => {
        const clientSideState = isFeatureToggleEnabled('demoToggle');
        setIsDemoToggleEnabled(clientSideState);
    }, []);

    return (
        <div className="p-4 border border-gray-300 rounded">
            <h2 className="text-xl font-semibold mb-2">Client-Side Rendering</h2>
            <p className="mb-4">
                This section is rendered on the client.
                {isDemoToggleEnabled && (
                    <span className="text-green-600 font-semibold">
                        {" "}This additional text is only visible when the demoToggle feature is enabled (client-side).
                    </span>
                )}
            </p>
            <p className="text-sm text-gray-600">
                Current state of demoToggle (client-side): {isDemoToggleEnabled ? 'Enabled' : 'Disabled'}
            </p>
        </div>
    );
}