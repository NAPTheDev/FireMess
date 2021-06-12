let loading_message_count = 10;
let emoji_replace_list = {
  "😭": ["ToT", "T-T", "T_T", "T.T", ":((", ":-(("],
  "😓": ["'-_-"],
  "😜": [";p", ";-p", ";P", ";-P"],
  "😑": ["-_-"],
  "😢": [":'(", ":'-("],
  "😞": [":(", ":-(", "=(", ")=", ":["],
  "😐": [":|", ":-|"],
  "😛": [":P", ":-P", ":p", ":-p", "=P", "=p"],
  "😁": [":D", ":-D", "=D", ":d", ":-d", "=d"],
  "😗": [":*", ":-*"],
  "😇": ["O:)", "O:-)"],
  "😳": ["O_O", "o_o", "0_0"],
  "😊": ["^_^", "^~^", "=)"],
  "😠": [">:(", ">:-(", ">:o", ">:-o", ">:O", ">:-O"],
  "😎": ["8)", "B)", "8-)", "B-)", ":))"],
  "😚": ["-3-"],
  "😉": [";)", ";-)"],
  "😲": [":O", ":o", ":-O", ":-o"],
  "😣": [">_<", ">.<"],
  "😘": [";*", ";-*"],
  "😕": [":/", ":-/", ":\\", ":-\\", "=/", "=\\"],
  "🙂": [":)", ":]", ":-)", "(:", "(="],
  "♥": ["<3"],
  "😂": [":')"],
  "🤑": ["$-)"],
};

function replace_emoji(text) {
  text = ` ${text} `;

  for (const key in emoji_replace_list) {
    for (let i = 0; i < emoji_replace_list[key].length; i++) {
      text = text.replace(" " + emoji_replace_list[key][i] + " ", " " + key + " ");
    }
  }

  return text.trim();
}

function messages_tooltip() {
  let tooltipTriggerList = [].slice.call(main_chat.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
      delay: {
        show: 700,
        hide: 0,
      },
    });
  });
}

function set_chat_user(id) {
  if (chatUser?.id === id) return;
  document.getElementById(id).classList.remove("has-new-message");

  main_chat.innerHTML = sample.loadingSpin();
  loading_message_count = 10;

  document.getElementById("right-panel").style.display = "flex";

  database
    .ref("users")
    .child(id)
    .get()
    .then((snapshot) => {
      chatUser = { ...snapshot.val(), id: id };
      document.getElementById("chat-user-info").innerHTML = sample.chatUser(chatUser.photoURL, chatUser.displayName);
      let input_box = document.getElementById("input-box").getElementsByTagName("input");
      for (let i = 0; i < input_box.length; i++) {
        if (input_box[i].id != "my-input") input_box[i].disabled = false;
      }
      document.getElementById("my-input").emojioneArea.enable();

      document.getElementsByClassName("person-focus")[0]?.classList.remove("person-focus");
      document.getElementById(id).classList.add("person-focus");

      document.getElementById("chat-picture").src = chatUser.photoURL;
      document.getElementById("chat-email").innerText = chatUser.email;
      document.getElementById("chat-id").innerText = chatUser.id;

      database
        .ref("messages")
        .child(arrange_user_id(auth.currentUser.uid, id))
        .limitToLast(loading_message_count)
        .get()
        .then((child_snapshot) => {
          if (!child_snapshot.exists() && chatUser.id === id) {
            main_chat.innerHTML = sample.noMessageWarning();
          } else {
            let child_data = child_snapshot.val();
            main_chat.innerHTML = "";
            for (const key in child_data) {
              render_message(child_data[key], id);
            }
            scroll_bottom();
            messages_tooltip();
          }
        });
    });
}

function load_previous_messages() {
  let previous_scroll = main_chat.scrollHeight;

  loading = true;
  loading_message_count += 10;

  main_chat.innerHTML = sample.loadingSpin() + main_chat.innerHTML;
  database
    .ref("messages")
    .child(arrange_user_id(auth.currentUser.uid, chatUser.id))
    .limitToLast(loading_message_count)
    .get()
    .then((child_snapshot) => {
      let child_data = child_snapshot.val();
      main_chat.innerHTML = "";
      for (const key in child_data) {
        render_message(child_data[key], chatUser.id);
      }
      loading = false;

      main_chat.scrollTop = main_chat.scrollHeight - previous_scroll;
    });
}

function render_message(child_data, chatUserId) {
  let { sender, content, type, server_timestamp } = child_data;
  let side;
  if (sender === chatUser?.id) {
    side = "left";
  } else if (sender === auth.currentUser.uid && chatUser?.id === chatUserId) {
    side = "right";
  }

  if (main_chat.innerHTML === sample.noMessageWarning()) {
    main_chat.innerHTML = "";
  }
  if (side != undefined) {
    if (type === "text") main_chat.innerHTML += sample.message(content, side, server_timestamp);
    else if (type === "image") main_chat.innerHTML += sample.image(content, side, server_timestamp);
  } else {
    document.getElementById(chatUserId).classList.add("has-new-message");
  }
}

function render_time(time) {
  let hours = time.getHours();
  let am_pm = hours >= 12 ? "PM" : "AM";
  return `${format_time_unit(hours % 12)}:${format_time_unit(time.getMinutes())}:${format_time_unit(time.getSeconds())} ${am_pm} ${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear()}`;
}

function format_time_unit(unit) {
  unit = String(unit);
  if (unit.length < 2) {
    return "0" + unit;
  }
  return unit;
}

function arrange_user_id(id1, id2) {
  return id1 <= id2 ? id1 + "-" + id2 : id2 + "-" + id1;
}

function scroll_bottom() {
  setTimeout(() => {
    $("#main-chat").animate({ scrollTop: main_chat.scrollHeight - main_chat.clientHeight }, 300);
  }, 300);
}
