// Adapted from https://github.com/shanet/WebRTC-Example

var localVid = $("#localVideo");
var remoteVid = $("#remoteVideo");
var btn1 = $("#btn-client1");
var btn2 = $("#btn-client2");
var callBtn = $("#btn-call");
var msgDiv = $("#msgDiv");

var theInput = $('#msgInput')
var sendBtn = $('#btn-send');

var redBtn = $('#redLight-btn');
var yellowBtn = $('#yellowLight-btn');
var greenBtn = $('#greenLight-btn');

var leftTurn = $('#left');
var rightTurn = $('#right');
var wheel = $('.steering-wheel')
var compass = $("#spinner");

var index = 4;
var degree = 0;
var percentage = 0;

var localStream;
var peerConnection;
var serverConnection;

const peerConnectionConfig = {
    iceServers: [
        { urls: "stun:stun.stunprotocol.org:3478" },
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun.ekiga.net" },
        { urls: "stun:stun.fwdnet.net" },
        { urls: "stun:stun.ideasip.com" },
        { urls: "stun:stun.iptel.org" },
    ],
};

const MessageType = {
    SERVER_INFO: 0,
    CLIENT1: 1,
    CLIENT2: 2,
    CALL_REQUEST: 3,
    TEST: 4,
    RED_LIGHT: 5,
    YELLOW_LIGHT: 6,
    GREEN_LIGHT: 7,
    WHEEL: 8,
};

btn1.on("click", () => {
    getWebcam();
    btn2.prop("disabled", true);
    btn2.prop("display", "block");
    destination = "wss://" + location.host + "/client1";
    serverConnection = new WebSocket(destination);
    serverConnection.onmessage = handleMessage;
});

btn2.on("click", () => {
    getWebcam();
    btn1.prop("disabled", true);
    btn2.prop("invisibility", "hidden");
    destination = "wss://" + location.host + "/client2";
    serverConnection = new WebSocket(destination);
    serverConnection.onmessage = handleMessage;
});

callBtn.on("click", () => {
    start(true);
});

sendBtn.on('click', () => {
    if (destination != undefined) {
        serverConnection.send(
            JSON.stringify({
                type: MessageType.TEST,
                ice: event.candidate,
                message: theInput.val(),
            })
        );
        serverConnection.onmessage = handleMessage;
        console.log(theInput.val());
    }
});

redBtn.on('click', () => {
    if (destination != undefined) {
        serverConnection.send(
            JSON.stringify({
                type: MessageType.RED_LIGHT,
                ice: event.candidate,
                message: "Red light is on",
            })
        );
        serverConnection.onmessage = handleMessage;
        console.log("turn on red light");
        document.getElementById("redLight-btn").style.backgroundColor = "red";
        document.getElementById("yellowLight-btn").style.backgroundColor = "#CC8609";
        document.getElementById("greenLight-btn").style.backgroundColor = "darkgreen";
    }
});

yellowBtn.on('click', () => {
    if (destination != undefined) {
        serverConnection.send(
            JSON.stringify({
                type: MessageType.YELLOW_LIGHT,
                ice: event.candidate,
                message: "Yellow light is on",
            })
        );
        serverConnection.onmessage = handleMessage;
        console.log("turn on yellow light");
        document.getElementById("redLight-btn").style.backgroundColor = "darkred";
        document.getElementById("yellowLight-btn").style.backgroundColor = "yellow";
        document.getElementById("greenLight-btn").style.backgroundColor = "darkgreen";
    }
});

greenBtn.on('click', () => {
    if (destination != undefined) {
        serverConnection.send(
            JSON.stringify({
                type: MessageType.GREEN_LIGHT,
                ice: event.candidate,
                message: "green light is on",
            })
        );
        serverConnection.onmessage = handleMessage;
        console.log("turn on green light");
        document.getElementById("redLight-btn").style.backgroundColor = "darkred";
        document.getElementById("greenLight-btn").style.backgroundColor = "#7FFF00";
        document.getElementById("yellowLight-btn").style.backgroundColor = "#CC8609";
    }
});

function rotateThis(degree) {
    console.log("supposed to turn")
    wheel.css({
        "transform": "rotate(" + degree + "deg)"
    });
    compass.css({
        "transform": "rotate(" + degree / 4 + "deg)"
    });
};

