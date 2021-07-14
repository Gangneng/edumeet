from json.encoder import JSONEncoder
from django.shortcuts import render
from datetime import datetime
import calendar 
# https://blog.miguelgrinberg.com/post/video-streaming-with-flask/page/8

def main_cam(request):
    
    ##### 달력 만들기 ####
    cal_Y = str(datetime.today().year)
    cal_M = str(datetime.today().month)
    weakname = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    
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
        calendarmaker.append(i)
        if len(calendarmaker) == 7:
            bigcalendar.append(calendarmaker)
            calendarmaker = []
    if calendarmaker:
        bigcalendar.append(calendarmaker)
    if len(bigcalendar[-1]) != 7:
        for i in range(1,len(bigcalendar[-1])):
            bigcalendar[-1].append(0)



    #### 달력 만들기 끝 ####

    #보넬 정보 딕 #
    context = {
        "weakname":weakname ,
        "cal_Y":cal_Y,
        "cal_M" : cal_M , 
        "bigcalendar":bigcalendar,}

    return render(request, "cam/player.html", context=context)


from django.shortcuts import render
from datetime import datetime
import calendar 
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
from .models import GradeInfo, Lecture, LoginInfo, User, StudentUser, TeacherUser, Subject, Report
from .forms import LectureForm, UserForm, LoginInfoForm, GradeInfoForm, ClassInfoForm, SubjectForm
from .utils import login_check, student_check, teacher_check
import json, jwt
from djangoProject.settings import SECRET_KEY, BASE_DIR

# Create your views here.

def main_cam(request):
    
    ##### 달력 만들기 ####
    cal_Y = str(datetime.today().year)
    cal_M = str(datetime.today().month)
    weakname = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    
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
        calendarmaker.append(i)
        if len(calendarmaker) == 7:
            bigcalendar.append(calendarmaker)
            calendarmaker = []
    if calendarmaker:
        bigcalendar.append(calendarmaker)
    if len(bigcalendar[-1]) != 7:
        for i in range(1,len(bigcalendar[-1])):
            bigcalendar[-1].append(0)



    #### 달력 만들기 끝 ####

    #보넬 정보 딕 #
    context = {
        "weakname":weakname ,
        "cal_Y":cal_Y,
        "cal_M" : cal_M , 
        "bigcalendar":bigcalendar,}

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
            
        return redirect('/login')

class LoginView(APIView):
    def get(self, request):
        print(BASE_DIR)
        login_form = LoginInfoForm()
        return render(request, 'login.html', context={"login_form": login_form})
    
    def post(self, request):
        print(request.path_info)
        print("Get POST request")
        login_info_form = LoginInfoForm(request.data)
        login_info_form.is_valid()
        is_user, response_obj = login_info_form.is_user()
        print(is_user, "token info")
        return response_obj
        
class TeacherView(APIView):
    @teacher_check
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=['HS256'])
        user = User.objects.select_related().get(id = payload['id'])
        teacher = TeacherUser.objects.select_related().get(user_id=user.id)
        lecture_form = LectureForm()
        json_obj = get_calendar(request, user_id = user.id)
        json_obj['name'] = user.name
        json_obj['grade'] = user.grade_id.name
        json_obj['class'] = user.class_id.name
        json_obj['subject'] = teacher.assigned_subject.name
        json_obj['subject_id'] = teacher.assigned_subject.id
        json_obj['lecture_form'] = lecture_form

        return render(request, 'cam/player.html', context=json_obj)

class StudentView(APIView):
    @student_check
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

class LectureView(APIView):
    def get(self, reuqest):
        return redirect('/home')

    @teacher_check
    def post(self, request):

        access_token = request.COOKIES.get('access_token')
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=['HS256'])
        request.data['user_id'] = payload['id']
        lecture_form = LectureForm(request.data)
        print(lecture_form.__dict__)
        print(lecture_form)
        lecture_form.is_valid()
        print(lecture_form.cleaned_data)
        try:
            lecture_form.save()
        except:
            raise User.DoesNotExist
        # print(lecture_form.grade_id)
        return JsonResponse(data={"message":"success"})

def logout(request):
    response = redirect('/login')
    response.delete_cookie('access_token')
    
    return response


from datetime import datetime
import calendar
def get_calendar(request, user_id, target_date=datetime.now().isoformat()):
    ##### 달력 만들기 ####
    date_obj = datetime.fromisoformat(target_date)
    print(date_obj)
    cal_Y = str(date_obj.year)
    cal_M = str(date_obj.month)
    weakname = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    lectures = Lecture.objects.select_related().filter(user_id = user_id, class_date__year = cal_Y, class_date__month = cal_M)

    #월 첫째날 요일 계산하기
    now = date_obj
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
        print(lectures.filter(class_date__day = i))
        if len(calendarmaker) == 7:
            bigcalendar.append(calendarmaker)
            calendarmaker = []
    if calendarmaker:
        bigcalendar.append(calendarmaker)
    if len(bigcalendar[-1]) != 7:
        for i in range(1,len(bigcalendar[-1])):
            bigcalendar[-1].append(0)

    # lectures = 
    # print(serialize('json', lectures))
    # print(bigcalendar)
    #### 달력 만들기 끝 ####
    #보넬 정보 딕 #
    inputdic = {
        "weakname":weakname ,
        "cal_Y":cal_Y,
        "cal_M" : cal_M , 
        "bigcalendar":bigcalendar,
    }
    return inputdic

class ReportView(APIView):
    @teacher_check
    def get(self, request):
        lecture = int(request.GET.get('lecture', None))
        response_dict = {
            "message": "success",
            "error": None,
            "data": None
        }
        print('lecture', lecture)
        # response = JsonResponse({"message":"success", "error": None, "data":None}, status=200)
        try:
            report = Report.objects.filter(lecture_id=lecture)
            response_dict['data'] = serialize('json', report)
        except Exception as e:
            response_dict['message'] = "Fail"
            response_dict['error'] = e.__str__()
            return HttpResponse(json.dumps(response_dict))
        return JsonResponse(response_dict, status=200)
        print(response.__dict__)
        return response
        print(report.__dict__)