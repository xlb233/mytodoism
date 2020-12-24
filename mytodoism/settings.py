"""
配置文件
"""
import os

basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class BaseConfig:
    TODOISM_LOCALES = ['en_US', 'zh_Hans_CN']
    TODOISM_ITEM_PER_PAGE = 20
    BABLE_DEFAULT_LOCALE = TODOISM_LOCALES[0]

    SECRET_KEY = os.getenv('SECRET_KEY', 'a key string')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(basedir, 'data.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # enable 子域名支持，注意不要设置为*.dev域名，chrome63版本开始*.dev域名强制使用https
    SERVER_NAME = 'mytodoism.com:5000'


class DevelopmentConfig(BaseConfig):
    pass


class ProductionConfig(BaseConfig):
    pass


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///'
    WTF_CSRF_ENABLED = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}
