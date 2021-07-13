from channels.generic.websocket import AsyncWebsocketConsumer
from random import randint
from time import sleep
import json
import cv2
import threading
import time


#threading.Thread(target=video_thread_work()).start()
class WSConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        print('connect')
        await self.accept()

    async def disconnect(self, text_data):
        print("disconnect", text_data)
        pass

    async def receive(self, text_data):
        print("receive", text_data)
        pass

