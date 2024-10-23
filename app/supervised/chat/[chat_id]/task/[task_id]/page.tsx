import { getTaskAndPreviousMessages, updateTaskWithStatus } from "@/app/actions";
import { redirect } from "next/navigation";

interface Props {
  params: {
    chat_id: string;
    task_id: string;
  };
}

// Server-side function to handle task updates
async function handleTaskUpdate(formData: FormData) {
    "use server"
  const chat_id = formData.get('chat_id') as string;
  const task_id = formData.get('task_id') as string;
  const comment = formData.get('comment') as string;
  const status = formData.get('status') as 'done' | 'reject';

  await updateTaskWithStatus(chat_id, task_id, { comment, status });
  redirect(`/supervised/chat/${chat_id}/task/${task_id}`);
}

export default async function TaskPage({ params }: Props) {
  const { chat_id, task_id } = params;

  // Fetch the task data from the server
  const data = await getTaskAndPreviousMessages(chat_id, task_id);

  // If no task is found
  if (!data) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="max-w-lg bg-white shadow-lg rounded-lg p-8">
          <p className="mt-4 text-red-500 font-semibold">
            This task not found.
          </p>
        </div>
      </div>
    );
  }

  const { task, previousMessages } = data;

  type SupervisedToolResult = {
    type:string;
    toolName:string;
    toolCallId:string;
    result:{
      comment:string;
      status:string;
    }
  }

  const tool_data = task.content as SupervisedToolResult[];
  if (tool_data[0].result.status!="pending") {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="max-w-lg bg-white shadow-lg rounded-lg p-8">
          <p className="mt-4 text-red-500 font-semibold">
            This task is already in {tool_data[0].result.status} state
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="max-w-[1000px] w-full bg-white shadow-lg rounded-lg p-8">
        {/* Header */}
        <div className="bg-green-100 p-4 text-center text-xl font-bold text-green-800 rounded-t-lg">
          Supervised Task Update
        </div>

        {/* Task and Messages */}
        <div className="p-6">
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700">Last 6 Messages</h3>
            <div className="mt-2 p-4 bg-gray-50 border border-gray-300 rounded-md">
              {previousMessages.length > 0 ? (
                previousMessages.map((message, index) => (
                  <div key={index} className="mt-4 p-4 bg-gray-100 rounded-md">
                    <p>{message.content.toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No previous messages available.</p>
              )}
            </div>
          </div>

          {/* Form for comment and task update */}
          <form action={handleTaskUpdate} method="post" className="mt-6">
            <input type="hidden" name="chat_id" value={chat_id} />
            <input type="hidden" name="task_id" value={task_id} />

            <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
              Your comments
            </label>
            <textarea
              id="comments"
              name="comment"
              rows={3}
              className="mt-2 p-3 w-full border border-gray-300 rounded-md"
              placeholder="Add your comments here"
              required
            ></textarea>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                type="submit"
                name="status"
                value="reject"
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Reject Task
              </button>
              <button
                type="submit"
                name="status"
                value="done"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Complete Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
