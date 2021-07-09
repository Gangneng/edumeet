import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import base64
import cv2
import numpy as np
import time

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print('connected!')
        self.room_group_name = 'Test-Room'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        await asyncio.sleep(1)
        await self.send(json.dumps({
            "message": "websocket working"
        }))

    async def disconnect(self, event):
        print('Disconnected!', event)

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        print('receive')
        start = time.time()
        json_load = json.loads(text_data)
        videodata = json_load['video']
        datalist = list(videodata.values())
        image = np.array(datalist).reshape(480, 640, 4)
        print('receive end')
        # print(image)
        print("time : ", time.time() - start)
        await self.send(json.dumps({
            "message": "websocket image"
        }))

