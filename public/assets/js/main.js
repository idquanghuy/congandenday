let musterTime = setInterval(function () {
    countTimer();
}, 1000);

$(document).ready(function () {
    const pusher = new Pusher(appKey, {
        cluster: 'ap1'
    });

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    const clipboard = new ClipboardJS('.copy-text');
    const channel = pusher.subscribe("appPusher");

    $('.select2').select2();
    setInterval(getPhone, (180 * 1000))

    clipboard.on('success', (e) => Swal.fire('Thông báo', `Sao chép thành công < ${e.text} >`, 'success'));

    channel.bind("historyData", (data) => {
        !data.length ? $('#tableHistory').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#tableHistory').html('');

        data.map((history) => $('#tableHistory').append(`<tr><td>${history.time}</td><td>${history.phone}</td><td>${Intl.NumberFormat('en-US').format(history.money)}</td><td>${Intl.NumberFormat('en-US').format(history.bonus)}</td><td>${history.gameName}</td><td><span class="badge badge-primary">${history.content.toUpperCase()}</span></td><td><span class="badge badge-success">Thắng</span></td></tr>`));
    });

    channel.bind("phoneData", (data) => {
        !data.length ? $('#tablePhone').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) && $('#tableThongKe').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#tablePhone').html('') && $('#tableThongKe').html('');

        data.map((dataPhone) => {
            if (dataPhone.status == 'active' && ((dataPhone.amountDay + (dataPhone.betMax * 2) >= dataPhone.limitDay) || (dataPhone.amountMonth + (dataPhone.betMax * 2) >= dataPhone.limitMonth) || (dataPhone.count + 10 >= dataPhone.number))) dataPhone.status = 'pendingStop';

            $('#tablePhone').append(`<tr><td>${dataPhone.phone} <span class="badge badge-info copy-text" data-clipboard-text="${dataPhone.phone}"><i class="fas fa-copy"></i></span><br><small><b><span class="text-success">${Intl.NumberFormat('en-US').format(dataPhone.amountDay)}</span>/<span class="text-primary">${numberFormat(dataPhone.limitDay)}</span></span> ~ <span class="text-info">${dataPhone.count}</span>/<span class="text-primary">${dataPhone.number}</span>${dataPhone.bonus > 1 ? ` ~ <strong><span style="color: red;">x</span> ${dataPhone.bonus}</strong>` : ''}</b></small></td><td>${Intl.NumberFormat('en-US').format(dataPhone.betMin)} VNĐ</td><td>${Intl.NumberFormat('en-US').format(dataPhone.betMax)} VNĐ</td><td>${dataPhone.status == 'active' ? '<span class="badge badge-success">Hoạt động</span>' : (dataPhone.status == 'pendingStop' ? '<span class="badge badge-warning">Sắp bảo trì</span>' : `<span class="badge badge-danger">Bảo trì</span>`)}</td></tr>`);
            $('#tableThongKe').append(`<tr><td>${dataPhone.phone} <span class="badge badge-info copy-text" data-clipboard-text="${dataPhone.phone}"><i class="fas fa-copy"></i></span></td><td>${dataPhone.name}</td><td><span class="${dataPhone.status == 'active' ? 'text-success' : 'text-danger'}">${Intl.NumberFormat('en-US').format(dataPhone.amountDay)}</span>/${Intl.NumberFormat('en-US').format(dataPhone.limitDay)}</td><td><span class="${dataPhone.status == 'active' ? 'text-success' : 'text-danger'}">${Intl.NumberFormat('en-US').format(dataPhone.count)}</span>/${Intl.NumberFormat('en-US').format(dataPhone.number)}</td></tr>`);
        })
    });

    channel.bind("gameData", (data) => {
        if (!data.length) return;
        $('#list-game').html('');
        data.map((data, index) => $('#list-game').append(`<div style="padding: 5px"><button class="btn ${index == 0 ? 'btn-primary' : 'btn-outline-primary'} games" data-name="${data.name}" data-description="${data.description}" data-type="${data.gameType}"><b>${data.name}</b></button></div>`));
        getReward();
    });

    channel.bind("rewardData", (data) => {
        let gameType = $('.games.btn-primary').data('type');
        if (data == gameType) return getReward(gameType);
    });

    channel.bind('jackpotCount', (data) => {
        if (Number(data) > 10000) {
            $('.jackpot-value').hasClass('d-none') && $('.jackpot-value').removeClass('d-none');
            $('.jackpot-value>span').html(0);
            return animate('.jackpot-value>span', data);
        } else {
            !$('.jackpot-value').hasClass('d-none') && $('.jackpot-value').addClass('d-none');
        }

        !$('.jackpot-value').hasClass('d-none') && $('.jackpot-value').addClass('d-none');
    })

    channel.bind('musterData', (data) => {
        if (!data) return;

        $('#muster-session').html(`#${data.code}`);
        $('#muster-count').html(Intl.NumberFormat('en-US').format(data.count));
        $('#muster-winner').html(data.win);
        $('#muster-bonus').html(`${Intl.NumberFormat('en-US').format(data.bonus)}đ`);
        $('#muster-time').html(data.second);

        clearInterval(musterTime);

        musterTime = setInterval(function () {
            countTimer();
        }, 1000);
    })

    channel.bind('historyMuster', (data) => {
        !data.length ? $('#historyMuster').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#historyMuster').html('');

        data.map((data) => $('#historyMuster').append(`<tr><td><span class="text-info">#${data.code}</span></td><td>${data.count}</td><td>${data.phone}</td><td>${Intl.NumberFormat('en-US').format(data.amount)}đ</td></tr>`));
    
    })

    channel.bind('notiWin', (data) => {
        if (!data) return;

        Toast.fire({
            icon: 'success',
            title: `Chúc mừng <b>${data.phone}</b> đã thắng ${Intl.NumberFormat('en-US').format(data.amount)}đ`
        })
    })

    $('body').on('click', '.games', function (e) {
        let _this = $(this);

        _this.removeClass('btn-outline-primary');
        $('.games.btn-primary').removeClass('btn-primary').addClass('btn-outline-primary');
        _this.addClass('btn-primary');

        gameName = _this.data('name');
        gameType = _this.data('type');
        description = _this.data('description');
        $('#gameNoti').html(description);
        $('#gameName').html(`Cách Chơi ${gameName}`);

        getReward(gameType);
    })

    getPhone();

    getReward();

    getHistory();

    getMuster();

    historyMuster();


    $('#checkMission button').on('click', function (e) {
        let phoneCheck = $('#checkMission [name="phoneCheck"]').val();
        console.log(phoneCheck);

        $.post('../api/v1/getCount', { phone: phoneCheck })
            .done((response) => {
                !response.success ? Swal.fire('Thông báo', response.message, 'error') : Swal.fire('Thông báo', response.message, 'success');
                if (response.success) $('.money-day').removeClass('d-none') && $('.money-day').html(`${Intl.NumberFormat('en-US').format(response.count)} VNĐ`);
            })
            .fail((error) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${error.statusText}`, 'error'));
    })

    $('.form-jackpot [name="phone"]').on('change', function (e) {
        let phone = $('.form-jackpot [name="phone"]').val();
        $('div.form-jackpot>div.message').html('')

        $.post('../api/v1/jackpot/checkJoin', { phone })
            .done((res) => {
                if (!res.success) return $('div.form-jackpot>div.message').html(`<div class="alert alert-warning">${res.message}</div>`);

                let data = res.data;

                (data.isJoin == 0 || data.isJoin == -1) ? $('.form-jackpot div.input-group-append').html('<button class="btn btn-primary btn-join">Tham gia</button>') : $('.form-jackpot div.input-group-append').html('<button class="btn btn-danger btn-out">Hủy tham gia</button>');

                data.isJoin == 0 ? !$('.jackpot-time').hasClass('d-none') && $('.jackpot-time').addClass('d-none') : $('.jackpot-time').hasClass('d-none') && $('.jackpot-time').removeClass('d-none');

                if (data.isJoin != 0) data.isJoin == 1 ? $('.jackpot-time').html(`Thời gian tham gia nổ hũ: <strong>${data.time}</strong>`) : $('.jackpot-time').html(`Thời gian hủy tham gia nổ hũ: <strong>${data.time}</strong>`)
            })
            .fail((error) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${error.statusText}`, 'error'));
    })

    $('#checkByTrans button').on('click', function (e) {
        let transId = $('#checkByTrans [name="transId"]').val();

        if (!transId) {
            Swal.fire('Thông báo', 'Vui lòng nhập đầy đủ thông tin!', 'warning');
        } else if (transId.length < 8) {
            Swal.fire('Thông báo', 'Mã giao dịch không hợp lệ!', 'error');
        } else {
            $.ajax({
                url: `../api/v1/checkTransId`,
                method: 'POST',
                dataType: 'json',
                data: { transId },
                beforeSend: () => {
                    $('#checkByTrans button').prop('disabled', true);
                    $('#checkByTrans button').html('Đang xử lý <i class="fas fa-spinner text-white fa-spin ml-2" aria-hidden="true"></i>')
                },
                success: (res) => {
                    $('#checkByTrans button').prop('disabled', false);
                    $('#checkByTrans button').html('<i class="fa fa-search"></i>');

                    if (!res.success) {
                        Swal.fire('Thông báo', res.message, 'error');
                        if (res.data) {
                            $('#checkByTrans').addClass('d-none');
                            $('#checkByPhone').removeClass('d-none');
                            $('#checkByPhone [name="transId"]').val(transId);
                        }
                        return;
                    }
                    handleDetail(res.data);
                }
            })
        }
    })

    $('#checkByPhone button').on('click', function (e) {
        let transId = $('#checkByPhone [name="transId"]').val();
        let phone = $('#checkByPhone [name="phoneCheck"]').val();

        if (!transId || !phone) {
            Swal.fire('Thông báo', 'Vui lòng nhập đầy đủ thông tin!', 'warning');
        } else if (transId.length < 8) {
            Swal.fire('Thông báo', 'Mã giao dịch không hợp lệ!', 'error');
        } else {
            $.ajax({
                url: `../api/v1/checkTransId`,
                method: 'POST',
                dataType: 'json',
                data: { phone, transId },
                beforeSend: () => {
                    $('#checkByPhone button').prop('disabled', true);
                    $('#checkByPhone button').html('Đang xử lý <i class="fas fa-spinner text-white fa-spin ml-2" aria-hidden="true"></i>')
                },
                success: (res) => {
                    $('#checkByPhone button').prop('disabled', false);
                    $('#checkByPhone button').html('<i class="fa fa-search"></i>');

                    if (!res.success) return Swal.fire('Thông báo', res.message, 'error');
                    $('#checkByTrans').removeClass('d-none') && $('#checkByPhone').addClass('d-none')
                    handleDetail(res.data);
                }
            })
        }
    })

    $('body').on('click', '.form-jackpot div.input-group-append>button', function (e) {
        let phone = $('.form-jackpot [name="phone"]').val();
        let typeData = $(this).hasClass('btn-join') ? 'join' : 'out';
        let oldText = $(this).text();
        if (!phone) return $('div.form-jackpot>div.message').html('<div class="alert alert-warning">Vui lòng nhập số điện thoại!</div>');

        $.ajax({
            url: `../api/v1/jackpot/${typeData}`,
            method: 'POST',
            dataType: 'json',
            data: {
                phone
            },
            beforeSend: () => {
                $('.form-jackpot div.input-group-append>button').prop('disabled', true);
                $('.form-jackpot div.input-group-append>button').html('Đang xử lý <i class="fas fa-spinner text-white fa-spin ml-2" aria-hidden="true"></i>');
            },
            success: (res) => {
                $('.form-jackpot div.input-group-append>button').prop('disabled', false);
                $('.form-jackpot div.input-group-append>button').html(oldText);
                !res.success ? $('div.form-jackpot>div.message').html(`<div class="alert alert-warning">${res.message}</div>`) : $('div.form-jackpot>div.message').html(`<div class="alert alert-success">${res.message}</div>`);
                !$('.jackpot-time').hasClass('d-none') && $('.jackpot-time').addClass('d-none');
                $('.form-jackpot div.input-group-append').html('');
                $('.form-jackpot [name="phone"]').val('');
            }
        })
    })

    $('body').on('click', '#modalDetail button.btn-refund', function (e) {
        let transId = $('#detailTransId').text();

        if (!transId) return Swal.fire('Thông báo', 'Vui lòng kiểm tra lại giao dịch!', 'error');
        transId = transId.replace(/\D/g, '');

        $.ajax({
            url: '../api/v1/refundTransId',
            method: 'POST',
            dataType: 'json',
            data: { transId },
            beforeSend: () => {
                $('#modalDetail button.btn-refund').prop('disabled', true);
                $('#modalDetail button.btn-refund').html('Đang xử lý <i class="fas fa-spinner text-white fa-spin ml-2" aria-hidden="true"></i>');
            },
            success: (res) => {
                $('#modalDetail button.btn-refund').prop('disabled', false);
                $('#modalDetail button.btn-refund').html('Hoàn tiền');
                $('#modalDetail').modal('hide')
                res.success ? Swal.fire('Thông báo', res.message, 'success') : Swal.fire('Thông báo', res.message, 'error');
            }
        })
    })

    $('body').on('click', '#btnMuster', function (e) {
        let phone = $('input[name="phoneMuster"]').val();

        if (!phone) {
            return Swal.fire('Thông báo', 'Vui lòng nhập số điện thoại!');
        }

        $.ajax({
            url: '../api/v1/muster/add',
            method: 'POST',
            dataType: 'json',
            data: { phone },
            beforeSend: () => {
                $('#btnMuster').prop('disabled', true);
                $('#btnMuster').html('<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>');
            },
            success: (res) => {
                $('#btnMuster').prop('disabled', false);
                $('#btnMuster').html('<i class="fas fa-user-crown"></i>');
                res.success ? Swal.fire('Thông báo', res.message, 'success') : Swal.fire('Thông báo', res.message, 'error');
            }
        })
    })
});

