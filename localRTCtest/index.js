"use strict";

onload = () => {
    MainFrame();
    initRTC();
}

function MainFrame() {
    let sPage = "";
    sPage += "<div id='container'>";
    sPage += "<video id='localVideo' playsinline autoplay muted></video>";
    sPage += "<video id='remoteVideo' playsinline autoplay></video>";
    sPage += "<div>";
    sPage += "<button id='startButton' onClick='startConnect()'>Start</button>";
    sPage += "<button id='hangupButton' onClick='hangupClick()'>Hang Up</button>";
    sPage += "</div>";
    sPage += "</div>";
    document.getElementById('Main').innerHTML = sPage;
}

var localStream, pc;
const signaling = new BroadcastChannel('webrtc');
function initRTC() {
    signaling.onmessage = e => {
        if (!localStream) {
            console.log('not ready yet');
            return;
        }
        if ("offer" == e.data.type)
            handleOffer(e.data);
        else if ("answer" == e.data.type)
            handleAnswer(e.data);
        else if ("candidate" == e.data.type)
            handleCandidate(e.data);
        else if ("ready" == e.data.type) {
            if (pc) {
                console.log('already in call, ignoring');
                return;
            }
            makeCall();
        }
        else if ("bye" == e.data.type) {
            if (pc)
                hangup();
        }
        else
            console.log('unhandled', e);
    };
}

async function startConnect() {
    localStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    localVideo.srcObject = localStream;
    startButton.disabled = true;
    hangupButton.disabled = false;
    signaling.postMessage({type: 'ready'});
}

async function hangupClick() {
    hangup();
    signaling.postMessage({type: 'bye'});
}

async function hangup() {
    if (pc) {
        pc.close();
        pc = null;
    }
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    startButton.disabled = false;
    hangupButton.disabled = true;
}

function createPeerConnection() {
    pc = new RTCPeerConnection();
    pc.onicecandidate = e => {
        const message = { type: 'candidate', candidate: null, };
        if (e.candidate) {
            message.candidate = e.candidate.candidate;
            message.sdpMid = e.candidate.sdpMid;
            message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        signaling.postMessage(message);
    };
    pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

async function makeCall() {
    await createPeerConnection();
    const offer = await pc.createOffer();
    signaling.postMessage({type: 'offer', sdp: offer.sdp});
    await pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
    if (pc) {
        console.error('existing peerconnection');
        return;
    }
    await createPeerConnection();
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    signaling.postMessage({type: 'answer', sdp: answer.sdp});
    await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
    if (!pc) {
        console.error('no peerconnection');
        return;
    }
    await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
    if (!pc) {
        console.error('no peerconnection');
        return;
    }
    if (!candidate.candidate)
        await pc.addIceCandidate(null);
    else
        await pc.addIceCandidate(candidate);
}
