import django.db.models.deletion
import profiles.models
from django.conf import settings
from django.db import migrations, models
from django.db.models.functions import Lower


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Profile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nickname", models.CharField(max_length=20, unique=True)),
                ("role", models.CharField(choices=[("general_user", "General user"), ("stylist", "Stylist")], default="general_user", max_length=20)),
                ("profile_image", models.ImageField(blank=True, null=True, upload_to=profiles.models.profile_image_upload_path)),
                ("bio", models.CharField(blank=True, max_length=500)),
                ("is_public", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "profiles_profile",
            },
        ),
        migrations.AddConstraint(
            model_name="profile",
            constraint=models.UniqueConstraint(Lower("nickname"), name="profiles_profile_nickname_ci_unique"),
        ),
    ]
