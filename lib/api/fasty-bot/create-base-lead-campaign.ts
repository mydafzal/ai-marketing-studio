import {getFbMarketingApiKey, getUserDetail} from '@/app/actions'

interface CampaignCreateRequest {
    fbAccountId?: string
    campaign_name: string
}

export async function createBaseLeadCampaign(
    request: CampaignCreateRequest
): Promise<any> {
    try {
        let {
            fbAccountId,
            campaign_name,
        } = request

        const userDetail = await getUserDetail();
        let fbPageId = ""
        let privacyPolicyLink = ""
        let userSubPrompt = ""

        if (userDetail.success && userDetail.user) {
            fbPageId = String(userDetail.user.fbPageId || '')
            privacyPolicyLink = String(userDetail.user.privacyPolicyLink || '')
            userSubPrompt = String(userDetail.user.defaultExtraDetails || '')
        }
        let company_name = ""

        if (!fbAccountId) {
            fbAccountId = userDetail?.user?.fbAccountId || '0'
        }

        if (!company_name) {
            company_name = userDetail?.user?.company_name || ''
        }

        let payload: {
            fb_account_id: string;
            company_name?: string;
            campaign_name: string;
            page_id?: string;
            privacy_policy_link?: string;
            user_sub_prompt?: string;
        } = {
            fb_account_id: fbAccountId,
            campaign_name,
            privacy_policy_link: privacyPolicyLink,
            user_sub_prompt: userSubPrompt,
        };

        if (company_name && company_name.trim() !== "") {
            payload.company_name = company_name;
        }

        if (fbPageId) {
            payload.page_id = fbPageId;  // Changed from fbPageId to page_id
        }

        const fastyEndpoint = process.env.FASTY_API_URL
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/campaign/create-lead-campaign-base`
        console.log('payload to create a base lead campaign', payload)
        const token_resp = await getFbMarketingApiKey()
        let token = ""
        if (token_resp.success && token_resp.token) {
            token = token_resp.token
        }

        return await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token,
                'x-api-key': `${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(payload)
        })
    } catch (error) {
        console.error('Error create campaign:', error)
        return false
    }
}