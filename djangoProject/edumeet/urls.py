from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('detectme', views.detectme, name='detectme'),
    path('detectme2', views.detectme2, name='detectme2')
]