from django.shortcuts import render

# https://blog.miguelgrinberg.com/post/video-streaming-with-flask/page/8

from django.http.request import HttpHeaders, HttpRequest
from django.http.response import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect, render
from django.contrib.auth.hashers import make_password
from django.views import  View
from django.http import JsonResponse, HttpResponse
from django.core.serializers import json, serialize
# from rest_framework
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated

# from .models import Account
from .models import GradeInfo, Lecture, LoginInfo, User, StudentUser, TeacherUser, Subject
from .forms import UserForm, LoginInfoForm, GradeInfoForm, ClassInfoForm, SubjectForm
from .utils import login_check
import json, jwt
from djangoProject.settings import SECRET_KEY, BASE_DIR

# Create your views here.

def main_cam(request):
    context = {}
    return render(request, "cam/player.html", context=context)

class HelloWorldView(APIView):
    def get(self, request):
        data = {}
        data['message'] = "Hello,World"
        print('view')
        return Response(data = data)

def login_page_render(request):

    return render(request, "login_page.html")

# def login_process(request):
#     if request.method == "POST":
#         user_name = request.POST.get("username")
#         password = request.POST.get("pass")
#         print(user_name, password)
#         return render(request, "index.html", context={"user_name":user_name, "password": password})
#     return HttpResponse(400)

def init_insert_info(request):
    subjects = ['없음', '국어', '수학', '통합', '안전한 생활', '창의적 체험활동', '사회', '도덕', '과학', '체육', '음악', '미술', '영어', '실과']
    for i in range(1, 7):
        GradeInfoForm({'name':str(i)}).save()
    for i in range(1, 6):
        ClassInfoForm({'name':str(i)}).save()
    for sub in subjects:
        SubjectForm({'name':sub}).save()
    return HttpResponse('성공')

class RegistView(APIView):
    def get(self, request):
        return render(request, 'regist.html', context={'loginfo_form': LoginInfoForm, 'user_form':UserForm})
    
    def post(self, request):
        login_info_form = LoginInfoForm(request.POST)
        user_form = UserForm(request.POST)
        if login_info_form.is_valid() and user_form.is_valid():
            loginfo = login_info_form.save(commit=False)
            user = user_form.save()
            user_id = user.id
            loginfo.user_id = user_id
            if request.data.get('type')[0] == '2':
                print('create teacher user')
                teacher = TeacherUser()
                teacher.user_id = user_id
                teacher.save()
            elif request.data.get('type')[0] == '3':
                print('create student user')
                student = StudentUser()
                student.user_id = user_id
                student.save()
            loginfo.save()
            print('regist success')
            
        return render(request, 'login.html')

class LoginView(APIView):
    def get(self, request):
        print(BASE_DIR)
        login_form = LoginInfoForm()
        return render(request, 'login.html', context={"login_form": login_form})
    
    def post(self, request):
        print(request.path_info)
        print("Get POST request")
        login_info_form = LoginInfoForm(request.data)
        print(login_info_form.is_valid())
        # print(request.POST)
        # db_list = LoginInfo.objects.all()
        # for i in db_list:
        #     print(i.login_id, i.password)
        # print("Is valid form?",login_info_form.is_valid())
        print(login_info_form.is_user())
        # print(login_info_form.token_name)
        is_user, response_obj = login_info_form.is_user()
        print(is_user, "token info")
        return response_obj
        
class TeacherView(APIView):
    @login_check
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id = payload['id'])
        return render(request, 'teacher.html', context={'name': user.name, 'class':user.class_id, 'subject':user.grade_id})

class StudentView(APIView):
    @login_check
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id = payload['id'])
        return render(request, 'student.html', context={'name': user.name, 'class':user.class_id, 'subject':user.grade_id})

class AppView(APIView):
    @login_check
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['id']
        user = User.objects.get(id = user_id)
        calendar_obj = get_calendar(request, user_id)
        calendar_obj['name'] = user.name
        calendar_obj['class'] = user.class_id
        calendar_obj['subject'] = user.grade_id

        return render(request, 'home.html', context=calendar_obj)

def logout(request):
    response = redirect('/login')
    response.delete_cookie('access_token')
    
    return response


from datetime import datetime
import calendar
def get_calendar(request, user_id):

    # print(lectures)

    ##### 달력 만들기 ####
    cal_Y = str(datetime.today().year)
    cal_M = str(datetime.today().month)
    weakname = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    lectures = Lecture.objects.filter(user_id = user_id, class_date__year = cal_Y, class_date__month = cal_M)
    lectures = Lecture.objects.select_related().filter(user_id = user_id, class_date__year = cal_Y, class_date__month = cal_M)
    # print(test_lectures.get(id=3).subject_id.name)
    # print('test-lecture', serialize('json', test_lectures))
    # print('test_lecture where id = 3',serialize('json', test_lectures.get(id = 3)))
    
    #월 첫째날 요일 계산하기

    now = datetime.today()
    day_first = now.replace(day=1)
    weekday_first = day_first.weekday()
    day_last = calendar.monthrange(now.year,now.month)

    


    if weekday_first == 6 :
        weekday_first = 0 
    else:
        weekday_first += 1 
    bigcalendar = []
    calendarmaker = [0]*weekday_first
    for i in range(1,day_last[1]+1):
        calendarmaker.append(
            {
                "date": i,
                "lectures": lectures.filter(class_date__day = i)
            }
        )
        if len(calendarmaker) == 7:
            bigcalendar.append(calendarmaker)
            calendarmaker = []
    if calendarmaker:
        bigcalendar.append(calendarmaker)
    if len(bigcalendar[-1]) != 7:
        for i in range(1,len(bigcalendar[-1])):
            bigcalendar[-1].append(0)

    # lectures = 
    print(serialize('json', lectures))
    print(bigcalendar)
    #### 달력 만들기 끝 ####

    #보넬 정보 딕 #
    inputdic = {
        "weakname":weakname ,
        "cal_Y":cal_Y,
        "cal_M" : cal_M , 
        "bigcalendar":bigcalendar,
    }

    return inputdic 