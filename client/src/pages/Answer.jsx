import { useEffect, useRef, useState } from "react"

export function Answer(){

    // Video streams
    const localVideo=useRef(null);
    const remoteVideo=useRef(null);

    const callerIDBox=useRef(null)

    // RTC setup
    const peerConnection=useRef(new RTCPeerConnection({
        iceServers:[{urls:"stun:stun.l.google.com:19302"}]
    }));
    const[loading, setLoading]=useState(true);
    const uuidRef=useRef(null);
    const BACKEND_URL="http://localhost:3000";
    
    useEffect(()=>{

        let localStream=null, remoteStream=null;

        (async()=>{

            // Local video
            localStream=await navigator.mediaDevices.getUserMedia({video:true});
            localVideo.current.srcObject=localStream;
            localStream.getTracks().forEach((track)=>peerConnection.current.addTrack(track,localStream));

            // Remote video
            remoteStream=new MediaStream();
            remoteVideo.current.srcObject=remoteStream;
            peerConnection.current.ontrack=async(e)=>{
                e.streams[0].getTracks().forEach((track)=>remoteStream.addTrack(track));
            }

            // ICE gather
            const ice=[];
            peerConnection.current.onicecandidate=async(e)=>{
                if(e.candidate)ice.push(e.candidate);
                if(peerConnection.current.iceGatheringState=="complete"){
                    console.log("Answer ICE gathering complete",ice);
                    const currentUuid=uuidRef.current;
                    if(!currentUuid)return;

                    try{
                        await fetch(`${BACKEND_URL}/api/call/${currentUuid}/answer`,{
                            method:"POST",
                            headers:{"Content-Type":"application/json"},
                            body:JSON.stringify({
                                sdp:peerConnection.current.localDescription,
                                ice:ice
                            })
                        });
                        setLoading(false);
                    }catch(error){
                        console.error("Failed to send answer to server:",error);
                    }
                }
            }
            
        })();

        return ()=>{
            peerConnection.current.close();
            localStream && localStream.getTracks().forEach((t)=>t.stop());
            remoteStream && remoteStream.getTracks().forEach((t)=>t.stop());
        }

    },[])

    async function handleClick(){
        const code=callerIDBox.current.value.trim();
        if(!code){
            alert("Please enter a valid code");
            return;
        }
        uuidRef.current=code;

        try{
            // Fetch ICE+Offer here
            const response=await fetch(`${BACKEND_URL}/api/call/${code}`);
            if(!response.ok){
                alert("Call code not found!");
                return;
            }
            const remoteData=await response.json();
            
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(remoteData.sdp));
            const answer=await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            
            for(let i of remoteData.ice){
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(i));
            }
        }catch(err){
            console.error("Error setting up remote description / generating answer:",err);
        }
    }

    return(
        <div className="flex flex-col items-center gap-6 p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-850">Answer Connection</h2>
            <div className="w-full max-w-md flex gap-2">
                <input 
                    ref={callerIDBox} 
                    type="text" 
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm" 
                    placeholder="Paste the code here"
                />
                <button 
                    onClick={handleClick} 
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-semibold"
                >
                    Accept
                </button>
            </div>
            <div className="flex gap-4">
                <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">Local View</span>
                    <video ref={localVideo} autoPlay className="border rounded shadow-md w-80 bg-black"></video>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">Remote View</span>
                    <video ref={remoteVideo} autoPlay className="border rounded shadow-md w-80 bg-black"></video>
                </div>
            </div>
            {loading && <p className="text-yellow-600 animate-pulse font-medium">Ready to accept...</p>}
        </div>
    )
}