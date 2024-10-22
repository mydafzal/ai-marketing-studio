import React from 'react'

export default function SupervisedTaskMessage() {
  return (
    <div>
        <div id="chatHistory" className="w-full">
            <div className="flex items-start p-5 mb-4 bg-green-100 border border-green-200 rounded-lg shadow">
            <div className="flex items-center justify-center w-8 max-h-8 text-white bg-green-500 rounded-full mr-4">
                &#10003;
            </div>
            <div className="flex-grow">
                <h4 className="text-lg font-semibold text-green-900">Task in Progress</h4>
                <p className="mt-1 text-sm text-green-900">I will be taking care of A/B testing task. It may take up to 24 hours. You will be informed via email once it is finished.</p>
                <small className="block mt-2 text-xs text-green-900 opacity-80">Thank you for your patience!</small>
            </div>
            </div>
        </div>
        {/* <p className='mb-2'>We are taking care of this taks. This may take upto 24 hours. Team Reeply will reach you on your registered email.</p>
        <p className='mb-2'>If you want to get this task completed urgently. Please click on below link to schedule a meeting with us.</p>
        <a href="#" className='text-blue-500'>Schedule meeting</a> */}
    </div>
  )
}
