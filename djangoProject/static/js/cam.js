console.log("js work");


// 사이드바
const sidebar_list = document.querySelectorAll(".nv_list")

/* 접속자 확인용 */
var mapPeers = {};

var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

var webSocket;
var username;
var channel_name;
var My_data;
var btnSendMsg = document.querySelector('#btn-send-msg');
var messageList = document.querySelector('#message-list');
var messageInput = document.querySelector('#chat_input');

const servers = {
    iceservers: [
        {
            urls: ['stun:stun1.1.google.com:19302','stun:stun2.1.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
}

// 비디오 관련 정리
var localVideo = document.querySelector('#local-video');
const btnToggleAudio = document.querySelector('#btn-toggle-audio');
const btnToggleVideo = document.querySelector('#btn-toggle-video');
var localStream= navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;
        var videoTracks = stream.getVideoTracks();
        var audioTracks = stream.getAudioTracks();

        btnToggleVideo.addEventListener('click', () => {
            videoTracks[0].enabled = !videoTracks[0].enabled;
            if(videoTracks[0].enabled){
                btnToggleVideo.innerHTML = 'Video Off';
                return;
            }
            btnToggleVideo.innerHTML = 'Video On'
        });

        btnToggleAudio.addEventListener('click', () => {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            if(audioTracks[0].enabled){
                btnToggleVideo.innerHTML = 'audio Off';
                return;
            }
            btnToggleVideo.innerHTML = 'audio On'
        });

    })
    .catch(error => {
        console.log('Error accessing media devices.', error);
    });

function main() {
    // 사이드바 설정
    sideBarActive();

    btnJoin.addEventListener('click', ()=> {
        username = usernameInput.value;
        usernameInput.style.visibility = "hidden";
        btnJoin.style.visibility = "hidden";
        document.querySelector(".intopage").style.visibility = "hidden"
        makeSocket();
    });
}

// 비디오 만들기
function makeSocket () {
    var loc = window.location;
    var wsStart = 'ws://';
    if (loc.protocol == 'https://') {
        wsStart = 'wss://';
    }
    var endPoint = wsStart + loc.host + loc.pathname + "ws/";
    webSocket = new WebSocket(endPoint);
    // 시작 되면 최초 센드하기
    webSocket.onopen = function (e) {
        console.log("open", e);
        My_data = {
            'user_name': username,
            'room_group_name': 'Test-Room'
        }
        var jsonSend = JSON.stringify({
            'send_type' : 'new_socket_opened',
            'peer_data': My_data,
        });
        webSocket.send(jsonSend);
    }
    //
    webSocket.onmessage = function (e) {
        var jsonDic = JSON.parse(e.data);
        var peer_data = jsonDic['peer_data'];
        if (username == peer_data['user_name']) {
            console.log('Same username: ', jsonDic)

            if (jsonDic['send_type'] == 'send_image'){
                console.log('send_type: send_image here');
                sendImgMaker()
                return;
            }
            return;
        }
        var send_type = jsonDic['send_type'];
        if (send_type == 'websocket accepted!'){
            My_data['channel_name'] = jsonDic['peer_data']['channel_name'];
            console.log('send_type: websocket accepted!', My_data);
            sendImgMaker()
            return;
        }
        if (send_type == 'new_socket_opened'){
            newSocketOffer(peer_data);
            console.log('send_type: new_socket_opened');
            return;
        }
        if (send_type == 'icecandidate_offer'){
            console.log('send_type: icecandidate_offer');
            newSocketAnswer(jsonDic['sdp'], peer_data, jsonDic['receiver_peer']['channel_name'])
            return;
        }
        if (send_type == 'icecandidate_answer'){
            console.log('send_type: icecandidate_answer');
            var answer = jsonDic['sdp'];
            var peer = mapPeers[peer_data['user_name']][0];
            peer.setRemoteDescription(answer)
                .then(console.log('work done'));
            return;
        }
        if (send_type == ''){
            console.log('send_type: Null');
        }
    }

    webSocket.onerror = function (e) {
        console.log("error", e);
    }
    webSocket.onclose = function (e) {
        console.log("close", e);
    }
}
async function newSocketOffer(peer_data) {
    // 여기 는 로컬 ip만 가능 다른 ip와 통신하려면 턴 서버 스턴서버를 적용해야함
    var peer = new RTCPeerConnection(servers);
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});

    localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
    });


    var dc = peer.createDataChannel('channel');
    dc.onopen = function (e) {
        console.log('뭔가 전해짐!');
    }
    // 이건 메세지
    dc.onmessage = function (e) {
        var message = e.data;
        var li = document.createElement('li');
        li.appendChild(document.createTextNode(message));
        messageList.appendChild(li);
    }

    // 이함수는 html에 VIdeo 넣을 공간만 만듬
    var remoteVideo = createVideo(peer_data['user_name']);
    // 이함수는  VIdeo 넣을 공간에 peer를 연결함
    var remoteStream = new MediaStream()
    peer.ontrack = event => {
        event.streams[0].getTracks().forEach(track =>
            remoteStream.addTrack(track))
    }
    remoteVideo.srcObject = remoteStream;

    mapPeers[peer_data['user_name']] = [peer, dc];

    peer.oniceconnectionstatechange = function (e) {
        var iceCS = peer.iceConnectionState;

        if(iceCS === 'failed' || iceCS ==='disconnected' || iceCS === 'closed'){
            delete mapPeers[peer_data['user_name']];
            if(iceCS != 'closed') {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    }
    peer.onicecandidate = function (e){
        if(e.candidate){
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));
            return;
        }

        var jsonSend = JSON.stringify({
            'send_type' : 'icecandidate_offer',
            'peer_data': My_data,
            'sdp': peer.localDescription,
            'receiver_peer':peer_data,
        });
        webSocket.send(jsonSend);
    }

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Local description set successfully');
        });
}
async function newSocketAnswer(sdp, peer_data, receiver_channel_name){
    // 여기 는 로컬 ip만 가능 다른 ip와 통신하려면 턴 서버 스턴서버를 적용해야함
    var peer = new RTCPeerConnection(servers);
    localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
    });


    // 이건 메세지
    peer.ondatachannel = function (e){
        peer.dc = e.channel;
        peer.dc.onopen = function (e) {
            console.log('Video answer Connected opened!');
        }
        peer.dc.onmessage = function (e) {
            var message = e.data;
            var li = document.createElement('li');
            li.appendChild(document.createTextNode(message));
            messageList.appendChild(li);
        }
    }

    // 이함수는 html에 VIdeo 넣을 공간만 만듬
    var remoteVideo = createVideo(peer_data['user_name']);
    // 이함수는  VIdeo 넣을 공간에 peer를 연결함
    var remoteStream = new MediaStream()
    peer.ontrack = event => {
        event.streams[0].getTracks().forEach(track =>
            remoteStream.addTrack(track))
    }

    remoteVideo.srcObject = remoteStream;

    mapPeers[peer_data['user_name']] = [peer, peer.dc];

    peer.oniceconnectionstatechange = function (e) {
        var iceCS = peer.iceConnectionState;
        console.log('설마', iceCS)
        if(iceCS === 'failed' || iceCS ==='disconnected' || iceCS === 'closed'){
            delete mapPeers[peer_data['user_name']];
            if(iceCS != 'closed') {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    }
    peer.onicecandidate = function (e){
        if(e.candidate){
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));
            return;
        }

        var jsonSend = JSON.stringify({
            'send_type' : 'icecandidate_answer',
            'peer_data': My_data,
            'sdp': peer.localDescription,
            'receiver_peer':peer_data,
        });
        webSocket.send(jsonSend);
    }
    peer.setRemoteDescription(sdp)
        .then(() => {
            console.log('Remote description set successfully for %s', peer_data['user_name']);

            return peer.createAnswer();
        })
        .then((a) => {
            console.log('Answer created!');
            peer.setLocalDescription(a);
        })
}

