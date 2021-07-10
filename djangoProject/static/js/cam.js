console.log("js work");

/* 접속자 확인용 */
var mapPeers = {};

var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

var webSocket;
var username;
var channel_name;
var My_data;
var videoboard;
var videoStream = new MediaStream();
var videodata
var btnSendMsg = document.querySelector('#btn-send-msg');
var messageList = document.querySelector('#message-list')

const servers = {
    iceservers: [
        {
            urls: ['stun:stun1.1.google.com:19302','stun:stun2.1.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
}

// 비디오 관련 정리
const localVideo = document.querySelector('#local-video');
var localStream= navigator.mediaDevices.getUserMedia({video: true, audio: true});
const btnToggleAudio = document.querySelector('#btn-toggle-audio');
const btnToggleVideo = document.querySelector('#btn-toggle-video');


function main() {
    btnJoin.addEventListener('click', ()=> {
        username = usernameInput.value;
        usernameInput.style.visibility = "hidden";
        btnJoin.style.visibility = "hidden";
        makeSocket();
    });
}

// 비디오 만들기
// function makeMyVideo() {
//     var audioTracks = mediaStream.getAudioTracks();
//     var videoTracks = mediaStream.getVideoTracks();
//     audioTracks[0].enabled = true;
//     videoTracks[0].enabled = true;
//
//     btnToggleAudio.addEventListener('click', () => {
//     audioTracks[0].enabled = !audioTracks[0].enabled;
//     if(audioTracks[0].enabled){
//         btnToggleAudio.innerHTML = 'Audio Mute';
//         return;
//     }
//     btnToggleAudio.innerHTML = 'Audio Unmute'
//     });
//
//     btnToggleVideo.addEventListener('click', () => {
//     videoTracks[0].enabled = !videoTracks[0].enabled;
//     if(videoTracks[0].enabled){
//         btnToggleVideo.innerHTML = 'Video Off';
//         return;
//     }
//     btnToggleVideo.innerHTML = 'Video On'
//     });
// }


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
            return;
        }
        var send_type = jsonDic['send_type'];
        if (send_type == 'websocket accepted!'){
            My_data['channel_name'] = jsonDic['peer_data']['channel_name'];
            console.log('send_type: websocket accepted!', My_data);
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
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});

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
    var videoContainer = document.querySelector('#video-container');
    var remoteVideo = document.createElement('video');

    remoteVideo.id = peer_username + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    var videoWrapper = document.createElement('div');
    videoContainer.appendChild(videoWrapper);
    videoWrapper.appendChild(remoteVideo);

    return remoteVideo;
}
function setOnTrack(peer, remoteVideo){
    var remoteStream = new MediaStream();
    peer.onTrack = async function (e) {
        e.stream[0].getTracks().forEach(track => {
            remoteStream.addTrack(track)
        })
    }
    remoteVideo.srcObject = remoteStream;
}
function removeVideo(div_video){
    var videoWrapper = videoboard.parentNode;
    videoWrapper.parentNode.removeChild(videoWrapper);
}

// 함수 이미지 보내기
function sendImgMaker(e) {
    context.drawImage(videoboard, 0, 0, 640, 480);
    canvas = document.querySelector('#canvas');
    var data_pixel = canvas.getContext('2d').getImageData(0, 0, 640, 480).data;
    var jsonSend = JSON.stringify({
        'message': "10",
        'video': data_pixel
    },);
    return jsonSend;
}

