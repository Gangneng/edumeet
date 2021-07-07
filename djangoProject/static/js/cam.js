console.log("js work");

/* 접속자 확인용 */
var mapPeers = {};

var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

/* join and make socket */

var username;
var webSocket;

btnJoin.addEventListener('click', () => {
    username = usernameInput.value;

    console.log('username: ', username);

    if(username == ''){
        return;
    }
    usernameInput.value = '';
    usernameInput.disabled = true;
    usernameInput.style.visibility = "hidden";

    btnJoin.disabled = true;
    btnJoin.style.visibility = "hidden";

    var labelUsername = document.querySelector('#label-username');
    labelUsername.innerHTML = username;

    /*  소켓 만들 주소 만들기  */
    var loc = window.location;
    var wsStart = 'ws://';
    if (loc.protocol == 'https:'){
        wsStart = 'wss://';
    }

    var endPoint = wsStart + loc.host + loc.pathname;

    console.log('endPoint: ', endPoint);

    /* 소켓 명령어 및 소켓 생성 */
    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', (e) => {
        console.log('Connection Opened');
        sendSignal('new-peer',{})
    });
    /* 메세지 보네기 함수 webSocketOnMessage 만듬 */
    webSocket.addEventListener('message', webSocketOnMessage);
    webSocket.addEventListener('close', (e) => {
        console.log('Connection Closed!');
    });
    webSocket.addEventListener('error', (e) => {
        console.log('Error Occurred!');
    });
});

/* 소켓 메세지 */
function webSocketOnMessage(event) {
    console.log('websocketOnmessage in !')
    /* Json 형식  */
    var parsedData = JSON.parse(event.data);

    /* 받은 */
    var peerUsername = parsedData['peer'];
    var action = parsedData['action'];
    console.log(username == peerUsername,username,peerUsername)
    /* 로그인 확인 */
    if(username == peerUsername){
        console.log('나가짐')
        return;
    }
    var receiver_channel_name = parsedData['message']['receiver_channel_name'];

    /* 액션에 따른 명령어 */
    /* 연결 만들기 */
    if(action == 'new-peer'){
        /* createOfferer 생성함수 참고 */
        createOfferer(peerUsername, receiver_channel_name);

        return;
    }
    /* 연결한 곳에 정보보네기 */
    if(action == 'new-offer'){
        var offer = parsedData['message']['sdp'];
        /* createAnswerer 생성함수 참고 */
        createAnswerer(offer, peerUsername, receiver_channel_name);
        return;
    }
    /*   */
    if(action == 'new-answer'){
        var answer = parsedData['message']['sdp'];

        var peer = mapPeers[peerUsername][0];

        peer.setRemoteDescription(answer);

        return;
    }
}

/* webSocketOnMessage 용함수 만들기 함수  */
function createOfferer(peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(null);
    // turn server stun server 작업 해야함 예 외부 ip 까지 접속해야함

    /* 만든 함수 addLocalTracks 밑에 있음 영상 peer에 넣는 작업*/
    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => {
       console.log('Connection opened!');
    });

    /* 만든 함수 dcOnMessage 밑에 있음 대화창 데이터 연동작업 */
    dc.addEventListener('message', dcOnMessage);

    /* 만든 함수 createVideo 밑에 있음  영상 위치 추가해 주기 */
    var remoteVideo = createVideo(peerUsername);

    /* 만든 함수 setOnTrack 밑에 있음 영상에 음향이랑 비디오 실행 하는거  */
    setOnTrack(peer, remoteVideo);

    /* 접속자 명단  */
    mapPeers[peerUsername] = [peer, dc];

    /* 접속자 삭제하기 */
    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUsername];
            console.log('deleted iceConnection')
            if(iceConnectionState != 'closed'){
                peer.close();
            }

            /* 만든 함수 setOnTrack 밑에 있음 나간 접속자 영상 없에기  */
            removeVideo(remoteVideo);
        }
    });

    /* 접속자와 연동 영상이 만들어지면 영상을 sdp로 만들어 보네준다*/
    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));

            return;
        }
        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });
    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Local description set successfully.');
    });

}

