import { useEffect, useRef, useState } from "react"

export function Call(){

    // Video stream
    const localVideo=useRef(null);
    const remoteVideo=useRef(null);
    
    // RTC setup
    const peerConnection=useRef(new RTCPeerConnection({
        iceServers:[{urls:"stun:stun.l.google.com:19302"}]
    }));
    
    const[loading, setLoading]=useState(true);
    const[data, setData]=useState({"sdp":null,"ice":null});
    const[uuid, setUuid]=useState("");
    const activeInterval=useRef(null);
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

            // Create offer
            const offer=await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            

            // ICE gather
            const ice=[];
            peerConnection.current.onicecandidate=async(e)=>{
                if(e.candidate)ice.push(e.candidate);
                if(peerConnection.current.iceGatheringState=="complete"){
                    console.log(offer,ice);
                    try{
                        const response=await fetch(`${BACKEND_URL}/api/call`,{
                            method:"POST",
                            headers:{"Content-Type":"application/json"},
                            body:JSON.stringify({sdp:offer,ice})
                        });
                        const result=await response.json();
                        setUuid(result.uuid);

                        // Trigger API call interval here
                        const intervalId=setInterval(async()=>{
                            try{
                                const checkRes=await fetch(`${BACKEND_URL}/api/call/${result.uuid}/answer`);
                                if(checkRes.ok){
                                    const remoteData=await checkRes.json();
                                    if(remoteData && remoteData.sdp){
                                        clearInterval(intervalId);
                                        activeInterval.current=null;
                                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(remoteData.sdp));
                                        for(let i of remoteData.ice){
                                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(i));
                                        }
                                        setLoading(false);
                                    }
                                }
                            }catch(err){
                                console.error("Error checking answer:",err);
                            }
                        },2000);

                        activeInterval.current=intervalId;
                    }catch(err){
                        console.error("Failed to post offer to server:",err);
                    }
                }
            }

        })();

        return ()=>{
            if(activeInterval.current)clearInterval(activeInterval.current);
            peerConnection.current.close();
            localStream && localStream.getTracks().forEach((t)=>t.stop());
            remoteStream && remoteStream.getTracks().forEach((t)=>t.stop());
        }

    },[])

    return(
        <div className="flex flex-col items-center gap-6 p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-850">Call Connection</h2>
            {uuid && (
                <div className="w-full max-w-md p-4 bg-sky-50 border border-sky-200 rounded-lg shadow-sm flex flex-col items-center">
                    <p className="text-sm font-semibold text-sky-850 mb-1">Your Code is:</p>
                    <code className="bg-white px-3 py-1.5 border border-sky-300 rounded font-mono text-base break-all font-bold text-sky-900 select-all">{uuid}</code>
                    <p className="text-xs text-sky-600 mt-2">Send this code to the receiver to connect.</p>
                </div>
            )}
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
            {loading && <p className="text-yellow-600 animate-pulse font-medium">Waiting for response...</p>}
        </div>
    )
}