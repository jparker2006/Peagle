var g_objData = {};

onload = () => {
    MainFrame();
    initWebSocket();
}

const MainFrame = () => {
    let sPage = "";
    sPage += "<button class='connect' onClick='connectToRTC()'>Connect!</button>";
    sPage += "<audio id='remote' autoplay></audio>";
    sPage += "<audio id='local' autoplay></audio>";

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
            let objData = JSON.parse(evt.data);
            let sType = objData.Type;
            if ("Jake" == sType) {
                if ("BCast2Game" == objData.Message) {
                    if ("ConnectToRTC" == objData.Event) {
                        console.log("click");
                    }
                }
                else if ("WhoAmI" == objData.Message) {
                    g_objData.nID = objData.ID;
                }
            }
        }
    }
    catch (exception) {
        console.log('ERROR: ' + exception);
    }
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
