from django.shortcuts import render

# https://blog.miguelgrinberg.com/post/video-streaming-with-flask/page/8

def main_cam(request):
    context = {}
    return render(request, "cam/main.html", context=context)
