from flask import Blueprint, render_template, jsonify, request

from flask_login import login_required, current_user
from flask_babel import _

from mytodoism.extensions import db
from mytodoism.models import Item

todo_bp = Blueprint('todo', __name__)


# 总览视图
@todo_bp.route('/app')
@login_required
def app():
    all_count = Item.query.with_parent(current_user).count()
    active_count = Item.query.with_parent(current_user).filter_by(done=False).count()
    completed_count = Item.query.with_parent(current_user).filter_by(done=True).count()
    return render_template('_app.html', items=current_user.items,
                           all_count=all_count, active_count=active_count, completed_count=completed_count)


# 新建todo
# 这个视图由/static/js/script.js中的new_item函数用ajax以POST请求启动，将_item.html渲染好后回传给js，js将这个模版分区append到todolist中
@todo_bp.route('/item/new', methods=['POST'])
@login_required
def new_item():
    data = request.get_json()
    if data is None or data['body'].strip() == '':
        return jsonify(message='Invalid item body.'), 400
    item = Item(body=data['body'], author=current_user._get_current_object())
    db.session.add(item)
    db.session.commit()
    return jsonify(html=render_template('_item.html', item=item), message='+1')


# 编辑todo
# 这个视图由_item.html中的按钮启动
@todo_bp.route('/item/<int:item_id>/edit', methods=['PUT'])
@login_required
def edit_item(item_id):
    item = Item.query.get_or_404(item_id)
    if current_user != item.author:
        return jsonify(message=_('Permission denied')), 403

    data = request.get_json()
    if data is None or data['body'].strip() == '':
        return jsonify(message=_('Invalid item body')), 400
    item.body = data['body']
    db.session.commit()
    return jsonify(message=_('Item updated.'))


# 删除todo
@todo_bp.route('/item/<int:item_id>/delete', methods=['DELETE'])
@login_required
def delete_item(item_id):
    item = Item.query.get_or_404(item_id)
    if current_user != item.author:
        return jsonify(message=_('Permission denied')), 403

    db.session.delete(item)
    db.session.commit()
    return jsonify(message=_('Item deleted.'))


# 已/未完成todo
# patch方法用于部分更新资源
@todo_bp.route('/item/<int:item_id>/toggle', methods=['PATCH'])
@login_required
def toggle_item(item_id):
    item = Item.query.get_or_404(item_id)
    if current_user != item.author:
        return jsonify(message=_('Permission denied')), 403

    item.done = not item.done
    db.session.commit()
    return jsonify(message=_('Item toggled.'))


# 清空已经完成的todo
@todo_bp.route('/item/clear', methods=['DELETE'])
@login_required
def clear_items():
    items = Item.query.with_parent(current_user).filter_by(done=True).all()
    for item in items:
        if current_user != item.author:
            return jsonify(message=_('Permission denied')), 403

    for item in items:
        db.session.delete(item)
    db.session.commit()
    return jsonify(message=_('All clear!'))
