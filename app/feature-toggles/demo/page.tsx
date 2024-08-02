import {isEnabled as isEnabledServer} from '@/lib/helpers/feature-toggle/server-feature-toggle-manager';
import ClientSideDemo from './ClientSideDemo';

export default function FeatureToggleDemo() {
    const isDemoToggleEnabled = isEnabledServer('demoToggle');

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-4">Feature Toggle Demo</h1>

            <div className="mb-8 p-4 border border-gray-300 rounded">
                <h2 className="text-xl font-semibold mb-2">Server-Side Rendering</h2>
                <p className="mb-4">
                    This section is rendered on the server.
                    {isDemoToggleEnabled && (
                        <span className="text-green-600 font-semibold">
                            {" "}This additional text is only visible when the demoToggle feature is enabled (server-side).
                        </span>
                    )}
                </p>
                <p className="text-sm text-gray-600">
                    Current state of demoToggle (server-side): {isDemoToggleEnabled ? 'Enabled' : 'Disabled'}
                </p>
            </div>

            <ClientSideDemo initialToggleState={isDemoToggleEnabled}/>
        </div>
    );
}