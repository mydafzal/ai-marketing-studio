import React from "react";

export function LoginFooter() {
    return (
        <footer className="fixed bottom-2 left-0 right-0 h-8 bg-gray-50 border-t border-gray-300 px-4 py-2">
            <ul className="flex justify-center space-x-4 text-zinc-700">
                <li>
                    <a href="https://reeply.ai/" target="_blank" rel="noopener noreferrer">
                        About Reeply AI
                    </a>
                </li>
                <li>
                    <a href="https://reeply.ai/TermsOfService" target="_blank" rel="noopener noreferrer">
                        Terms of Service
                    </a>
                </li>
                <li>
                    <a href="https://reeply.ai/PrivacyPolicy" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                    </a>
                </li>
                <li>
                    <a href="https://reeply.ai/RefundPolicy" target="_blank" rel="noopener noreferrer">
                        Refund Policy
                    </a>
                </li>
                <li>
                    <a href="https://reeply.ai/Pricing" target="_blank" rel="noopener noreferrer">
                        Pricing
                    </a>
                </li>
                <li>
                    <a href="https://reeply.ai/Imprint" target="_blank" rel="noopener noreferrer">
                        Imprint
                    </a>
                </li>
            </ul>
        </footer>
    );
}