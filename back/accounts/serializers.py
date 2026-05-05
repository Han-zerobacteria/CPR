from django.contrib.auth import authenticate
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = authenticate(
            request=request,
            username=attrs['username'],
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


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
