  import { ServerActionResult } from "ai";

// Server-side API for showing Ad Creatives Switcher in sidebar
export default async function showAdCreativesSwitcher(): Promise<ServerActionResult> {
  // Simply return a result that indicates the client should load the UI
  return {
    toolName: "showAdCreativesSwitcher",
    result: {}
  };
}