import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the experiment (RLS policies will ensure user can only delete their org's experiments)
    // This will cascade delete related variant_assignments
    const { error, count } = await supabase
      .from('experiments')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('Error deleting experiment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Experiment not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/experiments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
