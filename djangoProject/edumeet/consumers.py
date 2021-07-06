import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'Test-Room'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print('Disconnected!')

    async def receive(self, text_data):
        print('실행되라!')
        receive_dict = json.loads(text_data)
        message = receive_dict['message']
        action = receive_dict['action']
        print(action)
        if (action == 'new-offer') or (action == 'new-answer'):
            receive_channel_name = receive_dict['message']['receiver_channel_name']

            receive_dict['message']['receiver_channel_name'] = self.channel_name

            await self.channel_layer.send(
                receive_channel_name,
                {
                    'type': 'send_sdp',
                    'receive_dict': receive_dict
                }
            )

            return
        else:
            receive_dict['message']['receiver_channel_name'] = self.channel_name
            receive_channel_name = receive_dict['message']['receiver_channel_name']
            await self.channel_layer.send(
                receive_channel_name,
                {
                    'type': 'send_sdp',
                    'receive_dict': receive_dict
                }
            )
    async def send_sdp(self, event):
        receive_dict = event['receive_dict']

        await self.send(text_data=json.dumps(receive_dict))