import express from 'express';
import crypto from 'crypto';

const app=express();

app.use(express.json());

// Enable CORS middleware
app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS");
    if(req.method==='OPTIONS'){
        return res.sendStatus(200);
    }
    next();
});

// Map to hold calls: uuid -> { offer: { sdp, ice }, answer: { sdp, ice } | null }
const calls=new Map();

app.get('/',(req,res)=>{
    res.send("Signaling server running");
});

// Create a new call room (send Offer + ICE candidates)
app.post('/api/call',(req,res)=>{
    const {sdp,ice}=req.body;
    if(!sdp || !ice){
        return res.status(400).json({error:"Missing SDP or ICE candidates"});
    }
    
    const uuid=crypto.randomUUID();
    calls.set(uuid,{
        offer:{sdp,ice},
        answer:null
    });
    
    res.json({uuid});
});

// Retrieve the offer (SDP + ICE candidates) for the receiver
app.get('/api/call/:uuid',(req,res)=>{
    const {uuid}=req.params;
    const call=calls.get(uuid);
    if(!call){
        return res.status(404).json({error:"Call not found"});
    }
    res.json(call.offer);
});

// Save the answer (SDP + ICE candidates) from the receiver
app.post('/api/call/:uuid/answer',(req,res)=>{
    const {uuid}=req.params;
    const {sdp,ice}=req.body;
    if(!sdp || !ice){
        return res.status(400).json({error:"Missing SDP or ICE candidates"});
    }
    
    const call=calls.get(uuid);
    if(!call){
        return res.status(404).json({error:"Call not found"});
    }
    
    call.answer={sdp,ice};
    res.json({success:true});
});

// Constantly queried by the caller to see if the answer is appended.
// If it is, return it and clean up the record from the map.
app.get('/api/call/:uuid/answer',(req,res)=>{
    const {uuid}=req.params;
    const call=calls.get(uuid);
    if(!call){
        return res.status(404).json({error:"Call not found"});
    }
    
    if(call.answer){
        res.json(call.answer);
        calls.delete(uuid); // clean it up
    }else{
        res.json({sdp:null,ice:null});
    }
});

app.listen(3000,()=>console.log("Server started on port 3000"));