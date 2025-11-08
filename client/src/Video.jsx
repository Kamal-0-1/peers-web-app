import { useEffect, useRef } from "react"

export function Video(){
    const localVid=useRef(null);
    const remoteVid=useRef(null);
    const createOffer=useRef(null);
    const createAnswer=useRef(null);
    const offerArea=useRef(null);
    const answerArea=useRef(null);
    useEffect(()=>{
        (async()=>{
            const peerConnection=new RTCPeerConnection({
                iceServers:[{urls:"stun:stun.l.google.com:19302"}]
            })

            const localStream=await navigator.mediaDevices.getUserMedia({video:true});
            localVid.current.srcObject=localStream;
            localStream.getTracks().forEach((track)=>peerConnection.addTrack(track,localStream));

            const remoteStream=new MediaStream();
            remoteVid.current.srcObject=remoteStream;
            peerConnection.ontrack=async(e)=>{
                e.streams[0].getTracks().forEach((track)=>remoteStream.addTrack(track));
            }

            const ice=[];
            peerConnection.onicecandidate=async(e)=>{
                if(e.candidate){
                    ice.push(e.candidate);
                    console.log(e);
                }
                
            }

            createOffer.current.onclick=async()=>{
                const offer=await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                offerArea.current.value=JSON.stringify(peerConnection.localDescription);
            }


        })();
    },[]);
    return(
        <div className="w-full h-screen flex justify-center items-center gap-3 p-4">
            <div className="w-1/2 h-full">
                <video ref={localVid} autoPlay></video>
                <button ref={createOffer} className="p-1 m-5 bg-gray-400">Create Offer</button>
                <textarea ref={offerArea} className="w-full h-65"></textarea>
            </div>
            <div className="w-1/2 h-full">
                <video ref={remoteVid} autoPlay></video>
                <button ref={createAnswer} className="p-1 m-5 bg-gray-400">Create Answer</button>
                <textarea ref={answerArea} className="w-full h-65"></textarea>
            </div>
            
        </div>
    )   
}