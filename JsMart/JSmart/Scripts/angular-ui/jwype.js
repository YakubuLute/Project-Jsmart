// JavaScript source code

var app = angular.module('jwype', []); // Inisialisasi angular app dengan nama 'jwype'

// Proxy
var chatHub = $.connection.chatHub; // Menginisialisasi signalr hub proxy

/* Moment.js Implementation */
var moment = moment(); // Membuat objek dari moment.js

var seff = new Audio('../sounds/incomingmsg.wav'); // Inisialisasi sound effect untuk incoming message

/**********************************************************************************
                    ************** CHAT ****************
**********************************************************************************/
var totalOnlineUsers = 0, totalAvailableGroups = 0; // Variabel penampung jumlah online user dan jumlah group yang ada

function emoticonFiltering(message) { // Fungsi untuk memfilter message yang mengndung emoticon
    var filtered = '';
    var smileys = [
        [':)', '<img src="img/emot/happy.gif" />'],
        [':(', '<img src="img/emot/sad.gif" />'],
        [';)', '<img src="img/emot/winking.gif" />'],
        [':D', '<img src="img/emot/big grin.gif" />'],
        [';;)', '<img src="img/emot/batting eyelashes.gif" />'],
        ['>:D<', '<img src="img/emot/big hug.gif" />'],
        [':-/', '<img src="img/emot/confused.git" />'],
        [':x', '<img src="img/emot/love struck.gif" />'],
        [':">', '<img src="img/emot/blushing.gif" />'],
        [':P', '<img src="img/emot/tongue.gif" />'],
        [':-*', '<img src="img/emot/kiss.gif" />'],
        ['=((', '<img src="img/emot/broken heart.gif" />'],
        [':-O', '<img src="img/emot/surprise.gif" />'],
        ['X(', '<img src="img/emot/angry.gif" />'],
        [':>', '<img src="img/emot/smug.gif" />'],
        ['B-)', '<img src="img/emot/cool.gif" />'],
        [':-S', '<img src="img/emot/whew!.gif" />'],
        ['>:)', '<img src="img/emot/devil.gif" />'],
        [':((', '<img src="img/emot/crying.gif" />'],
        [':))', '<img src="img/emot/laughing.gif" />']
    ];
    for (i = 0; i < smileys.length; i++) {
        if (i == 0) {
            filtered = message.replace(smileys[i][0], smileys[i][1]);
        } else {
            filtered = filtered.replace(smileys[i][0], smileys[i][1]);
        }
    }
    return filtered;
}

function manageScene(loggedIn) { // Scene manager, before login and after login
    if (loggedIn) {
        $('#chatBox').show();
        $('#loginBox').hide();
    } else {
        $('#chatBox').hide();
        $('#loginBox').show();
    }
    $('#videoChatContainer').hide();
}

function showAllGroupsList(chatHub, groupList) { // Menampilkan semua list group yang tersedia ke sidebar
    var html = '';
    for (i = 0; i < groupList.length; i++) {
        if (i == 0) { // If it's Admin group
            html = '<a href="#" id="' + groupList[i].groupid + '" class="list-group-item group" data-toggle="modal" data-target="#adminLoginModal">' + groupList[i].groupname + '</a>';
        } else { // Another group
            html = '<a href="#" id="' + groupList[i].groupid + '" class="list-group-item group">' + groupList[i].groupname + '</a>';
        }
        $('#groupList').append(html);
    }

    $('.list-group-item.group').click(function () {
        $('#videoChatContainer').hide();
        $('#chatBox').show();

        // Quiting from another rooms conference
        for (i = 0; i < 4; i++) {
            quitRoom(i);
        }

        var id = $(this).attr('id');
        openGroupChatWindow(chatHub, id, groupList[id - 1].groupname);
    });
}

