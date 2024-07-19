"use client"
import { ChevronDown, ChevronLeft, Loader2, XCircle } from "lucide-react";
import Messages from "./Messages";
import ChatInput from "./ChatInput";
import { trpc } from "@/app/_trpc/client";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ChatContextProvider } from "./ChatContext";

interface ChatWrapperProps{
    fileId: string; // replace with actual file ID fetched from the API call. For now, using a placeholder string.  // Example: "file-12345"  // In the actual implementation, fetch the file ID from the API call.  // const fileId = await fetchFileIdFromApi();  // return fileId;  // Example: "file-12345"  // In the actual implementation, fetch the file ID from the API call.  // const fileId = await fetchFileIdFromApi();  // return fileId;  // Example: "file-12345"  // In the actual implementation, fetch the file ID from the API call.  // const fileId = await fetchFileIdFromApi();  // return fileId;  // Example: "file-12345"  // In the actual implementation, fetch the file ID from the API call.  //
}
export default function ChatWrapper({fileId}:ChatWrapperProps){
    const {data,isLoading}=trpc.getFileUploadStatus.useQuery({fileId},{
        // // whatever we return will be accessable here
        
        // refetchInterval:(data)=>

        //   // @ts-ignore
        //      data?.status==="SUCCESS" ? false : 500
        
    })

    console.log(data?.status);

    if(isLoading){
        return (
            <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
            <h3 className='font-semibold text-xl'>
              Loading...
            </h3>
            <p className='text-zinc-500 text-sm'>
              We&apos;re preparing your PDF.
            </p>
          </div>
        </div>
        <ChatInput isDisabled/> 
      </div>
        )
    }
    if(data?.status==='PROCESSING'){
        return (
            <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
            <div className='flex-1 flex justify-center items-center flex-col mb-28'>
              <div className='flex flex-col items-center gap-2'>
                <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
                <h3 className='font-semibold text-xl'>
                  Processing PDF...
                </h3>
                <p className='text-zinc-500 text-sm'>
                  This won&apos;t take long.
                </p>
              </div>
            </div>
            <ChatInput isDisabled/> 
          </div>
        )
        
    }
    if(data?.status==='FAILED' ){
        return (
            <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
    <div className='flex-1 flex justify-center items-center flex-col mb-28'>
      <div className='flex flex-col items-center gap-2'>
        <XCircle className='h-8 w-8 text-red-500' />
        <h3 className='font-semibold text-xl'>
         Too Many pages in PDF
        </h3>
        <p className='text-zinc-500 text-sm'>
         Your <span className="font-medium">Free</span>{' '}
          plan supports upto 5 pages per PDF.
        </p>
        <Link href='/dashboard' className={buttonVariants
        ({
           variant:'secondary',
           className:'mt-4'
        })}>
        <ChevronLeft className="h-3 w-3 mr-1.5"/>
             Back
       
        </Link>
      </div>
    </div>
    <ChatInput isDisabled/> 
  </div>
        )
    }
    return (
      <ChatContextProvider fileId={fileId}>
        <div className="relative min-h-full  bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
            <div className="flex-1 flex justify-center items-center flex-col mb-28">
            <Messages fileId={fileId} />
            </div>

            <ChatInput/>
        </div>
        </ChatContextProvider>
    )
}