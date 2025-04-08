export interface InvoiceItem {
  date: Date
  invoiceNumber: string
  amount: number
  hosted_invoice_url: string
}
export interface PaymentHistoryProps {
  invoices: InvoiceItem[]
}


export function PaymentHistory({ invoices }: PaymentHistoryProps) {
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto bg-[#1A1D29] shadow-md rounded-lg border border-[#2A2E3A]">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[#C084FC] mb-4">
            Subscription Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-[#2A2E3A] text-left text-white">
              <thead>
                <tr className="bg-[#2A2E3A] text-[#ADB0B8]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Invoice Number</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr
                    key={index}
                    className="border-t border-[#2A2E3A] hover:bg-[#232733]"
                  >
                    <td className="py-3 px-4">
                      {invoice.date.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-green-400 underline">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-white">
                      €{(invoice.amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-white">
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#2A2E3A] rounded hover:bg-[#343a46] inline-block"
                        title="Download Invoice"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="size-5 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 10l5 5m0 0l5-5m-5 5V3"
                          />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
