import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'
import {OpenAIEmbeddings} from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone';
import { getPineconeClient } from '@/lib/validators/pinecone'
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
const f = createUploadthing();
 

export const ourFileRouter = {
  
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
  // this middleware is called when someone has requested a file to upload
 // uer->middleware->onUploadComplete
  .middleware(async ({ req }) => {
        const {getUser}=getKindeServerSession();
        const user=await getUser();
        if(!user || !user.id) throw new Error('UNAUTHORIZED')

    return {userId:user.id}
    })
    .onUploadComplete(async ({ metadata, file }) => {
  
        const createdFile=await db.file.create({
            data:{
                key:file.key,
                name:file.name,
                // @ts-ignore
                userId:metadata.userId ,
                url:file.url,
                uploadStatus:"PROCESSING"
            }
        })
        
    try{
        // process of turning text to vector
         const response=await fetch(file.url)
         // used to index the file 
         console.log("1");
         // used to blob the pdf
         const blob=await response.blob();
         console.log("2");
         // load the pdf using PDFLoader in a loader function
         const loader=new PDFLoader(blob);
         console.log("3");
         const pageLevelDocs=await loader.load();
         console.log("4");
         const pagesAmt=pageLevelDocs.length
         console.log("5");
         const pinecone=await getPineconeClient();
         // vectorize and index the entire document
         const pineconeIndex=pinecone.Index("quill");
         console.log("6");
         // used to generate vector from the text
         

         const embeddings = new HuggingFaceInferenceEmbeddings({
           apiKey: "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", // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
         });
         console.log("7");
         console.log(embeddings);
         // store the vector in a pinecone decoument
         await PineconeStore.fromDocuments(pageLevelDocs,embeddings,{
            pineconeIndex,
            namespace:createdFile.id
         })
         console.log("8");
         // updating file to a successful store
         await db.file.update({
            data:{
                uploadStatus:"SUCCESS"
            },
            where:{
                id:createdFile.id
            }
         })
    }
    catch(e){
        console.log("the error is---------"+e);
     await db.file.update({
        data:{
            uploadStatus:"FAILED"
        },
        where:{
            id:createdFile.id
        }
     })
    }
    
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;