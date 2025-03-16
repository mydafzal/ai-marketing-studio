// /components/stocks/ai-video-generator/server.tsx

import { AiVideoGenerator } from "./ai-video-generator"
import { BotCard } from "@/components/stocks/message" 
// or wherever your BotCard is exported from

/**
 * No "use client" here. 
 * We default-export a function returning <BotCard> + <AiVideoGenerator />
 */
export default function showAiVideoGenerator() {
  return (
    <BotCard>
      <AiVideoGenerator />
    </BotCard>
  )
}
