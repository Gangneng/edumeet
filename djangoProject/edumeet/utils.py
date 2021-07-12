from django.http.request import HttpRequest
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
            print(payload)
            user_check(request.path_info, payload)
        except jwt.exceptions.DecodeError as e:
            print(e)
            return JsonResponse({'message':'INVALID TOKEN'}, status=400)
        
        except User.DoesNotExist:
            return JsonResponse({'message':'INVALID USER'})
        
        return func(self, request, *args, **kwargs)
    return wrapper

def user_check(path_info, payload):
    user_info = User.objects.get(id=payload['id'])
    user_type = user_info.type 
    if path_info == '/student':
        if user_type != 3:
            raise User.DoesNotExist
    if path_info == '/teacher':
        if user_type != 2:
            raise User.DoesNotExist
    