import { createContext, useState ,useRef} from "react";
import { useToast } from "../ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
type StreamResponse={
    addMessage:()=>void
    message:string,
    handleInputChange:(event:React.ChangeEvent<HTMLTextAreaElement>)=>void,
    isLoading:boolean
}

export const ChatContext=createContext<StreamResponse>({
    // function to add a message
    addMessage:()=>{},
    // message we are going to add
    message:'',
    handleInputChange:()=>{},
    isLoading:false
})
interface Props{
    fileId:string,
    children:React.ReactNode
}
export const ChatContextProvider=({fileId,children}:Props)=>{
     const[message,setMessage]=useState<string>(' ');
     const [isLoading,setIsLoading]=useState<boolean>(false);
     // optimisic approach in displayint the messages
     const utils=trpc.useContext();
     // used to keep a track of the backup message
     const backupMessage=useRef('');
      const {toast}=useToast();
      const {mutate:sendMessage}=useMutation({
        mutationFn:async({message}:{message:string})=>{
            const response=await fetch('/api/message',{
                method:'POST',
                body:JSON.stringify({
                    fileId,
                    message
                })
            })
            if(!response.ok){
                throw new Error('Failed to send message')
            }
            return response.body
        },
        // it will be called as soon as we send the message->as we click on Enter to send the message
        // used for optimistic updates for instant feedback
       onMutate:async({message})=>{
        // step1-> first create a backup of the message
         backupMessage.current=message
         setMessage(' ');
      // step 2->we want to cancel any outgoing fetches so that they do not override
          await utils.getFileMessages.cancel();
    // step 3->keep a snapshot of the previous messages we have
    const previousMessages=await utils.getFileMessages.getInfiniteData();
    // insert new values as we send the message
    utils.getFileMessages.setInfiniteData(
        {fileId,limit:INFINITE_QUERY_LIMIT},
        // used to add the old messages to the new messages list
        (old)=>{
            if(!old){
                return {
                    pages:[],
                    pageParams:[]
                }
            }
            // cloning the old pages
            let newPages=[...old.pages];
            // adding the new message to the first page
            let latestPage=newPages[0];
            // combining the old messages and the new messages
            latestPage.messages=[
                {
                    createdAt:new Date().toISOString(),
                    id:crypto.randomUUID(),
                    text:message,
                    isUserMessage:true
                },
                ...latestPage.messages
            ]
          // changing the new messages
            newPages[0]=latestPage; 
            return {
                ...old,
                pages:newPages
            }
        }
    )

    setIsLoading(true);

    return{
        previousMessages:previousMessages?.pages.flatMap((page)=>
        page.messages ?? []
        )
    }
     
       },

       onError:(_,__,context)=>{
         setMessage(backupMessage.current);
          utils.getFileMessages.setData(
            {fileId},
            {messages:context?.previousMessages ?? []}
        )
       },
       onSuccess:async(stream)=>{
        setIsLoading(false);
        if(!stream)
            return toast({
            title:"there was a problem sending message",
            description:"Please refresh this page and try again",
            variant:"destructive"
            })
        const reader=stream.getReader();
        const decoder=new TextDecoder();
        let done=false;
        // accumlated response
        let accResponse='';
        // read the content of the string we get in real time
        while(!done){
            const {value,done:doneReading}=await reader.read();
            done=doneReading
            const chunkValue=decoder.decode(value)
            accResponse+=chunkValue
            // append the chunk to the actual message
            utils.getFileMessages.setInfiniteData(
                {fileId,limit:INFINITE_QUERY_LIMIT},
                (old)=> {
                    if(!old) return {pages:[],pageParams:[]}
                    
                    let isAiResponseCreated=old.pages.some((page)=>page.messages.some((message)=>
                    message.id==="ai-response"
                    )
                )
                let updatePages=old.pages.map((page)=>{
                    if(page===old.pages[0]){
                        let updatedMessages;
                        if(!isAiResponseCreated){
                            updatedMessages=[
                                {
                                    createdAt:new Date().toISOString(),
                                    id:"ai-response",
                                    text:accResponse,
                                    isUserMessage:false 
                                },
                                ...page.messages
                            ]
                        }else{
                            updatedMessages=page.messages.map((message)=>{
                                if(message.id==="ai-response"){
                                    return {
                                        ...message,
                                        text:accResponse
                                    }
                                }
                                return message 
                            })
                        }
                        return {
                            ...page,
                            messages:updatedMessages
                        }
                    }
                    return page 
                })
                return {...old,pages:updatePages}
                }
            )
        }
       }
       ,
       onSettled:async()=>{
         setIsLoading(false);
         await utils.getFileMessages.invalidate({fileId})
       }
      })

       const handleInputChange=(e:React.ChangeEvent<HTMLTextAreaElement>)=>{
        setMessage(e.target.value)
       }
      const addMessage=()=>sendMessage({message})
      return (
        <ChatContext.Provider value={{
            addMessage,
            message,
            handleInputChange,
            isLoading
        }}>
            {children}
        </ChatContext.Provider>
      )
}