import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from './ui/dialog'
import { Button } from './ui/button'
import { Expand, Loader2 } from 'lucide-react'
import SimpleBar from 'simplebar-react'
import { Document, Page } from 'react-pdf'
import { useToast } from './ui/use-toast'
import { useResizeDetector } from 'react-resize-detector'
interface pdfFullScreenProps{
    fileUrl:string
}
export default function PdfFullScreen({fileUrl}:pdfFullScreenProps){
    const {toast}=useToast();
    const[numPages,setNumPages]=useState<number | null>(null);
    const[currPage,setCurrPage]=useState<number>(1);
    const {width,ref}=useResizeDetector();

    const[isOpen,setIsOpen]=useState(false);
    return (
       <Dialog open={isOpen} onOpenChange={(v)=>{
        if(!v){
            setIsOpen(v)
        }
       }}> 
      <DialogTrigger onClick={()=>{
            setIsOpen(true)
        }} asChild>
        <Button variant='ghost' arial-label='fullscreen'>
            <Expand className="h-4 w-4"/> 
            </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-full">
          <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)] mt-6">
          <div ref={ref}>
                <Document loading={
                  <div className='flex
                  justify-center'>
                    <Loader2 className='my-24 h-6 w-6 animate-spin'/>
                  </div>
                }
                onLoadSuccess={({numPages})=>{
                      setNumPages(numPages);
                }}
                onLoadError={()=>{
                  toast({
                    title:'Error loading PDF',
                    description:"Please try again Later",
                    variant:"destructive"
                  })
                }}
                file={fileUrl} className='max-h-full'>
                 {new Array(numPages).fill(0).map((_,i)=>(
                 <Page key={i} width={width ? width : 1} pageNumber={i+1}>
                 </Page>
                 ))}
                </Document>
                
               </div>
          </SimpleBar>
      </DialogContent>
       </Dialog>
    )
}