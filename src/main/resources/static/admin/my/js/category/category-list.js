layui.use(['layer', 'form', 'table', 'miniTab', 'laydate'], function () {
    var $ = layui.jquery,
        form = layui.form,
        table = layui.table,
        miniTab = layui.miniTab,
        laydate = layui.laydate;
    //日期范围
    laydate.render({
        elem: '#date-range',
        range: '~',
        theme: 'molv'
    });

    table.render({
        elem: '#currentTableId',
        url: '/admin/category/list',
        toolbar: '#toolbarDemo',
        defaultToolbar: ['filter', 'exports', 'print', {
            title: '提示',
            layEvent: 'LAYTABLE_TIPS',
            icon: 'layui-icon-tips'
        }],
        cols: [
            [
                {type: "checkbox", width: 50, fixed: "left"},
                {field: 'id', width: 80, title: 'ID', sort: true},
                {
                    field: 'name', width: 150, title: '名称', sort: true, templet: function (data) {
                        let href = '/page/categories?id=' + data.id;
                        return '<a href=' + href + ' style="color: #01AAED;" target="_blank">' + data.name + '</a>';
                    }
                },
                {field: 'introduction', width: 250, title: '简介'},
                {
                    field: 'color', width: 100, title: '颜色', align: 'center', templet: function (data) {
                        let color = data.color;
                        return '<span class="layui-badge" style="background-color: ' + color +
                            ';color: #666666">' + color + '</span>';
                    }
                },
                {
                    field: 'display',
                    width: 150,
                    title: '是否前台显示',
                    sort: true,
                    align: 'center',
                    templet: function (data) {
                        let text = data.display ? '是' : '否';
                        let color = data.display ? 'green' : 'orange';
                        let bgColor = 'layui-bg-' + color;
                        return '<span class="layui-badge ' + bgColor + '">' + text + '</span>';
                    }
                },
                {
                    field: 'articleCount',
                    width: 150,
                    title: '关联文章数量',
                    sort: true,
                    align: 'center',
                    templet: function (data) {
                        return '<span class="layui-badge layui-bg-green">' + data.articleCount + '</span>';
                    }
                },
                {field: 'createTime', width: 200, title: '创建时间', sort: true},
                {field: 'updateTime', width: 200, title: '更新时间', sort: true},
                {
                    title: '操作', minWidth: 120, toolbar: '#currentTableBar', fixed: "right", align: "center",
                    hide: (!hasPermission('blog:category:edit') && !hasPermission('blog:category:delete'))
                }
            ]
        ],
        limits: [10, 15, 20, 25, 50, 100],
        limit: 15,
        page: true,
        done: function () {
            checkPermission();
        }
    });

    // 监听搜索操作
    form.on('submit(data-search-btn)', function (data) {
        let name = data.field.name;
        let display = data.field.display;
        let dateRange = data.field.dateRange;
        let dates = dateRange.split(' ~ ')
        let startDate = dates[0];
        let endDate = dates[1];
        //执行搜索重载
        table.reload('currentTableId', {
            page: {
                curr: 1
            }
            , where: {
                name: name,
                display: display,
                startDate: startDate,
                endDate: endDate
            }
        }, 'data');
        return false;
    });

    /**
     * toolbar监听事件
     */
    table.on('toolbar(currentTableFilter)', function (obj) {
        if (obj.event === 'delete') {  // 监听删除操作
            var checkStatus = table.checkStatus('currentTableId')
                , data = checkStatus.data;
            var idList = [];
            $.each(data, function () {
                let id = $(this)[0].id;
                let articleCount = $(this)[0].articleCount;
                let name = $(this)[0].name;
                if (articleCount >= 1) {
                    Swal.fire({
                        text: `分类: ${name}下存在文章，不能删除！`,
                        icon: 'warning',
                    })
                    return false;
                }
                idList.push(id);
            });
            if (idList.length <= 0) {
                return false;
            }
            Swal.fire({
                title: '确定删除选中的' + idList.length + '个分类吗？',
                text: '你将无法恢复它！',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: '确定删除！',
                cancelButtonText: '取消删除！',
                showLoaderOnConfirm: true,
                preConfirm: () => {
                    return new Promise((resolve, reject) => {
                        axios({
                            method: 'delete',
                            url: '/admin/category',
                            data: idList,
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        })
                            .then(response => {
                                table.reload('currentTableId');
                                resolve(response.data);
                            }, error => {
                                reject(error);
                            })
                    }).then(res => {
                        Swal.fire({
                            icon: 'success',
                            title: '删除成功！',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }).catch(error => {
                        Swal.showValidationMessage(`删除失败: ${error.response.data.message}`);
                    })
                }
            });
        } else if (obj.event === 'add') {  // 监听添加操作
            var index = layer.open({
                title: '添加分类',
                type: 2,
                shade: 0.2,
                maxmin: true,
                shadeClose: true,
                area: ['50%', '80%'],
                content: '/admin/page/category/category-add',
            });
            $(window).on("resize", function () {
                layer.full(index);
            });
        }
    });

    table.on('tool(currentTableFilter)', function (obj) {
        var data = obj.data;
        if (obj.event === 'edit') {
            var index = layer.open({
                title: '编辑分类',
                type: 2,
                shade: 0.2,
                maxmin: true,
                shadeClose: true,
                area: ['50%', '80%'],
                content: '/admin/category/' + data.id,
            });
            $(window).on("resize", function () {
                layer.full(index);
            });
            return false;
        } else if (obj.event === 'delete') {
            let articleCount = data.articleCount;
            if (articleCount >= 1) {
                Swal.fire({
                    text: `分类下存在文章，不能删除！`,
                    icon: 'warning',
                })
                return false;
            }
            Swal.fire({
                title: '确定删除选中的这个分类吗？',
                text: '你将无法恢复它！',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: '确定删除！',
                cancelButtonText: '取消删除！',
                showLoaderOnConfirm: true,
                preConfirm: () => {
                    return new Promise((resolve, reject) => {
                        axios({
                            method: 'delete',
                            url: '/admin/category/' + data.id,
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        })
                            .then(response => {
                                obj.del();
                                resolve(response.data);
                            }, error => {
                                reject(error);
                            })
                    }).then(res => {
                        Swal.fire({
                            icon: 'success',
                            title: '删除成功！',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }).catch(error => {
                        Swal.showValidationMessage(`删除失败: ${error.response.data.message}`);
                    })
                }
            });
        }
    });

});