function makeGroupChatWindow(chatHub, groupid, groupWindowId, groupname) { // Membuka sebuah chat window group baru apabila user join ke suatu group

    var html = '<div id="' + groupWindowId + '" class="mainbox ui-widget-content draggable col-lg-3 col-md-3 col-sm-3 grwindow" style="position:fixed; right:0px; bottom:0px; z-index:99999999999999">' +
                    '<div class="panelChat panel-primary">' +
                        '<div id="headerChat" class="panel-heading" style="cursor:pointer">' +
                            '<span class="glyphicon glyphicon-comment"></span> ' + groupname + ' Group' +
                            '<div class="btn-group pull-right">' +
                                '<button id="btnCloseWindow" type="button" class="btn btn-default btn-xs dropdown-toggle">' +
                                    '<span class="glyphicon glyphicon-remove"></span>' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="panelChat-body">' +
                            '<ul id="discussion" class="chatBox"></ul>' +
                        '</div>' +
                        '<div class="panel-footer">' +
                            '<div class="input-group">' +
                                '<input id="message" type="text" class="form-control input-sm" placeholder="Type something ..." />' +
                                '<span class="input-group-btn">' +
                                    '<button class="btn btn-warning btn-sm" id="btn-chat">Send</button>' +
                                '</span>' +
                                '<span class="input-group-btn">' +
                                    '<button class="btn btn-danger btn-sm" id="btnJwing">JWING!!!</button>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

    $('#chatWindowContainer').append($(html));

    // Close Window Event
    $('#group_' + groupid).find('#btnCloseWindow').click(function () {
        $('#' + groupWindowId).remove();
    });

    // Button Event
    $('#group_' + groupid).find('#btn-chat').click(function () {
        var message = $('#group_' + groupid).find('#message').val();
        if (message.length > 0) {
            chatHub.server.sendBroadcastMessage(groupname, $('#hidUsername').val(), message, Date.now());
            $('#group_' + groupid).find('#message').val('');
        }
    });

    // TextBox Event
    $('#group_' + groupid).find('#message').keypress(function (e) {
        if (e.which == 13) {
            $('#group_' + groupid).find('#btn-chat').click();
        }
    });

    // New Feature (JWING!!!)
    $('#group_' + groupid).find('#btnJwing').click(function () {
        chatHub.server.sendBroadcastMessage(groupname, $('#hidUsername').val(), '<font style="color:red">JWING!!!</font>', Date.now());
    });

    $('#group_' + groupid).draggable({
        handle: '#headerChat'
    });

    // Send group message
    chatHub.server.connect($('#hidId').val(), groupname);

}

function openGroupChatWindow(chatHub, id, groupname) { // Fungsi untuk membuka chat window group
    var groupWindowId = 'group_' + id;
    if ($('#' + groupWindowId).length > 0) {
        return;
    }
    if (id != 1) { // If it's not Admin Group
        makeGroupChatWindow(chatHub, id, groupWindowId, groupname);
    }
}

function initEvents(chatHub) { // Inisialisasi semua event listener pada button dan input

    // Login
    $('#btnStartChat').click(function () {
        if ($('#username').val().length > 0) {
            var username = $('#username').val();
            chatHub.server.connect(username);

            $('#sideMenu').show();
            $('#sideMenu').BootSideMenu({ side: 'left', autoClose: false });
            $('#usernameSide').html(username);
        }
    });

    /*
    $('#username').keypress(function (e) {
        if (e.which == 13) {
            $('#btnStartChat').click();
        }
    });
    */

    // Send a Message
    $('#chatBox').find('#btn-chat').click(function () {
        var message = $('#chatBox').find('#message').val();
        if (message.length > 0) {
            var username = $('#hidUsername').val();
            chatHub.server.sendBroadcastMessage(username, message, Date.now());
            $('#chatBox').find('#message').val('');
        }
    });

    $('#chatBox').find('#message').keypress(function (e) {
        if (e.which == 13) {
            $('#chatBox').find('#btn-chat').click();
        }
    });

}

function registerUser(chatHub, id, name) { // Menambahkan daftar online user ke online list
    var userid = $('#hidId').val();
    var html = '<a href="#" id="' + id + '" class="list-group-item user">' + name + '</a>';
    $('#onlineList').append(html);
    $('.list-group-item.user').click(function () {
        $('#videoChatContainer').hide();
        $('#chatBox').show();

        // Quiting from another rooms conference
        for (i = 0; i < 4; i++) {
            quitRoom(i);
        }

        var id = $(this).attr('id');
        if (userid != id) {
            openPrivateChatWindow(chatHub, id, name);
        }
    });
}

