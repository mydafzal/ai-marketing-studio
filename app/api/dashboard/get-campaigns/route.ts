import { NextResponse } from 'next/server'
import { decryptToken } from '@/app/cryptoUtils';
import { getFbMarketingApiKey } from '@/app/actions';

// Facebook Graph API constants
const FACEBOOK_API_VERSION = 'v22.0';
const FACEBOOK_GRAPH_API_ENDPOINT = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

// Helper function to make requests to Facebook Graph API
async function makeFacebookRequest(endpoint: string, params: Record<string, string>, token: string) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${FACEBOOK_GRAPH_API_ENDPOINT}/${endpoint}?${queryParams}&access_token=${token}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Facebook API error: ${response.status}`);
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error making Facebook request to ${endpoint}:`, error);
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fbAccountId = searchParams.get('fb_account_id');
    const limit = parseInt(searchParams.get('limit') || '7', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!fbAccountId) {
        return NextResponse.json({ error: 'fbAccountId is required' }, { status: 400 });
    }

    try {
        // Get and decrypt the Facebook token
        const tokenResp = await getFbMarketingApiKey();
        
        if (!tokenResp.success || !tokenResp.token) {
            return NextResponse.json({ error: 'Failed to get Facebook API key' }, { status: 401 });
        }
        
        const token = await decryptToken(tokenResp.token);
        
        // Step 1: Get campaigns for the ad account
        const campaignsEndpoint = `${fbAccountId}/campaigns`;
        const campaignsParams = {
            'fields': 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time',
            'limit': (limit + offset).toString()
        };
        
        const campaignsResponse = await makeFacebookRequest(campaignsEndpoint, campaignsParams, token);
        
        if (!campaignsResponse || !campaignsResponse.data) {
            return NextResponse.json({ error: 'Failed to fetch campaigns from Facebook' }, { status: 500 });
        }
        
        // Apply offset and limit
        const paginatedCampaigns = campaignsResponse.data.slice(offset, offset + limit);
        
        // Step 2: For each campaign, get ad creatives to use as thumbnails
        const enhancedCampaigns = await Promise.all(
            paginatedCampaigns.map(async (campaign: any) => {
                // Get ads for this campaign to find creatives
                const adsEndpoint = `${campaign.id}/ads`;
                const adsParams = {
                    'fields': 'id,name,creative{id,thumbnail_url,image_url,object_story_spec}',
                    'limit': '5' // Limit to just a few ads to get thumbnails
                };
                
                const adsResponse = await makeFacebookRequest(adsEndpoint, adsParams, token);
                
                // Default thumbnail if we can't find one
                let thumbnail = 'https://via.placeholder.com/400x250/0A0C14/FFFFFF?text=No+Preview';
                let previewType = 'placeholder';
                
                // Try to find a thumbnail from the creative
                if (adsResponse && adsResponse.data && adsResponse.data.length > 0) {
                    for (const ad of adsResponse.data) {
                        if (ad.creative) {
                            // Check for thumbnail URL
                            if (ad.creative.thumbnail_url) {
                                thumbnail = ad.creative.thumbnail_url;
                                previewType = 'thumbnail';
                                break;
                            }
                            
                            // Check for image URL
                            if (ad.creative.image_url) {
                                thumbnail = ad.creative.image_url;
                                previewType = 'image';
                                break;
                            }
                            
                            // If we have an object_story_spec, we might try to get a creative preview
                            if (ad.creative.object_story_spec && ad.creative.id) {
                                // We'll just store the creative ID and get the preview later
                                const creativeId = ad.creative.id;
                                
                                // Try to get preview
                                const previewEndpoint = `${creativeId}/previews`;
                                const previewParams = {
                                    'ad_format': 'DESKTOP_FEED_STANDARD'
                                };
                                
                                const previewResponse = await makeFacebookRequest(previewEndpoint, previewParams, token);
                                
                                if (previewResponse && previewResponse.data && previewResponse.data.length > 0) {
                                    // For the demo, we'll just use the first preview
                                    thumbnail = previewResponse.data[0].body;
                                    previewType = 'preview_html';
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // Calculate budget (daily or lifetime)
                let budget = 0;
                if (campaign.daily_budget) {
                    budget = parseFloat(campaign.daily_budget) / 100; // FB returns budget in cents
                } else if (campaign.lifetime_budget) {
                    budget = parseFloat(campaign.lifetime_budget) / 100;
                }
                
                // Fetch insights/metrics for this campaign
                const insightsEndpoint = `${campaign.id}/insights`;
                const insightsParams = {
                    'fields': 'impressions,clicks,ctr,spend,actions,cost_per_action_type',
                    'date_preset': 'last_30d'
                };
                
                const insightsResponse = await makeFacebookRequest(insightsEndpoint, insightsParams, token);
                
                // Default metrics
                let metrics = {
                    ctr: '0%',
                    conversions: 0,
                    cpa: '$0',
                    clicks: 0,
                    impressions: 0,
                    spend: '$0',
                    leads: 0
                };
                
                // Update metrics with actual data if available
                if (insightsResponse && insightsResponse.data && insightsResponse.data.length > 0) {
                    const insights = insightsResponse.data[0];
                    
                    // Extract conversion actions (if available)
                    let conversions = 0;
                    let costPerConversion = 0;
                    
                    if (insights.actions) {
                        // Find the conversion actions based on campaign objective
                        const conversionActions = insights.actions.filter((action: any) => {
                            // Common conversion types
                            return action.action_type === 'offsite_conversion' || 
                                   action.action_type === 'lead' ||
                                   action.action_type === 'purchase';
                        });
                        
                        if (conversionActions.length > 0) {
                            conversions = conversionActions.reduce((sum: number, action: any) => {
                                return sum + parseInt(action.value || '0', 10);
                            }, 0);
                        }
                    }
                    
                    // Try to get cost per conversion from cost_per_action_type
                    if (insights.cost_per_action_type) {
                        const cpaEntries = insights.cost_per_action_type.filter((entry: any) => {
                            return entry.action_type === 'offsite_conversion' || 
                                  entry.action_type === 'lead' ||
                                  entry.action_type === 'purchase';
                        });
                        
                        if (cpaEntries.length > 0) {
                            costPerConversion = parseFloat(cpaEntries[0].value || '0');
                        }
                    }
                    
                    // Update metrics with actual values
                    metrics = {
                        ctr: `${(parseFloat(insights.ctr || '0') * 100).toFixed(2)}%`,
                        conversions: conversions,
                        cpa: `$${costPerConversion.toFixed(2)}`,
                        clicks: parseInt(insights.clicks || '0', 10),
                        impressions: parseInt(insights.impressions || '0', 10),
                        spend: `$${parseFloat(insights.spend || '0').toFixed(2)}`,
                        leads: 0 // We'll leave leads at 0 for now
                    };
                }
                
                // Calculate performance scores based on metrics
                // These are relative scores for visualization
                const performance = {
                    ctr: Math.min(100, Math.max(10, parseFloat(metrics.ctr) * 25)),
                    conversions: Math.min(100, Math.max(10, metrics.conversions > 0 ? 50 : 30)),
                    cpa: Math.min(100, Math.max(10, metrics.conversions > 0 ? 50 : 30))
                };
                
                return {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    objective: campaign.objective,
                    thumbnail,
                    previewType,
                    budget: budget * 30, // Monthly budget estimate based on daily
                    startDate: campaign.start_time || campaign.created_time,
                    endDate: campaign.stop_time || '',
                    metrics,
                    performance
                };
            })
        );
        
        return NextResponse.json({
            success: true,
            campaigns: enhancedCampaigns,
            total: campaignsResponse.data.length,
            paging: campaignsResponse.paging || null
        });
    } catch (error) {
        console.error('Error fetching dashboard campaigns:', error);
        return NextResponse.json({ error: 'Failed to process campaign data' }, { status: 500 });
    }
}