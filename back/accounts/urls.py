from django.urls import path

from .views import (
    CheckLoginIdView,
    CheckNicknameView,
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    SignupView,
)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='auth-signup'),
    path('check-login-id/', CheckLoginIdView.as_view(), name='auth-check-login-id'),
    path('check-nickname/', CheckNicknameView.as_view(), name='auth-check-nickname'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
]
