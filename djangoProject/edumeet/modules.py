import json
import bcrypt
import re
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
def id_validator(data):
    pattern = re.compile(r'[a-zA-Z0-9]{6,20}')
    if len(data) <= 8:
        raise ValidationError(
            _('%(data)s is too short, please more than 8 letter'),
            params={'value': data},
        )
    if not pattern.match(data):
        raise ValidationError('소문자와 숫자만 사용해주세요.')
    
def pass_validator(passwd):
    print('validator')
    SpecialSym =['$', '@', '#', '%', '!', "^", "&"]
    val = True
    if len(passwd) < 6:
        print('length should be at least 6')
        val = False
          
    if len(passwd) > 20:
        print('length should be not be greater than 20')
        val = False
          
    if not any(char.isdigit() for char in passwd):
        print('Password should have at least one numeral')
        val = False
    # uppercase check
    # if not any(char.isupper() for char in passwd):
    #     print('Password should have at least one uppercase letter')
    #     val = False
          
    if not any(char.islower() for char in passwd):
        print('Password should have at least one lowercase letter')
        val = False
          
    if not any(char in SpecialSym for char in passwd):
        print('Password should have at least one of the symbols $@#')
        val = False
    if val:
        return val