leftTurn.on("click", function() {
    if (index === 4) {
        index = 1;
        percentage -= 400;
    } else {
        index += 1;
    }
    percentage += 100;
    degree -= 360;
    console.log(degree)
    if (destination != undefined) {
        serverConnection.send(
            JSON.stringify({
                type: MessageType.WHEEL,
                ice: event.candidate,
                message: degree,
            })
        );
        serverConnection.onmessage = handleMessage;
        console.log("turn wheel left");
    }
    return rotateThis(degree);
});

rightTurn.on("click", function() {
    if (index === 0) {
        percentage += 400;
        index = 3;
    } else {
        index -= 1;
    }
    percentage -= 100;
    degree += 360;
    console.log(degree)
    if (destination != undefined) {
        serverConnection.send(
            JSON.stringify({
                type: MessageType.WHEEL,
                ice: event.candidate,
                message: degree,
            })
        );
        serverConnection.onmessage = handleMessage;
        console.log("turn wheel right");
    }
    return rotateThis(degree);
});

function getWebcam() {
    if (navigator.getUserMedia) {
        navigator.getUserMedia({
                video: true,
                audio: true,
            },
            (stream) => {
                // success
                localStream = stream;
                localVid.prop("srcObject", stream);
            },
            (error) => {
                // error
                console.error(error);
            }
        );
    } else {
        alert("Your browser does not support getUserMedia API");
    }
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.ontrack = gotRemoteStream;
    peerConnection.addStream(localStream);

    if (isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler); // using chained Promises for async
    }
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        serverConnection.send(
            JSON.stringify({
                type: MessageType.CALL_REQUEST,
                ice: event.candidate,
                message: "Sending ICE candidate",
            })
        );
    }
}

function createdDescription(description) {
    console.log("got description");

    peerConnection
        .setLocalDescription(description)
        .then(() => {
            serverConnection.send(
                JSON.stringify({
                    type: MessageType.CALL_REQUEST,
                    sdp: peerConnection.localDescription,
                    message: "Requesting call",
                })
            );
        })
        .catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log("got remote stream");
    remoteVid.prop("srcObject", event.streams[0]);
    msgDiv.html("Connected.");
}

function handleMessage(mEvent) {
    var msg = JSON.parse(mEvent.data);

    switch (msg.type) {
        case MessageType.SERVER_INFO:
            msgDiv.html(msg.message);
            break;

        case MessageType.TEST:
            msgDiv.html(msg.message);
            break;

        case MessageType.RED_LIGHT:
            document.getElementById("redLight-btn").style.backgroundColor = "red";
            document.getElementById("yellowLight-btn").style.backgroundColor = "#CC8609";
            document.getElementById("greenLight-btn").style.backgroundColor = "darkgreen";
            // msgDiv.html(msg.message);
            break;

        case MessageType.YELLOW_LIGHT:
            document.getElementById("redLight-btn").style.backgroundColor = "darkred";
            document.getElementById("yellowLight-btn").style.backgroundColor = "yellow";
            document.getElementById("greenLight-btn").style.backgroundColor = "darkgreen";
            // msgDiv.html(msg.message);
            break;

        case MessageType.GREEN_LIGHT:
            document.getElementById("redLight-btn").style.backgroundColor = "darkred";
            document.getElementById("yellowLight-btn").style.backgroundColor = "#CC8609";
            document.getElementById("greenLight-btn").style.backgroundColor = "#7FFF00";
            // msgDiv.html(msg.message);
            break;

        case MessageType.WHEEL:
            rotateThis(msg.message);
            break;


        // Message came from Client 1, Handle as Client2
        case MessageType.CLIENT1:
            break;

        // Message came from Client 2, Handle as Client1
        case MessageType.CLIENT2:
            break;

        case MessageType.CALL_REQUEST:
            if (!peerConnection) {
                msgDiv.html("Receiving Call!");
                start(false);
            }

            // Are we on the SDP stage or the ICE stage of the handshake?
            if (msg.sdp) {
                peerConnection
                    .setRemoteDescription(new RTCSessionDescription(msg.sdp))
                    .then(() => {
                        // Only create answers in response to offers
                        if (msg.sdp.type == "offer") {
                            peerConnection
                                .createAnswer()
                                .then(createdDescription)
                                .catch(errorHandler);
                        }
                    })
                    .catch(errorHandler);
            } else if (msg.ice) {
                peerConnection
                    .addIceCandidate(new RTCIceCandidate(msg.ice))
                    .catch(errorHandler);
            }

        default:
            break;
    }
}

function errorHandler(error) {
    console.error(error);
}
