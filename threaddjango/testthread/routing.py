from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(r'', consumers.Consumer.as_asgi()),
]