function addMessage(groupid, groupname, username, message, timestamp, firstOpen) { // Membuat bubble chat baru ketika ada message masuk
    var bubbleChat = '<li class=\'left clearfix\'>' +
                                '<span class=\'chatBox-img pull-left\'>' +
                                    '<img src=\'img/user-avatar.png\' width=\'50\' height=\'50\' alt=\'Avatar\' class=\'img-circle\' />' +
                                '</span>' +
                                '<div class=\'chatBox-body clearfix\'>' +
                                    '<div class=\'header\'>' +
                                        '<strong class=\'primary-font\'>' + username + '</strong>' +
                                        '<small class=\'pull-right text-muted\'>' +
                                            '<span class=\'glyphicon glyphicon-time\'></span>' +
                                            moment.zone("+07:00").utc(timestamp, 'X').format('YYYY-MM-DD HH:mm') +
                                        '</small>' +
                                    '</div>' +
                                    '<p>' + emoticonFiltering(message) + '</p>' +
                                '</div>' +
                        '</li>';

    if (groupname == '') { // If it's a public chat
        $('#chatBox').find('#discussion').append(bubbleChat);
    } else { // If it's a group chat
        if ($('#group_' + groupid).length > 0) {
            $('#group_' + groupid).find('#discussion').append(bubbleChat);
        }
    }

    // Make chat container auto-scrolling when overflow-y
    var containerHeight = $('.panelChat-body')[0].scrollHeight;
    var speed = 0;
    if (firstOpen == false) {
        speed = 500;
    }
    $('.panelChat-body').animate({ scrollTop: containerHeight }, speed);
}

function openPrivateChatWindow(chatHub, id, username) { // Membuka chat window user
    var windowid = 'chatTo_' + id;
    if ($('#' + windowid).length > 0) {
        return;
    }
    makePrivateChatWindow(chatHub, id, windowid, username);
}

function makePrivateChatWindow(chatHub, userid, windowid, username) { // Membuat chat window user baru apabila user lain ingin chat dengannya

    var html = '<div id="' + windowid + '" class="mainbox ui-widget-content draggable col-lg-3 col-md-3 col-sm-3" style="position:fixed; right:0px; bottom:0px; z-index:99999999999999">' +
                    '<div class="panelChat panel-primary">' +
                        '<div id="headerChat" class="panel-heading" style="cursor:pointer">' +
                            '<span class="glyphicon glyphicon-comment"></span> ' + username +
                            '<div class="btn-group pull-right">' +
                                '<button id="btnCloseWindow" type="button" class="btn btn-default btn-xs dropdown-toggle">' +
                                    '<span class="glyphicon glyphicon-remove"></span>' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="panelChat-body">' +
                            '<ul id="discussion" class="chatBox"></ul>' +
                        '</div>' +
                        '<div class="panel-footer">' +
                            '<div class="input-group">' +
                                '<input id="message" type="text" class="form-control input-sm" placeholder="Type something ..." />' +
                                '<span class="input-group-btn">' +
                                    '<button class="btn btn-warning btn-sm" id="btn-chat">Send</button>' +
                                '</span>' +
                                '<span class="input-group-btn">' +
                                    '<button class="btn btn-danger btn-sm" id="btnJwing">JWING!!!</button>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

    $('#chatWindowContainer').append($(html));

    // Close Window Event
    $('#' + windowid).find('#btnCloseWindow').click(function () {
        $('#' + windowid).remove();
    });

    // Button Event
    $('#' + windowid).find('#btn-chat').click(function () {
        var message = $('#' + windowid).find('#message').val();
        if (message.length > 0) {
            chatHub.server.sendPrivateMessage(userid, message, Date.now());
            $('#' + windowid).find('#message').val('');
        }
    });

    // TextBox Event
    $('#' + windowid).find('#message').keypress(function (e) {
        if (e.which == 13) {
            $('#' + windowid).find('#btn-chat').click();
        }
    });

    // New Feature (JWING!!!)
    $('#' + windowid).find('#btnJwing').click(function () {
        chatHub.server.sendPrivateMessage(userid, '<font style="color:red">JWING!!!</font>', Date.now());
    });

    $('#' + windowid).draggable({
        handle: '#headerChat'
    });

}