function getPhone() {
    fetch("../api/v1/getPhone")
        .then((response) => response.json())
        .then((res) => {
            if (!res.success) return Swal.fire('Thông báo', res.message, 'error');
            !res.data.length ? $('#tablePhone').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) && $('#tableThongKe').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#tablePhone').html('') && $('#tableThongKe').html('')

            res.data.map((dataPhone) => {
                if (dataPhone.status == 'active' && ((dataPhone.amountDay + (dataPhone.betMax * 2) >= dataPhone.limitDay) || (dataPhone.amountMonth + (dataPhone.betMax * 2) >= dataPhone.limitMonth) || (dataPhone.count + 10 >= dataPhone.number))) dataPhone.status = 'pendingStop';
                $('#tablePhone').append(`<tr><td>${dataPhone.phone} <span class="badge badge-info copy-text" data-clipboard-text="${dataPhone.phone}"><i class="fas fa-copy"></i></span><br><small><b><span class="text-success">${Intl.NumberFormat('en-US').format(dataPhone.amountDay)}</span>/<span class="text-primary">${numberFormat(dataPhone.limitDay)}</span> ~ <span class="text-info">${dataPhone.count}</span>/<span class="text-primary">${dataPhone.number}</span>${dataPhone.bonus > 1 ? ` ~ <strong><span style="color: red;">x</span> ${dataPhone.bonus}</strong>` : ''}</b></small></td><td>${Intl.NumberFormat('en-US').format(dataPhone.betMin)} VNĐ</td><td>${Intl.NumberFormat('en-US').format(dataPhone.betMax)} VNĐ</td><td>${dataPhone.status == 'active' ? '<span class="badge badge-success">Hoạt động</span>' : (dataPhone.status == 'pendingStop' ? '<span class="badge badge-warning">Sắp bảo trì</span>' : `<span class="badge badge-danger">Bảo trì</span>`)}</td></tr>`);
                $('#tableThongKe').append(`<tr><td>${dataPhone.phone} <span class="badge badge-info copy-text" data-clipboard-text="${dataPhone.phone}"><i class="fas fa-copy"></i></span></td><td>${dataPhone.name}</td><td><span class="${dataPhone.status == 'active' ? 'text-success' : 'text-danger'}">${Intl.NumberFormat('en-US').format(dataPhone.amountDay)}</span>/${Intl.NumberFormat('en-US').format(dataPhone.limitDay)}</td><td><span class="${dataPhone.status == 'active' ? 'text-success' : 'text-danger'}">${Intl.NumberFormat('en-US').format(dataPhone.count)}</span>/${Intl.NumberFormat('en-US').format(dataPhone.number)}</td></tr>`);
            })
        })
        .catch((err) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${err}`, 'error'));
}

function getHistory() {
    fetch("../api/v1/getHistory")
        .then((response) => response.json())
        .then((res) => {
            if (!res.success) return Swal.fire('Thông báo', res.message, 'error');
            !res.data.length ? $('#tableHistory').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#tableHistory').html('');

            res.data.map((data) => $('#tableHistory').append(`<tr><td>${new Date(data.time).toLocaleString()}</td><td>${data.phone}</td><td>${Intl.NumberFormat('en-US').format(data.money)}</td><td>${Intl.NumberFormat('en-US').format(data.bonus)}</td><td>${data.gameName}</td><td><span class="badge badge-primary">${data.content.toUpperCase()}</span></td><td><span class="badge badge-success">Thắng</span></td></tr>`));
        })
        .catch((err) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${err}`, 'error'));
}

