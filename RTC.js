var g_objData = {};

var PC, LC;
var PConfig =  {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}]};

onload = () => {
    PrepRTCToBrowser();
    MainFrame();
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
    sPage += "<video id='remote' autoplay></video>";
    sPage += "<video id='local' autoplay muted></video><br><br>";
    sPage += "<input id='call' type='button' value='Call' onClick='initiateCall()' />";
    sPage += "<input id='end' type='button' disabled value='Hang Up' onClick='SendHangUp()' />";
    document.getElementById('Main').innerHTML = sPage;
}

const connectToRTC = () => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = 0;
    objData.Message = "BCast2Game";
    objData.Event = "ConnectToRTC";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function initiateCall() {
    PC = new RTCPeerConnection(PConfig);
    PC.onicecandidate = onIceCandidateHandler;
    PC.ontrack = onAddStreamHandler;
    navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
        LC = stream;
        document.getElementById('local').srcObject = LC;
        PC.addStream(LC);
        createAndSendOffer();
    }, function(error) { console.log(error); });
}

function answerCall() {
    PC = new RTCPeerConnection(PConfig);
    PC.onicecandidate = onIceCandidateHandler;
    PC.ontrack = onAddStreamHandler;
    navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
        LC = stream;
        document.getElementById('local').srcObject = LC;
        PC.addStream(LC);
        console.log(PC);
        createAndSendAnswer();
    }, function(error) { console.log(error);});
};

var wsUri = "ws://jakehenryparker.com:58007";
if (window.location.protocol === 'https:') {
    wsUri = "wss://jakehenryparker.com:57007/wss";
}
var wSocket = null;
function initWebSocket() {
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
            if (!PC) answerCall();
            let objData = JSON.parse(evt.data);
            let sType = objData.Type;
            if ("Jake" == sType) {
                if ("BCast2Game" == objData.Message) {
                    if ("ConnectToRTC" == objData.Event) {
                        console.log("click");
                    }
                    else if ("StartCall" == objData.Event) {
                        console.log("Call Started.");
                        startCall();
                    }
                    else if ("HangUpCall" == objData.Event) {
                        console.log("Call Ended.");
                        endCall();
                    }
                    else if ("SDP" == objData.Event) {
                        console.log("Received SDP from remote peer.");
                        PC.setRemoteDescription(new RTCSessionDescription(JSON.parse(objData.Offer)));
                    }
                    else if ("Candidate" == objData.Event) {
                        console.log("Received ICECandidate from remote peer.");
                        PC.addIceCandidate(new RTCIceCandidate(JSON.parse(objData.Candidate)));
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

function onIceCandidateHandler(evt) {
    if (!evt || !evt.candidate)
        return;

    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Message = "BCast2Game";
    objData.Event = "Candidate";
    objData.Candidate = JSON.stringify(evt.candidate);
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
};

function onAddStreamHandler(evt) {
    document.getElementById('call').disabled = true;
    document.getElementById('end').disabled = false;
    document.getElementById('remote').srcObject = evt.stream;
    console.log("Adding stream.");
};

function createAndSendOffer() {
    PC.createOffer(
        function (offer) {
            var off = new RTCSessionDescription(offer);
            PC.setLocalDescription(new RTCSessionDescription(off),
                function() {
                    SendOffer(off);
                },
                function(error) { console.log(error);}
            );
        },
        function (error) { console.log(error); }
    );
};

function createAndSendAnswer() {
    PC.createAnswer(
        function (answer) {
            var ans = new RTCSessionDescription(answer);
            PC.setLocalDescription(ans, function() {
                SendAnswer(ans);
            },
            function (error) { console.log(error);}
            );
        },
        function (error) {console.log(error);}
    );
};

const endCall = () => {
    document.getElementById('call').disabled = false;
    document.getElementById('end').disabled = true;

    PC.close();
    PC = null;
    if (LC) {
        LC.getTracks().forEach(function (track) {
            track.stop();
        });
        document.getElementById('local').src = "";
    }
    if (document.getElementById('remote'))
        document.getElementById('remote').src = "";
}

const SendOffer = (offer) => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Message = "BCast2Game";
    objData.Event = "SDP";
    objData.Offer = JSON.stringify(offer);
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

const SendAnswer = (answer) => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Message = "BCast2Game";
    objData.Event = "SDP";
    objData.Offer = JSON.stringify(answer);
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

const SendCall = () => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Message = "BCast2Game";
    objData.Event = "StartCall";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
    startCall();
}

const SendHangUp = () => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Message = "BCast2Game";
    objData.Event = "HangUpCall";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
    endCall();
}

function SendMyID() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = 0;
    objData.ID = 0;
    objData.Message = "MyID";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function SetGameID(nGameID) {
    let objData = {};
    objData.Type = "Jake";
    objData.Message = "SetGameID";
    objData.GameID = parseInt(nGameID);
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
    g_objData.nGameID = nGameID;
}

function stopWebSocket() {
    if (wSocket)
        wSocket.close(1000, "Deliberate disconnection");
}

function close_socket() {
    if (wSocket.readyState === WebSocket.OPEN)
        wSocket.close(1000, "Deliberate disconnection");
}

function CheckConnection() {
    if (!wSocket)
        initWebSocket();
    else if (wSocket.readyState == 3) { // Closed
        wSocket = null;
        initWebSocket();
    }
}

function sendMessage(jsonData) {
    if (wSocket != null && 1 == wSocket.readyState) {
        wSocket.send(jsonData);
    }
    else {
        console.log("ws error");
        CheckConnection();
        sendMessage.jsonData = jsonData;
        setTimeout(function(){wSocket.send(sendMessage.jsonData);}, 1500);
    }
}

var hidden, visibilityChange;
VisiblitySetup();
function VisiblitySetup() {
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
    document.addEventListener(visibilityChange, ShowVisibilityChange, false);
}

function ShowVisibilityChange() {
    //var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if ('visible' === document.visibilityState) {
        CheckConnection();
    }
}
