# Generated by Django 3.2.4 on 2021-07-14 03:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('edumeet', '0003_report'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='img_url',
            field=models.URLField(null=True),
        ),
        migrations.AddField(
            model_name='report',
            name='plot_data',
            field=models.JSONField(null=True),
        ),
    ]