function getReward(gameType) {
    if (!gameType) {
        gameType = $('.games.btn-primary').data('type');
        gameName = $('.games.btn-primary').data('name');
        description = $('.games.btn-primary').data('description');
        $('#gameNoti').html(description);
        $('#gameName').html(`Cách Chơi ${gameName}`);
    }

    $.post('../api/v1/getReward', { gameType })
        .done((response) => {
            if (!response.success) return Swal.fire('Thông báo', response.message, 'error');
            !response.data.length ? $('#tableReward').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#tableReward').html('');

            response.data.map((data) => {
                $('#tableReward').append(`<tr><td><b>${data.content}</b></td><td><span class="badge badge-info">${data.numberTLS.join('</span> - <span class="badge badge-info">')}</span></td><td><strong><span style="color: red;">x</span> ${data.amount}</strong></td></tr>`)
            });
        })
        .fail((error) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${error.statusText}`, 'error'));
}

function historyJackpot() {
    fetch("../api/v1/jackpot/history")
        .then((response) => response.json())
        .then((res) => {
            if (!res.success) return Swal.fire('Thông báo', res.message, 'error');
            !res.data.length ? $('#historyJackpot').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#historyJackpot').html('');

            res.data.map((data) => $('#historyJackpot').append(`<tr><td>${data.time}</td><td>${data.phone}</td><td><span class="text-success">+ ${Intl.NumberFormat().format(data.amount)} đ</span></td></tr>`));
        })
        .catch((err) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${err}`, 'error'));
}

