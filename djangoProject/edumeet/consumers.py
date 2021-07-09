import base64
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio


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
        json_load = json.loads(text_data)
        json_load['video']
        print('여기', json_load['video'])



        await self.send(json.dumps({
            "message": "websocket catch"
        }))

        await asyncio.sleep(100)