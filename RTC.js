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
    sPage += "<input id='groupname' type='text' placeholder='Group Name' />";
    sPage += "<button onClick='createGroup()'>Create Group</button>";
    sPage += "</div>";

    sPage += "<div id='incoming' class='incoming'>";
    sPage += "Incoming Calls:<br>";
    sPage += "</div>";

    sPage += "<div id='groups' class='incoming'>";
    sPage += "Available Groups:<br>";
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
}

const createGroup = () => {
    let sGroupName = document.getElementById("groupname").value;
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.ID = g_objData.nID;
    objData.Event = "GroupCreated";
    objData.GroupName = sGroupName;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);

    joinGroup(1); // will be game id
}

const MainFrame = () => {
    let sPage = "";
    sPage += "<div id='videos'>";
    sPage += "<video id='local' autoplay muted ></video>";
    sPage += "<video id='remote' autoplay ></video><br>";
    sPage += "</div>";
    sPage += "<button onClick='hangUp()'>Hang up</button>";
    document.getElementById('Main').innerHTML = sPage;
}

const start = (bCaller) => {
    g_objData.PC = new RTCPeerConnection({ 'iceServers':
        [ {'urls': 'stun:stun.stunprotocol.org:3478'}, {'urls': 'stun:stun.l.google.com:19302'} ]
    });

    g_objData.PC.onicecandidate = gotIceCandidate;
    g_objData.PC.ontrack = gotRemoteStream;

    PCStream(bCaller);
}

const startGroupMember = (bCaller, nIndice) => {

    g_objData.nCalling = g_objData.PCs[nIndice].nID;

    g_objData.PCs[nIndice].conn = new RTCPeerConnection({ 'iceServers':
        [ {'urls': 'stun:stun.stunprotocol.org:3478'}, {'urls': 'stun:stun.l.google.com:19302'} ]
    });

    g_objData.PCs[nIndice].conn.onicecandidate = gotIceCandidate;
    g_objData.PCs[nIndice].conn.ontrack = gotRemoteStream;

    console.log(g_objData.PCs);

    ForcedOfferPCStream(bCaller, nIndice);
}

const ForcedOfferPCStream = (bCaller, nIndice) => {
    setTimeout(function() {
        if (!g_objData.LocalStream) {
            ForcedOfferPCStream(bCaller, nIndice);
            console.log("Still trying");
        }
        else {
            g_objData.PCs[nIndice].conn.addStream(g_objData.LocalStream);
            if (bCaller) {
                console.log("Caller making offer");
                g_objData.PCs[nIndice].conn.createOffer().then(createdDescription).catch(errorHandler);
            }
        }
    }, 500);
}

const PCStream = (bCaller) => {
    setTimeout(function() {
        if (!g_objData.LocalStream) {
            PCStream(bCaller);
            console.log("Still trying");
        }
        else {
            g_objData.PC.addStream(g_objData.LocalStream);
            if (bCaller) {
                console.log("Caller making offer");
                g_objData.PC.createOffer().then(createdDescription).catch(errorHandler);
            }
        }
    }, 500);
}

const closeRTC = () => {
    g_objData.PC.close();
    g_objData.PC = null;

    if (g_objData.LocalStream) {
        g_objData.LocalStream.getTracks().forEach(function (track) {
            track.stop();
        });
        g_objData.LocalStream = null;
    }
    g_objData.nCalling = -1;
    g_objData.PCs = [];
    g_objData.nGameID = 0;
    SetGameID(0);

    MenuFrame();
}

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

const setRTCConstraints = () => {
    if (navigator.mediaDevices.getUserMedia)
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(getUserMediaSuccess).catch(errorHandler);
    else
        alert('Your browser does not support getUserMedia API');
}

