from flask import Blueprint, jsonify, render_template, redirect, request, url_for

from flask_login import current_user, login_user, login_required, logout_user
from faker import Faker
from flask_babel import _

from mytodoism.models import User, Item
from mytodoism.extensions import db

auth_bp = Blueprint('auth', __name__)
fake = Faker()


@auth_bp.route('/register')
def register():
    username = fake.user_name()
    # 若生成的虚拟账号用户名重复，则重新生成虚拟username
    while User.query.filter_by(username=username).first() is not None:
        username = fake.user_name()
    password = fake.word()
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    # 添加几个代办项目作为示例
    item = Item(body=_('Witness something truly majestic'), author=user)
    item2 = Item(body=_('Help a complete stranger'), author=user)
    item3 = Item(body=_('Drive a motorcycle on the Great Wall of China'), author=user)
    item4 = Item(body=_('Sit on the Great Egyptian Pyramids'), done=True, author=user)
    db.session.add_all([item, item2, item3, item4])
    db.session.commit()
    # 使用jsonify函数返回JSON格式的用户名、密码和提示消息，提供给js
    return jsonify(username=username, password=password, message=_('Generate success.'))


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('todo.app'))
    if request.method == 'POST':
        data = request.get_json()
        username = data['username']
        password = data['password']
        user = User.query.filter_by(username=username).first()
        if user is not None and user.check_password(password):
            login_user(user)
            return jsonify(message=_('Login success'))
        return jsonify(message=_('Invalid username or password.')), 400
    return render_template('_login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify(message=_('Logout success.'))

