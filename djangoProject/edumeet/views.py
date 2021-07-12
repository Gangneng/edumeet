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

