var g_objData = {};

onload = () => {
    PrepRTCToBrowser();
    LoginFrame();
}

const LoginFrame = () => {
    let sPage = "";
    sPage += "<input id='username' type='text' />";
    sPage += "<button onClick='login()'>Login</button>";
    document.getElementById('Main').innerHTML = sPage;
}

const login = () => {
    let sUsername = document.getElementById('username').value;
    if (!sUsername) {
        alert("Please enter a username");
        return;
    }
    g_objData.sUsername = sUsername;
    initWebSocket();
    MenuFrame();
}

const MenuFrame = () => {
    let sPage = "";

    sPage += "<div class='callsomeone'>";
    sPage += "Call Someone<br>";
    sPage += "<input id='calledusername' type='text' placeholder='Username' />";
    sPage += "<button onClick='dialUser()'>Dial Up</button><br>";
    sPage += "</div>";

    sPage += "<div id='incoming' class='incoming'>";
    sPage += "Incoming Calls:<br>";
    sPage += "</div>";

    document.getElementById('Main').innerHTML = sPage;
}

const dialUser = () => {
    let sUsername = document.getElementById('calledusername').value;
    if (!sUsername) {
        alert("Please enter a username before dialing");
        return;
    }

    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.ID = g_objData.nID;
    objData.Event = "SomeonesDialing";
    objData.Username = sUsername;
    objData.TheirUN = g_objData.sUsername;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);

    setRTCConstraints();
    MainFrame();

    g_objData.PCs = [];
}

const MainFrame = () => {
    let sPage = "";
    sPage += "<video id='local' autoplay muted ></video>";
    document.getElementById('Main').innerHTML = sPage;
}

const start = (bCaller, nID) => {
    g_objData.PCs.push({});
    let nIndex = g_objData.PCs.length - 1; // will always be the most recent entry
    g_objData.PCs[nIndex].conn = new RTCPeerConnection({ 'iceServers':
        [ {'urls': 'stun:stun.stunprotocol.org:3478'}, {'urls': 'stun:stun.l.google.com:19302'} ]
    });
    g_objData.PCs[nIndex].videoElement = document.createElement('video');
    g_objData.PCs[nIndex].videoElement.id = 'USER' + String(nID);
    g_objData.PCs[nIndex].videoElement.autoplay = true;
    document.getElementById('Main').innerHTML += g_objData.PCs[nIndex].videoElement.outerHTML;
    g_objData.PCs[nIndex].ID = nID;
    g_objData.PCs[nIndex].conn.onicecandidate = function(event) { gotIceCandidate(nID, event) };
    g_objData.PCs[nIndex].conn.ontrack = function(event) { gotRemoteStream(nID, event) };
    PCStream(bCaller, nID);
}

/*
const closeRTC = () => {
    g_objData.PCs[0].conn.close();
    g_objData.PCs[0].conn = null;
    // remove from PC array

    if (g_objData.LocalStream) {
        g_objData.LocalStream.getTracks().forEach(function (track) {
            track.stop();
        });
        g_objData.LocalStream = null;
    }
//     g_objData.nCalling = -1;
    MenuFrame();

}
*/
/*
const hangUp = () => {
    let objData = {};
    objData.ToID = parseInt(g_objData.nCalling);
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Event = "HangUp";
    objData.Message = "Msg2ID";
    objData.ice = event.candidate;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);

    closeRTC();
}
*/

const setRTCConstraints = () => {
    if (navigator.mediaDevices.getUserMedia)
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(getUserMediaSuccess).catch(errorHandler);
    else
        alert('Your browser does not support getUserMedia API');
}

const PCStream = (bCaller, nID) => {
    setTimeout(function() {
        if (!g_objData.LocalStream) {
            PCStream(bCaller, nID);
            console.log("Still trying");
        }
        else {
            getUserMediaSuccess(g_objData.LocalStream);
            for (let i=0; i<g_objData.PCs.length; i++) {
                document.getElementById('USER' + g_objData.PCs[i].ID).srcObject = g_objData.PCs[i].conn.getRemoteStreams()[0];
            }
            let PCsIndice = findPCIById(nID);
            g_objData.PCs[PCsIndice].conn.addStream(g_objData.LocalStream);
            if (bCaller) {
                console.log("Caller making offer");
                g_objData.PCs[PCsIndice].conn.createOffer().then(createdDescription(nID)).catch(errorHandler);
            }
        }
    }, 500);
}

