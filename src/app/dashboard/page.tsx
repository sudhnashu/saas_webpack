import Dashboard from "@/components/Dashboard";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation";


export default async function Page(){
    
 // used to get the details of the user when he is logged in
    const {getUser}=getKindeServerSession();
    const user=await getUser();
    // if the user if not logged in and reached to dashboard by any means without logging in
    // then rediarect the user to the log in process
    if(!user || !user.id)
     redirect('/auth-callback?origin=dashboard');
    
    const dbUser=await db.user.findFirst({
        where:{
            id:user.id
        }   
    })

    if(!dbUser)redirect('/auth-callback?origin=dashboard');




    return (
       <Dashboard/>
    )
}