/* createOfferer 용함수  그트리밍 영상을 peer 에 넣어준다*/
function addLocalTracks(peer){
    console.log('addLocalTracks')
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    return;
}

/* createOfferer 용함수  메세지 받은것을 적어준다 */
var messageList = document.querySelector('#message-list');

function  dcOnMessage(event){
    console.log('dcOnMessage')
    var message = event.data;
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
}

/* createOfferer 용함수 영상 추가해주기 */
function  createVideo(peerUsername){
    console.log('createVideo')
    var videoContainer = document.querySelector('#video-container');
    var remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    var videoWrapper =document.createElement('div');

    videoContainer.appendChild(videoWrapper);
    videoWrapper.appendChild(remoteVideo);
    return remoteVideo;
}

/* createOfferer 용함수 영상 추가해주기 */
function setOnTrack(peer, remoteVideo){
    console.log('setOnTrack')
    var remoteStream = new MediaStream();
    remoteVideo.scrObject = remoteStream;

    peer.addEventListener('track', async (event) => {
       remoteStream.addTrack(event.track, remoteStream);
    });
}

/* createOfferer 나간 접속자 영상 삭제 */
function removeVideo(video){
    console.log('removeVideo')
    var videoWrapper = video.parentNode;
    videoWrapper.parentNode.removeChild(videoWrapper);
}



/* webSocketOnMessage 용함수 만들기 함수  */
function createAnswerer(offer, peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(null);
    // turn server stun server 작업 해야함 예 외부 ip 까지 접속해야함

    /* 만든 함수 addLocalTracks 밑에 있음 영상 peer에 넣는 작업*/
    addLocalTracks(peer);

    /* 만든 함수 createVideo 밑에 있음  영상 위치 추가해 주기 */
    var remoteVideo = createVideo(peerUsername);

    /* 만든 함수 setOnTrack 밑에 있음 영상에 음향이랑 비디오 실행 하는거  */
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e=> {
        peer.dc = e.channel;
        peer.dc.addEventListener('open', () => {
            console.log('connection opened')
        });
        peer.dc.addEventListener('message',dcOnMessage);

        /* 접속자 명단  */
        mapPeers[peerUsername] = [peer, peer.dc];
    });
    /* 접속자 삭제하기 */
    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUsername];

            if(iceConnectionState != 'closed'){
                peer.close();
            }

            /* 만든 함수 setOnTrack 밑에 있음 나간 접속자 영상 없에기  */
            removeVideo(remoteVideo);
        }
    });

    /* 접속자와 연동 영상이 만들어지면 영상을 sdp로 만들어 보네준다*/
    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));

            return;
        }
        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Remote description set successfully for %s',peerUsername);

            return peer.createAnswer();
        })
        .then(a => {
            console.log('Answer created!');

            peer.setLocalDescription(a);
        })


}

/* 비디오 오디오 */
var localStream = new MediaStream();

const constraints = {
    'video' : true,
    'audio' : true
}

const localVideo = document.querySelector('#local-video');
const btnToggleAudio = document.querySelector('#btn-toggle-audio');
const btnToggleVideo = document.querySelector('#btn-toggle-video');



var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        var audioTracks = stream.getAudioTracks();
        var videoTracks = stream.getVideoTracks();

        audioTracks[0].enabled = true;
        videoTracks[0].enabled = true;

        /* 오디오 비디오 키고 끄기 버튼 */
        btnToggleAudio.addEventListener('click', () => {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            if(audioTracks[0].enabled){
                btnToggleAudio.innerHTML = 'Audio Mute';
                return;
            }
            btnToggleAudio.innerHTML = 'Audio Unmute'
        });

        btnToggleVideo.addEventListener('click', () => {
            videoTracks[0].enabled = !videoTracks[0].enabled;
            if(videoTracks[0].enabled){
                btnToggleVideo.innerHTML = 'Video Off';
                return;
            }
            btnToggleVideo.innerHTML = 'Video On'
        });
    })
    .catch(error => {
        console.log('Error accessing media devices.', error);
    });


/* json 묶어주고 보내는 함수 */
function sendSignal(action, message){
    var jsonStr = JSON.stringify({
        'peer': username,
        'action': action,
        'message': message,
    });

    webSocket.send(jsonStr);
}