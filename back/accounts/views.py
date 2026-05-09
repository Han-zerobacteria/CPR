from django.conf import settings
from django.db.models.functions import Lower

from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from profiles.models import Profile
from profiles.serializers import ProfileSerializer

from .models import User
from .serializers import (
    LoginSerializer,
    SignupSerializer,
    UserSerializer,
    validate_login_id_format,
    validate_nickname_format,
)


def refresh_cookie_options():
    return {
        'httponly': True,
        'secure': settings.AUTH_REFRESH_COOKIE_SECURE,
        'samesite': settings.AUTH_REFRESH_COOKIE_SAMESITE,
        'path': settings.AUTH_REFRESH_COOKIE_PATH,
    }


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        refresh_token,
        **refresh_cookie_options(),
    )


def delete_refresh_cookie(response):
    response.delete_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                'accessToken': str(refresh.access_token),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, str(refresh))
        return response

@extend_schema(
    tags=["accounts"],
    request=SignupSerializer   # <- Swagger에 body 구조 노출
)
class SignupView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                'accessToken': str(refresh.access_token),
                'user': UserSerializer(user).data,
                'profile': ProfileSerializer(user.profile).data,
            },
            status=status.HTTP_201_CREATED,
        )
        set_refresh_cookie(response, str(refresh))
        return response


class CheckLoginIdView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        login_id = request.query_params.get('login_id')
        if not login_id:
            return Response(
                {'available': False, 'detail': 'login_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_login_id_format(login_id)
        except ValidationError as exc:
            return Response(
                {'available': False, 'detail': exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {'available': not User.objects.filter(login_id=login_id).exists()},
            status=status.HTTP_200_OK,
        )


class CheckNicknameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        nickname = request.query_params.get('nickname')
        if not nickname:
            return Response(
                {'available': False, 'detail': 'nickname is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            normalized_nickname = validate_nickname_format(nickname)
        except ValidationError as exc:
            return Response(
                {'available': False, 'detail': exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_used = Profile.objects.annotate(nickname_lower=Lower('nickname')).filter(
            nickname_lower=normalized_nickname.lower()
        ).exists()
        return Response({'available': not is_used}, status=status.HTTP_200_OK)


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token cookie is missing.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        response = Response(
            {'accessToken': serializer.validated_data['access']},
            status=status.HTTP_200_OK,
        )

        rotated_refresh = serializer.validated_data.get('refresh')
        if rotated_refresh:
            set_refresh_cookie(response, rotated_refresh)

        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        delete_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                'user': UserSerializer(request.user).data,
                'profile': ProfileSerializer(request.user.profile).data,
            }
        )
