"use client"
import React, {useState} from 'react'

import SupervisedTaskResult from './supervised-task-result'

type SupervisedTaskResult = {
  comment:string
  status:'done'  | 'rejected' | 'pending' 
}

type SupervisedTaskMessageProps = {
  result?:SupervisedTaskResult
}

export default function SupervisedTaskMessage({result}:SupervisedTaskMessageProps) {
  console.log(result)
  const [taskResultUI, setTaskResultUI] = useState<null | React.ReactNode>(
    result && result.status!=="pending" ? <SupervisedTaskResult {...result} /> : null
  )
  return (
    <>
    {
      taskResultUI?(taskResultUI):(<div>
    <div id="chatHistory" className="w-full">
        <div className="flex items-start p-5 mb-4 bg-yellow-100 border border-yellow-200 rounded-lg shadow">
            <div className="text-xl flex items-center justify-center w-8 max-h-8 text-yellow-600 bg-transparent rounded-full mr-4">
                &#x231B;
            </div>
            <div className="flex-grow">
                <h4 className="text-lg font-semibold text-yellow-900">Task in Progress</h4>
                <p className="mt-1 text-sm text-yellow-900">Thank you! I’ve gathered all the information I need and will begin processing now. To ensure everything is perfect, our dedicated Reeply AI Team will also review it thoroughly. This may take up to 24 hours. Once completed, you’ll be notified via email and here in this chat. Stay tuned!</p>
                <small className="block mt-2 text-xs text-yellow-900 opacity-80">Thank you for your patience!</small>
            </div>
        </div>
    </div>
</div>)
    }
    </>
  )
}
