from django.urls import path

from . import views

urlpatterns = [
    path('', views.webcam),
    path('detectme', views.detectme)
]