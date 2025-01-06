export interface InvoiceItem {
  date: Date
  invoiceNumber: string
  amount: number
}
export interface PaymentHistoryProps {
  invoices: InvoiceItem[]
}

export function PaymentHistory({ invoices }: PaymentHistoryProps) {
  return (
    <div className="p-6 bg-gray-50 ">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-purple-600 mb-4">
            Subscription Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-left">
              <thead>
                <tr className="bg-purple-50 text-gray-700">
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
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      {invoice.date.toLocaleDateString()}{' '}
                      {/* Format the date */}
                    </td>
                    <td className="py-3 px-4 text-green-600 underline cursor-pointer">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      €{(invoice.amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      <button className="p-2 bg-gray-100 rounded hover:bg-gray-200">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 10l5 5m0 0l5-5m-5 5V3"
                          />
                        </svg>
                      </button>
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
