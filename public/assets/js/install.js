$(document).ready(function () {
    $('#checkTOKEN button').click(function (e) {
        if (localStorage.getItem('TOKEN_SETUP')) {
            $.growl.warning({
                title: "<center>Warning!</center>",
                message: "<center>Token installed, reload!</center>",
            });
            return setTimeout(() => window.location.reload(), 1500);
        }
        let TOKEN_SETUP = $('#checkTOKEN input[name="TOKEN_SETUP"]').val().trim();

        const regexUUID = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
        if (!TOKEN_SETUP || !regexUUID.test(TOKEN_SETUP)) {
            return $.growl.warning({
                title: "<center>Warning!</center>",
                message: "<center>Invaild Token Setup!</center>",
            });
        }
        fetch('../install/' + TOKEN_SETUP)
            .then((response) => response.json())
            .then((res) => {
                if (!res.success) return $.growl.error({
                    title: "<center>Error!</center>",
                    message: `<center>${res.message}</center>`,
                });

                $.growl.notice({
                    title: "<center>Success!</center>",
                    message: `<center>${res.message}</center>`,
                });

                localStorage.setItem('TOKEN_SETUP', TOKEN_SETUP);
                setTimeout(() => window.location.reload(), 1000);
            })
    })

    $('#createAuth button').click(function (e) {
        let TOKEN_SETUP = localStorage.getItem('TOKEN_SETUP');
        if (!TOKEN_SETUP) {
            return $.growl.error({
                title: "<center>Error!</center>",
                message: "<center>Token Setup Not Found!</center>",
            });
        }

        let name = $('#createAuth input[name="name"]').val();
        let username = $('#createAuth input[name="username"]').val();
        let password = $('#createAuth input[name="password"]').val();

        if (!name || !username || !password) {
            return $.growl.warning({
                title: "<center>Warning!</center>",
                message: "<center>Vui lòng điền đầy đủ thông tin!</center>",
            });
        }

        $.post('../adminPanel/register', {
            name,
            username,
            password,
            TOKEN_SETUP
        }, function (res) {
            if (!res.success) return $.growl.error({
                title: "<center>Error!</center>",
                message: `<center>${res.message}</center>`,
            });

            $.growl.notice({
                title: "<center>Success!</center>",
                message: `<center>${res.message}</center>`,
            });
            setTimeout(() => window.location.reload(), 2000);
        })
    })

    $('#createSetting form').submit(function (e) {
        e.preventDefault();
        let TOKEN_SETUP = localStorage.getItem('TOKEN_SETUP');
        if (!TOKEN_SETUP) {
            return $.growl.error({
                title: "<center>Error!</center>",
                message: "<center>Token Setup Not Found!</center>",
            });
        }

        let nameSite = $('[name="nameSite"]').val(), defaultTitle = $('[name="defaultTitle"]').val(), description = $('textarea[name="description"]').val(), keywords = $('textarea[name="keywords"]').val(), favicon = $('[name="favicon"]').val(), thumbnail = $('[name="thumbnail"]').val(), gameNote = $('[name="gameNote"]').val(), limitPhone = $('[name="limitPhone"]').val(), paymentComment = $('[name="paymentComment"]').val(), withdrawComment = $('[name="withdrawComment"]').val(), siteStatus = $('[name="siteStatus"]').val();

        let missionData = {
            status: 'active',
            data: []
        };

        let topData = {
            status: 'active',
            bonus: [],
            fakeData: []
        }

        let history = {
            autoStatus: 'active',
            dataType: 'history',
            limit: 10,
            time: 30
        }

        let refund = {
            status: 'active',
            win: 100,
            won: 50,
            limit: 10
        }

        let notification = {
            status: 'active',
            data: ''
        }
        missionData.status = $(this).find('[name="missionStatus"]').val();
        $('#missionData>tbody>tr').each(function () {
            let amount = $(this).find('td.amount').text().replace(/\D/g, '');
            let bonus = $(this).find('td.bonus').text().replace(/\D/g, '');
            missionData.data.push({
                amount: Number(amount),
                bonus: Number(bonus)
            })
        })

        topData.status = $(this).find('[name="topStatus"]').val();
        $('#bonusData>tbody>tr').each(function () {
            let bonus = $(this).find('td.bonus').text().replace(/\D/g, '');
            topData.bonus.push(Number(bonus))
        })
        $('#fakeData>tbody>tr').each(function () {
            let phone = $(this).find('td.phone').text();
            let amount = $(this).find('td.amount').text().replace(/\D/g, '');
            let bonus = $(this).find('td.bonus').text().replace(/\D/g, '');
            topData.fakeData.push({
                phone,
                amount: Number(amount),
                bonus: Number(bonus)
            })
        })

        history.autoStatus = $('[name="autoStatus"]').val();
        history.dataType = $('[name="typeAPI"]').val();
        history.limit = Number($('[name="limitGet"]').val());
        history.time = Number($('[name="timeGet"]').val());

        refund.status = $('[name="refundStatus"]').val();
        refund.win = Number($('[name="refundWin"]').val());
        refund.won = Number($('[name="refundWon"]').val());
        refund.limit = Number($('[name="limitRefund"]').val());

        notification.status = $('[name="notiStatus"]').val();
        notification.data = $('[name="notiData"]').val();

        $.post('../install', {
            TOKEN_SETUP, nameSite, defaultTitle, description, keywords, favicon, thumbnail, gameNote, limitPhone, paymentComment, withdrawComment, missionData, topData, history, refund, notification, siteStatus
        }, function (res) {
            if (!res.success) return $.growl.error({
                title: "<center>Error!</center>",
                message: `<center>${res.message}</center>`,
            });

            $.growl.notice({
                title: "<center>Success!</center>",
                message: `<center>${res.message}</center>`,
            });
            setTimeout(() => window.location.href = '../adminPanel', 1500);
        })
    })

    $('body').on('click', '#missionData>tbody>tr>td.remove', function (e) {
        $(this).parent().remove();
    })

    $('body').on('click', '#bonusData>tbody>tr>td.remove', function (e) {
        $(this).parent().remove();
        resetTOP('#bonusData');
    })

    $('body').on('click', '#fakeData>tbody>tr>td.remove', function (e) {
        $(this).parent().remove();
        resetTOP('#fakeData');
    })

    $('body').on('click', '#missionData>tbody>tr>td.save', function (e) {
        let amount = $(this).parent().find('td>input.amount').val();
        let bonus = $(this).parent().find('td>input.bonus').val();

        if (!amount || !bonus) return $(this).parent().remove();
        console.log(amount, bonus);

        $('#missionData>tbody').append(`<tr><td class="amount">${Intl.NumberFormat('en-US').format(amount)}</td><td class="bonus">${Intl.NumberFormat('en-US').format(bonus)}</td><td class="remove"><span class="text-danger hand"><i class="fa fa-times" aria-hidden="true"></i></span></td></tr>`)
        $(this).parent().remove();
    })

    $('body').on('click', '#bonusData>tbody>tr>td.save', function (e) {
        let bonus = $(this).parent().find('td>input.bonus').val();
        if (!bonus) return $(this).parent().remove();
        console.log(bonus);

        $('#bonusData>tbody').append(`<tr><td class="top"></td><td class="bonus">${Intl.NumberFormat('en-US').format(bonus)}</td><td class="remove"><span class="text-danger hand"><i class="fa fa-times" aria-hidden="true"></i></span></td></tr>`)
        $(this).parent().remove();

        resetTOP('#bonusData');
    })

    $('body').on('click', '#fakeData>tbody>tr>td.save', function (e) {
        let phone = $(this).parent().find('td>input.phone').val();
        let amount = $(this).parent().find('td>input.amount').val();
        let bonus = $(this).parent().find('td>input.bonus').val();

        if (!phone || !amount || !bonus) return $(this).parent().remove();
        console.log(phone, amount, bonus);

        $('#fakeData>tbody').append(`<tr><td class="top"></td><td class="phone">${phone}</td><td class="amount">${Intl.NumberFormat('en-US').format(amount)}</td><td class="bonus">${Intl.NumberFormat('en-US').format(bonus)}</td><td class="remove"><span class="text-danger hand"><i class="fa fa-times" aria-hidden="true"></i></span></td></tr>`)
        $(this).parent().remove();

        resetTOP('#fakeData');
    })

    $('#missionData>thead>tr>th.add').on('click', (e) => $('#missionData>tbody').append(`<tr><td><input type="number" class="form-control amount" placeholder="Nhập số tiền tổng cược của 1 ngày" /></td><td><input type="number" class="form-control bonus" placeholder="Nhập số tiền thưởng" /></td><td class="save"><span class="text-success hand"><i class="fas fa-save"></i></span></td></tr>`))

    $('#bonusData>thead>tr>th.add').on('click', (e) => $('#bonusData>tbody').append(`<tr><td colspan="2"><input type="number" class="form-control bonus" placeholder="Nhập số tiền thưởng top tiếp theo" /></td><td class="save"><span class="text-success hand"><i class="fas fa-save"></i></span></td></tr>`))

    $('#fakeData>thead>tr>th.add').on('click', (e) => $('#fakeData>tbody').append(`<tr><td colspan="2"><input type="text" class="form-control phone" placeholder="Nhập số điện thoại pha ke, ví dụ: 098268****" /></td><td><input type="number" class="form-control amount" placeholder="Nhập số tiền thắng cược pha ke" /></td><td><input type="number" class="form-control bonus" placeholder="Nhập số tiền thưởng pha ke" /></td><td class="save"><span class="text-success hand"><i class="fas fa-save"></i></span></td></tr>`))

    function resetTOP(element) {
        $(`${element}>tbody>tr>td.top`).each(function (index) {
            $(this).html(`${index + 1}`)
        })
    }
})