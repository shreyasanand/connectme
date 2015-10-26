$(document).ready(function() {
    var socket = io.connect("http://10.192.1.140:3000/");
    var userName;
    
    // Initial page setup (Login page)
    $('.signin').show();
    $('.signup').hide();
    $('#divErrorStatus').hide();
    $('#profileBar').hide();
    $('#chatRooms').hide();
    $('.divChatRoomWindow').hide();
    
    // Assign event handlers to button clicks
    $('#btnSignUp').click(handleSignUpBtnClick);
    $('#btnRedirectToSignIn').click(handleRedirectToSignInBtnClick);
    $('#btnRegister').click(handleRegisterBtnClick);
    $('#btnSignIn').click(handleSignInBtnClick);
    $('#btnCreateRoom').click(handleCreateRoomBtnClick);
    $("#btnSendMessage").click(handleSendMsgBtnClick);
    $('#btnLogout').click(handleLogoutBtnClick);
    $("#btnLeave").click(handleLeaveRoomBtnClick);
    $('#txtChatRoomName').keyup(handleChatRoomNameKeyup);
    $('#txtTypedMsg').keyup(handleMsgTypedKeyup);

    function handleSignUpBtnClick() {
        $('.signin').hide();
        $('.signup').show();
        $('#divErrorStatus').hide();
    }

    function handleRedirectToSignInBtnClick() {
        $('.signin').show();
        $('.signup').hide();
        $('#divErrorStatus').hide();
    }

    function handleRegisterBtnClick() {
        var newName = $('#txtNewName').val();
        var newUserName = $('#txtNewUsrname').val();
        var newPassword = $('#txtNewPwd').val();
        var newEmail = $('#txtNewEmail').val();
        if (newName.trim() != "") {
            if (newUserName.trim() != "") {
                if (newPassword.trim() != "") {
                    // Send user info to server for authentication.
                    socket.emit("signUp", {
                        "name": newName,
                        "userName": newUserName,
                        "password": newPassword,
                        "email": newEmail
                    });
                } else {
                    displayErrorMsg('Please enter password');
                }
            } else {
                displayErrorMsg('Please enter username');
            }
        } else {
            displayErrorMsg('Please enter name');
        }
    }

    function handleSignInBtnClick() {
        $('#divErrorStatus').hide();
        var errorMsg;
        userName = $('#txtUsrname').val();
        var password = $('#txtPwd').val();
        if (userName.trim() != "") {
            if (password.trim() != "") {
                // Send login info to server for authentication.
                socket.emit("signIn", {
                    "userName": userName,
                    "password": password
                });
            } else {
                displayErrorMsg('Please enter password');
            }
        } else {
            displayErrorMsg('Please enter username');
        }
    }

    function handleCreateRoomBtnClick() {
        var roomName = $('#txtChatRoomName').val().trim();
        $('#txtChatRoomName').val("");
        $(".divChatRoomName").removeClass("has-error");
        $(".divChatRoomName").removeClass("has-success");
        $(".divChatRoomNameValidity").html("");
        socket.emit("createChatRoom", roomName);
    }

    function handleSendMsgBtnClick() {
        var roomName = $(this).val();
        var msg = $("#txtTypedMsg").val();
        $("#txtTypedMsg").val("");
        socket.emit("message", roomName, msg);
        var html = "<span style='position: absolute;'><span class='rightAlignMsg'>" + msg +
            "</span><span class='image'><img src='http://www.gravatar.com/avatar/50c830ed1772627f4964fb669eee45f0?s=140&r=x&d=mm'><b class='right'>Me</b></span></span><br><br><br><br><br>";
        $("#Msgs" + roomName + "").append(html);
        $("#Msgs" + roomName + "").scrollTop($("#Msgs" + roomName + "")[0].scrollHeight);
    }

    function handleLogoutBtnClick() {
        location.reload();
        socket.emit("logOut");
    }

    function handleChatRoomNameKeyup() {
        var chatRoomName = $(this).val().replace(/ /g, '');
        socket.emit("chatRoomValidity", chatRoomName);
    }

    function handleMsgTypedKeyup() {
        if (($("#txtTypedMsg").val()) != '') {
            $('#btnSendMessage').removeAttr("disabled");
        } else {
            $('#btnSendMessage').attr("disabled", "true");
        }
    }

    function handleLeaveRoomBtnClick() {
        socket.emit("leaveChatRoom", $(this).val());
    }
    
/************************************************************************************************************************************************/  
    
    
    // Assign event handlers to events from server
    socket.on("errorLogin", handleLoginErrorEvnt);
    socket.on("signupSuccess", handleSignUpSuccessEvnt);
    socket.on("signInSuccess", handleSignInSuccessEvnt);
    socket.on("newChatRoom", handleAddNewChatRoomEvnt);
    socket.on("chatRoomValid", handleValidRoomNameEvnt);
    socket.on("chatRoomNotValid", handleInValidRoomNameEvnt);
    socket.on("joinChatRoomSuccess", handleJoinRoomSuccessEvnt);
    socket.on("leaveChatRoomSuccess", handleLeaveRoomSuccessEvnt);
    socket.on("newChatRoomUser", handleNewChatRoomUserEvnt);
    socket.on("message", handleNewMessageEvnt);
    socket.on("userLeft", handleUserLeftEvnt);
    
    socket.on("disconnect", function () {
         displayErrorMsg("Server stopped. Please try again later");
    });

    function handleLoginErrorEvnt(msg) {
        displayErrorMsg(msg);
    }

    function handleSignUpSuccessEvnt() {
        // Clear the signup form
        $("#signUpForm input").each(function() {
            this.value = "";
        });
        $('.signup').hide();
        $('.signin').show();
        $('#divErrorStatus').hide();
    }

    function handleSignInSuccessEvnt(chatRooms) {
        $('#txtUsername').val("");
        $('#txtPassword').val("");
        $('.signin').hide();
        $('.signup').hide();
        $('#divErrorStatus').hide();
        $('#profileBarUser').append(userName);
        $('#profileBar').show();
        $('#chatRooms').show();
        var divChatRooms = $(".divChatRooms");
        for (chatRoom in chatRooms) {
            var divChatRoom = "<div id=" + chatRoom + " class='chatRoomCard row'>";
            divChatRoom += "<div class='col-md-5'><b style='float:left; font-size:larger;'>" + chatRoom +
                "</b></div>";
            divChatRoom += "<div style='float:right;' id='divBtn" + chatRoom +
                "' class='col-md-3'><button value=" + chatRoom +
                " type='button' class='btnChatRoomJoin'>Join</button></div></div>";
            divChatRooms.append(divChatRoom);
        }
        $(".btnChatRoomJoin").unbind("click");
        $(".chatRoomCard").unbind("click");
        $('.btnChatRoomJoin').click(function() {
            var chatRoom = $(this).val();
            socket.emit("chatRoomJoin", chatRoom);
        });
        $(".chatRoomCard").click(function() {
            if ($(this).attr("value") == "joined") {
                $(".divChatRoomWindow").show();
                $(".divChatMsgs div").hide();
                $(".divChatRooms .chatRoomCard").removeClass("selectedRoom");
                var roomName = $(this).attr("id");
                $("#btnLeave").attr("value", roomName);
                $("#Msgs" + roomName + "").show();
                $("#" + roomName + "").addClass("selectedRoom");
                $(".divChatRoomWindow .divTitle").html(roomName);
                $("#btnSendMessage").val(roomName);
            } else {
                return;
            }
        });
    }

    function handleAddNewChatRoomEvnt(roomName) {
        var divChatRoom = "<div id=" + roomName + " class='chatRoomCard row'>";
        divChatRoom += "<div class='col-md-5'><b style='float:left; font-size:larger;'>" + roomName +
            "</b></div>";
        divChatRoom += "<div style='float:right;' id='divBtn" + roomName +
            "' class='col-md-3'><button value=" + roomName +
            " type='button' class='btnChatRoomJoin'>Join</button></div></div>";
        $('.divChatRooms').append(divChatRoom);
        $(".btnChatRoomJoin").unbind("click");
        $(".chatRoomCard").unbind("click");
        $('.btnChatRoomJoin').click(function() {
            var chatRoom = $(this).val();
            socket.emit("chatRoomJoin", chatRoom);
        });
        $(".chatRoomCard").click(function() {
            if ($(this).attr("value") == "joined") {
                $(".divChatRoomWindow").show();
                $(".divChatMsgs div").hide();
                $(".divChatRooms .chatRoomCard").removeClass("selectedRoom");
                var roomName = $(this).attr("id");
                $("#btnLeave").attr("value", roomName);
                $("#Msgs" + roomName + "").show();
                $("#" + roomName + "").addClass("selectedRoom");
                $(".divChatRoomWindow .divTitle").html(roomName);
                $("#btnSendMessage").val(roomName);
            } else {
                return;
            }
        });
    }

    function handleValidRoomNameEvnt() {
        $(".divChatRoomName").removeClass("has-error");
        $(".divChatRoomName").addClass("has-success");
        var roomNameAvailableHtml =
            "<span style='position: absolute; right: 70px;' class='glyphicon glyphicon-ok form-control-feedback'>Available</span>";
        $(".divChatRoomNameValidity").html(roomNameAvailableHtml);
        $("#btnCreateRoom").removeAttr("disabled");
    }

    function handleInValidRoomNameEvnt() {
        $(".divChatRoomName").addClass("has-error");
        $(".divChatRoomName").removeClass("has-success");
        var roomNameNotAvailableHtml =
            "<span style='position: absolute; right: 70px;' class='glyphicon glyphicon-remove form-control-feedback'>Not available</span>";
        $(".divChatRoomNameValidity").html(roomNameNotAvailableHtml);
        $("#btnCreateRoom").attr("disabled", "true");
    }

    function handleJoinRoomSuccessEvnt(roomName) {
        $(".divChatRoomWindow").show();
        $("#btnLeave").show();
        $("#btnLeave").attr("value", roomName);
        $(".divChatRooms .chatRoomCard").removeClass("selectedRoom");
        $("#" + roomName + "").addClass("selectedRoom");
        $("#" + roomName + "").attr("value", "joined");
        $(".divChatRoomWindow .divTitle").html(roomName);
        $("#btnSendMessage").val(roomName);
        $("#divBtn" + roomName + "").html("Joined");
        $(".divChatMsgs div").hide();
        $(".divChatMsgs").append("<div id='Msgs" + roomName + "'></div>");
        $("#Msgs" + roomName + "").show();
    }

    function handleLeaveRoomSuccessEvnt(room) {
        var joinBtnHtml = "<button value=" + room + " type='button' class='btnChatRoomJoin'>Join</button>";
        $("#divBtn" + room + "").html(joinBtnHtml);
        $("#" + room + "").attr("value", "");
        $("#Msgs" + room + "").remove();
        $(".divChatRoomWindow").hide();
        $(".divChatRoomWindow .divTitle").html("");
        $(".divChatRooms .chatRoomCard").removeClass("selectedRoom");
        $('.btnChatRoomJoin').click(function() {
            var chatRoom = $(this).val();
            socket.emit("chatRoomJoin", chatRoom);
        });
    }

    function handleNewChatRoomUserEvnt(user, room) {
        var newUsrJoinMsgHtml = "<span class='centerAlignMsg'><b>" + user +
            " has joined the room </b></span><br><br><br>";
        $("#Msgs" + room + "").append(newUsrJoinMsgHtml);
    }

    function handleNewMessageEvnt(data) {
        var msgHtml =
            "<span><span class='image' 'float:left;'><img src='http://www.gravatar.com/avatar/50c830ed1772627f4964fb669eee45f0?s=140&r=x&d=mm'><b class='left'>" +
            data.sender + "</b></span><span class='leftAlignMsg'>" + data.message +
            "</span></span><br><br>";
        $("#Msgs" + data.chatRoomName + "").append(msgHtml);
        $("#Msgs" + data.chatRoomName + "").scrollTop($("#Msgs" + data.chatRoomName + "")[0].scrollHeight);
    }

    function handleUserLeftEvnt(user, room) {
        var usrLeftMsgHtml = "<span class='centerAlignMsg'><b>" + user +
            " has left the room </b></span><br><br><br>";
        $("#Msgs" + room + "").append(usrLeftMsgHtml);
    }
});

function displayErrorMsg(errorMsg) {
    $('#divErrorMsg').html(errorMsg);
    $('#divErrorStatus').show();
}

function handle(e) {
    if (e.keyCode === 13) {
        $('#btnSendMessage').trigger("click");
    }
    return false;
}