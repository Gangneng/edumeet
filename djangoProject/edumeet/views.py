from django.shortcuts import render
from django.views.decorators import gzip
from django.http import StreamingHttpResponse
import cv2
import threading

# https://blog.miguelgrinberg.com/post/video-streaming-with-flask/page/8

def main_cam(request):
    context = {}

    return render(request, "cam/main.html", context=context)

