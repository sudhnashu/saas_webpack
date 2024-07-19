import { db } from "@/db";
import { sendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
import { OpenAIEmbeddings } from '@langchain/openai';
import  {getPineconeClient}  from '@/lib/validators/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { openai } from "@/lib/openai";
import {OpenAIStream,StreamingTextResponse} from 'ai';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
export const POST = async (req: NextRequest) => {
    // End point for asking questions to a PDF
    const body = await req.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.id) throw new Error('UNAUTHORIZED');
    const { id: userId } = user;

    // Using zod validation 
    const { fileId, message } = sendMessageValidator.parse(body);

    // Find the file
    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId
        }
    });

    if (!file) return new Response('NotFound', { status: 404 });

    // Storing the messages in the database which is sent at the post end point
    await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId
        }
    });

    // Vectorize the incoming message
   
console.log("hum yaha pe hai")
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: "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", // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
});
console.log("hum yaha se nikal gaye hai")
    // Initialize Pinecone client and index
    const pinecone =await getPineconeClient();
    // putting it in a document named quill
    const pineconeIndex = pinecone.Index('quill');
// finding the most relevant pdf page for the question
console.log(4);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: file.id
    });
    console.log(5);
   // Further processing and response handling...
   // retrning the top 4 similar output
 // 
 console.log(6);
   const results=await vectorStore.similaritySearch(message,4);
    // see the previous message the user have done with the pdf
     const prevMessage=await db.message.findMany({
        where:{
            fileId,
            
        },
        orderBy:{
            createdAt:"asc"
        },
        // take the last 6 messages
        take:6
    })
    // formatting the messages to send to  openAI API
    const formattedPrevMessages=prevMessage.map((msg)=>({
        // here const is wriiten to prevent the typescript error
        role:msg.isUserMessage ? "user" as const : "assistant" as const,
        content:msg.text,

    }
    ))
    console.log(11);
    // giving the prompt of sending the message and sending the message to the openAI APi
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
          },
          {
            role: 'user',
            content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
            
      \n----------------\n
      
      PREVIOUS CONVERSATION:
      ${formattedPrevMessages.map((message) => {
        if (message.role === 'user')
          return `User: ${message.content}\n`
        return `Assistant: ${message.content}\n`
      })}
      
      \n----------------\n
      
      CONTEXT:
      ${results.map((r) => r.pageContent).join('\n\n')}
      
      USER INPUT: ${message}`,
          },
        ],
      })
      console.log(12);
// getting the response and updating it in the message db
// sending the response to the user in real time 
      const stream=OpenAIStream(response,{
        async onCompletion(completion){
          await db.message.create({
            data:{
                text:completion,
                isUserMessage:false,
                fileId,
                userId
            }
          })
        }
      })
// returning the response to the client in real time
   return new StreamingTextResponse(stream);



};
