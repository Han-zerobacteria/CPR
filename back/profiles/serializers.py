from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            "nickname",
            "role",
            "profile_image_url",
            "bio",
            "is_public",
        ]
