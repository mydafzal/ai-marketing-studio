import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", 
});

export async function gpt_process_comment(comment:string) {

  const prompt = `This is the comment provided by the admin to the user about a task initiated by the user. 
  Please rephrase it in a professional manner. 
  Admin Comment: ${comment}
  
  Remember, this response will be directly displayed to the user as part of an ongoing chat. 
  Ensure it sounds natural and professional without greetings or signatures. 
  `

    if (!prompt) {
      throw Error("Prompt  is required");
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      });

      const message = completion.choices[0].message?.content;
      return {
        success:true,
        message:message
      }
  }
  catch{
    return {
        success:false,
        message:"Error in processing GPT API request"
    }
  }
}
