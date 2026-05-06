from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models.functions import Lower
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from profiles.models import Profile
from profiles.serializers import ProfileSerializer

from .models import User


LOGIN_ID_ERROR = _(
    "Login ID must be 4-20 characters, start with a lowercase letter, "
    "and contain only lowercase letters, numbers, and underscores."
)
NICKNAME_ERROR = _(
    "Nickname must be 2-20 characters and contain only Korean, letters, "
    "numbers, underscores, or periods without spaces."
)
ALLOWED_PROFILE_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
}
MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024


class LoginSerializer(serializers.Serializer):
    login_id = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = authenticate(
            request=request,
            username=attrs['login_id'],
            password=attrs['password'],
        )

        if user is None:
            raise serializers.ValidationError(
                'Unable to log in with the provided credentials.',
                code='authorization',
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'This user account is disabled.',
                code='authorization',
            )

        attrs['user'] = user
        return attrs


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(trim_whitespace=False, write_only=True)
    confirm_password = serializers.CharField(trim_whitespace=False, write_only=True)
    nickname = serializers.CharField(write_only=True)
    profile_image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    bio = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=500)

    class Meta:
        model = User
        fields = [
            "login_id",
            "password",
            "confirm_password",
            "nickname",
            "profile_image",
            "bio",
        ]

    def validate_login_id(self, value):
        if value != value.lower():
            raise serializers.ValidationError(LOGIN_ID_ERROR)
        if not serializers.RegexField(r"^[a-z][a-z0-9_]{3,19}$").to_internal_value(value):
            raise serializers.ValidationError(LOGIN_ID_ERROR)
        if User.objects.filter(login_id=value).exists():
            raise serializers.ValidationError("This login ID is already in use.")
        return value

    def validate_nickname(self, value):
        nickname = value.strip()
        if nickname != value:
            raise serializers.ValidationError("Nickname cannot start or end with spaces.")
        if not serializers.RegexField(r"^[가-힣A-Za-z0-9_.]{2,20}$").to_internal_value(nickname):
            raise serializers.ValidationError(NICKNAME_ERROR)
        if Profile.objects.annotate(nickname_lower=Lower("nickname")).filter(
            nickname_lower=nickname.lower()
        ).exists():
            raise serializers.ValidationError("This nickname is already in use.")
        return nickname

    def validate_profile_image(self, value):
        if value is None:
            return value

        if value.size > MAX_PROFILE_IMAGE_BYTES:
            raise serializers.ValidationError("Profile image must be 5MB or smaller.")
        if value.content_type not in ALLOWED_PROFILE_IMAGE_TYPES:
            raise serializers.ValidationError("Unsupported profile image type.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        user = User(login_id=attrs["login_id"])
        try:
            validate_password(attrs["password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        nickname = validated_data.pop("nickname")
        profile_image = validated_data.pop("profile_image", None)
        bio = validated_data.pop("bio", "")

        try:
            with transaction.atomic():
                user = User.objects.create_user(**validated_data)
                Profile.objects.create(
                    user=user,
                    nickname=nickname,
                    role=Profile.Role.GENERAL_USER,
                    profile_image=profile_image,
                    bio=bio,
                )
        except IntegrityError as exc:
            raise serializers.ValidationError(
                "A user with this login ID or nickname already exists."
            ) from exc

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "login_id"]


class SignupResponseSerializer(serializers.Serializer):
    accessToken = serializers.CharField()
    user = UserSerializer()
    profile = ProfileSerializer()
