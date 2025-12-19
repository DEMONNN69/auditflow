from .base import *

DEBUG = False

ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MIDDLEWARE.insert(0, 'whitenoise.middleware.WhiteNoiseMiddleware')
