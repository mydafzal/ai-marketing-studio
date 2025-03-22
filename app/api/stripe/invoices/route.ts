import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
})

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customer ID' }, { status: 400 })
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100
    })

    const mapped = invoices.data.map((invoice) => ({
      date: new Date(invoice.created * 1000),
      invoiceNumber: invoice.number,
      amount: invoice.amount_paid,
      hosted_invoice_url: invoice.hosted_invoice_url
    }))

    return NextResponse.json({ invoices: mapped })
  } catch (error) {
    console.error('Invoice fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
