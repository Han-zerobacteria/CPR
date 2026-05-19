from django.urls import path

from .views import (
    CheckLoginIdView,
    CheckNicknameView,
    SignupView,
)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='accounts-signup'),
    path('check-login-id/', CheckLoginIdView.as_view(), name='accounts-check-login-id'),
    path('check-nickname/', CheckNicknameView.as_view(), name='accounts-check-nickname'),
]
