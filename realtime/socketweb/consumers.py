from channels.generic.websocket import WebsocketConsumer
from random import randint
from time import sleep
import json
import cv2
import threading


class WSConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        cam = VideoCamera()
        while True:
            print(cam.frame)
            sleep(1)
        self.send(json.dumps({'message': f'{cam.frame}'}))

    async def disconnect(self, text_data):
        print("disconnect", text_data)

    async def receive(self, text_data):
        print("receive", text_data)
        cam = VideoCamera()
        print(cam.frame)
        self.send(json.dumps({'message': f'{cam.frame}'}))


class VideoCamera(object):
    def __init__(self):
        self.video = cv2.VideoCapture(0)
        (self.grabbed, self.frame) = self.video.read()
        threading.Thread(target=self.update, args=()).start()

    def __del__(self):
        self.video.release()

    def get_frame(self):
        image = self.frame
        _, jpeg = cv2.imencode('.jpg', image)
        return jpeg.tobytes()

    def update(self):
        while True:
            (self.grabbed, self.frame) = self.video.read()


def gen(camera):
    while True:
        frame = camera.get_frame()
        yield(b'--frame\r\n'
              b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

