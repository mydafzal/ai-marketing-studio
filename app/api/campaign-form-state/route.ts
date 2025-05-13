/**
 * API Routes for Campaign Form State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';
import { CampaignFormStateManager } from '../../../lib/campaign-form-state/storage-manager';
import { SaveFormStateInput } from '../../../lib/campaign-form-state/schema';
import { extractFormState } from '../../../lib/campaign-form-state/form-extractor';

/**
 * Save a campaign form state
 * POST /api/campaign-form-state
 */
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID
    const userId = session.user.email;
    
    // Parse the input
    const data = await req.json();
    
    // Use the extractor to format the input
    const input: SaveFormStateInput = extractFormState(data);
    
    // Save the form state
    const result = await CampaignFormStateManager.saveFormState(userId, input);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in campaign form state POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get all campaign form states for the current user
 * GET /api/campaign-form-state
 */
export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID
    const userId = session.user.email;
    
    // Get the list of form states
    const formStates = await CampaignFormStateManager.listFormStates(userId);
    
    return NextResponse.json({ success: true, formStates });
  } catch (error) {
    console.error('Error in campaign form state GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}