const gotIceCandidate = (event) => {
    if (event.candidate != null) {
        let objData = {};
        objData.ToID = parseInt(g_objData.nCalling);
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

const joinGroup = (nGameID) => {
    g_objData.PCs = [];
    g_objData.nGameID = nGameID;

    GroupFrame();
    setRTCConstraints();

    SetGameID(nGameID);
    BroadcastGiveMeYourData();
    BroadcastData();
}

const GroupFrame = () => {
    let sPage = "";
    sPage += "<div id='videos'>";
    sPage += "<video id='local' autoplay muted ></video>";
    sPage += "<video id='remote' autoplay ></video>";
    sPage += "</div>";
    sPage += "<button onClick='hangUp()'>Hang up</button>";
    document.getElementById('Main').innerHTML = sPage;
}

const BroadcastGiveMeYourData = () => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "GiveMeYourData";
    objData.ID = g_objData.nID;
    objData.bCaller = false;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

const SendData = (nUID) => {
    let objData = {};
    objData.ToID = parseInt(nUID);
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Event = "Data";
    objData.Message = "Msg2ID";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

const BroadcastData = () => {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.ID = g_objData.nID;
    objData.Event = "Data";
    objData.Message = "BCast2Game";
    objData.bCaller = true;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
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
                        if (objData.Username == g_objData.sUsername) {
                            let sPage = "";
                            sPage += "<div class='call' onClick='pickUp("+objData.ID+")'>";
                            sPage += objData.TheirUN + " is calling";
                            sPage += "</div>";
                            document.getElementById("incoming").innerHTML += sPage;
                        }
                    }
                    else if ("GroupCreated" == objData.Event) {
                        let sPage = "";
                        sPage += "<div class='call' onClick='joinGroup(" + 1 + ")'>"; // will be the game number for now we only need 1 group
                        sPage += objData.GroupName;
                        sPage += "</div>";
                        document.getElementById("groups").innerHTML += sPage;
                    }
                    else if ("GiveMeYourData" == objData.Event) {
                        console.log("giving you my data");
                        SendData(objData.ID);
                    }
                    else if ("Data" == objData.Event) {
                        console.log("got your data");
                        addNewPersonToCall(objData, objData.bCaller);
                    }
                }

                else if ("Msg2ID" == objData.Message) {
                    if ("PickingUp" == objData.Event) {
                        console.log(objData.UN + " picked up the call");
                        setRTCConstraints();
                        g_objData.nCalling = objData.ID;
                        MainFrame();
                        start(true);
                    }
                    else if ("SDP" == objData.Event) {
                        console.log("SDP recieved");

                        /*
                        g_objData.PC.setRemoteDescription(new RTCSessionDescription(objData.sdp)).then(function() {
                            if (objData.sdp.type == 'offer') {
                                g_objData.PC.createAnswer().then(createdDescription).catch(errorHandler);
                            }
                        }).catch(errorHandler);
                        */

                        g_objData.PCs[0].conn.setRemoteDescription(new RTCSessionDescription(objData.sdp)).then(function() {
                            if (objData.sdp.type == 'offer') {
                                g_objData.PCs[0].conn.createAnswer().then(createdDescription).catch(errorHandler);
                            }
                        }).catch(errorHandler);
                    }
                    else if ("Ice" == objData.Event) {
                        console.log("Ice recieved");
//                         g_objData.PC.addIceCandidate(new RTCIceCandidate(objData.ice)).catch(errorHandler);
                        g_objData.PCs[0].conn.addIceCandidate(new RTCIceCandidate(objData.ice)).catch(errorHandler);
                    }
                    else if ("HangUp" == objData.Event) {
                        console.log("call ended");
                        closeRTC();
                    }
                    else if ("Data" == objData.Event) {
                        console.log("got your data");
                        addNewPersonToCall(objData, objData.bCaller);
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

const addNewPersonToCall = (objData, bCaller) => {
    let objPC = {};
    objPC.nID = objData.ID;
    console.log("added new member stream");

    g_objData.PCs.push(objPC);
    startGroupMember(bCaller, g_objData.PCs.length - 1);
}

const pickUp = (nID) => {
    setRTCConstraints();
    g_objData.nCalling = nID;
    MainFrame();
    start(false);

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
}

const createdDescription = (description) => {
    console.log('got description');

    g_objData.PCs[0].conn.setLocalDescription(description).then(function() {

        let objData = {};
        objData.ToID = parseInt(g_objData.PCs[0].nID);
        objData.Type = "Jake";
        objData.GameID = g_objData.nGameID;
        objData.Message = "Msg2ID";
        objData.ID = g_objData.nID;
        objData.Event = "SDP";
        objData.sdp = g_objData.PCs[0].conn.localDescription;
        let jsonData = JSON.stringify(objData);
        sendMessage(jsonData);

    }).catch(errorHandler);
}

const gotRemoteStream = (event) => {
    console.log('got remote stream');
    document.getElementById('remote').srcObject = event.streams[0];
//     document.getElementById('USER' + g_objData.PCs[0].nID).srcObject = event.streams[0];
//     g_objData.PCs[0].vidStream.srcObject = event.streams[0];

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
