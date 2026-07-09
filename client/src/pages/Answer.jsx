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
                    console.log(offer,ice);
                    // Send ICE+Answer to server
                    setLoading(false);
                }
            }
            
        })();

        return ()=>{
            peerConnection.current.close();
            localStream.getTracks().forEach((t)=>t.stop());
            remoteStream.getTracks().forEach((t)=>t.stop());
        }

    },[])

    async function handleClick(){
        // Fetch ICE+Offer here
        const remoteData=null;
        peerConnection.current.setRemoteDescription(remoteData?.sdp);
        const answer=await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        for(let i of remoteData?.ice)await peerConnection.current.addIceCandidate(new RTCIceCandidate(i));
    }

    return(
        <div>
            <input ref={callerIDBox} type="text" className="border" placeholder="Paste the code here"></input>
            <button onClick={handleClick}>Accept</button>
            <video ref={localVideo} autoPlay className="border"></video>
            <video ref={remoteVideo} className="border"></video>
            {loading && <p>Loading...</p>}
        </div>
    )

}