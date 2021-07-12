(function ($) {
  "use strict";

  /*==================================================================
    [ Validate ]*/
  var input = $(".validate-input .input100");

  $(".validate-form").on("submit", function () {
    var check = true;

    for (var i = 0; i < input.length; i++) {
      if (validate(input[i]) == false) {
        showValidate(input[i]);
        check = false;
      }
    }

    return check;
  });

  $(".validate-form .input100").each(function () {
    $(this).focus(function () {
      hideValidate(this);
    });
  });

  function validate(input) {
    if ($(input).attr("type") == "email" || $(input).attr("name") == "email") {
      if (
        $(input)
          .val()
          .trim()
          .match(
            /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
          ) == null
      ) {
        return false;
      }
    } else {
      if ($(input).val().trim() == "") {
        return false;
      }
    }
  }

  function showValidate(input) {
    var thisAlert = $(input).parent();

    $(thisAlert).addClass("alert-validate");
  }

  function hideValidate(input) {
    var thisAlert = $(input).parent();

    $(thisAlert).removeClass("alert-validate");
  }
})(jQuery);

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

var csrftoken = getCookie("csrftoken");

async function login() {
  const id = document.querySelector("input[name=login_id]").value;
  const password = document.querySelector("input[name=password]").value;
  console.log(id, password);
  let response = await fetch("http://127.0.0.1:8000/login", {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({
      login_id: id,
      password: password,
    }),
  })
    .catch(function (response) {
      console.log(reponse);
      alert(response.json()["message"]);
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      sessionStorage["Authorization"] = json.access_token;
      if (json.user_type == 2) {
        window.location.href = "/teacher";
      } else if (json.user_type == 3) {
        window.location.href = "/student";
      } else {
        alert(json.message);
      }
      console.log(json);
    });
}

today = new Date();
year = today.getFullYear();
month = today.getMonth();

first_date = new Date(year, month, 1).getDate();
last_date = new Date(year, month + 1, 0).getDate();
first_day = new Date(year, month, 1).getDay();

function makecalendar() {
  $("#month").text(month);

  calendar = document.getElementById("calendar");
  row = calendar.insertRow();

  for (i = 0; i < first_day; i++) {
    //first_day에 해당하는 요일까지 열을 만든다.
    //요일은 0부터 시작하기 때문에 i값도 0에서 시작한다.
    cell = row.insertCell();
  }
  for (i = 1; i <= last_date; i++) {
    // 달력은 1일부터 시작하므로 i=1
    if (first_day != 7) {
      //first_day는 0~6이다. 일주일은 한 줄에 7칸이니까 7이상은 찍히지 않는다.
      cell = row.insertCell();
      //셀추가
      cell_id = "day" + String(i);
      cell.setAttribute("id", cell_id);
      //모든 셀에 id를 부여함
      cell.innerHTML = [i];
      //추가된 셀에 i값 입력
      first_day += 1;
      //요일값이 하루 추가된걸 for문에 알려줌
    } else {
      //첫줄의 first_day 값이 7이되면 작동
      row = calendar.insertRow();
      //행을 하나 추가
      cell = row.insertCell();
      cell_id = "day" + String(i);
      cell.setAttribute("id", cell_id);
      cell.innerHTML = [i];
      //세줄은 위와 같음
      first_day = first_day - 6;
      //6을 빼는 이유는 매번 7에서 else문으로 넘어오고, if문이 6번만 하면 되기때문이다.
      //7을 빼버리면 0부터 시작해서 if문이 7번 실행되고 else로 넘어오므로 -6을한다.
    }
  }
}

makecalendar();

function before_month() {
  while (calendar.rows.length > 2) {
    //2줄이 남을 때 까지 줄을 지워줌
    //버튼과 요일이 남아야 하기 때문에 2줄만 남기고 지운다.
    calendar.deleteRow(calendar.rows.length - 1);
    //length-1 = 아래서부터 지우라는 뜻
  }
  month = month - 1;
  //한달씩 뒤로감
  if (month === -1) {
    //0월이 되었을 때 이전연도 12월로 가도록 작업
    //js에서 0월 = 실제 1월 이므로 -1로 맞춰야한다.
    year = year - 1;
    month = month + 12;
  }
  first_date = new Date(year, month, 1).getDate();
  last_date = new Date(year, month + 1, 0).getDate();
  first_day = new Date(year, month, 1).getDay();
  makecalendar();
}

function next_month() {
  while (calendar.rows.length > 2) {
    calendar.deleteRow(calendar.rows.length - 1);
  }
  month = month + 1;
  //한달씩 증가함
  if (month === 12) {
    //13월이 되었을 때 다음연도 1월로 가도록 작업
    //js에서 11월 = 실제 12월 이므로 12로 맞춰야한다.
    year = year + 1;
    month = 1;
  }

  first_date = new Date(year, month, 1).getDate();
  last_date = new Date(year, month + 1, 0).getDate();
  first_day = new Date(year, month, 1).getDay();
  makecalendar();
}

document.querySelector(".my_btn").addEventListener("click", login);
document.addEventListener("");
