# Generated by Django 3.2.4 on 2021-07-14 03:13

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('edumeet', '0002_alter_lecture_class_date'),
    ]

    operations = [
        migrations.CreateModel(
            name='Report',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('lecture_id', models.ForeignKey(db_column='lecture_id', default=1, on_delete=django.db.models.deletion.CASCADE, to='edumeet.lecture')),
            ],
        ),
    ]
