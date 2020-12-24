// 这个js文件作用于index.html以及其相关的几个子模版，如_app.html等
$(document).ready(function () {
    // 回车键键号是13，ESC键键号是27
    var ENTER_KEY = 13;
    var ESC_KEY = 27;

    $(document).ajaxError(function (event, request) {
        var message = null;

        if (request.responseJSON && request.responseJSON.hasOwnProperty('message')) {
            message = request.responseJSON.message;
        } else if (request.responseText) {
            var IS_JSON = true;
            try {
                var data = JSON.parse(request.responseText);
            }
            catch (err) {
                IS_JSON = false;
            }

            if (IS_JSON && data !== undefined && data.hasOwnProperty('message')) {
                message = JSON.parse(request.responseText).message;
            } else {
                message = default_error_message;
            }
        } else {
            message = default_error_message;
        }
        M.toast({html: message});
    });

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader('X-CSRFToken', csrf_token);
            }
        }
    });

    // 给hashchange事件绑定回调函数
    $(window).bind("hashchange", function(){
        // hash 取得url#后面的字符串
        var hash = window.location.hash.replace('#', '');
        var url = null;
        // 根据hashtag值的不同，选择对应的页面url
        if (hash === 'login') {
            url = login_page_url  // 在index.html的<script>标签中定义
        } else if (hash === 'app') {
            url = app_page_url
        } else {
            url = intro_page_url
        }
        // 向对应页面的URL发送GET请求，服务端会返回对应的局部模版
        $.ajax({
            type: 'GET',
            url: url,
            success: function (data) {
                // 在index.html的#main中插入子页面
                $('#main').hide().html(data).fadeIn(800);
                activeM(); // 激活新插入的页面中的Materialize插件（字体插件）
            } // 错误回调函数已经统一设置，不需要定义error
        });
    });
    // 初始化，若url没有#，则返回默认视图，否则触发上面定义的hashchange事件进行切换。
    if (window.location.hash === '') {
       window.location.hash = '#intro'; // home page, show the default view
    } else {
       $(window).trigger('hashchange'); // user refreshed the browser, fire the appropriate function
    }


    function toggle_password() {
        var password_input = document.getElementById('password-input');
        if (password_input.type === 'password') {
            password_input.type = 'text';
        } else {
            password_input.type = 'password';
        }
    }

    $(document).on('click', '#toggle-password', toggle_password);

    function display_dashboard() {
        var all_count = $('.item').length;
        if (all_count === 0) {
            $('#dashboard').hide();
        } else {
            $('#dashboard').show();
            $('ul.tabs').tabs();
        }
    }

    function remove_edit_input() {
        var $edit_input = $('#edit-item-input');
        var $input = $('#item-input');

        $edit_input.parent().prev().show();
        $edit_input.parent().remove();
        $input.focus();
    }

    function refresh_count() {
        var $items = $('.item');

        display_dashboard();
        var all_count = $items.length;
        var active_count = $items.filter(function () {
            return $(this).data('done') === false;
        }).length;
        var completed_count = $items.filter(function () {
            return $(this).data('done') === true;
        }).length;
        $('#all-count').html(all_count);
        $('#active-count').html(active_count);
        $('#active-count-nav').html(active_count);
        $('#completed-count').html(completed_count);
    }


    // 定义激活Materialize插件的函数
    function activeM() {
        $('.sidenav').sidenav();
        $('ul.tabs').tabs();
        $('.modal').modal();
        $('.tooltipped').tooltip();
        $('.dropdown-trigger').dropdown({
            constrainWidth: false,
            coverTrigger: false
            });
        display_dashboard();
    }

    // 定义新建todo列表项的函数
    function new_item(e){
        var $input = $('#item-input');
        var value = $input.val().trim(); // 获取输入值
        if (e.which !== ENTER_KEY || !value){
            return; //如果Enter没有按下或者输入为空，就什么都不做
        }
        $input.focus().val(''); // 聚焦到输入框并清空内容
        $.ajax({
            type:'POST',
            url: new_item_url,
            data: JSON.stringify({'body': value}),
            contentType: 'application/json;charset=UTF-8',
            success: function(data){
                M.toast({html: data.message, classes: 'rounded'});
                $('.items').append(data.html);
                activeM();
                refresh_count();
            }
        });
    }
    // 定义编辑todo列表项的函数
    function edit_item(e) {
        var $edit_input = $('#edit-item-input');
        var value = $edit_input.val().trim();
        if (e.which !== ENTER_KEY || !value) {
            return;
        }
        $edit_input.val('');

        if (!value) {
            M.toast({html: empty_body_error_message});
            return;
        }
        // 从_item.html的外层容器的data-href属性获取的url，这个url对应的端点就是todo.py中的edit_item函数
        var url = $edit_input.parent().prev().data('href');
        // 从_item.html的外层容器的data-id属性获取的item_id，表示即将修改的条目的id
        var id = $edit_input.parent().prev().data('id');

        $.ajax({
            type: 'PUT',
            url: url,
            data: JSON.stringify({'body': value}),
            contentType: 'application/json;charset=UTF-8',
            success: function (data) {
                $('#body' + id).html(value);
                $edit_input.parent().prev().data('body', value);
                remove_edit_input();
                M.toast({html: data.message});
            }
        })
    }
    // 给_app.html中的id为item-input的输入框绑定事件监听, 当回车键弹起时，调用new_item函数给todo蓝本中的new_item视图函数发送请求
    $(document).on('keyup', '#item-input', new_item.bind(this));
    // 给动态生成的#edit-item-input输入框绑定事件监听，当回车键弹起时，调用edit_item函数给todo蓝本中的edit_item视图函数发送请求
    $(document).on('keyup', '#edit-item-input', edit_item.bind(this));

    // 给.done-btn按钮绑定点击事件，完成/未完成事件
    $(document).on('click', '.done-btn', function () {
        var $input = $('#item-input');

        $input.focus();
        var $item = $(this).parent().parent();
        var $this = $(this);

        if ($item.data('done')) {
            $.ajax({
                type: 'PATCH',
                url: $this.data('href'),
                success: function (data) {
                    $this.next().removeClass('inactive-item');
                    $this.next().addClass('active-item');
                    $this.find('i').text('check_box_outline_blank');
                    $item.data('done', false);
                    M.toast({html: data.message});
                    refresh_count();
                }
            })
        } else {
            $.ajax({
                type: 'PATCH',
                url: $this.data('href'),
                success: function (data) {
                    $this.next().removeClass('active-item');
                    $this.next().addClass('inactive-item');
                    $this.find('i').text('check_box');
                    $item.data('done', true);
                    M.toast({html: data.message});
                    refresh_count();
                }
            })

        }
    });


    // 给_item.html中class为item的外层容器绑定鼠标进入\离开事件以及回调函数
    // 进入时移除hide，显示编辑按钮
    // 离开时加入hide，隐藏编辑按钮
    $(document).on('mouseenter', '.item', function () {
        $(this).find('.edit-btns').removeClass('hide');
    })
        .on('mouseleave', '.item', function () {
            $(this).find('.edit-btns').addClass('hide');
        });

    // 给_item.html中的编辑按钮绑定鼠标点击事件以及回调函数，以弹出修改框
    $(document).on('click', '.edit-btn', function () {

        var $item = $(this).parent().parent();
        var itemId = $item.data('id');
        var itemBody = $('#body' + itemId).text();
        $item.hide();
        // 插入edit-item-input输入框
        $item.after(' \
                <div class="row card-panel hoverable">\
                <input class="validate" id="edit-item-input" type="text" value="' + itemBody + '"\
                autocomplete="off" autofocus required> \
                </div> \
            ');

        var $edit_input = $('#edit-item-input');

        // Focus at the end of input text.
        // Multiply by 2 to ensure the cursor always ends up at the end;
        // Opera sometimes sees a carriage return as 2 characters.
        var strLength = $edit_input.val().length * 2;

        $edit_input.focus();
        $edit_input[0].setSelectionRange(strLength, strLength);

        // Remove edit form when ESC was pressed or focus out.
        $(document).on('keydown', function (e) {
            if (e.keyCode === ESC_KEY) {
                remove_edit_input();
            }
        });

        $edit_input.on('focusout', function () {
            remove_edit_input();
        })
    });
    // 给_item.html的.delete-btn绑定点击事件和回调函数
    $(document).on('click', '.delete-btn', function () {
        var $input = $('#item-input');
        var $item = $(this).parent().parent();

        $input.focus();
        $.ajax({
            type: 'DELETE',
            url: $(this).data('href'),
            success: function (data) {
                $item.remove();
                activeM();
                refresh_count();
                M.toast({html: data.message});
            }
        });
    });

    // 定义注册的函数register
    function register(){
        $.ajax({
            type: 'GET',
            url: register_url,
            success: function (data){
                $('#username-input').val(data.username); // 将用户名插入用户名字段
                $('#password-input').val(data.password); // 将密码插入密码字段
                M.toast({html: data.message}) // 弹出提示消息
            }
        });
    }
    // 给_login.html的#register-btn绑定点击事件和回调函数register
    $(document).on('click', '#register-btn', register)

    // 定义登陆的函数login_user
    function login_user() {
        var username = $('#username-input').val();
        var password = $('#password-input').val();
        if (!username || !password) {
            M.toast({html: login_error_message});
            return;
        }

        var data = {
            'username': username,
            'password': password
        };
        $.ajax({
            type: 'POST',
            url: login_url,
            data: JSON.stringify(data),
            contentType: 'application/json;charset=UTF-8',
            success: function (data) {
                if (window.location.hash === '#app' || window.location.hash === 'app') {
                    $(window).trigger('hashchange');
                } else {
                    window.location.hash = '#app';
                }
                activeM();
                M.toast({html: data.message});
            }
        });
    }
    // 在.login-input输入框上绑定keyup事件
    // 回车弹起时调用login_user，完成登陆
    $(document).on('keyup', '.login-input', function (e) {
        if (e.which === ENTER_KEY) {
            login_user();
        }
    });

    // 在#login-btn按钮上绑定点击事件，注册回调函数为login_user
    // 点击后调用login_user，完成登陆
    $(document).on('click', '#login-btn', login_user);

    // 在#logout-btn按钮上绑定点击事件，注册回调函数
    $(document).on('click', '#logout-btn', function () {
        $.ajax({
            type: 'GET',
            url: logout_url,
            success: function (data) {
                window.location.hash = '#intro';
                activeM();
                M.toast({html: data.message});
            }
        });
    });

    $(document).on('click', '#active-item', function () {
        var $input = $('#item-input');
        var $items = $('.item');

        $input.focus();
        $items.show();
        $items.filter(function () {
            return $(this).data('done');
        }).hide();
    });

    $(document).on('click', '#completed-item', function () {
        var $input = $('#item-input');
        var $items = $('.item');

        $input.focus();
        $items.show();
        $items.filter(function () {
            return !$(this).data('done');
        }).hide();
    });

    $(document).on('click', '#all-item', function () {
        $('#item-input').focus();
        $('.item').show();
    });

    $(document).on('click', '#clear-btn', function () {
        var $input = $('#item-input');
        var $items = $('.item');

        $input.focus();
        $.ajax({
            type: 'DELETE',
            url: clear_item_url,
            success: function (data) {
                $items.filter(function () {
                    return $(this).data('done');
                }).remove();
                M.toast({html: data.message, classes: 'rounded'});
                refresh_count();
            }
        });
    });

    $(document).on('click', '.lang-btn', function () {
        $.ajax({
            type: 'GET',
            url: $(this).data('href'),
            success: function (data) {
                $(window).trigger('hashchange');
                activeM();
                M.toast({html: data.message});
            }
        });
    });

    activeM();  // initialize Materialize
});
