from django.db import models
from django.conf import settings
from django.db.models.fields.related import ForeignKey
from .modules import id_validator, pass_validator
from django.contrib.auth import password_validation

# Create your models here.
class User(models.Model):
    USER_TYPE = [
        (1, "admin"),
        (2, "teacher"),
        (3, "student")
    ]
    id = models.AutoField(primary_key=True)
    name = models.CharField('이름', max_length=20, blank=False, null=False)
    type = models.IntegerField('유형', choices = USER_TYPE)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('변경일', auto_now=True)
    grade_id = models.ForeignKey('GradeInfo', on_delete=models.PROTECT, db_column='grade_id', default=1)
    class_id = models.ForeignKey('ClassInfo', on_delete=models.PROTECT, db_column='class_id', default=1)
    # class Meta:
    #     db_table = 'edumeet_user'

class Subject(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField('과목이름', max_length=20, blank=False, null=False)
    def __str__(self):
        return str(self.id)

    # class Meta:
    #     db_table = 'edumeet_subject'

class GradeInfo(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField('Grade', max_length=20, blank=False, null = False)
    def __str__(self):
        return self.name
    # class Meta:
    #     db_table = 'edumeet_gradeinfo'

class ClassInfo(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField('Class', max_length=20, blank=False, null = False)
    def __str__(self):
        return self.name
    # class Meta:
    #     db_table = 'edumeet_classinfo'

class TeacherUser(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assigned_subject = models.ForeignKey('Subject', on_delete=models.PROTECT, db_column="subject_id", default=1)
    # def __str__(self):
    #     return self.user
    # class Meta:
    #     db_table = 'edumeet_teacheruser'
    
class StudentUser(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    def __str__(self):
        return self.user
    # class Meta:
    #     db_table = 'edumeet_studentuser'

class LoginInfo(models.Model):
    id = models.AutoField(primary_key=True)
    login_id = models.CharField('login_id', max_length=20, unique=True)
    password = models.CharField('password', max_length=30, validators=[pass_validator])
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # def __str__(self):
    #     return self.user_id
    # class Meta:
    #     db_table = 'edumeet_loginfo'

class Lecture(models.Model):
    time_choices = [
        (1, "09:00~09:45"),
        (2, "10:00~10:45"),
        (3, "11:00~11:45"),
        (4, "13:00~13:45"),
        (5, "14:00~14:45"),
        (6, "15:00~15:45"),
    ]
    id = models.AutoField(primary_key=True)
    subject_id = models.ForeignKey(Subject, on_delete=models.CASCADE, db_column='subject_id', default=1)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', default=1)
    class_time = models.IntegerField(choices = time_choices)
    class_date = models.DateTimeField(blank=False, null=False)
    grade_id = models.ForeignKey(GradeInfo, on_delete=models.CASCADE, db_column="grade_id", default=1)
    class_id = models.ForeignKey(ClassInfo, on_delete=models.CASCADE, db_column="class_id", default=1)
    def __str__(self):
        return f'{self.id}, {self.class_time}, {self.class_date}'
    # class Meta:
    #     db_table = 'edumeet_lecture'
    

class Report(models.Model):
    id = models.AutoField(primary_key=True)
    lecture = models.ForeignKey(Lecture, on_delete=models.CASCADE, default=1)
    img_url = models.URLField(null=True)
    plot_data = models.JSONField(null=True)

    class Meta:
        db_table = 'edumeet_report'