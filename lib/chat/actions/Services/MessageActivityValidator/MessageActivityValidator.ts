import { Message, Session } from "@/lib/types";
import {differenceInHours} from "date-fns";
import {sendAdminNotification} from "@/lib/api/fasty-bot/send-admin-notification";

class MessageActivityValidator{

    public async informAdminIfThisIsNewActivity(chatId: string, messages: Message[], session: Session | null ): Promise<boolean>{

        if(session === null || session.user === undefined){
            return false;
        }

        if(this.getIgnoredEmails().includes(session.user.email))
        {
            return false;
        }

        const userMessages = this.getUserMessages(messages);

        if(this.hadMessagesInTheLastNHours(16, userMessages))
        {
            return false;
        }

        await sendAdminNotification(chatId);
        return true;
    }

    // Todo: Create a provider for this later on
    private getIgnoredEmails() : string[] {
        return [
            'teo.kostelac@outlook.com',
            'contact@reeply.net',
            'themadnoise@gmail.com',
            'maxnols@reeply.net',
            'madani.farzam@gmail.com'
        ];
    }

    private getUserMessages(messages: Message[]): Message[] {
        return messages.filter(
            message => message.role === 'user'
        )
    }

    private hadMessagesInTheLastNHours(hours: number, messages: Message[]): boolean {
        return messages.some(
            message => {
                if(message === null || message.timestamp === undefined) {
                    return false;
                }
                const now = new Date();
                const HoursTillMessage = differenceInHours(now, message.timestamp);

                return HoursTillMessage < hours;
            }
        )
    }

}

export default MessageActivityValidator;