function EnterAdminRoom() { // Admin Authentication
    var password = $('#adminPwd').val();
    if (password != '' && password == 'Pr3c10u$M0m3nt!') {
        $('#adminPwd').val('');
        $('#adminLoginModal').modal('hide');
        makeGroupChatWindow(chatHub, 1, 'group_1', 'Administrator');
    }
}

function clientManager(chatHub) { // Callback Client SignalR Manager

    chatHub.client.onConnected = function (id, username, Users, Messages, groupList) { // Ketika user terkoneksi ke server

        totalOnlineUsers = Users.length;  // Get number of online users
        $('#totalOnlineUsers').html(totalOnlineUsers);

        totalAvailableGroups = groupList.length;  // Get number of available groups
        $('#totalGroups').html(totalAvailableGroups);

        manageScene(true);

        $('#hidId').val(id);
        $('#hidUsername').val(username);
        $('#chatOwner').html(username);

        // Register All Users
        for (var i = 0; i < Users.length; i++) {
            registerUser(chatHub, Users[i].ConnectionId, Users[i].Username);
        }

        // Get Chat History
        for (var i = 0; i < Messages.length; i++) {
            addMessage('', '', Messages[i].Username, Messages[i].Message, Messages[i].Timestamp, true);
        }

        // Register All Groups
        showAllGroupsList(chatHub, groupList);

    }

    chatHub.client.onNewUserConnected = function (id, name) { // Ketika seorang user baru terhubung ke server
        totalOnlineUsers++;
        $('#totalOnlineUsers').html(totalOnlineUsers);
        registerUser(chatHub, id, name);
    }

    chatHub.client.onUserDisconnected = function (id, username) { // Ketika user DC dari server
        $('#' + id).remove();

        totalOnlineUsers--; // Decrease number of online users
        $('#totalOnlineUsers').html(totalOnlineUsers);

        var windowid = 'chatTo_' + id;
        $('#' + windowid).remove();

        var log_off = $('<div class="mainbox col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2" style="position:fixed; top:10px; right:0px">' +
                                '<div class="alert alert-danger" role="alert">' +
                                    '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>' +
                                    '<span class="sr-only">System Message:</span>' +
                                    ' ' + username + ' left the chat.' +
                            '</div>' +
                    '</div>');
        $(log_off).hide();
        $('#chatWindowContainer').append(log_off);
        $(log_off).fadeIn(200).delay(2000).fadeOut(200);
    }

    chatHub.client.messageReceived = function (groupid, groupname, username, message, timestamp) { // Ketika sebuah message baru masuk
        addMessage(groupid, groupname, username, message, timestamp, false);
        seff.play();
    }

    chatHub.client.sendPrivateMessage = function (windowid, senderName, message, timestamp) { // Mengirim private message
        var window_id = 'chatTo_' + windowid;

        if ($('#' + window_id).length == 0) {
            makePrivateChatWindow(chatHub, windowid, window_id, senderName);
        }

        // Make New Bubble Chat
        var bubbleChat = '<li class=\'left clearfix\'>' +
                                '<span class=\'chatBox-img pull-left\'>' +
                                    '<img src=\'img/user-avatar.png\' width=\'50\' height=\'50\' alt=\'Avatar\' class=\'img-circle\' />' +
                                '</span>' +
                                '<div class=\'chatBox-body clearfix\'>' +
                                    '<div class=\'header\'>' +
                                        '<strong class=\'primary-font\'>' + senderName + '</strong>' +
                                        '<small class=\'pull-right text-muted\'>' +
                                            '<span class=\'glyphicon glyphicon-time\'></span>' +
                                            moment.zone("+07:00").utc(timestamp, 'X').format('YYYY-MM-DD HH:mm') +
                                        '</small>' +
                                    '</div>' +
                                    '<p>' + emoticonFiltering(message) + '</p>' +
                                '</div>' +
                        '</li>';

        // Make chat container auto-scrolling when overflow-y
        var containerHeight = $('#' + window_id).find('.panelChat-body')[0].scrollHeight;
        $('.panelChat-body').animate({ scrollTop: containerHeight }, 0);

        $('#' + window_id).find('#discussion').append(bubbleChat);

    }

}

