from .mp_detection import fd_image
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import numpy as np
import time


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print('connected!')
        self.room_group_name = 'Test-Room'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

        peer_data = {
            'user_name': '',
            'room_group_name': self.room_group_name ,
            'channel_name': self.channel_name
        }

        await self.accept()

        await self.send(json.dumps({
            "send_type": "websocket accepted!",
            "peer_data": peer_data
        }))

    async def disconnect(self, event):
        print('Disconnected!', event)

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        print('receive')
        json_load = json.loads(text_data)
        send_type = json_load['send_type']

        if send_type == 'new_socket_opened':
            print('send_type: new_socket_opened', json_load)
            json_load['peer_data']['channel_name'] = self.channel_name
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_group',
                    'send_data': json.dumps(json_load)
                }
            )

        if send_type == 'icecandidate_offer':
            print('send_type: icecandidate_offer')
            receiver_channel_name = json_load['receiver_peer']['channel_name']
            json_load['receiver_peer']['channel_name'] = self.channel_name

            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send_group',
                    'send_data' : json.dumps(json_load)
                }
            )

        if send_type == 'icecandidate_answer':
            print('send_type: icecandidate_answer')
            receiver_channel_name = json_load['receiver_peer']['channel_name']
            json_load['receiver_peer']['channel_name'] = self.channel_name

            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send_group',
                    'send_data': json.dumps(json_load)
                }
            )

        if send_type == 'send_image':
            print('send_type: send_image')
            start = time.time()
            videodata = json_load['video_img']
            datalist = list(videodata.values())
            image = np.array(datalist).reshape(480, 640, 4)
            image, is_absent = fd_image(image)
            print(is_absent)
            json_load['peer_data']['is_absent'] = is_absent
            print('receive end')
            print(image[0][0])
            print("time : ", time.time() - start)
            await self.send(json.dumps(json_load))

        if send_type == '':
            print('send_type: Null')

    async def send_group(self, event):
        print(event['send_data'])
        await self.send(event['send_data'])
