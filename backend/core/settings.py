"""
Django settings for core project.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env if present
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
DEFAULT_INSECURE_SECRET = 'django-insecure-mv-job-portal-secret-key-prod-change-in-env-2026'
SECRET_KEY = os.getenv('SECRET_KEY', DEFAULT_INSECURE_SECRET)

# SECURITY WARNING: don't run with debug turned on in production!
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development').lower()
DEBUG = os.getenv('DEBUG', 'False' if ENVIRONMENT == 'production' else 'True').lower() in ('true', '1', 't')

# Prevent insecure defaults in production
if not DEBUG:
    if SECRET_KEY == DEFAULT_INSECURE_SECRET or SECRET_KEY.startswith('django-insecure-'):
        raise RuntimeError(
            "CRITICAL SECURITY ERROR: Production deployment requires a secure, non-default SECRET_KEY. "
            "Please configure the SECRET_KEY environment variable with a strong cryptographic key."
        )

# Parse allowed hosts
raw_allowed_hosts = os.getenv('ALLOWED_HOSTS', '*' if DEBUG else 'localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip() for host in raw_allowed_hosts.split(',') if host.strip()]

if not DEBUG and ('*' in ALLOWED_HOSTS or not ALLOWED_HOSTS):
    raise RuntimeError(
        "CRITICAL SECURITY ERROR: ALLOWED_HOSTS cannot contain wildcard '*' when DEBUG is False. "
        "Explicitly specify permitted production domains or IP addresses in ALLOWED_HOSTS."
    )

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # Local apps
    'accounts',
    'companies',
    'candidates',
    'jobs',
    'applications',
    'admin_portal',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

# Database Configuration
# Production strictly requires PostgreSQL; development falls back to SQLite
DB_ENGINE = os.getenv('DB_ENGINE', '').lower()
DATABASE_URL = os.getenv('DATABASE_URL', '')
DB_NAME = os.getenv('DB_NAME', '')

use_postgres = (
    'postgres' in DB_ENGINE or
    DATABASE_URL.startswith(('postgres://', 'postgresql://')) or
    (bool(DB_NAME) and 'sqlite' not in DB_ENGINE and not DB_NAME.endswith('.sqlite3') and DB_NAME != ':memory:')
)

if not DEBUG and not use_postgres:
    raise RuntimeError(
        "CRITICAL DATABASE ERROR: Production deployment (DEBUG=False) strictly requires PostgreSQL. "
        "Silent fallback to SQLite is disallowed. Please configure DB_ENGINE=django.db.backends.postgresql "
        "or provide a valid DATABASE_URL."
    )

if use_postgres:
    if DATABASE_URL:
        from urllib.parse import urlparse
        parsed_db_url = urlparse(DATABASE_URL)
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': parsed_db_url.path.lstrip('/'),
                'USER': parsed_db_url.username or '',
                'PASSWORD': parsed_db_url.password or '',
                'HOST': parsed_db_url.hostname or 'localhost',
                'PORT': str(parsed_db_url.port or 5432),
                'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', 600)),
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': os.getenv('DB_NAME', 'jobboard_db'),
                'USER': os.getenv('DB_USER', 'jobboard_user'),
                'PASSWORD': os.getenv('DB_PASSWORD', 'jobboard_secure_password_123!'),
                'HOST': os.getenv('DB_HOST', 'localhost'),
                'PORT': os.getenv('DB_PORT', '5432'),
                'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', 600)),
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (Uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Dedicated Secure Resumes Directory (Stored outside public static files)
SECURE_RESUMES_DIR = MEDIA_ROOT / 'resumes'
MAX_RESUME_SIZE_MB = int(os.getenv('MAX_RESUME_SIZE_MB', 5))

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/minute',
        'user': '1000/minute',
    },
}

# SimpleJWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('ACCESS_TOKEN_LIFETIME_MINUTES', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://localhost:3000,http://localhost,http://127.0.0.1:5173'
    ).split(',') if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173,http://localhost:3000,http://localhost,http://127.0.0.1:5173'
    ).split(',') if origin.strip()
]

# Security Headers & HTTPS Configuration
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# HTTPS Cookies & Transport Security
SESSION_COOKIE_SECURE = not DEBUG or (os.getenv('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 't'))
CSRF_COOKIE_SECURE = not DEBUG or (os.getenv('CSRF_COOKIE_SECURE', 'False').lower() in ('true', '1', 't'))
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False' if DEBUG else 'True').lower() in ('true', '1', 't')
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', 31536000 if not DEBUG else 0))
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# Spectacular Settings (Swagger / OpenAPI)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Multi-Vendor Job Board & Application Portal API',
    'DESCRIPTION': 'Robust REST APIs for multi-vendor job board with Candidate, Recruiter, and Admin portals.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'ENUM_NAME_OVERRIDES': {
        'JobStatusEnum': 'jobs.models.Job.Status',
        'ApplicationStatusEnum': 'applications.models.JobApplication.Status',
    },
}