/**********************************************************************************
                    ************** END OF CHAT ****************
**********************************************************************************/

app.controller('mainController', function ($scope) { // Angular Main Controller
    
    manageScene(false);

    clientManager(chatHub);

    // Start Chat Hub
    $.connection.hub.start().done(function () {
        initEvents(chatHub);
    });

});

/**********************************************************************************
                    ************** BISTRI WEBRTC ****************
**********************************************************************************/
function enterRoomConf(roomId) { // Masuk ke room
    // Hide Main-Chat-Box first
    $('#chatBox').hide();

    // Quiting from another rooms
    for (i = 0; i < 4; i++) {
        quitRoom(i);
    }

    $('#videoChatContainer').show();
    joinRoom(roomId);
}

onBistriConferenceReady = function () {

    // Room Available
    var rooms = [
        ["2 People", 2], // Capacity: 2 people
        ["3 People", 3], // Capacity: 3 people
        ["4 People", 4], // Capacity: 4 people
        ["5 People", 5]  // Capacity: 5 people
    ];

    // Init Available Room List
    var html = '';
    for (i = 0; i < rooms.length; i++) {
        html = '<a href="#" id="' + i + '" class="list-group-item conf" onclick="enterRoomConf(' + i + ')">' + rooms[i][0] + '</a>';
        $('#confroomList').append(html);
    }
    $('#totalConfList').html(rooms.length);
    
    if (!bc.isCompatible()) {
        console.log('Your browser does not support WebRTC!');
        return;
    }

    window.localStream; // Menampung stream diri kita sendiri

    // Joining a room
    window.joinRoom = function (roomId) {
        if (!window.localStream) {
            alert('Local media is not ready.');
            return;
        }
        bc.joinRoom(rooms[roomId][0], rooms[roomId][1]);
    }

    // Leaving a room
    window.quitRoom = function (roomId) {
        bc.endCalls(rooms[roomId][0]);
        bc.quitRoom(rooms[roomId][0]);
    }

    // On Connected
    bc.signaling.bind("onConnected", function () {
        bc.startStream("320x320", function (stream) {
            window.localStream = stream;
            var node = document.querySelector('.video-container');
            bc.attachStream(stream, node, {
                fullscreen: true,
                mirror: true
            });
        });
    });

    bc.signaling.bind("onJoinedRoom", function (result) { // Ketika user sudah join ke suatu room
        var roomMembers = result.members;
        for (i = 0; i < roomMembers.length; i++) {
            var roomName = result.room.replace('_', ' ');
            bc.call(roomMembers[i].id, roomName, { stream: window.localStream });
        }
    });

    bc.signaling.bind("onJoinRoomError", function (error) { // Apabila join room mengalami error
        console.log('Error: ' + error.text + ' (' + error.code + ')');
    });

    bc.signaling.bind("onQuittedRoom", function (data) { // Ketika user sudah keluar dari room
        
    });

    bc.streams.bind("onStreamAdded", function (remoteStream, pid) { // Attach stream yang diterima ke container
        var node = document.querySelector('.video-container');
        bc.attachStream(remoteStream, node, {
            fullscreen: true
        });
    });

    bc.streams.bind("onStreamClosed", function (remoteStream, pid) { // Ketika stream terclose (leave room)
        bc.detachStream(remoteStream);
    });

    // Init Bistri with our AppId and AppKey
    bc.init({
        appId: '88abfb72',
        appKey: 'd7c99676d519bc748ee5aa0269d9f5b5'
    });

    // Start connecting
    bc.connect();

}