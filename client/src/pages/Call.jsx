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
                    // API Send ICE+Offer to server
                    // Trigger API call interval here
                    const remoteData=null;
                    peerConnection.current.setRemoteDescription(remoteData?.sdp);
                    for(let i of remoteData?.ice)await peerConnection.current.addIceCandidate(new RTCIceCandidate(i));
                    setLoading(false);
                }
            }

        })();

        return ()=>{
            peerConnection.current.close();
            localStream && localStream.getTracks().forEach((t)=>t.stop());
            remoteStream && remoteStream.getTracks().forEach((t)=>t.stop());
        }

    },[])

    return(
        <div>
            <div className="flex gap-1">
                <video ref={localVideo} autoPlay className="border"></video>
                <video ref={remoteVideo} className="border"></video>
            </div>
            {loading && <p>Loading...</p>}
        </div>
    )
}