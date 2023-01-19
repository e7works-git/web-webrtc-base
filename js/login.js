const BASE_URL = location.host == 'dev.vchatcloud.com' ? 'https://dev.vchatcloud.com' : 'https://vchatcloud.com';
const vChatCloud = new VChatCloud();
let channel, userNick, userKey, channelKey;

var getParameters = function(paramName) {
    // 리턴값을 위한 변수 선언
    var returnValue;

    // 현재 URL 가져오기
    var url = location.href;

    // get 파라미터 값을 가져올 수 있는 ? 를 기점으로 slice 한 후 split 으로 나눔
    var parameters = (url.slice(url.indexOf('?') + 1, url.length)).split('&');

    // 나누어진 값의 비교를 통해 paramName 으로 요청된 데이터의 값만 return
    for (var i = 0; i < parameters.length; i++) {
        var varName = parameters[i].split('=')[0];
        if (varName.toUpperCase() == paramName.toUpperCase()) {
            returnValue = parameters[i].split('=')[1];
            return decodeURIComponent(returnValue);
        }
    }
};


$(function() {
    channelKey = getParameters('channelKey');
    let p = $('div.login').show();

    $('button.popupbtn', p).click(function() {
        let r = { nick: $('input#name', p).val() };
        if (r.nick) {
            joinRoom(channelKey, 'xxxxxxxx'.replace(/[xy]/g, function(a, b) { return (b = Math.random() * 16, (a == 'y' ? b & 3 | 8 : b | 0).toString(16)) }), r.nick, function(err, history) {
                if (err) {
                    console.log(err)
                    res.toastPopup((errMsg[err.code] == undefined) ? err.code : errMsg[err.code].kor);
                    vChatCloud.disconnect();
                } else {
                    p.hide();
                    $("#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.roomtitle").text(channel.roomName);
                    // 이벤트 바인딩 시작
                    videoInit();
                }
            });
        }
    });

    $('.exit.btn_on').click(function() {
        exit(p)
    })

    $('#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.present-btn').click(function() {
        if (channel) {
            channel.toggleRTCMedia('display')
        } else {
            res.toastPopup("로그인을 해주세요");
        }
    })
})

function exit(p) {
    if (channel) {
        var exit_chk = confirm('종료 하시겠습니까?')
        if (!exit_chk)
            return;

        $("#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.roomtitle").text('')
        p.show();
        $('.cam-footer .cam-btn .mic').off("click.rtc")
        $('.cam-footer .cam-btn .cam').off("click.rtc")
        vChatCloud.disconnect();
        $("#likeCounter").text("0");
        channel = undefined;
    } else {
        res.toastPopup("로그인을 해주세요");
    }
}

function joinRoom(roomId, clientKey, nickName, callback) {
    // vchatcloud 객체
    channel = vChatCloud.joinChannel({
        roomId: roomId,
        clientKey: clientKey,
        nickName: nickName
    }, function(error, history) {
        if (error) {
            if (callback) return callback(error, null);
            return error;
        }
        callback(error, history);
    })
}

function openError(code, callback) {
    let p = $('div.errorpopup').hide();
    if (errMsg[code] == undefined) {
        $('p:nth-child(2)', p).text(code);
    } else {
        $('p:nth-child(2)', p).text(errMsg[code].kor);
    }
    $('a', p).off().click(function() { p.hide(); if (typeof callback == 'function') { callback() } });
    p.show();
}