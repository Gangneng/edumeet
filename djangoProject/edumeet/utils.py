from django.http.request import HttpRequest
from django.shortcuts import redirect
import jwt
import json

from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from djangoProject.settings import SECRET_KEY
from .models import User

def login_check(func):
    def wrapper(self, request, *args, **kwargs):
        print('login checker')
        access_token = request.COOKIES.get('access_token', None)
        print(access_token)
        if not access_token:
            return JsonResponse({'message':'Authorization is None'}, status=400)
        try:
            ALGORITHM = 'HS256'
            payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
            print(payload['id'])
            user_type = user_check(payload['id'])
            if user_type == 'student':
                return redirect("/student")
            if user_type == 'teacher':
                return redirect('/teacher')
        except jwt.exceptions.DecodeError as e:
            print(e)
            return JsonResponse({'message':'INVALID TOKEN'}, status=400)
        
        except User.DoesNotExist:
            return JsonResponse({'message':'INVALID USER'})
        
        return func(self, request, *args, **kwargs)
    return wrapper

def teacher_check(func):
    def wrapper(self, request, *args, **kwargs):
        access_token = request.COOKIES.get('access_token', None)
        if not access_token:
            return JsonResponse({'message':'Authorization is None'}, status=400)
        try:
            ALGORITHM = 'HS256'
            payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
            print(payload)
            if user_check(payload) != 'teacher':
                raise User.DoesNotExist
        except jwt.exceptions.DecodeError as e:
            print(e)
            return JsonResponse({'message':'INVALID TOKEN'}, status=400)
        
        except User.DoesNotExist:
            return JsonResponse({'message':'INVALID USER'})
        
        return func(self, request, *args, **kwargs)
    return wrapper

def student_check(func):
    def wrapper(self, request, *args, **kwargs):
        access_token = request.COOKIES.get('access_token', None)
        if not access_token:
            return JsonResponse({'message':'Authorization is None'}, status=400)
        try:
            ALGORITHM = 'HS256'
            payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
            print(payload)
            if user_check(payload) != 'student':
                raise User.DoesNotExist
        except jwt.exceptions.DecodeError as e:
            print(e)
            return JsonResponse({'message':'INVALID TOKEN'}, status=400)
        
        except User.DoesNotExist:
            return JsonResponse({'message':'INVALID USER'})
        
        return func(self, request, *args, **kwargs)
    return wrapper

def user_check(payload):
    user_info = User.objects.get(id=payload['id'])
    user_type = user_info.get_type_display()
    print('user type', user_type)
    return user_type