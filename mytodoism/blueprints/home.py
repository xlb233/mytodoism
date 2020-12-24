from flask import render_template, Blueprint, current_app, make_response, jsonify
from flask_babel import _
from flask_login import current_user

from mytodoism.extensions import db

home_bp = Blueprint('home', __name__)


@home_bp.route('/')
def index():
    return render_template('index.html')


@home_bp.route('/intro')
def intro():
    return render_template('_intro.html')


@home_bp.route('/set-locale/<locale>')
def set_locale(locale):
    if locale not in current_app.config['TODOISM_LOCALES']:
        return jsonify(message='Invalid locale.'), 404

    # 问题1.为何有些地方使用make_response，有些地方直接return jsonify
    response = make_response(jsonify(message='Setting updated.'))
    if current_user.is_authenticated:
        current_user.locale = locale
        db.session.commit()
    # 匿名用户的区域代码储存在cookie中
    else:
        response.set_cookie('locale', locale, max_age=60 * 60 * 24 * 30)
    return response
