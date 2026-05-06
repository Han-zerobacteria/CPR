from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("nickname", "user", "role", "is_public", "created_at")
    list_filter = ("role", "is_public")
    search_fields = ("nickname", "user__login_id")
