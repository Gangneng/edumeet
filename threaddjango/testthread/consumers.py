from channels.generic.websocket import AsyncWebsocketConsumer

class Consumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'theadData'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print('connect')

    async def disconnect(self, code):
        print('disconnect')

    async def receive(self, text_data):
        print('receve')