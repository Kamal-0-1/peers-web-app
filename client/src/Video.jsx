import { useEffect, useRef } from "react"

export function Video(){
    const v1=useRef(null);
    useEffect(()=>{
        (async()=>{
            v1.current.srcObject=await navigator.mediaDevices.getUserMedia(
                {video:{
                    width: { min: 300 },
                    height: { min: 300 },},audio:false
                });
        })()
    },[]);
    return(
        <div className="w-full h-screen flex justify-center items-center gap-3">
            <video ref={v1} autoPlay></video>
            <video></video>
        </div>
    )   
}