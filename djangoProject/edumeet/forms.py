from django.forms import widgets
from djangoProject.settings import SECRET_KEY
from django import forms
from django.core.serializers import json, serialize
from django.db.models import fields
from django.http.response import JsonResponse
# from django.contrib.auth.hashers import make_password
from .models import User, TeacherUser, StudentUser, GradeInfo, ClassInfo, Subject, LoginInfo
import bcrypt
import jwt

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['name', 'type']

    def save(self, commit=True):
        saved_user = User.objects.create(**self.cleaned_data)
        print(saved_user.id)
        return saved_user

class LoginInfoForm(forms.ModelForm):
    class Meta:
        model = LoginInfo
        fields = ('login_id', 'password')
        widgets = {
            'login_id': forms.TextInput(attrs={
                'class':'input100',
                'placeholder':'Username'
            }),
            'password': forms.PasswordInput(attrs={
                'class':'input100',
                'placeholder':'Password',
            }),

        }

    def save(self, commit=True):
        log_info = super(LoginInfoForm, self).save(commit=False)
        password = self.cleaned_data['password']
        new_salt = bcrypt.gensalt()
        password = bcrypt.hashpw(password.encode('utf-8'), new_salt).decode('utf-8')
        log_info.password = password
        if commit:
            log_info.save()
        return log_info

    def is_user(self):
        print(self.__dict__)
        try:
            user = LoginInfo.objects.get(login_id = self.data['login_id'])
        except Exception:
            return False, JsonResponse({'message': "INVALID_USER"}, status = 400)

        if bcrypt.checkpw(self.cleaned_data['password'].encode('utf-8'), user.password.encode('utf-8')):
            SECRET = SECRET_KEY
            ALGORITHM = 'HS256'
            access_token = jwt.encode({'id':user.id}, SECRET, algorithm=ALGORITHM)
            user_info = User.objects.get(id = user.id)
            response = JsonResponse({'message':'SUCCESS', 'user_type': user_info.type}, status=200)
            response.set_cookie('access_token', access_token)
            return True, response
        return False, JsonResponse({'message':'INVALID PASSWORD OR ACCOUNT'}, status=400)
        
class GradeInfoForm(forms.ModelForm):
    class Meta:
        model = GradeInfo
        fields = ['name']

class ClassInfoForm(forms.ModelForm):
    class Meta:
        model = ClassInfo
        fields = ['name']

class SubjectForm(forms.ModelForm):
    class Meta:
        model = Subject
        fields = ['name']
