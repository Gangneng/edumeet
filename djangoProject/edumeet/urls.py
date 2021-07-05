from django.urls import path
from .views import main_cam

urlpatterns = [
    path('', main_cam, name='main_cam'),
]