function createVideo(peer_username){
    var videoContainer = document.querySelector('.sdp_videos');
    var remoteVideo = document.createElement('video');

    remoteVideo.id = peer_username + '-video'+ ' work-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.style =
        "position: relative; " +
        "background-color: black; "+
        "margin: 1%; "+
        "border: 3px solid white; "+
        "border-radius: 3px; " +
        "object-fit:contain; " +
        "height: 90%; " +
        "width: 16vw; "
    remoteVideo.muted = true;
    videoContainer.appendChild(remoteVideo);

    return remoteVideo;
}
function removeVideo(div_video){
    var videoWrapper = div_video;
    videoWrapper.parentNode.removeChild(videoWrapper);
}

// 함수 이미지 보내기
function sendImgMaker(e) {

    const canvas = document.createElement("canvas");
    canvas.width = localVideo.videoWidth;
    canvas.height = localVideo.videoHeight;
    canvas.getContext('2d').drawImage(localVideo, 0, 0, localVideo.videoWidth, localVideo.height);
    var data_pixel = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    var jsonSend = JSON.stringify({
        'send_type' : 'send_image',
        'peer_data': My_data,
        'video_img' : data_pixel
    });
    webSocket.send(jsonSend);
    return jsonSend;
}

/* 채팅 */
btnSendMsg.addEventListener('click', sendMsgOnclick);

function  sendMsgOnclick(){
    var message = messageInput.value;

    var li = document.createElement('li');
    li.appendChild(document.createTextNode('Me :' + message));
    messageList.appendChild(li);

    var dataChannels = getDataChannels();

    message = username + ": " +message;

    for(index in dataChannels){
        dataChannels[index].send(message);
    }
    messageInput.value = "";
}

function getDataChannels(){
    var dataChannels = [];

    for(var peerUsername in mapPeers){
        var dataChannel= mapPeers[peerUsername][1];
        dataChannels.push(dataChannel);
    }
    return dataChannels
}

function sideBarActive(){
    function activateLink(){
        sidebar_list.forEach((item) =>
        item.classList.remove('nv_active'));
        this.classList.add('nv_active');
        var selectSideBar = this.querySelector('#nv_title').innerHTML
        console.log(selectSideBar);
    }
    sidebar_list.forEach((item) =>
    item.addEventListener('click', activateLink));
}
main()