const gotIceCandidate = (nID, event) => {
    if (event.candidate != null) {
        let objData = {};
        objData.ToID = parseInt(nID);
        objData.Type = "Jake";
        objData.GameID = g_objData.nGameID;
        objData.ID = g_objData.nID;
        objData.Event = "Ice";
        objData.Message = "Msg2ID";
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

const inPCs = (nID) => {
    for (let i=0; i<g_objData.PCs.length; i++) {
        if (nID == g_objData.PCs[i].ID)
            return true;
    }
    return false;
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
            let objData = JSON.parse(evt.data);
            let sType = objData.Type;
            if ("Jake" == sType) {

                if ("BCast2Game" == objData.Message) {
                    if ("SomeonesDialing" == objData.Event) {
                        let sPage = "";
                        sPage += "<div class='call' onClick='pickUp("+objData.ID+", "+true+")'>";
                        sPage += objData.TheirUN;
                        sPage += "</div>";
                        document.getElementById("incoming").innerHTML += sPage;
                    }
                    else if ("NewConnector" == objData.Event) {
                        if (g_objData.PCs && !inPCs(objData.ID)) {
                            start(true, objData.ID);
                            let objPickData = {};
                            objPickData.ToID = parseInt(objData.ID);
                            objPickData.Message = "Msg2ID";
                            objPickData.Type = "Jake";
                            objPickData.GameID = 0;
                            objPickData.Event = "PickingUp";
                            objPickData.UN = g_objData.sUsername;
                            objPickData.ID = g_objData.nID;
                            let jsonData = JSON.stringify(objPickData);
                            sendMessage(jsonData);
                        }
                    }
                }

                else if ("Msg2ID" == objData.Message) {
                    if ("PickingUp" == objData.Event) {
                        console.log(objData.UN + " picked up the call");
//                         setRTCConstraints();
//                         g_objData.nCalling = objData.ID;
                        start(false, objData.ID);
//                         MainFrame();
                    }
                    else if ("SDP" == objData.Event) {
                        console.log("SDP recieved");
                        let PCsIndice = findPCIById(objData.ID);
                        g_objData.PCs[PCsIndice].conn.setRemoteDescription(new RTCSessionDescription(objData.sdp)).then(function() {
                            if ('offer' == objData.sdp.type) {
                                g_objData.PCs[PCsIndice].conn.createAnswer().then(createdDescription(objData.ID)).catch(errorHandler);
                            }
                        }).catch(errorHandler);
                    }
                    else if ("Ice" == objData.Event) {
                        console.log("Ice recieved");
                        let PCsIndice = findPCIById(objData.ID);
                        g_objData.PCs[PCsIndice].conn.addIceCandidate(new RTCIceCandidate(objData.ice)).catch(errorHandler);
                    }
                    else if ("HangUp" == objData.Event) {
                        console.log("call ended");
                        closeRTC();
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

const findPCIById = (nID) => {
    for (let i=0; i<g_objData.PCs.length; i++) {
        if (nID == g_objData.PCs[i].ID)
            return i;
    }

    console.log("PANIC: PC for Id not created");
    return -1;
}

const pickUp = (nID, bFirstPick) => {
    setRTCConstraints();
//     g_objData.nCalling = nID;
    MainFrame();

    g_objData.PCs = [];
    start(true, nID);
//     g_objData.PCs[0].ID = nID;

    let objData = {};
    objData.ToID = parseInt(nID);
    objData.Message = "Msg2ID";
    objData.Type = "Jake";
    objData.GameID = 0;
    objData.Event = "PickingUp";
    objData.UN = g_objData.sUsername;
    objData.ID = g_objData.nID;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);

    // spider web data distribution
    if (bFirstPick) {
        console.log("Owner -> new");
        objData = {};
        objData.Message = "BCast2Game";
        objData.Type = "Jake";
        objData.GameID = 0;
        objData.Event = "NewConnector";
        objData.ID = g_objData.nID;
        objData.Owner = nID;
        jsonData = JSON.stringify(objData);
        sendMessage(jsonData);
    }
}

const createdDescription = (id, description) => {
    console.log('got description');

    let PCsIndice = findPCIById(id);
    g_objData.PCs[PCsIndice].conn.setLocalDescription(description).then(function() {

        let objData = {};
        objData.ToID = parseInt(id);
        objData.Type = "Jake";
        objData.GameID = g_objData.nGameID;
        objData.Message = "Msg2ID";
        objData.ID = g_objData.nID;
        objData.Event = "SDP";
        objData.sdp = g_objData.PCs[PCsIndice].conn.localDescription;
        let jsonData = JSON.stringify(objData);
        sendMessage(jsonData);

    }).catch(errorHandler);
}

const gotRemoteStream = (nID, event) => {
    console.log('got remote stream');
    document.getElementById('USER' + String(nID)).srcObject = event.streams[0];
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
    if (!g_objData.sUsername)
        return;
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

const PrepRTCToBrowser = () => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;
}
