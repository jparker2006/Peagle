var g_objData = {};

onload = () => {
    PrepRTCToBrowser();
    MainFrame();
    setRTCConstraints();
    initWebSocket();
}

const PrepRTCToBrowser = () => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;
}

const MainFrame = () => {
    let sPage = "";
    sPage += "<video id='local' autoplay muted ></video>";
    sPage += "<video id='remote' autoplay ></video><br>";
    sPage += "<button id='start' onclick='start(true)'>Start Video</button>";
    document.getElementById('Main').innerHTML = sPage;
}


const start = (isCaller) => {
    g_objData.PC = new RTCPeerConnection({ 'iceServers':
        [ {'urls': 'stun:stun.stunprotocol.org:3478'}, {'urls': 'stun:stun.l.google.com:19302'} ]
    });
    g_objData.PC.onicecandidate = gotIceCandidate;
    g_objData.PC.ontrack = gotRemoteStream;

    PCStream(isCaller);
}

const setRTCConstraints = () => {
    if (navigator.mediaDevices.getUserMedia)
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(getUserMediaSuccess).catch(errorHandler);
    else
        alert('Your browser does not support getUserMedia API');
}

const PCStream = (isCaller) => {
    setTimeout(function() {
        if (!g_objData.LocalStream) {
            PCStream();
            console.log("Still trying");
        }
        else {
            g_objData.PC.addStream(g_objData.LocalStream);
            if (isCaller) {
                g_objData.PC.createOffer().then(createdDescription).catch(errorHandler);
            }
        }
    }, 1000);
}

const gotIceCandidate = (event) => {
    if (event.candidate != null) {
        let objData = {};
        objData.Type = "Jake";
        objData.GameID = g_objData.nGameID;
        objData.ID = g_objData.nID;
        objData.Event = "Ice";
        objData.Message = "BCast2Game";
        objData.ice = event.candidate;
        let jsonData = JSON.stringify(objData);
        sendMessage(jsonData);
    }
}

const getUserMediaSuccess = (stream) => {
    g_objData.LocalStream = stream;
    document.getElementById('local').srcObject = stream;
}

const errorHandler = (error) => {
    console.log(error);
}


var wsUri = "ws://jakehenryparker.com:58007";
if (window.location.protocol === 'https:') {
    wsUri = "wss://jakehenryparker.com:57007/wss";
}
var wSocket = null;
const initWebSocket = () => {
    try {
        if (typeof MozWebSocket == 'function')
            WebSocket = MozWebSocket;
        if (wSocket && wSocket.readyState == 1) // OPEN
            wSocket.close();
        wSocket = new WebSocket(wsUri);
        wSocket.onopen = (evt) => {
            SendMyID();
            SetGameID(0);
            console.log("Connection established.");
        }
        wSocket.onclose = (evt) => {
            console.log("Connection closed");
        };
        wSocket.onmessage = (evt) => {
            if (!g_objData.PC) start(false);
            let objData = JSON.parse(evt.data);
            let sType = objData.Type;
            if ("Jake" == sType) {
                if ("BCast2Game" == objData.Message) {
                    if ("SDP" == objData.Event) {
                        g_objData.PC.setRemoteDescription(new RTCSessionDescription(objData.sdp)).then(function() {
                            if (objData.sdp.type == 'offer') {
                                g_objData.PC.createAnswer().then(createdDescription).catch(errorHandler);
                            }
                        }).catch(errorHandler);
                    }
                    else if ("Ice" == objData.Event) {
                        g_objData.PC.addIceCandidate(new RTCIceCandidate(objData.ice)).catch(errorHandler);
                    }
                }
                else if ("WhoAmI" == objData.Message) {
                    console.log("I am: " + objData.ID);
                    g_objData.nID = objData.ID;
                }
            }
        }
    }
    catch (exception) {
        console.log('ERROR: ' + exception);
    }
}

const createdDescription = (description) => {
    console.log('got description');

    g_objData.PC.setLocalDescription(description).then(function() {

        let objData = {};
        objData.Type = "Jake";
        objData.GameID = g_objData.nGameID;
        objData.Message = "BCast2Game";
        objData.ID = g_objData.nID;
        objData.Event = "SDP";
        objData.sdp = g_objData.PC.localDescription;
        let jsonData = JSON.stringify(objData);
        sendMessage(jsonData);

    }).catch(errorHandler);
}

const gotRemoteStream = (event) => {
    console.log('got remote stream');
    document.getElementById('remote').srcObject = event.streams[0];
}


const SendMyID = () => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = 0;
    objData.ID = 0;
    objData.Message = "MyID";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

const SetGameID = (nGameID) => {
    let objData = {};
    objData.Type = "Jake";
    objData.Message = "SetGameID";
    objData.GameID = parseInt(nGameID);
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
    g_objData.nGameID = nGameID;
}

const stopWebSocket = () => {
    if (wSocket)
        wSocket.close(1000, "Deliberate disconnection");
}

const close_socket = () => {
    if (wSocket.readyState === WebSocket.OPEN)
        wSocket.close(1000, "Deliberate disconnection");
}

const CheckConnection = () => {
    if (!wSocket)
        initWebSocket();
    else if (wSocket.readyState == 3) { // Closed
        wSocket = null;
        initWebSocket();
    }
}

const sendMessage = (jsonData) => {
    if (wSocket != null && 1 == wSocket.readyState)
        wSocket.send(jsonData);
    else {
        console.log("ws error");
        CheckConnection();
        sendMessage.jsonData = jsonData;
        setTimeout(function(){wSocket.send(sendMessage.jsonData);}, 1500);
    }
}

var hidden, visibilityChange;
const ShowVisibilityChange = () => {
    //var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if ('visible' === document.visibilityState)
        CheckConnection();
}

const VisiblitySetup = () => {
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    }
    else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    }
    else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
    document.addEventListener(visibilityChange, ShowVisibilityChange, false);
}

VisiblitySetup();