main()
// /* join and make socket */
//
// var username;
// var webSocket;
//
// btnJoin.addEventListener('click', () => {
//     username = usernameInput.value;
//
//     console.log('username: ', username);
//
//     if(username == ''){
//         return;
//     }
//     usernameInput.value = '';
//     usernameInput.disabled = true;
//     usernameInput.style.visibility = "hidden";
//
//     btnJoin.disabled = true;
//     btnJoin.style.visibility = "hidden";
//
//     var labelUsername = document.querySelector('#label-username');
//     labelUsername.innerHTML = username;
//
//     /*  소켓 만들 주소 만들기  */
//     var loc = window.location;
//     var wsStart = 'ws://';
//     if (loc.protocol == 'https://'){
//         wsStart = 'wss://';
//     }
//
//     var endPoint = wsStart + loc.host + loc.pathname;
//
//     console.log('endPoint: ', endPoint);
//
//     /* 소켓 명령어 및 소켓 생성 */
//     webSocket = new WebSocket(endPoint);
//
//     webSocket.addEventListener('open', (e) => {
//         console.log('Connection Opened');
//         sendSignal('new-peer',{})
//     });
//     /* 메세지 보네기 함수 webSocketOnMessage 만듬 */
//     webSocket.addEventListener('message', webSocketOnMessage);
//
//     webSocket.addEventListener('close', (e) => {
//         console.log('Connection Closed!');
//     });
//     webSocket.addEventListener('error', (e) => {
//         console.log('Error Occurred!');
//     });
// });
//
// /* 소켓 메세지 */
// function webSocketOnMessage(event) {
//     console.log('websocketOnmessage in !')
//     /* Json 형식  */
//     var parsedData = JSON.parse(event.data);
//
//     /* 받은 */
//     var peerUsername = parsedData['peer'];
//     var action = parsedData['action'];
//     console.log(username == peerUsername,username,peerUsername)
//     /* 로그인 확인 */
//     if(username == peerUsername){
//         console.log('나가짐')
//         return;
//     }
//     var receiver_channel_name = parsedData['message']['receiver_channel_name'];
//
//     /* 액션에 따른 명령어 */
//     /* 연결 만들기 */
//     if(action == 'new-peer'){
//         /* createOfferer 생성함수 참고 */
//         createOfferer(peerUsername, receiver_channel_name);
//
//         return;
//     }
//     /* 연결한 곳에 정보보네기 */
//     if(action == 'new-offer'){
//         var offer = parsedData['message']['sdp'];
//         /* createAnswerer 생성함수 참고 */
//         createAnswerer(offer, peerUsername, receiver_channel_name);
//         return;
//     }
//     /*   */
//     if(action == 'new-answer'){
//         var answer = parsedData['message']['sdp'];
//
//         var peer = mapPeers[peerUsername][0];
//
//         peer.setRemoteDescription(answer);
//
//         return;
//     }
// }
//
// /* webSocketOnMessage 용함수 만들기 함수  */
// function createOfferer(peerUsername, receiver_channel_name){
//     var peer = new RTCPeerConnection(null);
//     // turn server stun server 작업 해야함 예 외부 ip 까지 접속해야함
//
//     /* 만든 함수 addLocalTracks 밑에 있음 영상 peer에 넣는 작업*/
//     addLocalTracks(peer);
//
//     var dc = peer.createDataChannel('channel');
//     dc.addEventListener('open', () => {
//        console.log('Connection opened!');
//     });
//
//     /* 만든 함수 dcOnMessage 밑에 있음 대화창 데이터 연동작업 */
//     dc.addEventListener('message', dcOnMessage);
//
//     /* 만든 함수 createVideo 밑에 있음  영상 위치 추가해 주기 */
//     var remoteVideo = createVideo(peerUsername);
//
//     /* 만든 함수 setOnTrack 밑에 있음 영상에 음향이랑 비디오 실행 하는거  */
//     setOnTrack(peer, remoteVideo);
//
//     /* 접속자 명단  */
//     mapPeers[peerUsername] = [peer, dc];
//
//     /* 접속자 삭제하기 */
//     peer.addEventListener('iceconnectionstatechange', () => {
//         var iceConnectionState = peer.iceConnectionState;
//         if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
//             delete mapPeers[peerUsername];
//             console.log('deleted iceConnection')
//             if(iceConnectionState != 'closed'){
//                 peer.close();
//             }
//
//             /* 만든 함수 setOnTrack 밑에 있음 나간 접속자 영상 없에기  */
//             removeVideo(remoteVideo);
//         }
//     });
//
//     /* 접속자와 연동 영상이 만들어지면 영상을 sdp로 만들어 보네준다*/
//     peer.addEventListener('icecandidate', (event) => {
//         if(event.candidate){
//             //console.log('New ice candidate: ', JSON.stringify(peer.localDescription));
//             return;
//         }
//         sendSignal('new-offer', {
//             'sdp': peer.localDescription,
//             'receiver_channel_name': receiver_channel_name
//         });
//     });
//     peer.createOffer()
//         .then(o => peer.setLocalDescription(o))
//         .then(() => {
//             console.log('Local description set successfully.');
//     });
//
// }
//
// /* createOfferer 용함수  그트리밍 영상을 peer 에 넣어준다*/
// function addLocalTracks(peer){
//     console.log('addLocalTracks')
//     localStream.getTracks().forEach(track => {
//         peer.addTrack(track, localStream);
//     });
//
//     return;
// }
//
// /* createOfferer 용함수  메세지 받은것을 적어준다 */
//
// function  dcOnMessage(event){
//     console.log('dcOnMessage')
//     var message = event.data;
//     var li = document.createElement('li');
//     li.appendChild(document.createTextNode(message));
//     messageList.appendChild(li);
// }
//
// /* createOfferer 용함수 영상 추가해주기 */
// function  createVideo(peerUsername){
//     console.log('createVideo')
//     var videoContainer = document.querySelector('#video-container');
//     var remoteVideo = document.createElement('video');
//
//     remoteVideo.id = peerUsername + '-video';
//     remoteVideo.autoplay = true;
//     remoteVideo.playsInline = true;
//
//     var videoWrapper =document.createElement('div');
//
//     videoContainer.appendChild(videoWrapper);
//     videoWrapper.appendChild(remoteVideo);
//     return remoteVideo;
// }
//
// /* createOfferer 용함수 영상 추가해주기 */
// function setOnTrack(peer, remoteVideo){
//     console.log('setOnTrack')
//     var remoteStream = new MediaStream();
//     remoteVideo.scrObject = remoteStream;
//
//     peer.addEventListener('track', async (event) => {
//        remoteStream.addTrack(event.track, remoteVideo);
//        console.log('track: ',remoteStream)
//     });
// }
//
// /* createOfferer 나간 접속자 영상 삭제 */
// function removeVideo(video){
//     console.log('removeVideo')
//     var videoWrapper = video.parentNode;
//     videoWrapper.parentNode.removeChild(videoWrapper);
// }
//
//
//
// /* webSocketOnMessage 용함수 만들기 함수  */
// function createAnswerer(offer, peerUsername, receiver_channel_name){
//     var peer = new RTCPeerConnection(null);
//     // turn server stun server 작업 해야함 예 외부 ip 까지 접속해야함
//
//     /* 만든 함수 addLocalTracks 밑에 있음 영상 peer에 넣는 작업*/
//     addLocalTracks(peer);
//
//     /* 만든 함수 createVideo 밑에 있음  영상 위치 추가해 주기 */
//     var remoteVideo = createVideo(peerUsername);
//
//     /* 만든 함수 setOnTrack 밑에 있음 영상에 음향이랑 비디오 실행 하는거  */
//     setOnTrack(peer, remoteVideo);
//
//     peer.addEventListener('datachannel', e=> {
//         peer.dc = e.channel;
//         peer.dc.addEventListener('open', () => {
//             console.log('connection opened')
//         });
//         peer.dc.addEventListener('message',dcOnMessage);
//
//         /* 접속자 명단  */
//         mapPeers[peerUsername] = [peer, peer.dc];
//     });
//     /* 접속자 삭제하기 */
//     peer.addEventListener('iceconnectionstatechange', () => {
//         var iceConnectionState = peer.iceConnectionState;
//         if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
//             delete mapPeers[peerUsername];
//
//             if(iceConnectionState != 'closed'){
//                 peer.close();
//             }
//
//             /* 만든 함수 setOnTrack 밑에 있음 나간 접속자 영상 없에기  */
//             removeVideo(remoteVideo);
//         }
//     });
//
//     /* 접속자와 연동 영상이 만들어지면 영상을 sdp로 만들어 보네준다*/
//     peer.addEventListener('icecandidate', (event) => {
//         if(event.candidate){
//             console.log('New ice candidate: ', JSON.stringify(peer.localDescription));
//
//             return;
//         }
//         sendSignal('new-answer', {
//             'sdp': peer.localDescription,
//             'receiver_channel_name': receiver_channel_name
//         });
//     });
//
//     peer.setRemoteDescription(offer)
//         .then(() => {
//             console.log('Remote description set successfully for %s',peerUsername);
//
//             return peer.createAnswer();
//         })
//         .then(a => {
//             console.log('Answer created!');
//
//             peer.setLocalDescription(a);
//         })
//
//
// }
//
// /* 비디오 오디오 */
// var localStream = new MediaStream();
//
// const constraints = {
//     'video' : true,
//     'audio' : true
// }
//
// const localVideo = document.querySelector('#local-video');
// const btnToggleAudio = document.querySelector('#btn-toggle-audio');
// const btnToggleVideo = document.querySelector('#btn-toggle-video');
//
//
//
// var userMedia = navigator.mediaDevices.getUserMedia(constraints)
//     .then(stream => {
//         localStream = stream;
//         localVideo.srcObject = localStream;
//         localVideo.muted = true;
//
//         var audioTracks = stream.getAudioTracks();
//         var videoTracks = stream.getVideoTracks();
//
//         audioTracks[0].enabled = true;
//         videoTracks[0].enabled = true;
//
//         /* 오디오 비디오 키고 끄기 버튼 */
//         btnToggleAudio.addEventListener('click', () => {
//             audioTracks[0].enabled = !audioTracks[0].enabled;
//             if(audioTracks[0].enabled){
//                 btnToggleAudio.innerHTML = 'Audio Mute';
//                 return;
//             }
//             btnToggleAudio.innerHTML = 'Audio Unmute'
//         });
//
//         btnToggleVideo.addEventListener('click', () => {
//             videoTracks[0].enabled = !videoTracks[0].enabled;
//             if(videoTracks[0].enabled){
//                 btnToggleVideo.innerHTML = 'Video Off';
//                 return;
//             }
//             btnToggleVideo.innerHTML = 'Video On'
//         });
//     })
//     .catch(error => {
//         console.log('Error accessing media devices.', error);
//     });
//
// console.log(userMedia)
//
// /* json 묶어주고 보내는 함수 */
// function sendSignal(action, message){
//     var jsonStr = JSON.stringify({
//         'peer': username,
//         'action': action,
//         'message': message,
//     });
//
//     webSocket.send(jsonStr);
// }
//
// /* 채팅 */
// var btnSendMsg = document.querySelector('#btn-send-msg');
// var messageList = document.querySelector('#message-list');
// var messageInput = document.querySelector('#msg');
// btnSendMsg.addEventListener('click', sendMsgOnclick);
//
// function  sendMsgOnclick(){
//     var message = messageInput.value;
//
//     var li = document.createElement('li');
//     li.appendChild(document.createTextNode('Me :' + message));
//     messageList.appendChild(li);
//
//     var dataChannels = getDataChannels();
//
//     message = username + ": " +message;
//
//     for(index in dataChannels){
//         dataChannels[index].send(message);
//     }
//     messageInput.value = "";
// }
//
// function getDataChannels(){
//     var dataChannels = [];
//
//     for(peerUsername in mapPeers){
//         var dataChannel= mapPeers[peerUsername][1];
//         dataChannels.push(dataChannel);
//     }
//     return dataChannels
// }
