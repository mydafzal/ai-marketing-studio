/**
 * API Routes for specific Campaign Form State operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth';
import { CampaignFormStateManager } from '../../../../lib/campaign-form-state/storage-manager';
import { SaveFormStateInput } from '../../../../lib/campaign-form-state/schema';
import { extractFormState } from '../../../../lib/campaign-form-state/form-extractor';

interface Params {
  params: {
    id: string;
  };
}

/**
 * Get a specific form state by ID
 * GET /api/campaign-form-state/[id]
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID and form state ID
    const userId = session.user.email;
    const formStateId = params.id;
    
    // Get the form state
    const formState = await CampaignFormStateManager.getFormState(userId, formStateId);
    
    if (!formState) {
      return NextResponse.json(
        { success: false, error: 'Form state not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, formState });
  } catch (error) {
    console.error('Error in campaign form state GET by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update a specific form state
 * PUT /api/campaign-form-state/[id]
 */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID and form state ID
    const userId = session.user.email;
    const formStateId = params.id;
    
    // Parse the input
    const data = await req.json();
    
    // Use the extractor to format the input
    const input: SaveFormStateInput = extractFormState(data);
    
    // Update the form state
    const result = await CampaignFormStateManager.updateFormState(
      userId,
      formStateId,
      input
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update form state' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in campaign form state PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a specific form state
 * DELETE /api/campaign-form-state/[id]
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID and form state ID
    const userId = session.user.email;
    const formStateId = params.id;
    
    // Delete the form state
    const result = await CampaignFormStateManager.deleteFormState(userId, formStateId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in campaign form state DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}