function handleDetail(data) {
    let status, isRefund;
    switch (data.status) {
        case 'wait':
            status = `<span class="badge badge-primary">Đang xử lý</span>`;
            break;
        case 'done':
            status = `<span class="badge badge-success">Đã thanh toán</span>`;
            break;
        case 'limitBet':
            isRefund = true;
            status = `<span class="badge badge-danger">Sai hạn mức</span>`;
            break;
        case 'errorComment':
            isRefund = true;
            status = `<span class="badge badge-danger">Sai nội dung</span>`;
            break;
        case 'errorComment':
            status = `<span class="badge badge-danger">Giới hạn hoàn</span>`;
            break;
        default:
            status = `<span class="badge badge-danger">Lỗi xử lý</span>`;
            break;
    }

    isRefund ? $('.btn-refund').hasClass('d-none') && $('.btn-refund').removeClass('d-none') : !$('.btn-refund').hasClass('d-none') && $('.btn-refund').addClass('d-none')
    $('#detailTransId').html(`#${data.transId}`);
    $('#tableDetails').html(`<tr><td><b>Số điện thoại</b></td><td class="text-secondary">${data.phone}</td></tr><tr><td><b>Mã giao dịch</b></td><td class="text-info">${data.transId}</td></tr><tr><td><b>Trò chơi</b></td><td class="text-warning">${data.gameName ? data.gameName : 'Không xác định'}</td></tr><tr><td><b>Tiền cược</b></td><td class="text-secondary">${Intl.NumberFormat('en-US').format(data.amount)}đ</td></tr><tr><td><b>Nội dung</b></td><td class="text-info">${data.comment}</td></tr><tr><td><b>Tiền thắng</b></td><td class="text-secondary">${Intl.NumberFormat('en-US').format(data.bonus)}đ</td></tr><tr><td><b>Kết quả</b></td><td>${data.result == 'win' ? `<span class="badge badge-success">Thắng</span>` : (data.result == 'won' ? `<span class="badge badge-danger">Thua</span>` : `<span class="badge badge-warning">Không xác định</span>`)}</td></tr><tr><td><b>Trạng thái</b></td><td>${status}</td></tr><tr><td><b>Thời gian</b></td><td>${data.time}</td></tr>`);
    $('#modalDetail').modal('show');
}

