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
    console.log(cookies);
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

async function lectureFormSubmit() {
  const classTimeSelector = document.querySelector("select#id_class_time");
  const gradeSelector = document.querySelector("select#id_grade_id");
  const classSelector = document.querySelector("select#id_class_id");
  const subjectId = document.querySelector(".subject_info");
  var classDate = document.querySelector("input#id_class_date").value;
  let response = await fetch("http://127.0.0.1:8000/lecture", {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({
      class_date: classDate,
      class_time:
        classTimeSelector.options[classTimeSelector.selectedIndex].value,
      grade_id: gradeSelector.options[gradeSelector.selectedIndex].value,
      class_id: classSelector.options[classSelector.selectedIndex].value,
      subject_id: subjectId.dataset.value,
    }),
  })
    .then((res) => res.json())
    .then(function (res) {
      console.log(res);
    });
}

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

async function getReport(lectureId) {
  // const classTimeSelector = document.querySelector("select#id_class_time");
  // const gradeSelector = document.querySelector("select#id_grade_id");
  // const classSelector = document.querySelector("select#id_class_id");
  // const subjectId = document.querySelector(".subject_info");
  // var classDate = document.querySelector("input#id_class_date").value;
  let response = await fetch(
    "http://127.0.0.1:8000/report?lecture=" + lectureId,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
    }
  )
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
      openReport(res);
    })
    .catch((err) => console.log(err));
  // .catch((res) => openReport(res));
}

function openReport(res) {
  const reportBoard = document.querySelector(".study-info");
  var chartWrapper = document.querySelector("#report-wrapper");
  res = JSON.parse(res.data);
  console.log(res);
  if (res[0].fields.img_url == null && res[0].fields.plot_data == null) {
    chartWrapper.innerText = "내용을 준비하고 있습니다!!";
    chartWrapper.querySelector(".fit-picture").src = "";
  }
  if (res[0].fields.img_url != null) {
    // const reportImgEle = reportBoard.querySelector(".fit-picture");
    chartWrapper.querySelector(".fit-picture").src =
      "." + res[0].fields.img_url;
    // reportImgEle.src = res.img_url;
  }
  reportBoard.classList.remove("hidden");
}

function openLectureForm(targetDay) {
  const classDateInput = schedule.querySelector("input#id_class_date");
  const classYear = schedule.querySelector(".year");
  const classMon = schedule.querySelector(".mon");
  const classDate = schedule.querySelector(".date");
  classYear.innerText = targetDay.getFullYear();
  classMon.innerText = targetDay.getMonth() + 1;
  classDate.innertText = targetDay.getDate();
  classDateInput.value = targetDay.toISOString();
  schedule.classList.toggle("hidden");
}
document.addEventListener("click", function (e) {
  if (e.target.tagName == "BUTTON") {
    if (e.target.className == "wrap-login100") {
      login();
    }
    if (e.target.id == "submit_btn") {
      lectureFormSubmit();
    }
  }
  if (e.target.id == "schedule-btn") {
    schedule.classList.toggle("hidden");
  }
  if (e.target.id == "study-info-btn") {
    e.target.closest(".study-info").classList.toggle("hidden");
  }
});
document.querySelector("#calendar").addEventListener("click", function (e) {
  const schedule = document.querySelector("#schedule");
  const today = new Date();

  var targetYr = document.querySelector("#YEAR").innerText;
  var targetMon = document.querySelector("#MONTH").innerText - 1;
  var targetDate = parseInt(
    e.target.closest(".day").querySelector(".date").innerText
  );
  var targetDay = new Date(targetYr, targetMon, targetDate);
  if (targetDay > today) {
    if (e.target.className == "day") {
      openLectureForm(targetDay, e.target);
    }
  } else {
    console.log(e.target);
    var eventEle = e.target.closest(".event");
    console.log(eventEle);
    if (eventEle != null) {
      getReport(eventEle.dataset.id);
    }
  }
  // if (e.target.className == "date") {
  //   console.log(e.target.innerText);
  // }
});
