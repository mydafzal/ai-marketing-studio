import { CoreMessage } from 'ai'

export type Message = CoreMessage & {
  id: string;
  timestamp: string;
}

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  path: string;
  messages: Message[];
  sharePath?: string;
  logins?: string[];  
  timeSpent?: number; 
  messagesCount?: number;
  campaignId?: string; 
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string;
    }
>

export interface UserStats {
  chats: number;  
  messages: number;
}

export interface Session {
  user: {
    id: string;
    email: string;
  };
}

export interface AuthResult {
  type: string;
  message: string;
}

export interface User extends Record<string, any> {
  id: string;
  email: string;
  password: string;
  salt: string;
  fbAccountId?: string;
  chatCount?: number;  
  messagesCount?: number;  
}

export interface Campaign extends Record<string, any> {
  id: string;
  title: string;
  userId: string;
  content: string;
}

export interface AdText {
  id: number;
  image: string;
  date: string;
  text: string;
  headline: string;
  fbAdId?: string;
}

export interface ChatStatistics {
  totalChatsWithCampaignID: number;  
  uniqueChatsWithCampaignID: number; 
  chatsPerUser: Record<string, number>;
}

export interface TimeStatistics {
  totalLogins: number;  
  totalMessages: number; 
  totalTimeSpent: number;  
}