function getGame() {
    fetch("../api/v1/getGame")
        .then((response) => response.json())
        .then((res) => {
            if (!res.success) return Swal.fire('Thông báo', res.message, 'error');
            $('#list-game').html('');

            res.data.map((data, index) => $('#list-game').append(`<div style="padding: 5px"><button class="btn ${index == 0 ? 'btn-primary' : 'btn-outline-primary'} games" data-name="${data.name}" data-description="${data.description}" data-type="${data.gameType}" ><b>${data.name}</b></button></div>`));
        })
        .catch((err) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${err}`, 'error'));
}

function historyMuster() {
    fetch("../api/v1/muster/history")
        .then((response) => response.json())
        .then((res) => {
            if (!res.success) return Swal.fire('Thông báo', res.message, 'error');
            !res.data.length ? $('#historyMuster').html(`<tr><td colspan="12"><div class="text-center"><img src="../assets/images/photos/404.png"><p class="font-weight-bold">Không tìm thấy dữ liệu...</p></div></td></tr>`) : $('#historyMuster').html('');

            res.data.map((data) => $('#historyMuster').append(`<tr><td><span class="text-info">#${data.code}</span></td><td>${data.count}</td><td>${data.phone}</td><td>${Intl.NumberFormat('en-US').format(data.amount)}đ</td></tr>`));
        })
        .catch((err) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${err}`, 'error'));
}

function numberFormat(number) {
    return (number > 999 && number < 1000000) ? (number / 1000) + 'K' : (number >= 1000000 ? (number / 1000000) + 'M' : Intl.NumberFormat().format(number));
}

function getMuster() {
    fetch("../api/v1/muster/session")
        .then((response) => response.json())
        .then((res) => {
            if (!res.success) return;
            let data = res.data;

            $('#muster-session').html(`#${data.code}`);
            $('#muster-count').html(Intl.NumberFormat('en-US').format(data.count));
            $('#muster-winner').html(data.win);
            $('#muster-bonus').html(`${Intl.NumberFormat('en-US').format(data.bonus)}đ`);
            $('#muster-time').html(data.second);

        })
        .catch((err) => Swal.fire('Thông báo', `Có lỗi xảy ra, ${err}`, 'error'));
}

function countTimer() {
    let second = $('#muster-time').html();

    if (second < 1) {
        clearInterval(musterTime);

        return $('#muster-time').html(0);
    }

    $('#muster-time').html(second - 1);
}