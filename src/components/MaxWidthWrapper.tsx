import { cn } from "@/lib/utils";
import React from "react";

interface props{
    className?: string;
    children:React.ReactNode;
}
export default function MaxWidthWrapper({className,children}:props){
    return (
        // merging the two className properties
        <div className={cn('mx-auto w-full max-w-screen-xl px-2.5 md:px-20',className)}>
            {children}
        </div>
    )
}