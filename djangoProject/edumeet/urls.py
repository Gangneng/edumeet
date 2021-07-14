from django.urls import path
from django.conf.urls import url
from .views import AppView, LectureView, ReportView, main_cam, HelloWorldView, RegistView, LoginView, StudentView, TeacherView,login_page_render, init_insert_info, logout

urlpatterns = [
    url('/', LoginView.as_view()),
    url('^home', AppView.as_view()),
    url('^login', LoginView.as_view()),
    url('^lecture', LectureView.as_view()),
    url(r'^hello/world/$', HelloWorldView.as_view()),
    url('^regist', RegistView.as_view()),
    url('^teacher', TeacherView.as_view()),
    url('^student', StudentView.as_view()),
    url('^report', ReportView.as_view()),
    url('^insert_init', init_insert_info),
    url('^logout', logout),
    # path('', main_cam, name='main_cam'),
]