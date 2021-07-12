from django.urls import path
from django.conf.urls import url
from .views import AppView, main_cam, HelloWorldView, RegistView, LoginView, StudentView, TeacherView,login_page_render, init_insert_info, logout

urlpatterns = [
    url('^home', AppView.as_view()),
    url('^login', LoginView.as_view()),
    url('^lecture', main_cam, name='main_cam'),
    url(r'^hello/world/$', HelloWorldView.as_view()),
    url('^regist', RegistView.as_view()),
    url('^teacher', TeacherView.as_view()),
    url('^student', StudentView.as_view()),
    url('^insert_init', init_insert_info),
    url('^logout', logout),
]