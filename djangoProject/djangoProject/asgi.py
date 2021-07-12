"""
ASGI config for djangoProject project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import edumeet.routing
# from edumeet.routing import application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoProject.settings')
'''
 크롬만이 아닌 여러 익스플로워 연동되게 하기 
 추가된 소켓 연동
'''

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # Just HTTP for now. (We can add other protocols later.)
    "websocket": AuthMiddlewareStack(
        URLRouter(
            edumeet.routing.websocket_urlpatterns
        )
    )
})
application = get_asgi_application()