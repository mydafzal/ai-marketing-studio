import React from 'react'


type SupervisedTaskResult = {
    comment:string
    status:'done'  | 'rejected' | 'pending' 
}
  
export default function SupervisedTaskResult({comment, status}:SupervisedTaskResult) {
  return (
// &#10003; tick hex
    <>
    {status=="done"?
    (<div>
        <div id="chatHistory" className="w-full">
            <div className="flex items-start p-5 mb-4 bg-green-100 border border-green-200 rounded-lg shadow">
                <div className="text-xl flex items-center justify-center w-8 max-h-8 text-green-600 bg-transparent rounded-full mr-4">
                    &#x2714;
                </div>
                <div className="flex-grow">
                    <h4 className="text-lg font-semibold text-green-900">Task Completed</h4>
                    <p className="mt-1 text-sm text-green-900">{comment}</p>
                    <small className="block mt-2 text-xs text-green-900 opacity-80">Thank you for your collaboration!</small>
                </div>
            </div>
        </div>
    </div>
    )
    :(
    <div>
        <div id="chatHistory" className="w-full">
            <div className="flex items-start p-5 mb-4 bg-red-100 border border-red-200 rounded-lg shadow">
                <div className="text-xl flex items-center justify-center w-8 max-h-8 text-red-600 bg-transparent rounded-full mr-4">
                    &#x2716;
                </div>
                <div className="flex-grow">
                    <h4 className="text-lg font-semibold text-red-900">Task Rejected</h4>
                    <p className="mt-1 text-sm text-red-900">{comment}</p>
                    <small className="block mt-2 text-xs text-red-900 opacity-80">Thank you for understanding.</small>
                </div>
            </div>
        </div>
    </div>
    )
    }
    </>
  )
}
