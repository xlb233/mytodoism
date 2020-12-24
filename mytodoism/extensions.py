from flask import current_app, request

from flask_sqlalchemy import SQLAlchemy
from flask_login import current_user, LoginManager
from flask_wtf.csrf import CSRFProtect
from flask_babel import Babel, lazy_gettext as _l

db = SQLAlchemy()
csrf = CSRFProtect()
babel = Babel()

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = _l('Please login to access this page.')


# 获取当前登陆的用户对象，使用current_user时，会将存储在flask-session中的user_id取出传入load_user()函数中，以返回完整的当前登陆对象
# 调用顺序：
# 1.项目中的__init__.py使用自身（一个flask对象app）实例化了login_manager，login_manager的属性_user_callback被初始化为默认值None（见login_manager.py）
# 2. 当使用current_user时，调用flask_login扩展中的utils.py将_get_user()函数返回对象封装成代理对象current_user
#    即 current_user = LocalProxy(lambda: _get_user())
# 3. _get_user()函数将会调用current_app.login_manager._load_user()
# 4.此时user_loader将load_user函数作为参数传入。
# 5.获得user对象user = self._user_callback(user_id)
@login_manager.user_loader
def load_user(user_id):
    from mytodoism.models import User
    return User.query.get(int(user_id))


# get_locale函数将在处理每一个请求时被调用。
@babel.localeselector
def get_locale():
    if current_user.is_authenticated and current_user.locale is not None:
        return current_user.locale

    locale = request.cookies.get('locale')
    if locale is not None:
        return locale
    # request的accept_languages存储的是请求首部中的Accept-Language字段的值，该值存储的是浏览器的语言偏好列表
    # best_match将从这个列表中找出同时存在于TODOISM_LOCALES中的优先级最大的语言偏好作为当前语言设置
    return request.accept_languages.best_match(current_app.config['TODOISM_LOCALES'])
