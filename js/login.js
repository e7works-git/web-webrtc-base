const { Util, RoomInit } = e7lib;
const BASE_URL = Util.Config.hostpath;
let vChatCloud;
let channel, userNick, userKey, channelKey;
let pw, email;
const lock = { pw: false, email: false };

var getParameters = function (paramName) {
  // 리턴값을 위한 변수 선언
  let returnValue;
  // 현재 URL 가져오기
  let url = location.search;
  // get 파라미터 값을 가져올 수 있는 ? 를 기점으로 slice 한 후 split 으로 나눔
  let parameters = url.slice(1).split("&");
  console.log("parameters", parameters);
  // 나누어진 값의 비교를 통해 paramName 으로 요청된 데이터의 값만 return
  for (let i = 0; i < parameters.length; i++) {
    let varName = parameters[i].split("=")[0];
    if (varName.toUpperCase() == paramName.toUpperCase()) {
      returnValue = parameters[i].split("=")[1];
      return decodeURIComponent(returnValue);
    }
  }
};

$(function () {
  channelKey = getParameters("channelKey");
  try {
    email = Util.dataEmailPaser(getParameters("data"));
  } catch(e) {
    email = ""
  }
  let p = $("div.login").show();

  new RoomInit(channelKey, function (roomData) {
    if (roomData.lock() === "Y") {
      switch (roomData.lockType()) {
        case "PW":
          lock.pw = true;
          break;
        case "EM":
          lock.email = true;
          break;
        case "ALL":
          lock.pw = true;
          lock.email = true;
          break;
      }
    }
    const CONSTRAINTS = {
      video: {
        width: { ideal: roomData.resolution() ? roomData.resolution() *4 /3 : 320 },
        height: { ideal: roomData.resolution() ? roomData.resolution() : 240 },
      },
      audio: { echoCancellation: true, noiseSuppression: true },
    };
    vChatCloud = new VChatCloud({ url: Util.Config.chatUrl }, CONSTRAINTS);
  });

  $("button.popupbtn", p).click(async function () {
    let r = { nick: $("input#name", p).val() };
    if (r.nick) {
      let joined = false;
      const entryDiv = $("#entry");
      while (!joined) {
        await new Promise((resolve, reject) => {
          if (lock.pw || lock.email) {
            entryDiv.css("display", "flex");
            $(".entry_form").hide();
            if (lock.pw) {
              $(".entry_form.pw").show();
            }
            if (lock.email && !email) {
              $(".entry_form.id").show();
            } else {
              resolve(true);
            }

            $(".entry_btnwrap .submit", entryDiv).on("click", () => {
              pw = $(".entry_form.pw input").val();
              if (!email) {
                email = $(".entry_form.id input").val();
              }
              resolve(true);
            });
            $(".entry_btnwrap .cancel", entryDiv).on("click", () => {
              entryDiv.css("display", "none");
              $(".entry_form.pw input").val("");
              $(".entry_form.id input").val("");
              reject(false);
            });
            $(".entry_form input").on("keypress", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                $(".entry_btnwrap .submit", entryDiv).trigger("click");
              }
            });
          } else {
            resolve(true);
          }
        }).then(
          () =>
            new Promise((resolve) => {
              const clientKey = "xxxxxxxxxxxx".replace(/[xy]/g, function (a, b) {
                return (b = Math.random() * 16), (a == "y" ? (b & 3) | 8 : b | 0).toString(16);
              });
              joinRoom(
                {
                  roomId: channelKey,
                  clientKey: email ?? clientKey,
                  nickName: r.nick,
                  ...(lock.pw && pw ? { password: pw } : {}),
                },

                function (err, history) {
                  if (err) {
                    // 미허용 회원ID/비밀번호
                    if ((err.code === 10114) | (err.code === 10115)) {
                      pw = "";
                      if (err.code === 10114) {
                        email = "";
                        $(".entry_form.id").show();
                      }
                      $(".entry_contents_subtitle").show();
                    } else {
                      res.toastPopup(errMsg[err.code] == undefined ? err.code : errMsg[err.code].kor);
                    }
                    vChatCloud.disconnect();
                  } else {
                    p.hide();
                    $("#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.roomtitle").text(
                      channel.roomName
                    );

                    $(".entry_contents_subtitle").hide();
                    entryDiv.css("display", "none");
                    joined = true;
                    // 이벤트 바인딩 시작
                    videoInit();
                  }
                  resolve();
                }
              );
            })
        );
      }
    }
  });

  $(".exit.btn_on").click(function () {
    exit(p);
  });

  $("#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.present-btn").click(function () {
    if (channel) {
      channel.toggleRTCMedia("display");
    } else {
      res.toastPopup("로그인을 해주세요");
    }
  });
});

function exit(p) {
  if (channel) {
    var exit_chk = confirm("종료 하시겠습니까?");
    if (!exit_chk) return;

    $("#wrap > section > div > article.contents > div.webcam > div.cam-footer > p.roomtitle").text("");
    p.show();
    $(".cam-footer .cam-btn .mic").off("click.rtc");
    $(".cam-footer .cam-btn .cam").off("click.rtc");
    vChatCloud.disconnect();
    $("#likeCounter").text("0");
    channel = undefined;
  } else {
    res.toastPopup("로그인을 해주세요");
  }
}

function joinRoom({ roomId, clientKey, nickName, password }, callback) {
  // vchatcloud 객체
  channel = vChatCloud.joinChannel(
    {
      roomId: roomId,
      clientKey: clientKey,
      nickName: nickName,
      ...(lock.pw && pw ? { password } : {}),
    },
    function (error, history) {
      if (error) {
        if (callback) return callback(error, null);
        return error;
      }
      callback(error, history);
    }
  );
}

function openError(code, callback) {
  let p = $("div.errorpopup").hide();
  if (errMsg[code] == undefined) {
    $("p:nth-child(2)", p).text(code);
  } else {
    $("p:nth-child(2)", p).text(errMsg[code].kor);
  }
  $("a", p)
    .off()
    .click(function () {
      p.hide();
      if (typeof callback == "function") {
        callback();
      }
    });
  p.show();
}
