from django.conf import settings
from django.db import models
from django.db.models.functions import Lower


def profile_image_upload_path(instance, filename):
    return f"profiles/{instance.user_id}/{filename}"


class Profile(models.Model):
    class Role(models.TextChoices):
        GENERAL_USER = "general_user", "General user"
        STYLIST = "stylist", "Stylist"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    nickname = models.CharField(max_length=20, unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.GENERAL_USER,
    )
    profile_image = models.ImageField(upload_to=profile_image_upload_path, blank=True, null=True)
    bio = models.CharField(max_length=500, blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles_profile"
        constraints = [
            models.UniqueConstraint(Lower("nickname"), name="profiles_profile_nickname_ci_unique"),
        ]

    def __str__(self):
        return self.nickname

    @property
    def profile_image_url(self):
        if not self.profile_image:
            return None
        return self.profile_image.url
